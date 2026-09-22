import type Database from "better-sqlite3";
import { z } from "zod";
import { MAX_SUPPLEMENT_MS } from "./deadline";
import { TransformersEmbeddingProvider } from "./embeddings";
import { OpenAICompatibleLanguageModel } from "./provider";
import { createRagService } from "./service";

const TimeoutSchema = z.coerce
  .number()
  .int()
  .positive()
  .max(MAX_SUPPLEMENT_MS)
  .default(MAX_SUPPLEMENT_MS);
const LanguageModelConfigurationSchema = z.object({
  RAG_LLM_PROVIDER: z.enum(["local", "openai"]).default("local"),
  RAG_LLM_BASE_URL: z.url().optional(),
  RAG_LLM_MODEL: z.string().min(1).optional(),
  RAG_LLM_VERSION: z.string().min(1).optional(),
  RAG_LLM_API_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().optional(),
  RAG_TIMEOUT_MS: TimeoutSchema,
});
const ConfigurationSchema = z.object({
  RAG_TIMEOUT_MS: TimeoutSchema,
  RAG_EMBEDDING_MODEL: z.string().min(1).default("Xenova/multilingual-e5-small"),
  RAG_EMBEDDING_REVISION: z.string().min(1).default("761b726dd34fb83930e26aab4e9ac3899aa1fa78"),
  RAG_EMBEDDING_DIMENSIONS: z.coerce.number().int().positive().default(384),
  RAG_EMBEDDING_LOCAL_PATH: z.string().min(1).optional(),
  RAG_MODEL_CACHE: z.string().min(1).optional(),
});
const ModelDefaults = {
  local: {
    baseUrl: "http://127.0.0.1:8092/v1",
    model: "Qwen3-0.6B-Q8_0",
    version: "23749fefcc72300e3a2ad315e1317431b06b590a",
    key: "RAG_LLM_API_KEY",
  },
  openai: {
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4.1-mini-2025-04-14",
    version: undefined,
    key: "OPENAI_API_KEY",
  },
} as const;

export function createConfiguredLanguageModel(environment: unknown = process.env) {
  const configuration = LanguageModelConfigurationSchema.parse(environment);
  const defaults = ModelDefaults[configuration.RAG_LLM_PROVIDER];
  const model = configuration.RAG_LLM_MODEL ?? defaults.model;
  const apiKey = configuration.RAG_LLM_API_KEY ?? configuration[defaults.key];
  return new OpenAICompatibleLanguageModel({
    provider: configuration.RAG_LLM_PROVIDER,
    baseUrl: configuration.RAG_LLM_BASE_URL ?? defaults.baseUrl,
    model,
    version: configuration.RAG_LLM_VERSION ?? defaults.version ?? model,
    timeoutMs: configuration.RAG_TIMEOUT_MS,
    ...(apiKey ? { apiKey } : {}),
  });
}

export function createConfiguredRagService(
  db: Database.Database,
  environment: unknown = process.env,
) {
  const configuration = ConfigurationSchema.parse(environment);
  const llm = createConfiguredLanguageModel(environment);
  const embedding = new TransformersEmbeddingProvider({
    model: configuration.RAG_EMBEDDING_MODEL,
    revision: configuration.RAG_EMBEDDING_REVISION,
    dimensions: configuration.RAG_EMBEDDING_DIMENSIONS,
    ...(configuration.RAG_EMBEDDING_LOCAL_PATH
      ? { localModelPath: configuration.RAG_EMBEDDING_LOCAL_PATH }
      : {}),
    ...(configuration.RAG_MODEL_CACHE ? { cacheDir: configuration.RAG_MODEL_CACHE } : {}),
  });
  return createRagService({ db, embedding, llm, timeoutMs: configuration.RAG_TIMEOUT_MS });
}
