import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ingestKnowledgeDirectory } from "./ingestion";
import { parseKnowledgeDocument } from "./knowledge";
import { embeddings, markdown, metadata, now } from "./retrieval-test-fixtures";
import { RagStore } from "./store";

describe("independent approval ledger ingestion", () => {
  let db: Database.Database;
  let store: RagStore;
  beforeEach(() => {
    db = new Database(":memory:");
    store = new RagStore(db);
  });
  afterEach(() => db.close());
  it.each([
    { change: {}, expected: ["EQ-001"] },
    { change: { documentId: "OTHER-DOC" }, expected: [] },
    { change: { documentVersion: "0.2.0" }, expected: [] },
    { change: { reviewedContentHash: "0".repeat(64) }, expected: [] },
    { change: { approvedFileHash: "0".repeat(64) }, expected: [] },
    { change: { reviewedBy: "other-reviewer" }, expected: [] },
    { change: { reviewedAt: "2026-09-19T09:00:00.000Z" }, expected: [] },
  ])(
    "binds independent ledger tuple $change and excludes negative fixture directories",
    async ({ change, expected }) => {
      // Given
      const root = await mkdtemp(join(tmpdir(), "rag-ingestion-"));
      try {
        await mkdir(join(root, "knowledge/equipment"), { recursive: true });
        await mkdir(join(root, "tests/negative-fixtures"), { recursive: true });
        await mkdir(join(root, "data/knowledge/reviews"), { recursive: true });
        const source = markdown(metadata);
        const approved = parseKnowledgeDocument(source, "knowledge/equipment/EQ-001.md");
        await writeFile(join(root, "knowledge/equipment/EQ-001.md"), source);
        await writeFile(
          join(root, "tests/negative-fixtures/injected.md"),
          markdown({ ...metadata, documentId: "INJECTED" }),
        );
        await writeFile(
          join(root, "data/knowledge/reviews/approvals.json"),
          JSON.stringify({
            schemaVersion: "1.0.0",
            approvals: [
              {
                documentId: "EQ-001",
                documentVersion: "0.1.0",
                reviewedContentHash: approved.metadata.reviewedContentHash,
                approvedFileHash: approved.contentHash,
                reviewedBy: metadata.reviewedBy,
                reviewedAt: metadata.reviewedAt,
                ...change,
              },
            ],
          }),
        );
        // When
        const result = await ingestKnowledgeDirectory(root, store, {
          embedding: embeddings,
          scope: "demo",
          now,
          signal: new AbortController().signal,
        });
        // Then
        expect(result.indexedDocumentIds).toEqual(expected);
        expect(store.documents().map((document) => document.metadata.documentId)).toEqual([
          "EQ-001",
        ]);
        expect(store.embeddings()).toHaveLength(expected.length);
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    },
  );
});
