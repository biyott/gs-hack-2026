import { resolve } from "node:path";
import type { FeatureExtractionPipeline } from "@huggingface/transformers";
import { z } from "zod";
import type { EmbeddingProvider, ModelIdentity } from "./types";

const DEFAULT_MODEL = "Xenova/multilingual-e5-small";
const DEFAULT_REVISION = "761b726dd34fb83930e26aab4e9ac3899aa1fa78";

export type TransformersEmbeddingConfig = {
  readonly model?: string;
  readonly revision?: string;
  readonly dimensions?: number;
  readonly cacheDir?: string;
  readonly localModelPath?: string;
};

export class TransformersEmbeddingProvider implements EmbeddingProvider {
  readonly identity: ModelIdentity;
  private readonly config: TransformersEmbeddingConfig;
  private readonly localModelPath: string | undefined;
  // Cache the resident inference session so subsequent queries do not reload weights.
  private extractor: Promise<FeatureExtractionPipeline> | undefined;

  constructor(config: TransformersEmbeddingConfig = {}) {
    this.config = config;
    const model = config.model ?? DEFAULT_MODEL;
    this.identity = {
      provider: "transformers.js@3.8.1/onnxruntime-node",
      model,
      version: config.revision ?? DEFAULT_REVISION,
      dimensions: config.dimensions ?? 384,
      mode: "actual",
    };
    this.localModelPath =
      config.localModelPath ??
      process.env["RAG_EMBEDDING_LOCAL_PATH"] ??
      (model === DEFAULT_MODEL
        ? resolve("data/knowledge/runtime/models/Xenova/multilingual-e5-small")
        : undefined);
  }

  async embed(
    texts: readonly string[],
    signal: AbortSignal,
  ): Promise<readonly (readonly number[])[]> {
    signal.throwIfAborted();
    if (texts.length === 0) return [];
    this.extractor ??= this.load();
    const extractor = await this.extractor;
    signal.throwIfAborted();
    const result = await extractor([...texts], { pooling: "mean", normalize: true });
    signal.throwIfAborted();
    const vectors: unknown = result.tolist();
    return z
      .array(
        z
          .array(z.number().finite())
          .length(this.identity.dimensions)
          .refine(
            (vector) => Math.abs(Math.hypot(...vector) - 1) < 0.0001,
            "Embedding must have unit L2 norm",
          ),
      )
      .length(texts.length)
      .parse(vectors);
  }

  private async load(): Promise<FeatureExtractionPipeline> {
    const { pipeline } = await import("@huggingface/transformers");
    return pipeline<"feature-extraction">(
      "feature-extraction",
      this.localModelPath ?? this.identity.model,
      {
        revision: this.identity.version,
        device: "cpu",
        dtype: "q8",
        local_files_only: this.localModelPath !== undefined,
        ...(this.config.cacheDir === undefined ? {} : { cache_dir: this.config.cacheDir }),
        session_options: { intraOpNumThreads: 2, interOpNumThreads: 1 },
      },
    );
  }
}
