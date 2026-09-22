import type Database from "better-sqlite3";
import { z } from "zod";
import { KnowledgeError, normalizeMetadata } from "./knowledge";
import type {
  EvidenceReference,
  KnowledgeChunk,
  KnowledgeRecord,
  RagRunRecord,
  SearchScore,
  StoredEmbedding,
} from "./types";

const DocumentRowSchema = z.object({
  original_metadata_json: z.string(),
  body: z.string(),
  source_path: z.string(),
  content_hash: z.string(),
});
const ChunkRowSchema = z.object({
  chunk_id: z.string(),
  document_id: z.string(),
  document_version: z.string(),
  content: z.string(),
  content_hash: z.string(),
});
const EmbeddingRowSchema = z.object({
  chunk_id: z.string(),
  identity_json: z.string(),
  vector_json: z.string(),
});
const IdentitySchema = z.object({
  provider: z.string(),
  model: z.string(),
  version: z.string(),
  dimensions: z.number().int().positive(),
  mode: z.enum(["actual", "mock"]),
});
const ScoreSchema = z.object({ chunkId: z.string(), score: z.number().finite() });

export function parseEmbeddingVector(input: unknown, dimensions: number): readonly number[] {
  return z
    .array(z.number().finite())
    .length(dimensions)
    .refine(
      (vector) => vector.some((value) => value !== 0),
      "Embedding must have nonzero magnitude",
    )
    .parse(input);
}

