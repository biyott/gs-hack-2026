#!/usr/bin/env bash
set -euo pipefail

runtime_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
model_dir="${RAG_EMBEDDING_LOCAL_PATH:-$runtime_dir/models/Xenova/multilingual-e5-small}"
revision=761b726dd34fb83930e26aab4e9ac3899aa1fa78
base_url="https://huggingface.co/Xenova/multilingual-e5-small/resolve/$revision"
mkdir -p "$model_dir/onnx"

for resource in config.json tokenizer.json tokenizer_config.json special_tokens_map.json onnx/model_quantized.onnx; do
  target="$model_dir/$resource"
  if [[ ! -s "$target" ]]; then
    curl --fail --location --retry 3 --connect-timeout 15 --max-time 1800 \
      "$base_url/$resource" --output "$target.part"
    mv -- "$target.part" "$target"
  fi
done

(cd -- "$model_dir" && sha256sum --check "$runtime_dir/embedding-sha256.txt")
printf 'RAG_EMBEDDING_LOCAL_PATH=%s\n' "$model_dir"
