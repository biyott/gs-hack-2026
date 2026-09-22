import type { Guidance } from "@/contracts";
import { type FallbackReason, type Supplement, SupplementSchema } from "./generation-types";
import { hasInstructionContamination } from "./knowledge";
import type { KnowledgeChunk } from "./types";

export type ValidationResult =
  | { readonly valid: true; readonly supplement: Supplement }
  | { readonly valid: false; readonly reason: FallbackReason };

export function validateSupplement(
  output: unknown,
  input: { readonly guidance: Guidance; readonly chunks: readonly KnowledgeChunk[] },
): ValidationResult {
  const parsed = SupplementSchema.safeParse(output);
  if (!parsed.success) return { valid: false, reason: "invalid_output" };
  const supplement = parsed.data;
  if (supplement.actionCode !== input.guidance.actionCode)
    return { valid: false, reason: "action_mismatch" };
  if (supplement.locale !== input.guidance.locale)
    return { valid: false, reason: "locale_mismatch" };
  const cited: KnowledgeChunk[] = [];
  for (const citation of supplement.evidence) {
    const chunk = input.chunks.find(
      (candidate) =>
        candidate.documentId === citation.documentId &&
        candidate.documentVersion === citation.documentVersion &&
        candidate.chunkId === citation.chunkId,
    );
    if (!chunk) return { valid: false, reason: "incorrect_citation" };
    if (hasInstructionContamination(chunk.content))
      return { valid: false, reason: "unsafe_document" };
    if (!chunk.metadata.actionCodes.includes(supplement.actionCode))
      return { valid: false, reason: "action_mismatch" };
    cited.push(chunk);
  }
  const exactReviewedMatch = cited.some(
    (chunk) =>
      chunk.metadata.reviewedBy !== null &&
      chunk.metadata.reviewedAt !== null &&
      chunk.metadata.reviewedSupplementalExplanation?.[supplement.locale] ===
        supplement.supplementalExplanation,
  );
  if (!exactReviewedMatch) return { valid: false, reason: "unreviewed_explanation" };
  return { valid: true, supplement };
}

export function guidanceIsCurrent(
  original: Guidance,
  current: Guidance | null,
  now: number,
): boolean {
  if (
    !current ||
    Date.parse(original.generatedAt) > now ||
    Date.parse(current.generatedAt) > now ||
    Date.parse(original.expiresAt) <= now ||
    Date.parse(current.expiresAt) <= now
  )
    return false;
  return (
    original.runId === current.runId &&
    original.workerId === current.workerId &&
    original.incidentId === current.incidentId &&
    original.eventId === current.eventId &&
    original.guidanceId === current.guidanceId &&
    original.guidanceVersion === current.guidanceVersion &&
    original.actionCode === current.actionCode &&
    original.routeVersion === current.routeVersion &&
    original.stepId === current.stepId &&
    original.profileVersion === current.profileVersion &&
    original.mapId === current.mapId &&
    original.mapVersion === current.mapVersion &&
    original.floorId === current.floorId &&
    original.locale === current.locale &&
    original.templateCatalogVersion === current.templateCatalogVersion &&
    original.simulationMode === current.simulationMode &&
    original.destinationId === current.destinationId &&
    original.hazardType === current.hazardType &&
    JSON.stringify([...original.hazardIds].sort()) ===
      JSON.stringify([...current.hazardIds].sort()) &&
    JSON.stringify(original.waypoints) === JSON.stringify(current.waypoints)
  );
}
