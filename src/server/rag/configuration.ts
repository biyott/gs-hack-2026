import type Database from "better-sqlite3";
import { z } from "zod";
import { MAX_SUPPLEMENT_MS } from "./deadline";
import { TransformersEmbeddingProvider } from "./embeddings";
import { OpenAICompatibleLanguageModel } from "./provider";
import { createRagService } from "./service";

const ConfigurationSchema = z.object({
  RAG_LLM_BASE_URL: z.url().default("http://127.0.0.1:8092/v1"),
  RAG_LLM_MODEL: z.string().min(1).default("Qwen3-0.6B-Q8_0"),
  RAG_LLM_VERSION: z.string().min(1).default("23749fefcc72300e3a2ad315e1317431b06b590a"),
  RAG_LLM_API_KEY: z.string().min(1).optional(),
  RAG_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .positive()
    .max(MAX_SUPPLEMENT_MS)
    .default(MAX_SUPPLEMENT_MS),
  RAG_EMBEDDING_MODEL: z.string().min(1).default("Xenova/multilingual-e5-small"),
  RAG_EMBEDDING_REVISION: z.string().min(1).default("761b726dd34fb83930e26aab4e9ac3899aa1fa78"),
  RAG_EMBEDDING_DIMENSIONS: z.coerce.number().int().positive().default(384),
  RAG_EMBEDDING_LOCAL_PATH: z.string().min(1).optional(),
  RAG_MODEL_CACHE: z.string().min(1).optional(),
});

export function createConfiguredRagService(
  db: Database.Database,
  environment: unknown = process.env,
) {
  const configuration = ConfigurationSchema.parse(environment);
  const embedding = new TransformersEmbeddingProvider({
    model: configuration.RAG_EMBEDDING_MODEL,
    revision: configuration.RAG_EMBEDDING_REVISION,
    dimensions: configuration.RAG_EMBEDDING_DIMENSIONS,
    ...(configuration.RAG_EMBEDDING_LOCAL_PATH
      ? { localModelPath: configuration.RAG_EMBEDDING_LOCAL_PATH }
      : {}),
    ...(configuration.RAG_MODEL_CACHE ? { cacheDir: configuration.RAG_MODEL_CACHE } : {}),
  });
  const llm = new OpenAICompatibleLanguageModel({
    baseUrl: configuration.RAG_LLM_BASE_URL,
    model: configuration.RAG_LLM_MODEL,
    version: configuration.RAG_LLM_VERSION,
    timeoutMs: configuration.RAG_TIMEOUT_MS,
    ...(configuration.RAG_LLM_API_KEY ? { apiKey: configuration.RAG_LLM_API_KEY } : {}),
  });
  return createRagService({ db, embedding, llm, timeoutMs: configuration.RAG_TIMEOUT_MS });
}
