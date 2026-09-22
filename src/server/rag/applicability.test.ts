import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseKnowledgeDocument } from "./knowledge";
import { retrieve } from "./retrieval";
import { embeddings, request } from "./retrieval-test-fixtures";
import { RagStore } from "./store";

describe("operative fire-route evidence eligibility", () => {
  let db: Database.Database;
  let store: RagStore;
  beforeEach(() => {
    db = new Database(":memory:");
    store = new RagStore(db);
    const path = fileURLToPath(new URL("../../../knowledge/fire-gas/FG-002.md", import.meta.url));
    store.upsert(parseKnowledgeDocument(readFileSync(path, "utf8"), path), {
      identity: embeddings.identity,
      vector: [1, 0, 0],
    });
  });
  afterEach(() => db.close());

  const fireRequest = () =>
    request({
      now: "2026-09-21T09:30:00.000Z",
      simulationType: "fire-gas",
      hazardTypes: ["fire"],
      actionCode: "FOLLOW_VALIDATED_ROUTE",
      scenarioPolicy: "designated-refuge",
      query: "화재 기존 이동 경로 변경 fire route change",
    });

  it.each([undefined, { fireInvalidatedPreviousRoute: false }])(
    "excludes a reroute procedure when an initial fire request lacks causal history: %j",
    async (applicability) => {
      // Given: a valid first movement action supplies no prior fire invalidation fact.
      const input = { ...fireRequest(), ...(applicability ? { applicability } : {}) };
      // When: actual SQLite/FTS filtering runs with explicitly mocked vectors.
      const result = await retrieve(store, embeddings, input);
      // Then: an inapplicable procedure never reaches keyword/vector/fusion ranking.
      expect(result.outcome).toBe("no_match");
      expect(result.chunks).toEqual([]);
      expect(result.trace.filters).toContainEqual({
        documentId: "FG-002",
        eligible: false,
        reasons: ["fire-route-invalidation-unproven"],
      });
      expect(result.trace.fts).toEqual([]);
      expect(result.trace.vector).toEqual([]);
      expect(result.trace.fused).toEqual([]);
    },
  );

  it("retains the fire reroute procedure when authoritative invalidation and movement policy exist", async () => {
    // Given: this is an explicit filter fixture, not proof of production fact derivation.
    const input = {
      ...fireRequest(),
      applicability: { fireInvalidatedPreviousRoute: true },
    };
    // When
    const result = await retrieve(store, embeddings, input);
    // Then: a blanket exclusion would fail this positive genuine-reroute condition.
    expect(result.outcome).toBe("matched");
    expect(result.chunks.map((chunk) => chunk.documentId)).toEqual(["FG-002"]);
    expect(result.trace.fts).toHaveLength(1);
    expect(result.trace.vector).toHaveLength(1);
  });

  it.each([null, "shelter-per-scenario"])(
    "excludes movement explanation when the current policy is %s",
    async (scenarioPolicy) => {
      // Given: a past invalidation cannot establish a current movement policy.
      const input = {
        ...fireRequest(),
        scenarioPolicy,
        applicability: { fireInvalidatedPreviousRoute: true },
      };
      // When
      const result = await retrieve(store, embeddings, input);
      // Then
      expect(result.outcome).toBe("no_match");
      expect(result.trace.filters[0]?.reasons).toContain("movement-policy-unproven");
    },
  );
});

describe("operative equipment-direction evidence eligibility", () => {
  it.each([undefined, false, true])(
    "requires a proved direction change before selecting EQ-002: %s",
    async (equipmentDirectionChanged) => {
      // Given: the same current movement action can follow an initial route or a real turn.
      const db = new Database(":memory:");
      try {
        const store = new RagStore(db);
        const path = fileURLToPath(
          new URL("../../../knowledge/equipment/EQ-002.md", import.meta.url),
        );
        store.upsert(parseKnowledgeDocument(readFileSync(path, "utf8"), path), {
          identity: embeddings.identity,
          vector: [1, 0, 0],
        });
        const input = {
          ...request({
            now: "2026-09-21T09:30:00.000Z",
            actionCode: "FOLLOW_VALIDATED_ROUTE",
            query: "장비 방향 변경 equipment direction change",
          }),
          ...(equipmentDirectionChanged === undefined
            ? {}
            : { applicability: { equipmentDirectionChanged } }),
        };
        // When
        const result = await retrieve(store, embeddings, input);
        // Then: missing/false facts reject even a strongly matching query.
        expect(result.chunks.map((chunk) => chunk.documentId)).toEqual(
          equipmentDirectionChanged === true ? ["EQ-002"] : [],
        );
        if (equipmentDirectionChanged !== true) {
          expect(result.trace.filters[0]?.reasons).toContain("equipment-direction-change-unproven");
          expect(result.trace.fused).toEqual([]);
        }
      } finally {
        db.close();
      }
    },
  );
});
