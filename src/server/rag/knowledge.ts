import { createHash } from "node:crypto";
import { parse } from "yaml";
import { z } from "zod";
import { ActionCodeSchema, HazardTypeSchema } from "../../../packages/contracts/src/core";
import type { KnowledgeMetadata, KnowledgeRecord } from "./types";

export class KnowledgeError extends Error {
  constructor(readonly reason: string) {
    super(reason);
    this.name = "KnowledgeError";
  }
}

const scopedId = z
  .string()
  .min(1)
  .refine((value) => !value.includes("*"), "Wildcard scope is forbidden");
const timestamp = z.union([z.iso.datetime({ offset: true }), z.iso.date()]);
const approval = z.enum(["draft", "approved_for_demo", "approved", "retired"]);
const SourceMetadataSchema = z
  .object({
    documentId: z.string().min(1),
    title: z.string().min(1),
    siteId: scopedId.optional(),
    siteIds: z.array(scopedId).min(1).optional(),
    simulationType: z.enum(["common", "equipment", "fire-gas"]),
    hazardTypes: z.array(HazardTypeSchema),
    applicableRoles: z.array(scopedId).min(1),
    applicableZoneIds: z.array(scopedId).default([]),
    substanceIds: z.array(scopedId).default([]),
    profileConditions: z
      .object({
        stairsAllowed: z.boolean().optional(),
        assistanceRequired: z.boolean().optional(),
        profileVerified: z.boolean().optional(),
      })
      .strict()
      .default({}),
    actionCodes: z.array(ActionCodeSchema).default([]),
    language: z.string().min(1),
    version: z.string().min(1),
    synthetic: z.boolean().default(false),
    approvalStatus: approval.optional(),
    status: approval.optional(),
    effectiveFrom: timestamp.nullable().default(null),
    expiresAt: timestamp.nullable().default(null),
    reviewedBy: z.string().min(1).nullable().default(null),
    reviewedAt: timestamp.nullable().default(null),
    reviewedContentHash: z
      .string()
      .regex(/^[a-f0-9]{64}$/u)
      .nullable()
      .default(null),
    sourceReference: z.string().min(1),
    requiredScenarioPolicy: z.string().min(1).nullable().default(null),
    decisionKey: z.string().min(1).nullable().default(null),
    reviewedSupplementalExplanation: z
      .object({ ko: z.string().min(1), en: z.string().min(1) })
      .strict()
      .nullable()
      .default(null),
  })
  .strict();

export function normalizeMetadata(input: unknown): KnowledgeMetadata {
  const source = SourceMetadataSchema.parse(input);
  const siteIds = source.siteIds ?? (source.siteId ? [source.siteId] : []);
  if (siteIds.length === 0) throw new KnowledgeError("An explicit site scope is required");
  if (source.siteId && (siteIds.length !== 1 || siteIds[0] !== source.siteId))
    throw new KnowledgeError("Conflicting site aliases");
  if (source.status && source.approvalStatus && source.status !== source.approvalStatus)
    throw new KnowledgeError("Conflicting approval aliases");
  const approvalStatus = source.approvalStatus ?? source.status;
  if (!approvalStatus) throw new KnowledgeError("An approval status is required");
  if (source.synthetic !== source.sourceReference.startsWith("synthetic://safety-simulator/"))
    throw new KnowledgeError("Synthetic classification and source reference must agree");
  if (
    source.effectiveFrom &&
    source.expiresAt &&
    Date.parse(source.effectiveFrom) >= Date.parse(source.expiresAt)
  )
    throw new KnowledgeError("Document validity interval is empty");
  return {
    documentId: source.documentId,
    title: source.title,
    siteIds,
    simulationType: source.simulationType,
    simulationTypes:
      source.simulationType === "common" ? ["equipment", "fire-gas"] : [source.simulationType],
    hazardTypes: source.hazardTypes,
    applicableRoles: source.applicableRoles,
    applicableZoneIds: source.applicableZoneIds,
    substanceIds: source.substanceIds,
    profileConditions: {
      ...(source.profileConditions.stairsAllowed === undefined
        ? {}
        : { stairsAllowed: source.profileConditions.stairsAllowed }),
      ...(source.profileConditions.assistanceRequired === undefined
        ? {}
        : { assistanceRequired: source.profileConditions.assistanceRequired }),
      ...(source.profileConditions.profileVerified === undefined
        ? {}
        : { profileVerified: source.profileConditions.profileVerified }),
    },
    actionCodes: source.actionCodes,
    language: source.language,
    version: source.version,
    synthetic: source.synthetic,
    approvalStatus,
    effectiveFrom: source.effectiveFrom,
    expiresAt: source.expiresAt,
    reviewedBy: source.reviewedBy,
    reviewedAt: source.reviewedAt,
    reviewedContentHash: source.reviewedContentHash,
    sourceReference: source.sourceReference,
    requiredScenarioPolicy: source.requiredScenarioPolicy,
    decisionKey: source.decisionKey,
    reviewedSupplementalExplanation: source.reviewedSupplementalExplanation,
  };
}

export function hasInstructionContamination(content: string): boolean {
  return /ignore\s+(?:all\s+)?(?:previous|prior|system)\s+instructions|(?:reveal|print|leak)\s+(?:the\s+)?system\s+prompt|<\|(?:im_start|system)\|>|이전\s*지시(?:사항)?(?:를|을)?\s*무시|시스템\s*프롬프트(?:를|을)?\s*(?:공개|출력)/iu.test(
    content,
  );
}

export function reviewedContentDigest(source: string): string {
  const frontmatter = /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/u.exec(source)?.[0];
  if (!frontmatter) throw new KnowledgeError("Review digest requires YAML frontmatter");
  const reviewable = frontmatter.replace(
    /^(?:approvalStatus|reviewedBy|reviewedAt|reviewedContentHash):[^\r\n]*(?:\r?\n|$)/gmu,
    "",
  );
  return createHash("sha256")
    .update(reviewable + source.slice(frontmatter.length))
    .digest("hex");
}

export function parseKnowledgeDocument(source: string, sourcePath: string): KnowledgeRecord {
  if (Buffer.byteLength(source, "utf8") > 65_536)
    throw new KnowledgeError("Procedure exceeds the bounded document size");
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/u.exec(source);
  if (!match?.[1] || !match[2])
    throw new KnowledgeError("YAML metadata and a procedure body are required");
  const originalMetadata = z
    .record(z.string(), z.unknown())
    .parse(parse(match[1], { maxAliasCount: 0 }));
  const metadata = normalizeMetadata(originalMetadata);
  if (
    metadata.approvalStatus === "approved_for_demo" &&
    metadata.reviewedContentHash !== reviewedContentDigest(source)
  ) {
    throw new KnowledgeError(
      "Approved content differs from the independently reviewed content hash",
    );
  }
  const body = match[2].trim();
  const sectionNumbers = [...body.matchAll(/^##\s+(\d+)[.)]\s/gmu)].map((section) =>
    Number(section[1]),
  );
  if (
    metadata.synthetic &&
    (sectionNumbers.length !== 12 || sectionNumbers.some((section, index) => section !== index + 1))
  ) {
    throw new KnowledgeError("Synthetic procedures must preserve all twelve ordered sections");
  }
  if (hasInstructionContamination(body))
    throw new KnowledgeError("Instruction-contaminated source cannot be indexed");
  return {
    metadata,
    originalMetadata,
    body,
    sourcePath,
    contentHash: createHash("sha256").update(source).digest("hex"),
  };
}
