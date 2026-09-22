import type {
  IncidentAction,
  SimulationCommand,
  SimulationMode,
  SimulationSnapshot,
} from "@gs-safety/contracts";
import { SimulationSnapshotSchema, WorkerResponseSchema } from "@gs-safety/contracts";
import { and, eq } from "drizzle-orm";
import { PersistenceError } from "./errors";
import { createHistoryStore, parseStored } from "./history";
import type { SafetyDatabase } from "./index";
import { createReceiptStore, PersistedRequestSchema } from "./receipts";
import type { RunRepository } from "./repository-types";
import { createRuntimeStateStore } from "./runtime-state";
import { activeRuns, runHeads, runSnapshots } from "./schema";

export type {
  PreviousRun,
  RequestKey,
  RequestReceipt,
  ResponseKey,
  ResponseReceipt,
  RunCommit,
  RunRepository,
} from "./repository-types";

export function createRunRepository(database: SafetyDatabase): RunRepository {
  const { db, sqlite } = database;
  const history = createHistoryStore(database);
  const receipts = createReceiptStore(database);
  const runtimeState = createRuntimeStateStore(database);

  function get(runId: string): SimulationSnapshot | null {
    const head = db.select().from(runHeads).where(eq(runHeads.runId, runId)).get();
    if (!head) return null;
    const row = db
      .select()
      .from(runSnapshots)
      .where(and(eq(runSnapshots.runId, runId), eq(runSnapshots.version, head.version)))
      .get();
    if (!row) throw new PersistenceError("INVALID_RECORD", "Run snapshot missing");
    return parseStored(SimulationSnapshotSchema, row.payloadJson);
  }

  function current(mode: SimulationMode): SimulationSnapshot | null {
    const active = db.select().from(activeRuns).where(eq(activeRuns.mode, mode)).get();
    return active ? get(active.runId) : null;
  }

  function insert(
    snapshot: SimulationSnapshot,
    actorId: string,
    runtimeStateJson?: string,
  ): SimulationSnapshot {
    const inserted = db
      .insert(runHeads)
      .values({ runId: snapshot.run.runId, mode: snapshot.mode, version: snapshot.run.version })
      .onConflictDoNothing()
      .run();
    if (inserted.changes !== 1)
      throw new PersistenceError("CONFLICT", "Run identifier already exists");
    history.append(snapshot, actorId);
    runtimeState.append(snapshot.run, runtimeStateJson);
    db.insert(activeRuns)
      .values({ mode: snapshot.mode, runId: snapshot.run.runId })
      .onConflictDoUpdate({ target: activeRuns.mode, set: { runId: snapshot.run.runId } })
      .run();
    return snapshot;
  }

  function requestReplay(
    request: SimulationCommand | IncidentAction,
    context: { readonly runId: string; readonly actorId: string },
  ): SimulationSnapshot | null {
    const receipt = receipts.requestReceipt({
      mode: request.mode,
      runId: context.runId,
      requestId: request.requestId,
    });
    if (!receipt) return null;
    if (
      receipt.actorId !== context.actorId ||
      JSON.stringify(receipt.request) !== JSON.stringify(PersistedRequestSchema.parse(request))
    ) {
      throw new PersistenceError("CONFLICT", "Request identifier conflict");
    }
    return receipt.snapshot;
  }

  return {
    get,
    runtimeState: runtimeState.current,
    current,
    history: history.history,
    guidanceHistory: history.guidanceHistory,
    audits: history.audits,
    responseReceipt: receipts.responseReceipt,
    requestReceipt: receipts.requestReceipt,
    findRequestReceipt: receipts.findRequestReceipt,
    create(snapshot, actorId, runtimeStateJson) {
      const parsed = SimulationSnapshotSchema.parse(snapshot);
      return sqlite
        .transaction(() => {
          if (current(parsed.mode))
            throw new PersistenceError("CONFLICT", "Mode already has an active run");
          return insert(parsed, actorId, runtimeStateJson);
        })
        .immediate();
    },
    replace(snapshot, previous, actorId) {
      const parsed = SimulationSnapshotSchema.parse(snapshot);
      return sqlite
        .transaction(() => {
          if (previous.request) {
            const replay = requestReplay(previous.request, { runId: previous.runId, actorId });
            if (replay) return replay;
          }
          const active = current(parsed.mode);
          if (
            !active ||
            active.run.runId !== previous.runId ||
            active.run.version !== previous.version
          ) {
            throw new PersistenceError("CONFLICT", "Run version conflict");
          }
          const result = insert(parsed, actorId, previous.runtimeStateJson);
          if (previous.request)
            receipts.appendRequest({
              request: previous.request,
              actorId,
              snapshot: result,
              runId: previous.runId,
            });
          return result;
        })
        .immediate();
    },
    commit(change) {
      const snapshot = SimulationSnapshotSchema.parse(change.snapshot);
      return sqlite
        .transaction(() => {
          if (change.response) {
            const receipt = receipts.responseReceipt(change.response);
            if (receipt) {
              if (
                receipt.actorId !== change.actorId ||
                JSON.stringify(receipt.request) !==
                  JSON.stringify(WorkerResponseSchema.parse(change.response))
              ) {
                throw new PersistenceError("CONFLICT", "Request identifier conflict");
              }
              return receipt.snapshot;
            }
          }
          if (change.request) {
            const replay = requestReplay(change.request, {
              runId: snapshot.run.runId,
              actorId: change.actorId,
            });
            if (replay) return replay;
          }
          const previous = current(snapshot.mode);
          if (
            !previous ||
            previous.run.runId !== snapshot.run.runId ||
            previous.run.version !== change.expectedVersion ||
            snapshot.run.version !== change.expectedVersion + 1
          ) {
            throw new PersistenceError("CONFLICT", "Run version conflict");
          }
          for (const incident of previous.incidents) {
            const next = snapshot.incidents.find(
              (candidate) => candidate.incidentId === incident.incidentId,
            );
            if (
              !next ||
              incident.firstGuidance.some(
                (guidance) =>
                  !next.firstGuidance.some(
                    (candidate) => JSON.stringify(candidate) === JSON.stringify(guidance),
                  ),
              )
            ) {
              throw new PersistenceError("CONFLICT", "Immutable first guidance conflict");
            }
          }
          const result = db
            .update(runHeads)
            .set({ version: snapshot.run.version })
            .where(
              and(
                eq(runHeads.runId, snapshot.run.runId),
                eq(runHeads.version, change.expectedVersion),
              ),
            )
            .run();
          if (result.changes !== 1) throw new PersistenceError("CONFLICT", "Run version conflict");
          history.append(snapshot, change.actorId);
          runtimeState.append(snapshot.run, change.runtimeStateJson);
          if (change.response)
            receipts.appendResponse(change.response, { snapshot, actorId: change.actorId });
          if (change.request)
            receipts.appendRequest({
              request: change.request,
              actorId: change.actorId,
              snapshot,
              runId: snapshot.run.runId,
            });
          return snapshot;
        })
        .immediate();
    },
  };
}
