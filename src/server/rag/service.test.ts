import { createHash } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Guidance } from "@/contracts";
import type { GenerationInput, LanguageModelProvider, ModelCompletion } from "./generation-types";
import { createRagService } from "./service";
import { sampleGuidance } from "./test-fixtures";
import type { EmbeddingProvider } from "./types";

const embedding: EmbeddingProvider = {
  identity: { provider: "test", model: "test-vector", version: "1", dimensions: 3, mode: "mock" },
  async embed(texts) {
    return texts.map(() => [1, 0, 0]);
  },
};
const context = {
  query: "equipment approach alert",
  siteId: "SITE-CONSTRUCTION-01",
  simulationType: "equipment",
  hazardTypes: ["equipment"],
  role: "worker",
  zoneIds: ["ZONE-A"],
  substanceIds: [],
  profile: { stairsAllowed: false, assistanceRequired: true, verified: true },
  scenarioPolicy: null,
  scope: "demo",
  limit: 3,
} as const;

function completion(input: GenerationInput): ModelCompletion {
  const chunk = input.chunks[0];
  const text = chunk?.metadata.reviewedSupplementalExplanation?.[input.locale];
  if (!chunk || !text) throw new Error("Test requires one reviewed chunk");
  const output = {
    actionCode: input.actionCode,
    locale: input.locale,
    supplementalExplanation: text,
    evidence: [
      {
        documentId: chunk.documentId,
        documentVersion: chunk.documentVersion,
        chunkId: chunk.chunkId,
      },
    ],
  };
  return {
    output,
    callId: "mock-call",
    responseHash: createHash("sha256").update(JSON.stringify(output)).digest("hex"),
    modelReturned: "mock-model",
  };
}

describe("RAG service faults using explicitly mocked providers", () => {
  let db: Database.Database;
  let elapsed: number;
  let current: Guidance;
  let temporaryRoot: string | undefined;
  const wallStart = Date.parse("2026-09-21T10:00:00Z");
  beforeEach(() => {
    db = new Database(":memory:");
    elapsed = 0;
    current = sampleGuidance();
  });
  afterEach(async () => {
    vi.useRealTimers();
    db.close();
    if (temporaryRoot) await rm(temporaryRoot, { recursive: true, force: true });
    temporaryRoot = undefined;
  });

  async function service(generate: LanguageModelProvider["generate"], root = process.cwd()) {
    const llm: LanguageModelProvider = {
      identity: { provider: "test", model: "mock-model", version: "1", mode: "mock" },
      generate,
    };
    const result = createRagService({
      db,
      embedding,
      llm,
      wallNow: () => wallStart + elapsed,
      monotonicNow: () => elapsed,
    });
    await result.initialize(root);
    return result;
  }

  it("adds verified evidence without mutating authoritative primary guidance", async () => {
    const rag = await service(async (input) => completion(input));
    const original = JSON.stringify(current);
    const result = await rag.enrichGuidance({ guidance: current, context }, () => current);
    expect(result.status).toBe("accepted");
    expect(JSON.stringify(current)).toBe(original);
    expect(db.prepare("SELECT COUNT(*) AS count FROM guidance_evidence").get()).toEqual({
      count: 1,
    });
  });

  it.each([4999, 5000, 5001])("rejects elapsed deadline boundary %dms", async (latency) => {
    const rag = await service(async (input) => {
      elapsed = latency;
      return completion(input);
    });
    const result = await rag.enrichGuidance({ guidance: current, context }, () => current);
    expect(result.status).toBe(latency < 5000 ? "accepted" : "fallback");
    if (result.status === "fallback") expect(result.reason).toBe("timeout");
  });

  it.each<Partial<Guidance>>([{ runId: "new-run" }, { profileVersion: 2 }, { routeVersion: 2 }])(
    "drops a result after authoritative state changes %j",
    async (change) => {
      const rag = await service(async (input) => {
        current = { ...current, ...change };
        return completion(input);
      });
      const result = await rag.enrichGuidance(
        { guidance: sampleGuidance(), context },
        () => current,
      );
      expect(result.status === "fallback" && result.reason).toBe("stale_guidance");
    },
  );

  it("keeps a single fallback outcome when provider ignores cancellation and resolves late", async () => {
    let complete: (() => void) | undefined;
    let observedSignal: AbortSignal | undefined;
    let markStarted: (() => void) | undefined;
    const started = new Promise<void>((resolve) => {
      markStarted = resolve;
    });
    const rag = await service((input, signal) => {
      observedSignal = signal;
      markStarted?.();
      return new Promise((resolve) => {
        complete = () => resolve(completion(input));
      });
    });
    vi.useFakeTimers();
    const chunkIds = rag.store.chunks().map((chunk) => chunk.chunkId);
    const pending = rag.enrichGuidance({ guidance: current, context }, () => current);
    await started;
    elapsed = 5000;
    await vi.advanceTimersByTimeAsync(5000);
    const result = await pending;
    expect(result.status === "fallback" && result.reason).toBe("timeout");
    expect(observedSignal?.aborted).toBe(true);
    complete?.();
    await vi.advanceTimersByTimeAsync(0);
    expect(rag.store.chunks().map((chunk) => chunk.chunkId)).toEqual(chunkIds);
    expect(
      db.prepare("SELECT COUNT(*) AS count FROM rag_runs WHERE phase='generation'").get(),
    ).toEqual({ count: 1 });
    expect(db.prepare("SELECT COUNT(*) AS count FROM guidance_evidence").get()).toEqual({
      count: 0,
    });
  });

  it("retains the template when the provider fails", async () => {
    const rag = await service(async () => {
      throw new Error("injected provider failure");
    });
    const result = await rag.enrichGuidance({ guidance: current, context }, () => current);
    expect(result.status === "fallback" && result.reason).toBe("provider_failure");
    expect(current.mode).toBe("template");
  });

  it("refreshes a retired source and rejects its explanation during generation", async () => {
    temporaryRoot = await mkdtemp(join(tmpdir(), "rag-retirement-"));
    await cp("knowledge", join(temporaryRoot, "knowledge"), { recursive: true });
    await mkdir(join(temporaryRoot, "data/knowledge"), { recursive: true });
    await cp("data/knowledge/reviews", join(temporaryRoot, "data/knowledge/reviews"), {
      recursive: true,
    });
    const sourcePath = join(temporaryRoot, "knowledge/equipment/EQ-001.md");
    const rag = await service(async (input) => {
      const source = await readFile(sourcePath, "utf8");
      await writeFile(
        sourcePath,
        source.replace('approvalStatus: "approved_for_demo"', 'approvalStatus: "retired"'),
      );
      return completion(input);
    }, temporaryRoot);
    const result = await rag.enrichGuidance({ guidance: current, context }, () => current);
    expect(result.status === "fallback" && result.reason).toBe("stale_guidance");
    expect(rag.store.chunks().some((chunk) => chunk.documentId === "EQ-001")).toBe(false);
  });
});
