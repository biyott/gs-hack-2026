# Independent CORE G4 subcase report v1

Goal/run: GS-SAFETY-SIM-001 / GS-SAFETY-SIM-001-20260921T084101Z. Executor: `/root/qa_lead/qa_server/core_execution`; parent: `/root/qa_lead/qa_server`. Candidate `70da1337ab54652824ffb49f65cb0213822ba7c2420ae345664dbe7c48c893af`; source `af06052baf673b40b33f8a4bb9f095b4239ff622d82fec492de6d42caeb92584`; HEAD `9dc020a7c0160af17e2ac9157dcb8c390890309a`; build ID `VEwOJr6BFk2kVq-L1cCiG`. Frozen candidate root `/home/b/.cache/gs-safety-ci.u7pR52`.

This is a constructor-level software slice, not an overall or whole-AC verdict. There is one confirmed current-state discrepancy in S20. The latest target and immutable first guidance recover correctly, but current guidance remains `CONFIRM_ARRIVAL` after a later valid observation moves the worker to the old refuge.

## Execution and boundaries

Execution was 2026-09-21T13:22:11.598Z through 13:33:03.684Z; exact attempt times and results are in [execution-index.json](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/server/candidate-70da1337/core/execution-index.json). Node was `/home/b/.local/bin/node` v22.23.2, Vitest 5.0.1, real better-sqlite3 and candidate migrations/auth/repository/runtime. A fresh physical SQLite file was created per deterministic repetition and per independent control. `seedAccounts` seeded an isolated QA administrator with an in-memory random credential; no production default PIN or developer DB was used. This does not stand in for the parent's documented CLI startup or account matrix checks.

The runtime constructor was used without starting its scheduler. Date and performance were controlled through Vitest's narrow clock shim. Scenario epoch/seed stayed 09:00 UTC / 20260921; injected generation/session UTC was 09:30 under QR-004. Actual UTC execution times are separately retained. No product test/helper supplied fixtures or expected behavior; no evaluator, planner or geometry predicate was imported by the independent route oracle. No HTTP, server, model, device or browser was started.

The raw production snapshots, fresh databases and normalized traces are retained. Trace normalization replaces fresh UUID identity tokens with an explicit encounter-order map, including all embedded references, while preserving every other field, array order, profile, action, hazard, geometry and route value. The identity maps are stored beside each trace. This UUID mapping is disclosed for QA Lead review because G0 explicitly names fresh run/session IDs and wall timestamps; there is no hidden semantic normalization.

## Observed subcases

| Card / portion | Result | Observed evidence and limit |
| --- | --- | --- |
| S01 published scenarios | PASS within constructor scope | All 14 published scenarios reached completion in three fresh-DB repetitions each. Published checkpoint expectations and complete mapped traces agree. Thirteen groups passed attempt-01; EQ-PROFILE-ROUTES passed corrected attempt-02. CLI startup belongs to parent. |
| S02 approach/speed/heading/profile routes | PASS observed published controls | EQ-APPROACH, EQ-SPEED-DIRECTION and EQ-PROFILE-ROUTES use real production evaluation; expected REFUGE-01→REFUGE-02 heading transition, geometry/profile changes and independent route checks passed. |
| S03 no route, separate position loss, arrival | PASS published controls; S20 departure fails separately | Every-path closures yield empty route/destination, worker and equipment disconnect/stale checkpoints stay distinct, EQ-ARRIVAL does not synthesize explicit response timestamps. |
| S04 fire/gas/combined, region growth/shrink | PASS observed controls | Published fire/gas/compound checkpoints, DEMO-GAS-X identity, closed paths and independent route checks passed; independently authored shrink fixture updated the exact polygon and retained valid segments. |
| S05 shelter, sensors, clear versus reopen | PASS observed controls | Identical all-path-blocked gas fixtures with/without shelter policy produce SHELTER_PER_SCENARIO versus ROUTE_UNAVAILABLE, both empty. Stale/disconnected sensor and scenario clear/reopen cases passed. |
| S06 pause/speed/resume/reset, mode separation | PASS observed controls | Paused advance does not change virtual time; speed2 advances twice; reset changes run ID and removes current guidance/incidents; other mode snapshot remains equal; old history remains stored. Parent owns Next restart/SSE and old-run request checks. |
| S07 1000 temporal envelopes | NOT_RUN in this slice | Constructor execution does not establish a client/HTTP envelope-consumer result; assigned elsewhere by parent. No claim inferred from these scenarios. |
| S08 profiles and active update | PASS observed controls | A/B/C exact constraints preserved, C null fields/fallback retained, B/C assistanceRequired remains true, unknown profile remains unverified. Active A locale ko→en, profile version2, stairs forbidden and assistance/companion required update current guide and safe route while first dispatch stays immutable. |
| S09 demographic metamorphism | PASS server-constructor/persistence portion | Four original age/gender/nationality variants parse to the identical confirmed profile and produce identical mapped state; demographic keys/canary are absent from snapshots and persisted history. Actual LLM/browser network propagation is outside this slice. |
| S18 explicit owner transition matrix | PASS six runs | A→B and B→A clearance/reopen/close orders each repeated three times. A owns PATH-A/C; B owns PATH-B/C; shared C remains restricted until both release. Separate hazards, first guidance, times/actions and DB current snapshots remain correct. Owner matrix is explicitly injected into QA runtime state before start. |
| S18 public/scenario owner creation | BINDING GAP observed | No input field expresses per-hazard path ownership. Scenario-only A activation/block followed by B activation/block assigns PATH-B to A+B, so reopening B leaves all three paths blocked. The original B-only PATH-B matrix is not represented by this setup. This diagnostic is not a passing ownership-creation assertion. |
| S20 new-process target/first-guidance recovery | PASS narrow recovery portion | Old process PID792666 exited; new PID793636 independently checked ESRCH. Same DB restored latest target REFUGE-02=(125,42), while immutable first dispatch remained REFUGE-01. Fresh evaluation at latest target remains arrival with no fabricated arrivedAt. |
| S20 later old-target position | FAIL current-state portion | Natural virtual11s event gives known position (125,8), 34m from latest target, yet current guidance is still CONFIRM_ARRIVAL/version3/reason destination-reached. See finding below. |

