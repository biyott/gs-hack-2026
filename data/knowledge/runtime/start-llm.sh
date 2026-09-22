#!/usr/bin/env bash
set -euo pipefail

runtime_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
model="${RAG_LLM_LOCAL_PATH:-$runtime_dir/models/Qwen3-0.6B-Q8_0.gguf}"
binary="${RAG_LLM_BINARY:-$runtime_dir/bin/llama-b10964/llama-server}"

exec "$binary" --model "$model" --alias Qwen3-0.6B-Q8_0 \
  --host 127.0.0.1 --port "${RAG_LLM_PORT:-8092}" \
  --threads "${RAG_LLM_THREADS:-4}" --threads-batch "${RAG_LLM_THREADS:-4}" \
  --gpu-layers 0 --ctx-size 2048 --parallel 1 --cache-ram 256 \
  --jinja --reasoning off --reasoning-budget 0 --no-webui
