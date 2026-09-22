# Independent S17/S23 server import result

Executed 38 distinct subcases: **34 passed, 4 failed**. The four failures are the same recovery-marker durability defect across equipment/fire-gas and pending/playing. This is a server import slice result, not a whole-card, AC or goal verdict.

Candidate: `70da1337ab54652824ffb49f65cb0213822ba7c2420ae345664dbe7c48c893af`; source aggregate declared in the frozen manifest: `af06052baf673b40b33f8a4bb9f095b4239ff622d82fec492de6d42caeb92584`; supplied HEAD `9dc020a7c0160af17e2ac9157dcb8c390890309a`; BUILD_ID `VEwOJr6BFk2kVq-L1cCiG`. Read-only candidate: `/home/b/.cache/gs-safety-ci.u7pR52`. The candidate ID and source aggregate match the supplied manifest identity; 171 selected production/server/contract/configuration/migration files were hashed independently before and after execution, with zero mismatches. This does not claim a recomputation of the entire candidate aggregate.

The QA-owned strict TypeScript/Vitest harness independently drives the production `SimulationRuntime`, real migrated SQLite files, real seeded/authenticated accounts and real response/receipt repositories. It never starts the scheduler. Default EQ-APPROACH/FG-FIRE data retain virtual epoch `2026-09-21T09:00:00Z` and seed20260921; guidance and normal observation clocks use actual execution UTC. The expiry test alone injects Date at the generated envelope's expiry and records that fact. No producer tests or fixture factories were reused.

Execution records are under `docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/server/candidate-70da1337/voice/`:

| Run | Actual UTC start–end | Result | Evidence |
| --- | --- | --- | --- |
| Initial S17/S23 | 13:22:40.997–13:22:49.287 on 2026-09-21 | 24 passed | `attempt01.log`, `attempt01-report.json`, `attempt01/` per-case databases and state/dispatch/publication journals |
| New negative/durability cases | 13:25:42.893–13:25:48.393 on 2026-09-21 | 10 passed, 4 failed | `extension02.log`, `extension02-report.json`, `extension02/` per-case databases, raw queries and marker comparisons |

No test retry or product rework was performed. The second execution runs only newly added cases. Initial strict typecheck failed because the QA tsconfig omitted the candidate's existing `src/server/tracking/js-aruco2.d.ts`; that original log remains as `typecheck-attempt01.log`. Adding this existing declaration to the QA include list made strict typecheck pass (`typecheck-attempt02.log`, exit0), without a product change or weakened compiler flag.

## Passing subcases

| Scope | Executed assertions |
| --- | --- |
| S17, 6 cases | Both modes × ko/en: valid accepted-result seam produces a newer supplement envelope with unchanged primary content/context/timestamps and response state; immutable first guide remains identical; no added primary dispatch or incident; append-only guidance history includes primary and supplement; active-primary completion remains accepted; latest supplement receipt stays separate; exact response replay has no duplicate effects and returns current state while its original receipt remains immutable; same-process DB reopening restores the supplement and original first guide. Two mode-specific obsolete-primary cases reject delayed results and old callbacks after a profile change creates exactly one new primary dispatch. |
| S23, 18 cases | Pending/playing pause, delayed start while paused, rapid resume before delayed start, repeated stop/start and request replay preserve first stop intent. Genuine completed/failed/unsupported reports after stop retain facts and cannot regress on a later start. Same-primary supplement and DB reopening preserve an already-persisted marker. Genuine new primary clears the marker and accepts a positive start. Running-state recovery creates a new actual-UTC marker for pending/playing and delayed start becomes stop-requested. |
| Negative/compatibility, 10 cases | Wrong authenticated worker, wrong run/guidance, revoked device-slot token, expired issued session and exactly-expired primary do not mutate state or append receipts. Changed-payload receipt replay conflicts. A newly submitted non-voice primary-version receipt is rejected after a supplement, while the permitted voice callback was separately accepted. The shared parser accepts an absent legacy marker without inventing stop/completion. |

