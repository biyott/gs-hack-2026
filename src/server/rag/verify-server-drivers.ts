import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import Database from "better-sqlite3";
import ky from "ky";
import { z } from "zod";
import {
  EvidenceSchema,
  type Guidance,
  SessionSchema,
  SimulationCommandSchema,
  type SimulationMode,
  type SimulationSnapshot,
  SimulationSnapshotSchema,
} from "@/contracts";
import { createAuthService, defaultDemoAccounts, seedAccounts } from "../auth";
import { createDatabase } from "../db";
import { createRunRepository } from "../db/run-repository";
import { attachRag } from "../services/rag";
import { guidanceApplicability } from "../services/rag-applicability";
import { loadConfiguration } from "../simulation/configuration";
import { SimulationRuntime } from "../simulation/runtime";

export type PublicationDriver = {
  readonly database: Database.Database;
  readonly execute: (
    mode: SimulationMode,
    input: Readonly<Record<string, unknown>>,
  ) => Promise<SimulationSnapshot>;
  readonly subscribe: (
    mode: SimulationMode,
    listener: (snapshot: SimulationSnapshot) => void,
  ) => Promise<() => Promise<void>>;
  readonly close: () => Promise<void>;
};

export async function createHttpPublicationDriver(baseUrl: string): Promise<PublicationDriver> {
  const api = ky.create({ baseUrl, retry: 0, timeout: 15_000 });
  const session = SessionSchema.parse(
    await api
      .post("api/session", {
        json: { actorId: "admin", role: "admin", accessCode: process.env["GS_DEMO_PIN"] ?? "2026" },
      })
      .json(),
  );
  const authenticated = api.extend({ headers: { authorization: `Bearer ${session.token}` } });
  const database = new Database(process.env["DATABASE_PATH"] ?? "data/runtime/safety.sqlite", {
    readonly: true,
    fileMustExist: true,
  });
  return {
    database,
    async execute(mode, input) {
      const current = SimulationSnapshotSchema.parse(
        await authenticated.get("api/simulation", { searchParams: { mode } }).json(),
      );
      return SimulationSnapshotSchema.parse(
        await authenticated
          .post("api/simulation", {
            json: { ...input, mode, expectedVersion: current.run.version, requestId: randomUUID() },
          })
          .json(),
      );
    },
    async subscribe(mode, listener) {
      const abort = new AbortController();
      const response = await authenticated.get("api/events", {
        searchParams: { mode },
        signal: abort.signal,
        timeout: false,
      });
      assert.match(response.headers.get("content-type") ?? "", /text\/event-stream/u);
      assert.ok(response.body);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let pending = "";
      const reading = (async () => {
        try {
          while (true) {
            const item = await reader.read();
            if (item.done) return;
            pending += decoder.decode(item.value, { stream: true });
            const messages = pending.split("\n\n");
            pending = messages.pop() ?? "";
            for (const message of messages) {
              const data = message.split("\n").find((line) => line.startsWith("data: "));
              if (data) listener(SimulationSnapshotSchema.parse(JSON.parse(data.slice(6))));
            }
          }
        } catch (error) {
          if (abort.signal.aborted && error instanceof Error && error.name === "AbortError") return;
          throw error;
        }
      })();
      return async () => {
        await reader.cancel();
        abort.abort();
        await reading;
      };
    },
    async close() {
      database.close();
    },
  };
}

export async function createRuntimeDriver(outputDir: string): Promise<PublicationDriver> {
  const database = createDatabase(join(outputDir, "runtime.sqlite"));
  seedAccounts(database, defaultDemoAccounts({ GS_DEMO_PIN: "2026" }));
  const session = createAuthService(database).login({
    actorId: "admin",
    role: "admin",
    accessCode: "2026",
  }).session;
  const runtime = new SimulationRuntime({
    database,
    repository: createRunRepository(database),
    configuration: loadConfiguration(),
  });
  const readiness = attachRag(runtime);
  const deadline = performance.now() + 120_000;
  while (readiness.status === "loading" && performance.now() < deadline) await delay(25);
  assert.equal(readiness.status, "ready", JSON.stringify(readiness));
  return {
    database: database.sqlite,
    async execute(mode, input) {
      return runtime.command(
        SimulationCommandSchema.parse({
          ...input,
          mode,
          expectedVersion: runtime.getRun(mode).snapshot.run.version,
          requestId: randomUUID(),
        }),
        session,
      );
    },
    async subscribe(mode, listener) {
      const unsubscribe = runtime.bus.subscribe(mode, listener);
      return async () => unsubscribe();
    },
    async close() {
      runtime.dispose();
      database.close();
    },
  };
}

const rowSchema = z.object({
  id: z.string(),
  run_id: z.string(),
  started_at: z.string(),
  completed_at: z.string(),
  phase: z.string(),
  outcome: z.string(),
  provider_json: z.string(),
  detail_json: z.string(),
});

export type PersistedRagRow = z.infer<typeof rowSchema>;

export function readRagRows(database: Database.Database, runId: string) {
  return z
    .array(rowSchema)
    .parse(
      database
        .prepare("SELECT * FROM rag_runs WHERE run_id = ? ORDER BY started_at, id")
        .all(runId),
    );
}

export function readApplicabilityProof(database: Database.Database, guidance: Guidance) {
  const history = z
    .array(z.object({ payload_json: z.string() }))
    .parse(
      database
        .prepare("SELECT payload_json FROM run_snapshots WHERE run_id = ? ORDER BY version")
        .all(guidance.runId),
    )
    .map((row) => SimulationSnapshotSchema.parse(JSON.parse(row.payload_json)));
  const configuration = loadConfiguration();
  const scenario = configuration.scenarios.find(
    (candidate) => candidate.id === history[0]?.run.scenarioId,
  );
  const policy = configuration.policies.find((candidate) => candidate.id === scenario?.policyId);
  assert.ok(policy);
  return {
    history,
    sensorStaleAfterMs: policy.sensorStaleAfterMs,
    facts: guidanceApplicability(guidance, history, policy.sensorStaleAfterMs),
  };
}

export function readPhaseEvidence(database: Database.Database, rows: readonly PersistedRagRow[]) {
  return rows
    .filter((row) => row.phase === "generation" && row.outcome === "accepted")
    .flatMap((row) => {
      const detail = z
        .object({
          guidanceId: z.string(),
          supplement: z.object({ evidence: z.array(EvidenceSchema) }),
        })
        .parse(JSON.parse(row.detail_json));
      return detail.supplement.evidence.map((reference) => {
        const source = database
          .prepare(
            "SELECT ge.*, kc.content, kd.source_path, kd.content_hash, kd.metadata_json FROM guidance_evidence ge JOIN knowledge_chunks kc USING(chunk_id) JOIN knowledge_documents kd ON kd.document_id = ge.document_id WHERE ge.guidance_id = ? AND ge.document_id = ? AND ge.document_version = ? AND ge.chunk_id = ?",
          )
          .get(
            detail.guidanceId,
            reference.documentId,
            reference.documentVersion,
            reference.chunkId,
          );
        assert.ok(source);
        return { ragRunId: row.id, reference, source };
      });
    });
}
