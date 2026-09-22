# Executed commands and scope

Working directory: `/90-biyott@github/gs-hack-2026`.

The following shell variables describe the literal paths used by the recorded commands. They contain no credentials. The actual invocations used those full paths. `prepare.ts` writes immutable files with `wx`, so repeating into the same evidence directory deliberately fails instead of overwriting results.

```bash
ORDER_QA=/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/server/candidate-70da1337/ordering
ORDER_EVIDENCE=/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/server/candidate-70da1337/ordering
ORDER_CANDIDATE=/home/b/.cache/gs-safety-ci.u7pR52

/home/b/.local/bin/node --version
/home/b/.local/bin/node "$ORDER_CANDIDATE/node_modules/typescript/bin/tsc" --version
TSX_DISABLE_CACHE=1 TSX_TSCONFIG_PATH="$ORDER_QA/tsconfig.json" TMPDIR="$ORDER_EVIDENCE/tmp" /home/b/.local/bin/node --import "$ORDER_CANDIDATE/node_modules/tsx/dist/loader.mjs" "$ORDER_QA/prepare.ts"
/home/b/.local/bin/node "$ORDER_CANDIDATE/node_modules/typescript/bin/tsc" --project "$ORDER_QA/tsconfig.json"
TSX_DISABLE_CACHE=1 TSX_TSCONFIG_PATH="$ORDER_QA/tsconfig.json" TMPDIR="$ORDER_EVIDENCE/tmp" /home/b/.local/bin/node --import "$ORDER_CANDIDATE/node_modules/tsx/dist/loader.mjs" "$ORDER_QA/execute.ts"
TSX_DISABLE_CACHE=1 TSX_TSCONFIG_PATH="$ORDER_QA/tsconfig.json" TMPDIR="$ORDER_EVIDENCE/tmp" /home/b/.local/bin/node --import "$ORDER_CANDIDATE/node_modules/tsx/dist/loader.mjs" "$ORDER_QA/focused.ts"
```

Before the final focused invocation, a read-only Node SHA256 operation hashed `focused-inputs-v1.json`, `focused.ts`, and the existing base input ledger; it wrote the pre-execution declaration `focused-inputs-v1.sha256.json`. The focused runner verifies those hashes before calls.

Base execution returned exit1 because100 consumer assertions failed; focused execution returned exit0. Initial typecheck returned1 for a QA-only exported schema name/config error. Corrected and focused typechecks returned0. All initial diagnostics are retained. No product rework or identical environment retry occurred.

Retention analysis reads only `input-ledger-v1.json` and `results-v1.json`, joins on counted index/class, and compares the actual projected guidance against incoming guidance for valid/duplicate classes or baseline guidance for every other class. It recursively sorts JSON object keys, retains array order, and hashes both canonical values. `retention-analysis-v2.json` records that procedure and its inputs' hashes; v1's insertion-order mistake is preserved and explicitly superseded. This is analysis of the initial observations, not another product execution.

No HTTP, browser, server start, SQLite access, model call, audio API, actual EventSource, device API or product file write was performed. The harness drives the exported client store synchronously and invokes real pure policy functions; those boundaries define what this evidence can establish.
