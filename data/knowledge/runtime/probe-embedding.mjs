import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TransformersEmbeddingProvider } from '../../../src/server/rag/embeddings.ts';
const runtimeDir = dirname(fileURLToPath(import.meta.url));
const modelPath = process.env.RAG_EMBEDDING_LOCAL_PATH
  ?? join(runtimeDir, 'models', 'Xenova', 'multilingual-e5-small');
const started = performance.now();
const provider = new TransformersEmbeddingProvider({ localModelPath: modelPath });
await provider.embed(['query: warmup'], AbortSignal.timeout(60000));
const loadedMs = performance.now() - started;
const texts = [
  'query: 계단을 사용할 수 없는 작업자에게 이동 지원이 필요합니다.',
  'passage: A worker who cannot use stairs needs an accessible route and mobility assistance.',
  'passage: The lunch menu contains noodles, fruit, and coffee.',
  'query: The worker needs assistance because stairs are unavailable.',
  'passage: 계단을 이용할 수 없는 작업자는 이동 지원이 필요합니다.',
];
const inferenceStart = performance.now();
const vectors = await provider.embed(texts, AbortSignal.timeout(60000));
const inferenceMs = performance.now() - inferenceStart;
assert.equal(vectors.length, texts.length);
for (const vector of vectors) {
  assert.equal(vector.length, 384);
  assert.ok(vector.every(Number.isFinite));
  assert.ok(Math.abs(Math.hypot(...vector) - 1) < 0.0001);
}
const cosine = (left, right) => left.reduce((sum, value, index) => sum + value * right[index], 0);
const koreanEnglishRelevant = cosine(vectors[0], vectors[1]);
const koreanEnglishUnrelated = cosine(vectors[0], vectors[2]);
const englishKoreanRelevant = cosine(vectors[3], vectors[4]);
assert.ok(koreanEnglishRelevant > koreanEnglishUnrelated);
const warmStart = performance.now();
await provider.embed(['query: 중장비 접근 경보'], AbortSignal.timeout(60000));
console.log(JSON.stringify({
  actualInference: true,
  mock: false,
  provider: 'onnxruntime-node via @huggingface/transformers 3.8.1',
  model: 'Xenova/multilingual-e5-small',
  revision: '761b726dd34fb83930e26aab4e9ac3899aa1fa78',
  modelPath,
  identity: provider.identity,
  dimensions: 384,
  dtype: 'q8',
  loadedMs,
  inferenceMs,
  warmSingleQueryMs: performance.now() - warmStart,
  texts,
  cosine: { koreanEnglishRelevant, koreanEnglishUnrelated, englishKoreanRelevant },
  vectorsSha256: createHash('sha256').update(JSON.stringify(vectors)).digest('hex'),
  firstVectorSample: vectors[0].slice(0, 8),
}, null, 2));
