import { parseKnowledgeDocument, reviewedContentDigest } from "./knowledge";
import type { EmbeddingProvider, RetrievalRequest } from "./types";

export const now = "2026-09-21T09:00:00.000Z";
export const embeddings: EmbeddingProvider = {
  identity: {
    provider: "unit-fixture",
    model: "constant-test-vector",
    version: "1",
    dimensions: 3,
    mode: "mock",
  },
  async embed(texts) {
    return texts.map(() => [1, 0, 0]);
  },
};
export const metadata = {
  documentId: "EQ-001",
  title: "equipment approach",
  siteIds: ["SITE-CONSTRUCTION-01"],
  simulationType: "equipment",
  hazardTypes: ["equipment"],
  applicableRoles: ["worker"],
  applicableZoneIds: [],
  substanceIds: [],
  profileConditions: {},
  actionCodes: ["ALERT_HAZARD"],
  language: "ko",
  version: "0.1.0",
  synthetic: true,
  approvalStatus: "approved_for_demo",
  effectiveFrom: "2026-09-01T00:00:00.000Z",
  expiresAt: "2027-01-01T00:00:00.000Z",
  sourceReference: "synthetic://safety-simulator/EQ-001",
  reviewedBy: "independent-reviewer",
  reviewedAt: "2026-09-20T09:00:00.000Z",
};
export const body = Array.from(
  { length: 12 },
  (_, index) => `## ${index + 1}. Section\nequipment approach ${index + 1}`,
).join("\n\n");
export function markdown(values: Readonly<Record<string, unknown>>, content = body): string {
  const fields = Object.entries(values)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join("\n");
  const source = `---\n${fields}\n---\n${content}`;
  return source.replace(
    "\n---\n",
    `\nreviewedContentHash: "${reviewedContentDigest(source)}"\n---\n`,
  );
}
export function record(overrides: Readonly<Record<string, unknown>> = {}) {
  return parseKnowledgeDocument(
    markdown({ ...metadata, ...overrides }),
    "knowledge/equipment/EQ-001.md",
  );
}
export function request(overrides: Partial<RetrievalRequest> = {}): RetrievalRequest {
  return {
    runId: "retrieval-unit-run",
    query: "equipment approach",
    siteId: "SITE-CONSTRUCTION-01",
    simulationType: "equipment",
    hazardTypes: ["equipment"],
    role: "worker",
    zoneIds: [],
    substanceIds: [],
    actionCode: "ALERT_HAZARD",
    profile: { stairsAllowed: null, assistanceRequired: null, verified: false },
    scenarioPolicy: null,
    scope: "demo",
    now,
    limit: 20,
    signal: new AbortController().signal,
    ...overrides,
  };
}
