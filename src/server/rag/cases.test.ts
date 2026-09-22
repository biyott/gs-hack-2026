import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadCaseApplicability } from "./case-applicability";
import { documentTestNow, loadCaseFixture, loadRagCases } from "./case-clock";
import { ingestKnowledgeDirectory } from "./ingestion";
import { KnowledgeError } from "./knowledge";
import { retrieve } from "./retrieval";
import { RagStore } from "./store";
import type { EmbeddingProvider, RetrievalRequest } from "./types";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const cases = loadRagCases();
const embedding: EmbeddingProvider = {
  identity: {
    provider: "case-test-only",
    model: "constant-vector",
    version: "1",
    dimensions: 3,
    mode: "mock",
  },
  async embed(texts) {
    return texts.map(() => [1, 0, 0]);
  },
};

function requestAt(now: string): RetrievalRequest {
  return {
    runId: "case-review-boundary",
    query: "중장비 접근 경보",
    siteId: "SITE-CONSTRUCTION-01",
    simulationType: "equipment",
    hazardTypes: ["equipment"],
    role: "worker",
    zoneIds: ["ZONE-A"],
    substanceIds: [],
    actionCode: "ALERT_HAZARD",
    profile: { stairsAllowed: true, assistanceRequired: false, verified: true },
    scenarioPolicy: null,
    scope: "demo",
    now,
    limit: 10,
    signal: new AbortController().signal,
  };
}

describe("authored RAG cases with explicitly mocked embeddings", () => {
  let db: Database.Database;
  let store: RagStore;
  beforeEach(async () => {
    db = new Database(":memory:");
    store = new RagStore(db);
    await ingestKnowledgeDirectory(root, store, {
      embedding,
      scope: "demo",
      now: documentTestNow,
      signal: new AbortController().signal,
    });
  });
  afterEach(() => db.close());

  it.each(cases)("$testId: $reason", async (testCase) => {
    // Given: negative documents enter only this isolated database by explicit ID.
    const { preferredLocale: _locale, negativeFixtureIds, ...context } = testCase.context;
    for (const documentId of negativeFixtureIds) {
      const record = loadCaseFixture(documentId);
      expect(record.metadata.documentId).toBe(documentId);
      store.upsert(record, { identity: embedding.identity, vector: [1, 0, 0] });
    }
    const request: RetrievalRequest = {
      ...context,
      applicability: loadCaseApplicability(testCase),
      runId: testCase.testId,
      simulationType: testCase.simulationType,
      query: testCase.query,
      limit: 10,
      signal: new AbortController().signal,
    };
    Object.freeze(request);

    // When: the real SQLite retrieval pipeline applies metadata, FTS and vector search.
    const result = await retrieve(store, embedding, request);

    // Then: compare inclusion/exclusion rather than an incidental rank ordering.
    expect(result.outcome).toBe(testCase.expectedOutcome);
    expect([request.actionCode]).toEqual(testCase.expectedActionCodes);
    const documentIds = result.chunks.map((chunk) => chunk.documentId);
    const supportedActions = new Set(result.chunks.flatMap((chunk) => chunk.metadata.actionCodes));
    switch (testCase.expectedOutcome) {
      case "matched":
        expect(documentIds).toEqual(expect.arrayContaining(testCase.expectedDocumentIds));
        expect([...supportedActions]).toEqual(expect.arrayContaining(testCase.expectedActionCodes));
        break;
      case "no_match":
        expect(result.chunks).toEqual([]);
        expect([...supportedActions]).toEqual([]);
        break;
      case "conflict":
        expect(result.chunks).toEqual([]);
        expect([...supportedActions]).toEqual([]);
        expect(result.trace.conflictDocumentIds).toEqual(
          expect.arrayContaining(testCase.expectedDocumentIds),
        );
        break;
      default:
        testCase.expectedOutcome satisfies never;
    }
    const rankedChunks = [...result.trace.fts, ...result.trace.vector, ...result.trace.fused];
    for (const documentId of testCase.forbiddenDocumentIds) {
      expect(documentIds).not.toContain(documentId);
      const forbiddenChunks = store.chunks().filter((chunk) => chunk.documentId === documentId);
      for (const chunk of forbiddenChunks) {
        expect(rankedChunks.map((score) => score.chunkId)).not.toContain(chunk.chunkId);
      }
    }
    expect(result.trace.embedding.mode).toBe("mock");
    for (const chunk of result.chunks) {
      const stored = store.chunks().find((candidate) => candidate.chunkId === chunk.chunkId);
      expect(stored?.documentId).toBe(chunk.documentId);
      expect(stored?.documentVersion).toBe(chunk.documentVersion);
      expect(stored?.contentHash).toBe(chunk.contentHash);
      expect(chunk.metadata.actionCodes).toContain(request.actionCode);
    }
  });

  it("keeps every negative fixture outside ordinary ingestion", () => {
    // Given: the normal loader has walked the repository's knowledge directory.
    // When
    const documentIds = store.documents().map((record) => record.metadata.documentId);
    // Then
    expect(documentIds).toHaveLength(18);
    expect(documentIds.some((id) => id.startsWith("NEG-"))).toBe(false);
    expect(new Set(cases.map((testCase) => testCase.testId)).size).toBe(cases.length);
  });

  it("rejects a document instruction before it can become searchable evidence", () => {
    // Given / When / Then: a manifest-bound derivative still rejects contamination.
    expect(() => loadCaseFixture("NEG-PROMPT-INJECTION")).toThrow(
      new KnowledgeError("Instruction-contaminated source cannot be indexed"),
    );
  });

  it("excludes genuine reviewed documents at the preserved historical 09:00 request", async () => {
    // Given: reindex the genuine corpus and ledger at the original pre-review UTC.
    const request = requestAt("2026-09-21T09:00:00.000Z");
    const report = await ingestKnowledgeDirectory(root, store, {
      embedding,
      scope: "demo",
      now: request.now,
      signal: request.signal,
    });
    // When
    const result = await retrieve(store, embedding, request);
    // Then
    expect(report.indexedDocumentIds).toEqual([]);
    expect(report.exclusions).toHaveLength(18);
    expect(report.exclusions.every((entry) => entry.reasons.includes("review"))).toBe(true);
    expect(result.outcome).toBe("no_match");
    expect(result.chunks).toEqual([]);
  });
});

describe("isolated synthetic review timestamp boundaries", () => {
  it.each([
    ["2026-09-21T09:13:05.115Z", "no_match"],
    ["2026-09-21T09:13:05.116Z", "matched"],
    ["2026-09-21T09:13:05.117Z", "matched"],
  ] as const)("at document-test UTC %s returns %s", async (now, expectedOutcome) => {
    // Given: this fixture has a test-only review identity and never enters the real ledger.
    const db = new Database(":memory:");
    try {
      const store = new RagStore(db);
      store.upsert(loadCaseFixture("NEG-REVIEW-BOUNDARY"), {
        identity: embedding.identity,
        vector: [1, 0, 0],
      });
      // When
      const result = await retrieve(store, embedding, requestAt(now));
      // Then
      expect(result.outcome).toBe(expectedOutcome);
      expect(result.chunks.map((chunk) => chunk.documentId)).toEqual(
        expectedOutcome === "matched" ? ["NEG-REVIEW-BOUNDARY"] : [],
      );
    } finally {
      db.close();
    }
  });
});
