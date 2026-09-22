import type {
  IncidentAction,
  SimulationCommand,
  SimulationMode,
  SimulationSnapshot,
  WorkerResponse,
} from "@gs-safety/contracts";
import {
  IncidentActionSchema,
  SimulationCommandSchema,
  SimulationSnapshotSchema,
  WorkerResponseSchema,
} from "@gs-safety/contracts";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { PersistenceError } from "./errors";
import { parseStored } from "./history";
import type { SafetyDatabase } from "./index";
import type { RequestKey, RequestReceipt, ResponseKey, ResponseReceipt } from "./repository-types";
import { requestReceipts, responseReceipts } from "./schema";

export const PersistedRequestSchema = z.union([SimulationCommandSchema, IncidentActionSchema]);
const primaryVoiceResponses: ReadonlySet<WorkerResponse["response"]> = new Set([
  "voice-started",
  "voice-completed",
  "voice-failed",
  "voice-unsupported",
]);

export type ReceiptWrite = {
  readonly request: SimulationCommand | IncidentAction;
  readonly actorId: string;
  readonly snapshot: SimulationSnapshot;
  readonly runId: string;
};

export function createReceiptStore(database: SafetyDatabase) {
  const { db } = database;
  function findRequestReceipt(mode: SimulationMode, requestId: string): RequestReceipt | null {
    const rows = db
      .select()
      .from(requestReceipts)
      .where(and(eq(requestReceipts.mode, mode), eq(requestReceipts.requestId, requestId)))
      .limit(2)
      .all();
    if (rows.length > 1) throw new PersistenceError("CONFLICT", "Ambiguous request identifier");
    const row = rows[0];
    return row
      ? {
          request: parseStored(PersistedRequestSchema, row.payloadJson),
          actorId: row.actorId,
          snapshot: parseStored(SimulationSnapshotSchema, row.snapshotJson),
        }
      : null;
  }
  return {
    findRequestReceipt,
    responseReceipt(key: ResponseKey): ResponseReceipt | null {
      const row = db
        .select()
        .from(responseReceipts)
        .where(
          and(
            eq(responseReceipts.runId, key.runId),
            eq(responseReceipts.workerId, key.workerId),
            eq(responseReceipts.requestId, key.requestId),
          ),
        )
        .get();
      return row
        ? {
            request: parseStored(WorkerResponseSchema, row.payloadJson),
            actorId: row.actorId,
            snapshot: parseStored(SimulationSnapshotSchema, row.snapshotJson),
          }
        : null;
    },
    requestReceipt(key: RequestKey): RequestReceipt | null {
      const row = db
        .select()
        .from(requestReceipts)
        .where(
          and(
            eq(requestReceipts.runId, key.runId),
            eq(requestReceipts.mode, key.mode),
            eq(requestReceipts.requestId, key.requestId),
          ),
        )
        .get();
      return row
        ? {
            request: parseStored(PersistedRequestSchema, row.payloadJson),
            actorId: row.actorId,
            snapshot: parseStored(SimulationSnapshotSchema, row.snapshotJson),
          }
        : null;
    },
    appendResponse(
      response: WorkerResponse,
      result: { readonly snapshot: SimulationSnapshot; readonly actorId: string },
    ): void {
      if (response.runId !== result.snapshot.run.runId || response.mode !== result.snapshot.mode) {
        throw new PersistenceError("INVALID_RECORD", "Response run mismatch");
      }
      const guidance = result.snapshot.incidents
        .find((incident) => incident.incidentId === response.incidentId)
        ?.currentGuidance.find(
          (candidate) =>
            candidate.workerId === response.workerId &&
            candidate.guidanceId === response.guidanceId,
        );
      const matchesPrimaryVoice =
        guidance?.updateKind === "supplement" &&
        guidance.primaryGuidanceVersion === response.guidanceVersion &&
        primaryVoiceResponses.has(response.response);
      if (
        !guidance ||
        (guidance.guidanceVersion !== response.guidanceVersion && !matchesPrimaryVoice) ||
        Date.parse(guidance.expiresAt) <= Date.parse(result.snapshot.run.updatedAt)
      ) {
        throw new PersistenceError("INVALID_RECORD", "Response guidance is not current and valid");
      }
      db.insert(responseReceipts)
        .values({
          runId: response.runId,
          workerId: response.workerId,
          requestId: response.requestId,
          actorId: result.actorId,
          payloadJson: JSON.stringify(WorkerResponseSchema.parse(response)),
          snapshotJson: JSON.stringify(result.snapshot),
        })
        .run();
    },
    appendRequest(receipt: ReceiptWrite): void {
      if (receipt.request.mode !== receipt.snapshot.mode) {
        throw new PersistenceError("INVALID_RECORD", "Request mode mismatch");
      }
      if (findRequestReceipt(receipt.request.mode, receipt.request.requestId)) {
        throw new PersistenceError("CONFLICT", "Request identifier conflict");
      }
      db.insert(requestReceipts)
        .values({
          mode: receipt.request.mode,
          runId: receipt.runId,
          requestId: receipt.request.requestId,
          actorId: receipt.actorId,
          payloadJson: JSON.stringify(PersistedRequestSchema.parse(receipt.request)),
          snapshotJson: JSON.stringify(receipt.snapshot),
        })
        .run();
    },
  };
}
