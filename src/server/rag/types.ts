import type { ActionCode } from "../../../packages/contracts/src/core";

export type ModelIdentity = {
  readonly provider: string;
  readonly model: string;
  readonly version: string;
  readonly dimensions: number;
  readonly mode: "actual" | "mock";
};

export interface EmbeddingProvider {
  readonly identity: ModelIdentity;
  embed(texts: readonly string[], signal: AbortSignal): Promise<readonly (readonly number[])[]>;
}

export type KnowledgeMetadata = {
  readonly documentId: string;
  readonly title: string;
  readonly siteIds: readonly string[];
  readonly simulationType: "common" | "equipment" | "fire-gas";
  readonly simulationTypes: readonly ("equipment" | "fire-gas")[];
  readonly hazardTypes: readonly string[];
  readonly applicableRoles: readonly string[];
  readonly applicableZoneIds: readonly string[];
  readonly substanceIds: readonly string[];
  readonly profileConditions: {
    readonly stairsAllowed?: boolean;
    readonly assistanceRequired?: boolean;
    readonly profileVerified?: boolean;
  };
  readonly actionCodes: readonly ActionCode[];
  readonly language: string;
  readonly version: string;
  readonly synthetic: boolean;
  readonly approvalStatus: "draft" | "approved_for_demo" | "approved" | "retired";
  readonly effectiveFrom: string | null;
  readonly expiresAt: string | null;
  readonly reviewedBy: string | null;
  readonly reviewedAt: string | null;
  readonly reviewedContentHash: string | null;
  readonly sourceReference: string;
  readonly requiredScenarioPolicy: string | null;
  readonly decisionKey: string | null;
  readonly reviewedSupplementalExplanation: { readonly ko: string; readonly en: string } | null;
};

export type KnowledgeRecord = {
  readonly metadata: KnowledgeMetadata;
  readonly originalMetadata: Readonly<Record<string, unknown>>;
  readonly body: string;
  readonly sourcePath: string;
  readonly contentHash: string;
};

export type KnowledgeChunk = {
  readonly documentId: string;
  readonly documentVersion: string;
  readonly chunkId: string;
  readonly content: string;
  readonly metadata: KnowledgeMetadata;
  readonly contentHash: string;
};

export type StoredEmbedding = {
  readonly chunkId: string;
  readonly identity: ModelIdentity;
  readonly vector: readonly number[];
};

// The backend binds these causal facts to the exact current primary and its durable predecessor.
// Fire invalidation additionally proves a current validated replacement route; missing is unknown.
export type ApplicabilityFacts = {
  readonly fireInvalidatedPreviousRoute?: boolean;
  readonly equipmentDirectionChanged?: boolean;
};

export type RetrievalRequest = {
  readonly runId: string;
  readonly query: string;
  readonly siteId: string;
  readonly simulationType: "equipment" | "fire-gas";
  readonly hazardTypes: readonly string[];
  readonly role: string;
  readonly zoneIds: readonly string[];
  readonly substanceIds: readonly string[];
  readonly actionCode: ActionCode;
  readonly profile: {
    readonly stairsAllowed: boolean | null;
    readonly assistanceRequired: boolean | null;
    readonly verified: boolean;
  };
  readonly scenarioPolicy: string | null;
  readonly applicability?: ApplicabilityFacts;
  readonly scope: "demo" | "production";
  readonly now: string;
  readonly limit: number;
  readonly signal: AbortSignal;
};

export type SearchScore = { readonly chunkId: string; readonly score: number };
export type FilterResult = {
  readonly documentId: string;
  readonly eligible: boolean;
  readonly reasons: readonly string[];
};
export type RetrievalTrace = {
  readonly runId: string;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly embedding: ModelIdentity;
  readonly applicability: ApplicabilityFacts | null;
  readonly queryVector: readonly number[];
  readonly filters: readonly FilterResult[];
  readonly fts: readonly SearchScore[];
  readonly vector: readonly SearchScore[];
  readonly fused: readonly SearchScore[];
  readonly conflictDocumentIds: readonly string[];
};

export type RetrievalResult = {
  readonly outcome: "matched" | "no_match" | "conflict";
  readonly chunks: readonly KnowledgeChunk[];
  readonly trace: RetrievalTrace;
};

export type RagRunRecord = {
  readonly id: string;
  readonly runId: string;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly phase: string;
  readonly outcome: string;
  readonly provider: ModelIdentity;
  readonly detailJson: string;
};

export type EvidenceReference = {
  readonly documentId: string;
  readonly documentVersion: string;
  readonly chunkId: string;
};
