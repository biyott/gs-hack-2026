# Actual local RAG models

The application runs multilingual embeddings in its Node process. A separate `llama-server` process performs actual instruction-model inference. Both use public downloadable weights without credentials or paid APIs. Model binaries, weights, and logs are ignored by Git; the pinned download recipes and hashes are committed.

Run from the repository root on Linux x86_64 with Node 22:

```bash
ONNXRUNTIME_NODE_INSTALL_CUDA=skip npm ci
bash data/knowledge/runtime/prepare-embedding.sh
bash data/knowledge/runtime/prepare-llm.sh
bash data/knowledge/runtime/start-llm.sh
```

The final command stays in the foreground. The model endpoint is `http://127.0.0.1:8092/v1/chat/completions`; readiness is `http://127.0.0.1:8092/health`. The public API model name is `Qwen3-0.6B-Q8_0`. The server binds only to localhost. It supports OpenAI-compatible `response_format` with `json_schema`; set `chat_template_kwargs: { "enable_thinking": false }` on chat requests. Reasoning is also disabled in the launch command.

The CUDA installation flag skips optional large GPU-provider downloads; bundled CPU ONNX inference remains available.

## Embedding provider

`src/server/rag/embeddings.ts` exports `TransformersEmbeddingProvider`. It uses `@huggingface/transformers@3.8.1`, ONNX CPU inference, two inference threads, mean pooling, and L2 normalization. Its default model is the 384-dimensional `Xenova/multilingual-e5-small` ONNX conversion, revision `761b726dd34fb83930e26aab4e9ac3899aa1fa78`, quantization `q8`. The source model is `intfloat/multilingual-e5-small` (MIT).

The caller must prefix queries with `query: ` and knowledge passages with `passage: `, including non-English text. E5 truncates input to 512 tokens. Similarity is a retrieval ranking score, not a safety confidence score. No worker profile or location is automatically embedded by this runtime.

The constructor accepts optional `model`, `revision`, `dimensions`, `cacheDir`, and `localModelPath`. Default weights load locally from `data/knowledge/runtime/models/Xenova/multilingual-e5-small`; `RAG_EMBEDDING_LOCAL_PATH` overrides that directory. Configure the matching model identity, revision and dimensions together when replacing a model. The provider rejects aborted calls before/after loading and inference; the underlying native inference session itself cannot be interrupted by the supplied signal.

Run the actual application-adapter probe after installing dependencies:

```bash
node --experimental-strip-types data/knowledge/runtime/probe-embedding.mjs
```

It validates five real embeddings, unit norms, dimension 384, Korean-to-English relevant passage ranking, and records load/batch/warm query latency and a vector hash. It fails if real inference is unavailable; it has no mock fallback.

## Instruction-model identity

The local generator uses official `Qwen/Qwen3-0.6B-GGUF` revision `23749fefcc72300e3a2ad315e1317431b06b590a`, file `Qwen3-0.6B-Q8_0.gguf` (Apache 2.0), SHA256 `9465e63a22add5354d9bb4b99e90117043c7124007664907259bd16d043bb031`.

The Linux CPU runtime is official `ggml-org/llama.cpp` build `b10964` (`0.4.1-dev`), source commit `b29c606e28a01b1bc8c1351026a0fa6e616bf6c4`, release archive SHA256 `9abf88aea48a55d0f80edb1ee20220b186848cca0b4e919d71518cfd7ca67443`.

`RAG_LLM_LOCAL_PATH`, `RAG_LLM_BINARY`, `RAG_LLM_PORT`, and `RAG_LLM_THREADS` override local paths, port, and CPU threads. Default CPU thread count is 4, context length is 2048, and there is one concurrent model slot. Warm the model before latency tests. Multiple simultaneous callers queue, so the application must preserve immediate reviewed template guidance and enforce its supplemental deadline independently.

Actual inference evidence is recorded under `.omo/teams/team-08d29e60/artifacts/rag-model-runtime*`. Runtime provenance does not validate safety semantics; the application must validate model output against the retrieved approved source and authoritative action state.

The measured small-model fast path is **reviewed extractive selection**: the model returns a constrained `{ "selection": 0 }` choosing one of the supplied reviewed explanations, and the application resolves that index to its exact text and evidence. It must be logged as selection rather than freeform model-authored text. With 4 CPU threads, three English calls returned indices 2, 0, 1 correctly in 0.72–1.04 seconds; three Korean calls returned 2, 0, 1 correctly in 1.03–1.23 seconds. Full JSON explanation copying took 6.4–12.8 seconds, and host contention can also exceed the deadline for compact selection. Deadline fallback remains necessary.

Sources: [E5](https://huggingface.co/intfloat/multilingual-e5-small), [ONNX weights](https://huggingface.co/Xenova/multilingual-e5-small/tree/761b726dd34fb83930e26aab4e9ac3899aa1fa78), [Qwen weights](https://huggingface.co/Qwen/Qwen3-0.6B-GGUF/tree/23749fefcc72300e3a2ad315e1317431b06b590a), [llama.cpp release](https://github.com/ggml-org/llama.cpp/releases/tag/b10964).
