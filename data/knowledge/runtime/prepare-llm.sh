#!/usr/bin/env bash
set -euo pipefail

runtime_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
archive="$runtime_dir/downloads/llama-b10964-bin-ubuntu-x64.tar.gz"
model="${RAG_LLM_LOCAL_PATH:-$runtime_dir/models/Qwen3-0.6B-Q8_0.gguf}"
mkdir -p "$runtime_dir/downloads" "$runtime_dir/bin" "$(dirname -- "$model")"

if [[ ! -s "$archive" ]]; then
  curl --fail --location --retry 3 --connect-timeout 15 --max-time 1800 \
    https://github.com/ggml-org/llama.cpp/releases/download/b10964/llama-b10964-bin-ubuntu-x64.tar.gz \
    --output "$archive.part"
  mv -- "$archive.part" "$archive"
fi
printf '%s  %s\n' 9abf88aea48a55d0f80edb1ee20220b186848cca0b4e919d71518cfd7ca67443 "$archive" | sha256sum --check
if [[ ! -x "$runtime_dir/bin/llama-b10964/llama-server" ]]; then
  tar --extract --gzip --file "$archive" --directory "$runtime_dir/bin"
fi

if [[ ! -s "$model" ]]; then
  curl --fail --location --retry 3 --connect-timeout 15 --max-time 1800 \
    https://huggingface.co/Qwen/Qwen3-0.6B-GGUF/resolve/23749fefcc72300e3a2ad315e1317431b06b590a/Qwen3-0.6B-Q8_0.gguf \
    --output "$model.part"
  mv -- "$model.part" "$model"
fi
printf '%s  %s\n' 9465e63a22add5354d9bb4b99e90117043c7124007664907259bd16d043bb031 "$model" | sha256sum --check
