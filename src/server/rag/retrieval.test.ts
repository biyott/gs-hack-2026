import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { retrieve } from "./retrieval";
import { body, embeddings, now, record, request } from "./retrieval-test-fixtures";
import { RagStore } from "./store";
import type { EmbeddingProvider } from "./types";

describe("SQLite hybrid retrieval with explicitly mocked vectors", () => {
  let db: Database.Database;
  let store: RagStore;
  beforeEach(() => {
    db = new Database(":memory:");
    store = new RagStore(db);
  });
  afterEach(() => db.close());
  function insert(change: Readonly<Record<string, unknown>> = {}) {
    store.upsert(record(change), { identity: embeddings.identity, vector: [1, 0, 0] });
  }

  it("returns real FTS and cosine traces with complete procedure evidence", async () => {
    // Given
    insert();
    // When
    const result = await retrieve(store, embeddings, request());
    // Then
    expect(result.outcome).toBe("matched");
    expect(result.chunks.map((chunk) => chunk.documentId)).toEqual(["EQ-001"]);
    expect(result.chunks[0]?.content).toBe(body);
    expect(result.trace.fts).toHaveLength(1);
    expect(result.trace.vector[0]?.score).toBe(1);
    expect(result.trace.fused).toHaveLength(1);
    expect(result.trace.embedding.mode).toBe("mock");
  });
  it.each([
    [{ approvalStatus: "draft" }, "approval"],
    [{ approvalStatus: "retired" }, "approval"],
    [{ approvalStatus: "approved" }, "approval"],
    [{ effectiveFrom: "2026-10-01T00:00:00Z" }, "effective-date"],
    [{ expiresAt: now }, "expiry"],
    [{ siteIds: ["SITE-INDUSTRIAL-01"], simulationType: "common" }, "site"],
    [{ simulationType: "fire-gas" }, "mode"],
    [{ hazardTypes: ["fire"] }, "hazard"],
    [{ applicableRoles: ["operator"] }, "role"],
    [{ applicableZoneIds: ["ZONE-B"] }, "zone"],
    [{ substanceIds: ["DEMO-GAS-OTHER"] }, "substance"],
    [{ actionCodes: ["SENSOR_UNKNOWN"] }, "action"],
    [{ profileConditions: { stairsAllowed: false } }, "profile"],
    [{ requiredScenarioPolicy: "shelter-per-scenario" }, "policy"],
  ] as const)("excludes %j before ranking with reason %s", async (change, reason) => {
    // Given
    insert(change);
    // When
    const result = await retrieve(store, embeddings, request());
    // Then
    expect(result.outcome).toBe("no_match");
    expect(result.trace.filters[0]?.reasons).toContain(reason);
    expect(result.trace.fts).toEqual([]);
    expect(result.trace.vector).toEqual([]);
  });
  it("excludes demo approvals when production scope is requested", async () => {
    // Given
    insert();
    // When
    const result = await retrieve(store, embeddings, request({ scope: "production" }));
    // Then
    expect(result.outcome).toBe("no_match");
  });
  it("matches confirmed functional constraints when explicit values agree", async () => {
    // Given
    insert({ profileConditions: { stairsAllowed: false, assistanceRequired: true } });
    // When
    const result = await retrieve(
      store,
      embeddings,
      request({ profile: { stairsAllowed: false, assistanceRequired: true, verified: true } }),
    );
    // Then
    expect(result.outcome).toBe("matched");
  });
  it("reports contradictory directives before the requested action hides one", async () => {
    // Given
    insert({
      documentId: "CONFLICT-MOVE",
      decisionKey: "same-decision",
      actionCodes: ["FOLLOW_VALIDATED_ROUTE"],
    });
    insert({
      documentId: "CONFLICT-STAY",
      decisionKey: "same-decision",
      actionCodes: ["SHELTER_PER_SCENARIO"],
    });
    // When
    const result = await retrieve(
      store,
      embeddings,
      request({ actionCode: "FOLLOW_VALIDATED_ROUTE" }),
    );
    // Then
    expect(result.outcome).toBe("conflict");
    expect(result.chunks).toEqual([]);
    expect(result.trace.conflictDocumentIds).toEqual(["CONFLICT-MOVE", "CONFLICT-STAY"]);
  });
  it("removes old FTS entries and vectors when the document is retired", async () => {
    // Given
    insert();
    const oldChunkIds = store.chunks().map((chunk) => chunk.chunkId);
    store.upsert(record({ approvalStatus: "retired", version: "0.2.0" }), null);
    // When
    const result = await retrieve(store, embeddings, request());
    // Then
    expect(result.outcome).toBe("no_match");
    expect(store.embeddings()).toEqual([]);
    expect(store.keywordSearch("equipment", oldChunkIds)).toEqual([]);
  });
  it("refuses to mix stored vectors from a different model version", async () => {
    // Given
    store.upsert(record(), {
      identity: { ...embeddings.identity, version: "obsolete" },
      vector: [1, 0, 0],
    });
    // When
    const result = await retrieve(store, embeddings, request());
    // Then
    expect(result.trace.vector).toEqual([]);
    expect(result.trace.filters[0]?.reasons).toContain("embedding-model");
  });
  it("records below-cutoff cosine scores while declining unrelated evidence", async () => {
    // Given
    insert();
    const orthogonal: EmbeddingProvider = {
      ...embeddings,
      async embed() {
        return [[0, 1, 0]];
      },
    };
    // When
    const result = await retrieve(store, orthogonal, request({ query: "zzunrelated" }));
    // Then
    expect(result.outcome).toBe("no_match");
    expect(result.trace.vector[0]?.score).toBe(0);
    expect(result.trace.fused).toEqual([]);
  });
  it("discards candidates retired during asynchronous query embedding", async () => {
    // Given
    insert();
    const retiring: EmbeddingProvider = {
      ...embeddings,
      async embed() {
        store.upsert(record({ approvalStatus: "retired", version: "0.2.0" }), null);
        return [[1, 0, 0]];
      },
    };
    // When
    const result = await retrieve(store, retiring, request());
    // Then
    expect(result.outcome).toBe("no_match");
    expect(result.trace.filters[0]?.reasons).toContain("index-changed");
  });
  it("detects contradictory documents indexed during asynchronous query embedding", async () => {
    // Given
    insert({ decisionKey: "same-decision", actionCodes: ["FOLLOW_VALIDATED_ROUTE"] });
    const changing: EmbeddingProvider = {
      ...embeddings,
      async embed() {
        insert({
          documentId: "CONFLICT-STAY",
          decisionKey: "same-decision",
          actionCodes: ["SHELTER_PER_SCENARIO"],
        });
        return [[1, 0, 0]];
      },
    };
    // When
    const result = await retrieve(
      store,
      changing,
      request({ actionCode: "FOLLOW_VALIDATED_ROUTE" }),
    );
    // Then
    expect(result.outcome).toBe("conflict");
    expect(result.chunks).toEqual([]);
    expect(result.trace.conflictDocumentIds).toEqual(["CONFLICT-STAY", "EQ-001"]);
  });
});
