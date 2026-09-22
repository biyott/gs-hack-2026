import { KnowledgeError } from "./knowledge";
import type { RagStore } from "./store";
import type {
  FilterResult,
  KnowledgeChunk,
  KnowledgeMetadata,
  ModelIdentity,
  RetrievalRequest,
  StoredEmbedding,
} from "./types";

export function approvalExclusions(
  metadata: KnowledgeMetadata,
  scope: "demo" | "production",
  now: string,
): readonly string[] {
  const time = Date.parse(now);
  if (!Number.isFinite(time)) throw new KnowledgeError("Retrieval time must be a valid timestamp");
  const approvalMatches =
    scope === "demo"
      ? metadata.synthetic && metadata.approvalStatus === "approved_for_demo"
      : !metadata.synthetic && metadata.approvalStatus === "approved";
  return [
    ...(!approvalMatches ? ["approval"] : []),
    ...(!metadata.effectiveFrom || Date.parse(metadata.effectiveFrom) > time
      ? ["effective-date"]
      : []),
    ...(metadata.expiresAt && Date.parse(metadata.expiresAt) <= time ? ["expiry"] : []),
    ...(metadata.synthetic &&
    (!metadata.reviewedBy ||
      !metadata.reviewedAt ||
      !metadata.reviewedContentHash ||
      Date.parse(metadata.reviewedAt) > time)
      ? ["review"]
      : []),
  ];
}

export function sameEmbeddingModel(left: ModelIdentity, right: ModelIdentity): boolean {
  return (
    left.provider === right.provider &&
    left.model === right.model &&
    left.version === right.version &&
    left.dimensions === right.dimensions &&
    left.mode === right.mode
  );
}

function scopeExclusions(
  metadata: KnowledgeMetadata,
  request: RetrievalRequest,
): readonly string[] {
  const conditions = metadata.profileConditions;
  const constrained =
    conditions.stairsAllowed !== undefined || conditions.assistanceRequired !== undefined;
  const profileMatches =
    (!constrained || request.profile.verified) &&
    (conditions.stairsAllowed === undefined ||
      conditions.stairsAllowed === request.profile.stairsAllowed) &&
    (conditions.assistanceRequired === undefined ||
      conditions.assistanceRequired === request.profile.assistanceRequired) &&
    (conditions.profileVerified === undefined ||
      conditions.profileVerified === request.profile.verified);
  return [
    ...approvalExclusions(metadata, request.scope, request.now),
    ...(!metadata.siteIds.includes(request.siteId) ? ["site"] : []),
    ...(!metadata.simulationTypes.includes(request.simulationType) ? ["mode"] : []),
    ...(!metadata.hazardTypes.some((hazard) => request.hazardTypes.includes(hazard))
      ? ["hazard"]
      : []),
    ...(!metadata.applicableRoles.includes(request.role) ? ["role"] : []),
    ...(metadata.applicableZoneIds.length > 0 &&
    !metadata.applicableZoneIds.some((zone) => request.zoneIds.includes(zone))
      ? ["zone"]
      : []),
    ...(metadata.substanceIds.length > 0 &&
    !metadata.substanceIds.some((substance) => request.substanceIds.includes(substance))
      ? ["substance"]
      : []),
    ...(!profileMatches ? ["profile"] : []),
    ...(metadata.requiredScenarioPolicy &&
    metadata.requiredScenarioPolicy !== request.scenarioPolicy
      ? ["policy"]
      : []),
    ...(metadata.documentId === "FG-002" &&
    request.applicability?.fireInvalidatedPreviousRoute !== true
      ? ["fire-route-invalidation-unproven"]
      : []),
    ...(metadata.documentId === "FG-002" &&
    !["evacuation", "designated-refuge"].some((policy) => policy === request.scenarioPolicy)
      ? ["movement-policy-unproven"]
      : []),
    ...(metadata.documentId === "EQ-002" &&
    request.applicability?.equipmentDirectionChanged !== true
      ? ["equipment-direction-change-unproven"]
      : []),
  ];
}

export type CandidateSnapshot = {
  readonly filters: readonly FilterResult[];
  readonly chunks: readonly KnowledgeChunk[];
  readonly storedVectors: ReadonlyMap<string, StoredEmbedding>;
  readonly conflictDocumentIds: readonly string[];
};

export function selectCandidates(
  store: RagStore,
  identity: ModelIdentity,
  request: RetrievalRequest,
): CandidateSnapshot {
  const documents = store.documents();
  const chunks = store.chunks();
  const storedVectors = new Map(store.embeddings().map((vector) => [vector.chunkId, vector]));
  const documentChunks = new Map(chunks.map((chunk) => [chunk.documentId, chunk]));
  const scopeFilters = documents.map(({ metadata }) => {
    const chunk = documentChunks.get(metadata.documentId);
    const vector = chunk ? storedVectors.get(chunk.chunkId) : undefined;
    const indexReasons = !vector
      ? ["unindexed"]
      : sameEmbeddingModel(vector.identity, identity)
        ? []
        : ["embedding-model"];
    return {
      documentId: metadata.documentId,
      reasons: [...scopeExclusions(metadata, request), ...indexReasons],
    };
  });
  const scopedIds = new Set(
    scopeFilters.filter((filter) => filter.reasons.length === 0).map((filter) => filter.documentId),
  );
  const decisions = new Map<string, KnowledgeMetadata[]>();
  for (const { metadata } of documents) {
    if (!scopedIds.has(metadata.documentId) || !metadata.decisionKey) continue;
    const group = decisions.get(metadata.decisionKey) ?? [];
    group.push(metadata);
    decisions.set(metadata.decisionKey, group);
  }
  const conflictDocumentIds = [...decisions.values()]
    .filter(
      (group) =>
        group.some((metadata) => metadata.actionCodes.includes("FOLLOW_VALIDATED_ROUTE")) &&
        group.some((metadata) => metadata.actionCodes.includes("SHELTER_PER_SCENARIO")),
    )
    .flatMap((group) => group.map((metadata) => metadata.documentId))
    .sort();
  const filters = scopeFilters.map((filter) => {
    const chunk = documentChunks.get(filter.documentId);
    const actionMatches =
      chunk &&
      (chunk.metadata.actionCodes.length === 0 ||
        chunk.metadata.actionCodes.includes(request.actionCode));
    const reasons = [...filter.reasons, ...(!actionMatches ? ["action"] : [])];
    return { documentId: filter.documentId, eligible: reasons.length === 0, reasons };
  });
  const eligibleIds = new Set(
    filters.filter((filter) => filter.eligible).map((filter) => filter.documentId),
  );
  const candidates = chunks.filter((chunk) => eligibleIds.has(chunk.documentId));
  return { filters, chunks: candidates, storedVectors, conflictDocumentIds };
}
