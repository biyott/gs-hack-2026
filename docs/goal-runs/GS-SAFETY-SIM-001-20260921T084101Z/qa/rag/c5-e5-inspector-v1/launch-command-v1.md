# Additive E5 execution command — requires a new explicit parent runtime grant

Run from `/home/b/.cache/gs-safety-c5.H4mElI`. Requested maximum120s; expected60s. Attempt outputs must not exist. Original suite raw verdicts are preserved; postprocessing supplies additive scoped observations only.

```bash
NODE_OPTIONS=--max-old-space-size=1536 \
TSX_TSCONFIG_PATH=/home/b/.cache/gs-safety-c5.H4mElI/tsconfig.json \
/home/b/.local/share/gs-safety-runtime/node-v22.23.2-linux-x64/bin/node --import tsx \
/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/rag/c5-e5-inspector-v1/bound/launch-http.ts \
--grant=W2 --attempt=http-e5-attempt-01
```

Save complete stdout/stderr and `/usr/bin/time -v` at candidate evidence `http-e5-attempt-01.stdout.log`, `.stderr.log`, `.time.txt`; save exact launcher PID, grant receipt and UTC start/end separately. The launcher saves owned child proofs and cleanup while keeping generated credentials private. After resource release, run file-only `scan-http-v1.mjs /90-biyott@github/gs-hack-2026`, then `join-e5-v1.mjs` from this directory, using pinned Node. Both create additive reports without overwriting original evidence. Observer logpoints must resolve in exact frozen source bounds, and each target generation must have one exact E5 input/output/retrieval/signal join and actual model publication join.
