# Independent Q-RAG C3 execution adapter

Status: preparation and strict static validation only. A separate explicit W2 resource grant is required before any application, database, embedding, model, proxy or test invocation. Source C3 is frozen; all edits in this directory are QA adapters outside the candidate. Historical C1 results and frozen C2 preparation remain preserved and are never relabelled as C3 results.

Candidate root: `/home/b/.cache/gs-safety-c3.eulo4t9w`.
Candidate ID: `sha256:1a7c95cd1a15df738492a368d36cc6cb98985ec1c2618b10e807c82076b247c4`.
Manifest: `runtime-artifacts/candidate-manifest-c3.json`, SHA256 `8d9b031f68374ea939dcdebb570e76aeba4b09d1154165cab53d186e7d27c4bc`.
Source: `10f658c44bc4bd511302900e02b467058b6dc558b767f2acc4b2c49773d5f6ab`.
BUILD_ID: `BLy4PJy6kc0sEf4JQFnE0`. Contract freeze 1.0.4, implementation binding 1.0.4-r2.
Root receipt: `g3-freeze-c3.json`, SHA256 `37949392e24846b525874e79e648a9994df30ffe394357cbd843e971086b1362`.

The exact candidate launch guide is `runtime-artifacts/g3-launch-c3.md`. The controlled module replay keeps all 85 original identities and document-validity UTC 2026-09-21T09:30:00Z, virtual scenario 09:00 and seed 20260921. Review timestamps remain genuine. Live service and HTTP calls use actual fresh UTC; the stairs extension separately records eligible IDs/versions at controlled and live clocks. No exact-clock equivalence is assumed.

## Authorized future sequence

Run from the fixed C3 candidate directory, with the pinned Node 22.23.2 executable. Set `TSX_TSCONFIG_PATH` to that candidate's `tsconfig.json`. The calling shell supplies no private token in argv. `main.ts` first replays controlled retrieval/filter/fault cases against a fresh isolated SQLite database with actual E5/FTS. `--with-stairs` then adds actual model stairs KO and additive EN observations; `--with-privacy` adds the separate actual component canary path. Both reuse the resident E5 sequentially, with owned proxy lifetimes separated. No Next application runs during that module process.

```bash
cd /home/b/.cache/gs-safety-c3.eulo4t9w
export TSX_TSCONFIG_PATH=/home/b/.cache/gs-safety-c3.eulo4t9w/tsconfig.json
/home/b/.local/share/gs-safety-runtime/node-v22.23.2-linux-x64/bin/node --import tsx \
  /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/rag/candidate-1a7c95cd/main.ts \
  --grant=W2 --attempt=module-attempt-01 --with-stairs --with-privacy
```

The execution owner records actual process times/PIDs, CPU/RSS/memory/occupancy and the command, capturing stdout/stderr privately outside the attempt directory before starting it. Attempt directories are exclusive immutable outputs; never reuse a failed attempt. The initial and final candidate/harness hashes must match. Original frozen raw outcomes, including unsupported binding and raw diagnostic failures, remain distinct from source-backed dispositions.

After the entire module process and its proxy/DB have released, start normal production HTTP integration. The launcher generates private credentials, owns fresh SQLite and Next on4102, and uses an authenticated localhost8093 capture proxy to the existing8092 provider. It does not restart PID332445. Actual E5 ingestion readiness (18 documents/chunks/FTS/vectors, actual384) and warmup happen outside measured scenarios. The launcher resets scenarios before samples.

```bash
/home/b/.local/share/gs-safety-runtime/node-v22.23.2-linux-x64/bin/node --import tsx \
  /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/rag/candidate-1a7c95cd/launch-http.ts \
  --grant=W2 --attempt=http-attempt-01
```

Normal HTTP/SSE and genuine provider capture cover both modes and supported KO/EN profile variants. Intentionally injected failure controls are separate from normal provider observations. The existing product 5000 ms deadline remains unchanged. Run the log entry only after actual launcher cleanup/process exit, supplying the observed application PID, closure time and exact launch/cleanup artifact hashes; consult `privacy-log-readiness-v1.md` for its complete command contract.

## Evidence scopes

Actual component E5 captures exact outgoing texts, real vectors and model identity after the real command parser/runtime/attachment path. Production HTTP/SSE, raw LLM proxy bytes and closed application logs are separate surfaces/processes. Joining their feasible privacy observations does not claim direct production Next E5 capture. Intentional raw canary inputs are labelled setup; actual outgoing/client/log occurrences are retained as failures. Missing or ambiguous surfaces remain incomplete.

The stairs extension retains original Q07-03 raw required/forbidden/action/status checks and the additional-whitelist diagnostic separately. Its actual explanation review must use full approved conditions and must not invent an observed heading change from EQ002. Exact approved wording or metadata eligibility alone does not prove current semantic applicability.

Physical audio/display and whole case31 are coordinated with Q-UI. HTTP lineage/reconnect or module callbacks cannot prove physical speech behavior. This adapter and its preparation manifest issue no overall acceptance verdict.

The other inherited Markdown documents in this directory are explicitly marked historical C2 preparation references. This README, new C3 binding evidence and actual attempt artifacts identify the current executable settings.
