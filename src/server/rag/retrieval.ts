import { randomUUID } from "node:crypto";
import { KnowledgeError } from "./knowledge";
import { selectCandidates } from "./retrieval-candidates";
import { parseEmbeddingVector, type RagStore } from "./store";
import type { EmbeddingProvider, RetrievalRequest, RetrievalResult, SearchScore } from "./types";

export { approvalExclusions, sameEmbeddingModel } from "./retrieval-candidates";

function cosine(left: readonly number[], right: readonly number[]): number {
  const dot = left.reduce((sum, value, index) => sum + value * (right[index] ?? 0), 0);
  const magnitude = Math.sqrt(
    left.reduce((sum, value) => sum + value * value, 0) *
      right.reduce((sum, value) => sum + value * value, 0),
  );
  return dot / magnitude;
}

function rankFusion(
  fts: readonly SearchScore[],
  vectors: readonly SearchScore[],
): readonly SearchScore[] {
  const scores = new Map<string, number>();
  for (const ranking of [fts, vectors]) {
    ranking.forEach((hit, rank) => {
      scores.set(hit.chunkId, (scores.get(hit.chunkId) ?? 0) + 1 / (60 + rank + 1));
    });
  }
  return [...scores]
    .map(([chunkId, score]) => ({ chunkId, score }))
    .sort((left, right) => right.score - left.score || left.chunkId.localeCompare(right.chunkId));
}

export async function retrieve(
  store: RagStore,
  embedding: EmbeddingProvider,
  request: RetrievalRequest,
): Promise<RetrievalResult> {
  request.signal.throwIfAborted();
  const startedAt = new Date().toISOString();
  const initial = selectCandidates(store, embedding.identity, request);
  let current = initial;
  let filters = initial.filters;
  let candidates = initial.chunks;
  let queryVector: readonly number[] = [];
  let fts: readonly SearchScore[] = [];
  let vector: readonly SearchScore[] = [];
  if (candidates.length > 0 && initial.conflictDocumentIds.length === 0) {
    const vectors = await embedding.embed([`query: ${request.query}`], request.signal);
    request.signal.throwIfAborted();
    if (vectors.length !== 1)
      throw new KnowledgeError("Query embedding count does not match the request");
    queryVector = parseEmbeddingVector(vectors[0], embedding.identity.dimensions);
    current = selectCandidates(store, embedding.identity, request);
    const changedIds = new Set(
      initial.chunks
        .filter(
          (before) =>
            !current.chunks.some(
              (after) =>
                before.chunkId === after.chunkId && before.contentHash === after.contentHash,
            ),
        )
        .map((chunk) => chunk.documentId),
    );
    filters = current.filters.map((filter) =>
      changedIds.has(filter.documentId)
        ? { ...filter, eligible: false, reasons: [...filter.reasons, "index-changed"] }
        : filter,
    );
    candidates =
      current.conflictDocumentIds.length > 0
        ? []
        : current.chunks.filter((chunk) => !changedIds.has(chunk.documentId));
    fts = store.keywordSearch(
      request.query,
      candidates.map((chunk) => chunk.chunkId),
    );
    vector = candidates
      .flatMap((chunk) => {
        const stored = current.storedVectors.get(chunk.chunkId);
        return stored
          ? [{ chunkId: chunk.chunkId, score: cosine(queryVector, stored.vector) }]
          : [];
      })
      .sort((left, right) => right.score - left.score || left.chunkId.localeCompare(right.chunkId));
  }
  const fused = rankFusion(
    fts,
    vector.filter((hit) => hit.score >= 0.35),
  );
  const selectedIds = fused
    .slice(0, Math.max(1, Math.min(50, request.limit)))
    .map((hit) => hit.chunkId);
  const selected = selectedIds.flatMap((id) => candidates.filter((chunk) => chunk.chunkId === id));
  const conflictDocumentIds = current.conflictDocumentIds;
  const outcome =
    conflictDocumentIds.length > 0 ? "conflict" : selected.length > 0 ? "matched" : "no_match";
  const trace = {
    runId: request.runId,
    startedAt,
    completedAt: new Date().toISOString(),
    embedding: embedding.identity,
    applicability: request.applicability ?? null,
    queryVector,
    filters,
    fts,
    vector,
    fused,
    conflictDocumentIds,
  };
  store.logRun({
    id: randomUUID(),
    runId: request.runId,
    startedAt,
    completedAt: trace.completedAt,
    phase: "retrieval",
    outcome,
    provider: embedding.identity,
    detailJson: JSON.stringify(trace),
  });
  return { outcome, chunks: selected, trace };
}