Route validation checked every segment against independent polygon/segment math, enabled and nonclosed graph edges/corridors, stairs/accessibility constraints including null values, static obstacles, active/stale/disconnected hazard polygons, explicit outward initial egress without reentry, endpoint identity and map coordinates. No shortest-path optimality or physical tracking accuracy is claimed.

## Finding QA-CORE-S20-01

Criterion: original `incident-recovery-addendum-v1.md`, S20: a later position at the old target is not treated as arrival at the latest target. Independent input uses the frozen EQ-SPEED-DIRECTION events through8s, then QA position events9s=(125,42),11s=(125,8). At4s current target is REFUGE-01, at8s REFUGE-02, and at9s the current guide becomes route-free CONFIRM_ARRIVAL.

The first process persists at9s and exits. A separate process opens the same DB, proves the previous PID is absent, reconstructs the production runtime, verifies target `(125,42)` and unchanged first guidance, resumes the production simulation clock and advances through the authored11s position event. Expected: current action cannot assert destination-reached at `(125,8)` for the latest target34m away. Actual: known position `(125,8)`, current action `CONFIRM_ARRIVAL`, version3, `reasonCode=destination-reached`; latest target remains `(125,42)`. Explicit `arrivedAt`, `receivedAt`, and `understoodAt` remain null. This finding concerns current guidance, not a fabricated user response or a failure to preserve first history.

First observed attempt: `attempt-03-extra/S20-arrival.json`, with direct event application in the same process. Stronger confirmation: `attempt-04-s20-phase1/S20-OS-phase1.json`, `attempt-05-s20-phase2/S20-OS-phase2.json`, `attempt-05-s20-phase2/S20-OS-old-target.json`, plus phase2 Vitest failure JSON/console. The later confirmation uses normal scenario advancement and distinct exited/new OS processes; it is not a Next HTTP restart claim.

Source-supported mechanism: frozen `src/server/simulation/evaluate.ts:83` checks proximity against the correct latest target, but lines101–106 return the worker unchanged when evaluation says no-exposure and no recovery trigger applies. The prior arrival guide is then retained as current. This is a read-only mechanism assessment, not a patched/toggled root-cause proof. No product edit or rework was performed.

## Preserved harness failures and hygiene

1. Initial strict typecheck failed because the QA tsconfig omitted the candidate's existing js-aruco2 declaration. The exact log is preserved; including that declaration resolved the QA configuration error. Subsequent strict typechecks passed.
2. Attempt-01 incorrectly asserted incident supportStatus for the published assistanceRequired expectation. Support-request state must remain separate; raw guidance already showed assistanceRequired=true. The original executed harness, output, raw snapshots and failing assertions are preserved. The one-line correction checks `currentGuidance.messageArgs.assistanceRequired`; only that scenario was rerun in three new databases. This is a harness correction, not relaxed acceptance or a product rework.
3. One attempt-03 dispatch accidentally named a nonexistent config path. Its original failure log is preserved; the corrected path was then dispatched. No product code was loaded by the bad command, and no repeated identical environment failure was retried.
4. Despite the QA cacheDir being outside the candidate, Vitest's default bundled config loader temporarily used candidate dependency cache directory `node_modules/.vite-temp` through the QA dependency symlink. The directory was observed empty afterwards; no candidate source/build content changed. Later execution used `--configLoader=runner` to prevent repetition. This dependency-temp directory side effect is disclosed, not presented as perfect filesystem immutability.
5. Before execution, all256 selected source/data/migration/config hashes matched. After execution, all904 manifest source files and471 build artifacts match. The final verification records are retained. Candidate content, original G0/cards/fixtures and prior failures remain preserved. Zero product reworks.

## Reproduction commands

Run from the frozen candidate with pinned Node and the absolute owned config. Set a new QA_CORE_ATTEMPT for each execution; do not reuse fresh-database attempt paths. These commands describe the isolated runner form; attempts01–05 used the original default config loader as disclosed above.

```sh
QA_CORE_ATTEMPT=new-attempt /home/b/.local/bin/node /home/b/.cache/gs-safety-ci.u7pR52/node_modules/vitest/vitest.mjs run --configLoader=runner --config /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/server/candidate-70da1337/core/vitest.config.ts scenarios.test.ts
```

For S20 run `s20-phase1.test.ts` with a fresh attempt label and wait for its OS process to exit. Then run `s20-phase2.test.ts` in a new command/process, with a new QA_CORE_ATTEMPT and QA_CORE_PHASE1 set to the previous label. No server/model port is used. Phase2's old-target assertion currently fails on this candidate.

Final harness checks: strict TypeScript completed with no diagnostics; the programming skill's no-excuse audit reported no violations in10 files. `subcase-results-v1.json` carries the machine-readable result/finding record. Original fixtures retain their registered SHA-256 values, captured in `inputs-and-harness.json`.
