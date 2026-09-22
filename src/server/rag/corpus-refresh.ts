import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { type IngestionReport, ingestKnowledgeDirectory } from "./ingestion";
import { KnowledgeError } from "./knowledge";
import type { RagStore } from "./store";
import type { EmbeddingProvider } from "./types";

async function fingerprint(root: string): Promise<string> {
  const files = (
    await Promise.all(
      ["common", "equipment", "fire-gas"].map(async (kind) => {
        const directory = join(root, "knowledge", kind);
        const entries = await readdir(directory, { withFileTypes: true });
        return entries
          .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
          .map((entry) => join(directory, entry.name));
      }),
    )
  )
    .flat()
    .sort();
  files.push(join(root, "data/knowledge/reviews/approvals.json"));
  const hash = createHash("sha256");
  for (const path of files) hash.update(path).update(await readFile(path));
  return hash.digest("hex");
}

export function createCorpusRefresh(
  store: RagStore,
  embedding: EmbeddingProvider,
  now: () => number,
) {
  let root = process.cwd();
  let indexedFingerprint: string | undefined;
  let refreshInFlight: Promise<IngestionReport | null> | undefined;
  const invalidate = () => {
    indexedFingerprint = undefined;
    const knowledgeRoot = `${resolve(root, "knowledge")}${sep}`;
    for (const document of store.documents()) {
      if (resolve(document.sourcePath).startsWith(knowledgeRoot))
        store.remove(document.metadata.documentId);
    }
  };
  const refresh = async (signal: AbortSignal): Promise<IngestionReport | null> => {
    signal.throwIfAborted();
    refreshInFlight ??= (async () => {
      const currentFingerprint = await fingerprint(root);
      signal.throwIfAborted();
      if (currentFingerprint === indexedFingerprint) return null;
      indexedFingerprint = undefined;
      const report = await ingestKnowledgeDirectory(root, store, {
        embedding,
        scope: "demo",
        now: new Date(now()).toISOString(),
        signal,
      });
      if ((await fingerprint(root)) !== currentFingerprint) {
        invalidate();
        throw new KnowledgeError("Knowledge changed while indexing; stale evidence removed");
      }
      indexedFingerprint = currentFingerprint;
      return report;
    })().finally(() => {
      refreshInFlight = undefined;
    });
    try {
      const report = await refreshInFlight;
      signal.throwIfAborted();
      if ((await fingerprint(root)) !== indexedFingerprint) {
        throw new KnowledgeError("Knowledge changed before refresh publication");
      }
      return report;
    } catch (error) {
      if (
        signal.aborted ||
        (error instanceof Error && ["AbortError", "TimeoutError"].includes(error.name))
      )
        throw error;
      invalidate();
      throw error;
    }
  };
  return {
    refresh,
    initialize(directory: string) {
      root = directory;
      indexedFingerprint = undefined;
      return refresh(AbortSignal.timeout(120_000));
    },
  };
}