export class RagStore {
  constructor(readonly db: Database.Database) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS knowledge_documents (
        document_id TEXT PRIMARY KEY, metadata_json TEXT NOT NULL, original_metadata_json TEXT NOT NULL,
        body TEXT NOT NULL, source_path TEXT NOT NULL, content_hash TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS knowledge_chunks (
        chunk_id TEXT PRIMARY KEY, document_id TEXT NOT NULL, document_version TEXT NOT NULL,
        content TEXT NOT NULL, content_hash TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS knowledge_embeddings (
        chunk_id TEXT PRIMARY KEY, identity_json TEXT NOT NULL, vector_json TEXT NOT NULL,
        model TEXT NOT NULL, version TEXT NOT NULL, dimensions INTEGER NOT NULL
      );
      CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_fts USING fts5(chunk_id UNINDEXED, content, tokenize='unicode61');
      CREATE TABLE IF NOT EXISTS rag_runs (
        id TEXT PRIMARY KEY, run_id TEXT NOT NULL, started_at TEXT NOT NULL, completed_at TEXT NOT NULL,
        phase TEXT NOT NULL, outcome TEXT NOT NULL, provider_json TEXT NOT NULL, detail_json TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS guidance_evidence (
        guidance_id TEXT NOT NULL, document_id TEXT NOT NULL, document_version TEXT NOT NULL, chunk_id TEXT NOT NULL,
        PRIMARY KEY(guidance_id, document_id, document_version, chunk_id)
      );
    `);
  }

  private clearIndex(documentId: string): void {
    this.db
      .prepare(
        "DELETE FROM knowledge_fts WHERE chunk_id IN (SELECT chunk_id FROM knowledge_chunks WHERE document_id = ?)",
      )
      .run(documentId);
    this.db
      .prepare(
        "DELETE FROM knowledge_embeddings WHERE chunk_id IN (SELECT chunk_id FROM knowledge_chunks WHERE document_id = ?)",
      )
      .run(documentId);
    this.db.prepare("DELETE FROM knowledge_chunks WHERE document_id = ?").run(documentId);
  }

  upsert(record: KnowledgeRecord, embedding: Omit<StoredEmbedding, "chunkId"> | null): void {
    const vector = embedding
      ? parseEmbeddingVector(embedding.vector, embedding.identity.dimensions)
      : null;
    this.db.transaction(() => {
      this.clearIndex(record.metadata.documentId);
      this.db
        .prepare(`INSERT INTO knowledge_documents VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(document_id) DO UPDATE SET metadata_json=excluded.metadata_json,
        original_metadata_json=excluded.original_metadata_json, body=excluded.body,
        source_path=excluded.source_path, content_hash=excluded.content_hash`)
        .run(
          record.metadata.documentId,
          JSON.stringify(record.metadata),
          JSON.stringify(record.originalMetadata),
          record.body,
          record.sourcePath,
          record.contentHash,
        );
      if (!embedding || !vector) return;
      const chunkId = `${record.metadata.documentId}:${record.metadata.version}:${record.contentHash.slice(0, 16)}:procedure`;
      this.db
        .prepare("INSERT INTO knowledge_chunks VALUES (?, ?, ?, ?, ?)")
        .run(
          chunkId,
          record.metadata.documentId,
          record.metadata.version,
          record.body,
          record.contentHash,
        );
      this.db
        .prepare("INSERT INTO knowledge_fts (chunk_id, content) VALUES (?, ?)")
        .run(chunkId, `${record.metadata.title}\n${record.body}`);
      this.db
        .prepare("INSERT INTO knowledge_embeddings VALUES (?, ?, ?, ?, ?, ?)")
        .run(
          chunkId,
          JSON.stringify(embedding.identity),
          JSON.stringify(vector),
          embedding.identity.model,
          embedding.identity.version,
          embedding.identity.dimensions,
        );
    })();
  }

  documents(): readonly KnowledgeRecord[] {
    return z
      .array(DocumentRowSchema)
      .parse(this.db.prepare("SELECT * FROM knowledge_documents ORDER BY document_id").all())
      .map((row) => {
        const originalMetadata = z
          .record(z.string(), z.unknown())
          .parse(JSON.parse(row.original_metadata_json));
        return {
          metadata: normalizeMetadata(originalMetadata),
          originalMetadata,
          body: row.body,
          sourcePath: row.source_path,
          contentHash: row.content_hash,
        };
      });
  }

  chunks(): readonly KnowledgeChunk[] {
    const documents = new Map(
      this.documents().map((document) => [document.metadata.documentId, document.metadata]),
    );
    return z
      .array(ChunkRowSchema)
      .parse(this.db.prepare("SELECT * FROM knowledge_chunks ORDER BY chunk_id").all())
      .map((row) => {
        const metadata = documents.get(row.document_id);
        if (!metadata) throw new KnowledgeError("Chunk references a missing document");
        return {
          documentId: row.document_id,
          documentVersion: row.document_version,
          chunkId: row.chunk_id,
          content: row.content,
          metadata,
          contentHash: row.content_hash,
        };
      });
  }

  remove(documentId: string): void {
    this.db.transaction(() => {
      this.clearIndex(documentId);
      this.db.prepare("DELETE FROM knowledge_documents WHERE document_id = ?").run(documentId);
    })();
  }

  embeddings(): readonly StoredEmbedding[] {
    return z
      .array(EmbeddingRowSchema)
      .parse(this.db.prepare("SELECT * FROM knowledge_embeddings ORDER BY chunk_id").all())
      .map((row) => {
        const identity = IdentitySchema.parse(JSON.parse(row.identity_json));
        return {
          chunkId: row.chunk_id,
          identity,
          vector: parseEmbeddingVector(JSON.parse(row.vector_json), identity.dimensions),
        };
      });
  }

  keywordSearch(query: string, eligibleIds: readonly string[]): readonly SearchScore[] {
    const tokens = [...new Set(query.match(/[\p{L}\p{N}_-]+/gu) ?? [])].slice(0, 64);
    if (tokens.length === 0 || eligibleIds.length === 0) return [];
    const expression = tokens.map((token) => `"${token}"`).join(" OR ");
    const placeholders = eligibleIds.map(() => "?").join(",");
    return z.array(ScoreSchema).parse(
      this.db
        .prepare(`SELECT chunk_id AS chunkId, -bm25(knowledge_fts) AS score
      FROM knowledge_fts WHERE knowledge_fts MATCH ? AND chunk_id IN (${placeholders})
      ORDER BY bm25(knowledge_fts), chunk_id`)
        .all(expression, ...eligibleIds),
    );
  }

  logRun(record: RagRunRecord): void {
    this.db
      .prepare("INSERT INTO rag_runs VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(
        record.id,
        record.runId,
        record.startedAt,
        record.completedAt,
        record.phase,
        record.outcome,
        JSON.stringify(record.provider),
        record.detailJson,
      );
  }

  recordEvidence(guidanceId: string, evidence: readonly EvidenceReference[]): void {
    const insert = this.db.prepare("INSERT OR IGNORE INTO guidance_evidence VALUES (?, ?, ?, ?)");
    this.db.transaction(() => {
      for (const reference of evidence)
        insert.run(guidanceId, reference.documentId, reference.documentVersion, reference.chunkId);
    })();
  }
}
