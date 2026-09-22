import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { expect, it } from "vitest";
import { createCorpusRefresh } from "./corpus-refresh";
import { parseKnowledgeDocument } from "./knowledge";
import { embeddings, markdown, metadata, now } from "./retrieval-test-fixtures";
import { RagStore } from "./store";

it("leaves healthy corpus untouched when a refresh caller is already aborted", async () => {
  const db = new Database(":memory:");
  const store = new RagStore(db);
  try {
    const corpus = createCorpusRefresh(store, embeddings, () => Date.parse("2026-09-21T10:00:00Z"));
    await corpus.initialize(process.cwd());
    const chunkIds = store.chunks().map((chunk) => chunk.chunkId);
    const controller = new AbortController();
    controller.abort();
    await expect(corpus.refresh(controller.signal)).rejects.toThrow();
    expect(store.chunks().map((chunk) => chunk.chunkId)).toEqual(chunkIds);
    expect(store.embeddings()).toHaveLength(18);
  } finally {
    db.close();
  }
});

it("invalidates a joined refresh when a source is retired during embedding", async () => {
  const root = await mkdtemp(join(tmpdir(), "rag-refresh-race-"));
  const db = new Database(":memory:");
  const store = new RagStore(db);
  try {
    for (const path of [
      "knowledge/common",
      "knowledge/equipment",
      "knowledge/fire-gas",
      "data/knowledge/reviews",
    ]) {
      await mkdir(join(root, path), { recursive: true });
    }
    const path = join(root, "knowledge/equipment/EQ-001.md");
    const source = markdown(metadata);
    const record = parseKnowledgeDocument(source, path);
    await writeFile(path, source);
    await writeFile(
      join(root, "data/knowledge/reviews/approvals.json"),
      JSON.stringify({
        schemaVersion: "1.0.0",
        approvals: [
          {
            documentId: "EQ-001",
            documentVersion: "0.1.0",
            reviewedContentHash: record.metadata.reviewedContentHash,
            approvedFileHash: record.contentHash,
            reviewedBy: metadata.reviewedBy,
            reviewedAt: metadata.reviewedAt,
          },
        ],
      }),
    );
    let markEntered: (() => void) | undefined;
    let release: (() => void) | undefined;
    const entered = new Promise<void>((resolve) => {
      markEntered = resolve;
    });
    const released = new Promise<void>((resolve) => {
      release = resolve;
    });
    const corpus = createCorpusRefresh(
      store,
      {
        identity: embeddings.identity,
        async embed(texts) {
          markEntered?.();
          await released;
          return texts.map(() => [1, 0, 0]);
        },
      },
      () => Date.parse(now),
    );
    const initial = corpus.initialize(root);
    await entered;
    await writeFile(
      path,
      source.replace('approvalStatus: "approved_for_demo"', 'approvalStatus: "retired"'),
    );
    const joined = corpus.refresh(new AbortController().signal);
    const settled = Promise.allSettled([initial, joined]);
    release?.();
    const results = await settled;
    expect(results.every((result) => result.status === "rejected")).toBe(true);
    expect(store.chunks()).toEqual([]);
  } finally {
    db.close();
    await rm(root, { recursive: true, force: true });
  }
});
