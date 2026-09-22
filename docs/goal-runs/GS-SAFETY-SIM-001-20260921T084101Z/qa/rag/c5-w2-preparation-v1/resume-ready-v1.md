# C5 W2 resumed execution readiness

Observed 2026-09-21T23:10Z by `/root/qa_resume/w2_rag`. SOURCE_ONLY, UNBOUND, NOT_EXECUTED. No runtime grant is implied. G0, QD009 seam audit, C4 closeout, existing launchers and pinned model inventory have been read. The 78 template/source pairs in `reuse-origin-v1.json` match their recorded hashes; no oracle or frozen input was changed.

After the issued C5 G3 receipt and current provider PID arrive, render `bind-next.mjs --binding <issued-binding.json>` into its new candidate-specific directory. Its receipt/manifest/build identity checks precede binding. Static validation must pass before runtime: pinned Node invokes candidate `node_modules/typescript/bin/tsc --noEmit --project <bound>/tsconfig.json`. Do not substitute the historical provider PID.

The complete, sequential runtime commands, from the issued candidate root, are:

```bash
env NODE_OPTIONS=--max-old-space-size=1536 TSX_TSCONFIG_PATH="$QA_CANDIDATE_ROOT/tsconfig.json" \
  /usr/bin/time -v -o "$QA_EVIDENCE_ROOT/module-attempt-01.time.txt" \
  /home/b/.local/share/gs-safety-runtime/node-v22.23.2-linux-x64/bin/node --import tsx \
  "$QA_BOUND_ROOT/main.ts" --grant=W2 --attempt=module-attempt-01 \
  --with-applicability --with-stairs --with-privacy --with-engine-applicability \
  >"$QA_EVIDENCE_ROOT/module-attempt-01.stdout.log" 2>"$QA_EVIDENCE_ROOT/module-attempt-01.stderr.log"

env NODE_OPTIONS=--max-old-space-size=1536 TSX_TSCONFIG_PATH="$QA_CANDIDATE_ROOT/tsconfig.json" \
  /usr/bin/time -v -o "$QA_EVIDENCE_ROOT/http-attempt-01.time.txt" \
  /home/b/.local/share/gs-safety-runtime/node-v22.23.2-linux-x64/bin/node --import tsx \
  "$QA_BOUND_ROOT/launch-http.ts" --grant=W2 --attempt=http-attempt-01 \
  >"$QA_EVIDENCE_ROOT/http-attempt-01.stdout.log" 2>"$QA_EVIDENCE_ROOT/http-attempt-01.stderr.log"
```

Variables are receipt-derived absolute paths, not defaults. Capture command start/end/exit, exact launcher PID and resource observations externally. Module setup and HTTP launcher own fresh separate SQLite databases. The HTTP launcher performs migration, seed, production start, actual 18-document E5 readiness, warmup, normal KO/EN observations, genuine reroutes, privacy boundaries, real delayed response, joins, integrity and cleanup. Module execution supplies original85, controlled facts/policy, stairs, actual component privacy and14 actual engine observations. Both retain their original failures and narrower additive observations.

After process closure, bind the two existing scanner templates by replacing only `__QA_EVIDENCE_ROOT__`, preserve their source/rendered hashes, then execute component followed by HTTP filesystem-only scans. The scan names depend on the exact attempt names above. Inspect the existing W1 D10 saved current input and W2 direction-profile-only captures for the QD009 empty-current-scope seam; do not invent a new case or model-selection target.

Resource request: exclusive inference at127.0.0.1:8092, QA proxy8093 and application4102; no simultaneous W1/W3 app/model load. Reserve5minutes including setup/integrity/cleanup. C4 historical duration was51.19s module plus31.45s HTTP, module maximum RSS1,655,128KiB; these are scheduling estimates, not C5 measurements.

Provider owner launches the frozen `data/knowledge/runtime/start-llm.sh` with explicit C5 binary/model paths, port8092 and threads4. It executes llama.cpp b10964 alias Qwen3-0.6B-Q8_0, ctx2048, parallel1, GPU0, cacheRAM256, reasoning disabled. W2 observes and preserves that owner process. Receipt must record its PID/start ticks, startup/ready UTC, executable/model paths and hashes, exact command and owned process handle. Instruction revision23749fefcc72300e3a2ad315e1317431b06b590a; E5 revision761b726dd34fb83930e26aab4e9ac3899aa1fa78,384dimensions. No provider was launched by this preparation.

Owned app/proxy/process/database handles must close on success or failure, with release evidence. No broad process kills, C4 PASS transfer, normal mock substitution, product edits or acceptance verdict.
