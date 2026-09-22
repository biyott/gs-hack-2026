import { z } from "zod";
import type { Guidance } from "@/contracts";
import { ActionCodeSchema, EvidenceSchema, LocaleSchema } from "@/contracts";
import type { KnowledgeChunk, RetrievalRequest } from "./types";

export const SupplementSchema = z
  .object({
    actionCode: ActionCodeSchema,
    locale: LocaleSchema,
    supplementalExplanation: z.string().min(1).max(1500),
    evidence: z.array(EvidenceSchema).min(1).max(3),
  })
  .strict();
export type Supplement = z.infer<typeof SupplementSchema>;
export type LanguageModelIdentity = {
  readonly provider: string;
  readonly model: string;
  readonly version: string;
  readonly mode: "actual" | "mock";
};
export type GenerationInput = {
  readonly actionCode: Guidance["actionCode"];
  readonly locale: Guidance["locale"];
  readonly chunks: readonly KnowledgeChunk[];
};
export interface LanguageModelProvider {
  readonly identity: LanguageModelIdentity;
  generate(input: GenerationInput, signal: AbortSignal): Promise<ModelCompletion>;
}
export type ModelCompletion = {
  readonly output: unknown;
  readonly callId: string;
  readonly responseHash: string;
  readonly modelReturned: string;
};
export type EnrichmentInput = {
  readonly guidance: Guidance;
  readonly context: Omit<RetrievalRequest, "runId" | "actionCode" | "now" | "signal">;
};
export type FallbackReason =
  | "no_match"
  | "conflict"
  | "provider_failure"
  | "timeout"
  | "invalid_output"
  | "incorrect_citation"
  | "action_mismatch"
  | "locale_mismatch"
  | "unreviewed_explanation"
  | "unsafe_document"
  | "stale_guidance"
  | "expired";
export type EnrichmentResult =
  | { readonly status: "accepted"; readonly supplement: Supplement; readonly ragRunId: string }
  | { readonly status: "fallback"; readonly reason: FallbackReason; readonly ragRunId: string };

export class RagProviderError extends Error {
  constructor(
    readonly code: "configuration" | "transport" | "invalid_response" | "aborted",
    message: string,
  ) {
    super(message);
    this.name = "RagProviderError";
  }
}
