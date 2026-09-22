import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import { z } from "zod";
import type { Guidance } from "@/contracts";
import { createCorpusRefresh } from "./corpus-refresh";
import { MAX_SUPPLEMENT_MS, withinDeadline } from "./deadline";
import {
  type EnrichmentInput,
  type EnrichmentResult,
  type FallbackReason,
  type LanguageModelProvider,
  RagProviderError,
} from "./generation-types";
import { retrieve } from "./retrieval";
import { selectCandidates } from "./retrieval-candidates";
import { RagStore } from "./store";
import type { EmbeddingProvider } from "./types";
import { guidanceIsCurrent, validateSupplement } from "./validation";

export type RagServiceOptions = {
  readonly db: Database.Database;
  readonly embedding: EmbeddingProvider;
  readonly llm: LanguageModelProvider;
  readonly timeoutMs?: number;
  readonly wallNow?: () => number;
  readonly monotonicNow?: () => number;
};

export function createRagService(options: RagServiceOptions) {
  const store = new RagStore(options.db);
  const wallNow = options.wallNow ?? Date.now;
  const monotonicNow = options.monotonicNow ?? (() => performance.now());
  const timeoutMs = z
    .number()
    .int()
    .positive()
    .max(MAX_SUPPLEMENT_MS)
    .parse(options.timeoutMs ?? MAX_SUPPLEMENT_MS);
  const model = { ...options.llm.identity, dimensions: 0 };
  const corpus = createCorpusRefresh(store, options.embedding, wallNow);

  return {
    store,
    initialize(root = process.cwd()) {
      return corpus.initialize(root);
    },
    async enrichGuidance(
      input: EnrichmentInput,
      getCurrent: () => Guidance | null,
    ): Promise<EnrichmentResult> {
      const ragRunId = randomUUID();
      const startedAt = new Date(wallNow()).toISOString();
      const started = monotonicNow();
      let settled: EnrichmentResult | undefined;
      let completionTrace: {
        readonly callId: string;
        readonly responseHash: string;
        readonly modelReturned: string;
      } | null = null;
      const fallback = (reason: FallbackReason): EnrichmentResult => {
        if (settled) return settled;
        store.logRun({
          id: ragRunId,
          runId: input.guidance.runId,
          startedAt,
          completedAt: new Date(wallNow()).toISOString(),
          phase: "generation",
          outcome: "fallback",
          provider: model,
          detailJson: JSON.stringify({
            guidanceId: input.guidance.guidanceId,
            reason,
            elapsedMs: monotonicNow() - started,
            completion: completionTrace,
          }),
        });
        settled = { status: "fallback", reason, ragRunId };
        return settled;
      };
      if (Date.parse(input.guidance.expiresAt) <= wallNow()) return fallback("expired");
      if (!guidanceIsCurrent(input.guidance, getCurrent(), wallNow()))
        return fallback("stale_guidance");
      try {
        return await withinDeadline(async (signal) => {
          await corpus.refresh(signal);
          const request = {
            ...input.context,
            runId: input.guidance.runId,
            actionCode: input.guidance.actionCode,
            now: new Date(wallNow()).toISOString(),
            signal,
          };
          const retrieval = await retrieve(store, options.embedding, request);
          if (retrieval.outcome !== "matched") return fallback(retrieval.outcome);
          const retrievedAt = monotonicNow();
          const completion = await options.llm.generate(
            {
              actionCode: input.guidance.actionCode,
              locale: input.guidance.locale,
              chunks: retrieval.chunks,
            },
            signal,
          );
          completionTrace = {
            callId: completion.callId,
            responseHash: completion.responseHash,
            modelReturned: completion.modelReturned,
          };
          if (signal.aborted || monotonicNow() - started >= timeoutMs) return fallback("timeout");
          await corpus.refresh(signal);
          if (signal.aborted || monotonicNow() - started >= timeoutMs) return fallback("timeout");
          if (!guidanceIsCurrent(input.guidance, getCurrent(), wallNow()))
            return fallback("stale_guidance");
          const currentEvidence = selectCandidates(store, options.embedding.identity, {
            ...request,
            now: new Date(wallNow()).toISOString(),
          });
          if (currentEvidence.conflictDocumentIds.length > 0) return fallback("conflict");
          const currentChunks = currentEvidence.chunks;
          if (
            retrieval.chunks.some(
              (chunk) =>
                !currentChunks.some(
                  (current) =>
                    current.chunkId === chunk.chunkId && current.contentHash === chunk.contentHash,
                ),
            )
          )
            return fallback("stale_guidance");
          const validation = validateSupplement(completion.output, {
            guidance: input.guidance,
            chunks: retrieval.chunks,
          });
          if (!validation.valid) return fallback(validation.reason);
          if (monotonicNow() - started >= timeoutMs) return fallback("timeout");
          store.logRun({
            id: ragRunId,
            runId: input.guidance.runId,
            startedAt,
            completedAt: new Date(wallNow()).toISOString(),
            phase: "generation",
            outcome: "accepted",
            provider: model,
            detailJson: JSON.stringify({
              guidanceId: input.guidance.guidanceId,
              callId: completion.callId,
              responseHash: completion.responseHash,
              modelReturned: completion.modelReturned,
              retrievalMs: retrievedAt - started,
              generationMs: monotonicNow() - retrievedAt,
              validation: "reviewed-extractive-selection",
              supplement: validation.supplement,
            }),
          });
          store.recordEvidence(input.guidance.guidanceId, validation.supplement.evidence);
          settled = { status: "accepted", supplement: validation.supplement, ragRunId };
          return settled;
        }, timeoutMs);
      } catch (error) {
        if (error instanceof RagProviderError && error.code === "aborted")
          return fallback("timeout");
        if (error instanceof Error && error.name === "TimeoutError") return fallback("timeout");
        if (error instanceof Error) return fallback("provider_failure");
        throw error;
      }
    },
  };
}