`canonical-first-guidance-digests.json` independently derives recursively key-sorted JSON SHA256 values from the saved before/recovered artifacts: all four mode/locale first-guide digests match. The in-process publication ledger is a bus observation, not SSE transport evidence. The dispatch ledger counts actual server `onGuidance` calls, not device utterances.

## VOICE-001: recovery-created stop intent is not durable

Input: start the scenario, advance virtual time1000ms to the current primary, optionally submit genuine voice-started, then dispose the runtime and close its SQLite handle. Reopen both against the same file. Before any new command or worker response, query the latest persisted snapshot and reopen again.

Expected: frozen `docs/contracts/clarification-playback-stop-v1.0.3.md` lines9–11 defines the first server stop-request timestamp and requires it to survive SQLite checkpoint/restart. Lines15 and21 require repeated requests to preserve the first timestamp and running-to-paused recovery to issue/preserve stop intent. The recovery-created first marker must therefore be durable for this same primary.

Actual: recovery exposes a nonnull marker in the runtime, but the latest persisted snapshot still has `voiceStopRequestedAt: null`, run status `running`, and the original pending/playing status. Reopening before any later mutation reissues a different timestamp. All four variants fail both the persisted-marker and repeated-recovery checks.

| Mode / prior state | First recovery marker | Second recovery marker | Latest DB marker |
| --- | --- | --- | --- |
| equipment / pending | 2026-09-21T13:25:47.598Z | 2026-09-21T13:25:47.607Z | null |
| equipment / playing | 2026-09-21T13:25:47.885Z | 2026-09-21T13:25:47.892Z | null |
| fire-gas / pending | 2026-09-21T13:25:48.131Z | 2026-09-21T13:25:48.138Z | null |
| fire-gas / playing | 2026-09-21T13:25:48.380Z | 2026-09-21T13:25:48.386Z | null |

Representative evidence directory: `extension02/recovery-durability-playing-equipment-00813f45-b467-4f2d-b0f6-84f49a1284e4/`. `recovery-persistence-query.json` retains the real `SELECT version, payload_json FROM run_snapshots WHERE run_id = ? ORDER BY version DESC LIMIT 1` result, runtime response and parsed persisted response. `repeated-recovery-markers.json` SHA256 is `8c480c5ec6307370496d98aa4596c654ead4e373f97059ce8b2c22a961ff3cfb`. The SQLite file, observations and original failed output remain intact.

Source explanation consistent with observed state: `src/server/simulation/playback.ts:24` transforms restored running state and sets intent in memory; `src/server/simulation/runtime.ts:46` loads restored runs/checkpoints without committing this transformation. Thus later mutation can persist the marker, but recovery alone leaves the earlier database head. The passing already-persisted-pause cases distinguish this gap from general SQLite or marker parsing failure. An independent read-only contract/evidence reviewer agreed that the marker-lifetime assertion is applicable. No product patch was attempted.

This evidence is explicitly a **same-process runtime plus database close/reopen**. It does not replace an OS exit/start test. Parent QA was notified immediately with candidate, exact timestamps, raw evidence path/hash and a request to include a second actual restart with no intervening mutation.

## Remaining boundaries

The injected RAG factory returns an explicitly labelled synthetic accepted result through the supported `attachRag` seam. It proves downstream timing/lineage/persistence behavior only: no actual retrieval, approval filtering, generation validation, provider/model call or 5000ms model timeout is proved here. Actual primary speech overlap, beep/TTS start/cancel/end, visible labels, device callback timing, duplicate/reconnected SSE frames, HTTP scoping and true OS restart remain outside this slice. Contradictory terminal-to-terminal policy is unbound and was not assigned an invented oracle. Local manual replay has no new server attempt identifier; no local audio claim is made.

All runtime/SQLite handles are closed. Secrets were random, memory-only values; JSON/log evidence contains no token, PIN or access-code fields. Original inputs/failures and all isolated databases are preserved. Whole-card/AC/goal acceptance remains with QA Lead.
