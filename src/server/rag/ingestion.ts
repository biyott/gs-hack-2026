import { randomUUID } from "node:crypto";
import { lstat, readdir, readFile, realpath } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { z } from "zod";
import { KnowledgeError, parseKnowledgeDocument } from "./knowledge";
import { approvalExclusions, sameEmbeddingModel } from "./retrieval";
import { parseEmbeddingVector, type RagStore } from "./store";
import type { EmbeddingProvider, KnowledgeRecord } from "./types";

export type IngestionOptions = {
  readonly embedding: EmbeddingProvider;
  readonly scope: "demo" | "production";
  readonly now: string;
  readonly signal: AbortSignal;
};
export type IngestionReport = {
  readonly indexedDocumentIds: readonly string[];
  readonly excludedDocumentIds: readonly string[];
  readonly exclusions: readonly {
    readonly documentId: string;
    readonly reasons: readonly string[];
  }[];
};

const ApprovalSchema = z
  .object({
    documentId: z.string(),
    documentVersion: z.string(),
    reviewedContentHash: z.string().regex(/^[a-f0-9]{64}$/u),
    approvedFileHash: z.string().regex(/^[a-f0-9]{64}$/u),
    reviewedBy: z.string().min(1),
    reviewedAt: z.iso.datetime({ offset: true }),
  })
  .strict();
const LedgerSchema = z
  .object({ schemaVersion: z.literal("1.0.0"), approvals: z.array(ApprovalSchema) })
  .strict();
type Approval = z.infer<typeof ApprovalSchema>;

async function readApprovals(root: string): Promise<readonly Approval[]> {
  try {
    return LedgerSchema.parse(
      JSON.parse(await readFile(join(root, "data/knowledge/reviews/approvals.json"), "utf8")),
    ).approvals;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return [];
    throw error;
  }
}

async function normalMarkdownFiles(directory: string): Promise<readonly string[]> {
  try {
    const info = await lstat(directory);
    if (info.isSymbolicLink() || !info.isDirectory())
      throw new KnowledgeError("Knowledge directories must be physical directories");
    return (await readdir(directory, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => join(directory, entry.name))
      .sort();
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return [];
    throw error;
  }
}

function independentlyApproved(document: KnowledgeRecord, approvals: readonly Approval[]): boolean {
  const metadata = document.metadata;
  return approvals.some(
    (approval) =>
      approval.documentId === metadata.documentId &&
      approval.documentVersion === metadata.version &&
      approval.reviewedContentHash === metadata.reviewedContentHash &&
      approval.approvedFileHash === document.contentHash &&
      approval.reviewedBy === metadata.reviewedBy &&
      approval.reviewedAt === metadata.reviewedAt,
  );
}

export async function ingestKnowledgeDirectory(
  root: string,
  store: RagStore,
  options: IngestionOptions,
): Promise<IngestionReport> {
  options.signal.throwIfAborted();
  const startedAt = new Date().toISOString();
  const knowledgeRoot = join(await realpath(root), "knowledge");
  const existingDocuments = new Map(
    store.documents().map((document) => [document.metadata.documentId, document]),
  );
  const existingChunks = new Map(store.chunks().map((chunk) => [chunk.documentId, chunk]));
  const existingVectors = new Map(
    store.embeddings().map((embedding) => [embedding.chunkId, embedding]),
  );
  for (const document of existingDocuments.values()) {
    if (resolve(document.sourcePath).startsWith(`${knowledgeRoot}${sep}`))
      store.remove(document.metadata.documentId);
  }
  const approvals = await readApprovals(root);
  const paths = (
    await Promise.all(
      ["common", "equipment", "fire-gas"].map((kind) =>
        normalMarkdownFiles(join(knowledgeRoot, kind)),
      ),
    )
  ).flat();
  const documents = await Promise.all(
    paths.map(async (path) => parseKnowledgeDocument(await readFile(path, "utf8"), path)),
  );
  if (new Set(documents.map((document) => document.metadata.documentId)).size !== documents.length)
    throw new KnowledgeError("Duplicate knowledge document identifiers");
  const exclusions = documents.map((document) => ({
    documentId: document.metadata.documentId,
    reasons: [
      ...approvalExclusions(document.metadata, options.scope, options.now),
      ...(document.metadata.synthetic && !independentlyApproved(document, approvals)
        ? ["approval-ledger"]
        : []),
    ],
  }));
  const eligibleIds = new Set(
    exclusions.filter((entry) => entry.reasons.length === 0).map((entry) => entry.documentId),
  );
  const eligible = documents.filter((document) => eligibleIds.has(document.metadata.documentId));
  const reusable = new Map(
    eligible.flatMap((document) => {
      const previous = existingDocuments.get(document.metadata.documentId);
      const chunk = existingChunks.get(document.metadata.documentId);
      const embedding = chunk ? existingVectors.get(chunk.chunkId) : undefined;
      return previous?.contentHash === document.contentHash &&
        embedding &&
        sameEmbeddingModel(embedding.identity, options.embedding.identity)
        ? [[document.metadata.documentId, embedding] as const]
        : [];
    }),
  );
  const pending = eligible.filter((document) => !reusable.has(document.metadata.documentId));
  const generated =
    pending.length > 0
      ? await options.embedding.embed(
          pending.map((document) => `passage: ${document.metadata.title}\n${document.body}`),
          options.signal,
        )
      : [];
  options.signal.throwIfAborted();
  if (generated.length !== pending.length)
    throw new KnowledgeError("Document embedding count does not match indexed procedures");
  const fresh = new Map(
    pending.map((document, index) => [
      document.metadata.documentId,
      parseEmbeddingVector(generated[index], options.embedding.identity.dimensions),
    ]),
  );
  for (const document of documents) {
    const vector =
      fresh.get(document.metadata.documentId) ?? reusable.get(document.metadata.documentId)?.vector;
    store.upsert(document, vector ? { identity: options.embedding.identity, vector } : null);
  }
  const report = {
    indexedDocumentIds: eligible.map((document) => document.metadata.documentId),
    excludedDocumentIds: exclusions
      .filter((entry) => entry.reasons.length > 0)
      .map((entry) => entry.documentId),
    exclusions,
  };
  store.logRun({
    id: randomUUID(),
    runId: "knowledge-ingestion",
    startedAt,
    completedAt: new Date().toISOString(),
    phase: "ingestion",
    outcome: "completed",
    provider: options.embedding.identity,
    detailJson: JSON.stringify(report),
  });
  return report;
}
