# Q-SERVER G3 execution readiness audit v1

Prepared 2026-09-21 at 10:57–11:03 UTC by `/root/qa_lead/qa_server`. This is read-only preparation for S01–S22, not execution evidence or a product verdict. G3 source/build submission is pending. No server was started, API request sent, database opened, migration/seed executed, dependency installed, or product test run for this audit. All prior cards, fixtures, failures and readiness records remain intact.

## Binding and observed environment

- Governing inputs remain the run's acceptance registration/G0 protocol, original goal, source002/005/006, QR003 supplement lineage and QR004 [clock binding](../clock-binding-v1.1.md). [Source-gap audit v1](source-gap-audit-v1.md) records the archived source anchors; its 08:54 readiness gaps are historical.
- `docs/contracts/freeze-v1.0.1.json` declares content SHA256 `379a4bee66b78f2df9aa8a792f18d2edf5d6b63b26c2b94e94df55e6e51f0c63`, matching QA Lead's supplied declaration. Independent filesystem hashing matched all 19 listed file hashes. This checks each file, not an independently reconstructed aggregate-hash algorithm. Contract revision is 1.0.1; wire simulation snapshot remains 1.0.0.
- The freeze now records Backend, Frontend, Mobile, Tracking, Design and RAG concurrence. Its stated limitation remains: a contract freeze is not the final source/build candidate.
- Read-only runtime version checks found Node v22.23.2 and npm 10.9.8. The shared checkout lacks `.next/BUILD_ID` and the conventional `node_modules/better-sqlite3/build/Release/better_sqlite3.node` artifact. No module import was attempted, so this is an artifact observation, not a proved native load failure. `sqlite3` CLI was not found; the package's raw read-only driver is an alternative once candidate dependencies are verified.
- Technical bootstrap reconciliation reports a separate install at `/home/b/.cache/gs-safety-ci.u7pR52`, matching manifests, SQLite 3.53.4 and Sharp 0.35.4. These are producer reports, not this slice's independent environment execution. Technical G2 status says its earlier incomplete source copy is not a candidate. QA must receive the final candidate directory and manifest before using that environment.
- QA Lead reserved planned server port 4101, subject to a free-port check after G3. Local model port 8092 belongs to RAG Lead; exclusive measurement windows must be coordinated, with no restart of that shared service by this slice.

## Commands and resources for the submitted candidate

The commands below are verified against `package.json`, server/DB/auth documentation and installed Next CLI documentation. They have **not** been run by this audit. Run from the submitted candidate root because migrations/configuration use the current working directory. Keep an absolute QA DB path beneath this slice's evidence directory; never accept the default `data/runtime/safety.sqlite` for QA.

| Step | Command or binding | Required precondition/evidence |
| --- | --- | --- |
| Dependency provisioning | `ONNXRUNTIME_NODE_INSTALL_CUDA=skip npm ci` | Technical owner provides final lock hash, completed install/native verification and source/build manifest. A dependency install changes its target directory, so use only an assigned isolated environment after G3. |
| Fresh migration | `npm run db:migrate` | Export `DATABASE_PATH` to a new absolute QA path and supply the agreed nonlogged `GS_DEMO_PIN`. Script uses Node `--env-file-if-exists=.env --import tsx`; explicit process environment must identify this QA DB. Record absent-before/create-after, migration list and schema hash. |
| Fresh seed | `npm run db:seed` | Same DB path and PIN. Record public account IDs/roles/bindings, never hashes, PINs or tokens. Three reproducibility repetitions use three distinct fresh files. |
| Production artifact | `npm run build` is the producer build command | QA consumes the submitted build with its `.next/BUILD_ID` and artifact hash. An ad hoc QA rebuild cannot silently stand in for the submitted artifact. |
| Start | `npm run start -- --port 4101` | Same exported absolute `DATABASE_PATH`, explicit `GS_DEMO_PIN`, frozen RAG configuration and final candidate cwd. `PORT=4101 npm run start` is equivalent; **PORT in `.env` is not supported** by installed Next CLI. Record actual process identity, command, cwd and sanitized config. |
| Real process restart | Stop only the owned application process, verify it exits, then repeat the same start command | Same candidate, DB and PIN; record new OS process identity and fresh stream UUID. Do not reset/select/reseed state before the first restored observation. Capture paused restored running runs before resume. Reconstructing `SimulationRuntime` in one process is a different test slice. |
| Database audit | QA-only direct `better-sqlite3` driver connection with `{readonly:true,fileMustExist:true}` | Use the final candidate's verified driver and only the QA DB. This is not the product's writable DB helper. Do **not** call `createDatabase` or `getDatabaseServices` for read-only audit: they migrate/seed and write. A QA-owned query adapter remains to be authored. |

The installed guide at `node_modules/next/dist/docs/01-app/03-api-reference/06-cli/next.md` states that `next start` requires a prior production build, supports `--port`, and cannot read the listener port from `.env`. Do not print the environment or enable shell tracing while credentials are present. Session responses are kept in process memory; only redacted IDs, roles, status codes and version/timing fields belong in evidence.

`GS_DEMO_PIN` must be 4–128 characters and explicit in production. `src/server/auth/config.ts` provisions admin, admin-2, operator, support, worker-a, worker-b, equipment, cctv and observer. Worker accounts bind WORKER-A/WORKER_1 and WORKER-B/WORKER_2; device accounts bind EQUIPMENT and CCTV. There is no default WORKER-C account: profile-C route tests can use isolated configuration; a worker-C response test requires an explicitly seeded QA account through `seedAccounts` and a documented fixture binding. Account names/roles are not guessed from UI selections. Preserve the PIN across restart because changing it invalidates sessions during seed reconciliation.

## Public API and fixture boundaries

The canonical public login is `POST /api/session` with `{actorId,role,accessCode}`; optional worker/device bindings must match the stored account. Browser tests use the HttpOnly SameSite cookie and same-origin mutation requests. A QA HTTP driver can keep the returned bearer token in memory. `DELETE /api/session` revokes the session and closes its streams. There is no token in an SSE URL.

Public endpoints are documented in `src/server/README.md` and `docs/contracts/v1.md`: catalog; GET/POST simulation; GET events; POST incident actions; POST worker response; tracking/calibration/frame/UWB/clock and native pairing routes. Snapshot responses are direct values, errors use the canonical error object, and SSE event `snapshot` carries a complete scoped snapshot with event ID `streamId:mode:sequence`.

| Harness need | Existing source boundary | Binding still required before execution |
| --- | --- | --- |
| Exact virtual-time engine runs | `SimulationRuntime` in `src/server/simulation/runtime.ts`; `loadConfiguration(dataRoot)` and `SimulationConfiguration` in `configuration.ts`; `createDatabase`, `createRunRepository`, `createAuthService`, `seedAccounts` | Backend confirmed through QA Lead that the constructor `{configuration,database,repository}` does not start the scheduler. QA can import it without invoking `getRuntimeServices` or `startScheduler`. The producer's `runtime-test-fixtures.ts` is a constructor reference; its expectations/helpers are not the independent QA oracle. QA Lead permits this engine slice, paired with separate real HTTP lifecycle tests. |
| Clock control | Public `start`, `pause`, `resume`, `speed`, `advance`; `src/server/simulation/clock.ts` | `advance` does nothing unless running. Production service always starts a 100ms wall-time scheduler, so HTTP `advance` alone cannot guarantee exact G0 event times. Backend confirmed `vi.useFakeTimers({toFake:['Date','performance']})`, `vi.setSystemTime(G0 epoch)` and explicit advance in the isolated constructor slice. Hold virtual 09:00 separately from document 09:30 and live UTC. No new public test endpoint is required. |
| Custom simultaneous hazards/closures and policy pairs | Parsed `SimulationConfiguration` supplied to the runtime; `loadConfiguration` accepts an external data root at import level | Author schema-parsed QA fixture configurations under owned QA paths. Normal HTTP singleton calls `loadConfiguration()` with fixed cwd data and exposes no arbitrary scenario upload; these custom fixture tests are labelled engine/import evidence. Normal catalog scenarios remain covered through real HTTP. |
| Profile/pose/input controls | `packages/contracts/src/commands.ts`; simulation actions `profile`, `equipment`, `control`, `position-input` | Available now. Profile requires a higher profile version; equipment/pose controls obey mode/capability limits. Measured input cannot be overwritten by a manual scenario coordinate. Do not report these public controls as missing. |
| Delayed valid RAG and error/timeout variants | `attachRag(runtime, createService)` and `RagServiceFactory` in `src/server/services/rag.ts` | A QA-owned deferred provider can control resolution for persistence/lineage tests. Exact delayed supplement during actual UI09 speech needs coordinated client delivery and audio observation. Mock provider timing cannot prove actual local-model operation; RAG Lead owns model resource/window binding. |
| 1000 envelopes and reconnect/network faults | Strict wire schema and production client admission consumers; real SSE route only produces its current snapshots | No documented public API accepts arbitrary snapshot injection; valid simulation commands still produce server snapshots. Bind a QA replay adapter to the submitted consumer or isolated transport fixture, log actual consumer/connection generation, and pre-hash the expected ledger. Server response validation is a separate negative API slice. A fabricated SSE transport is labelled QA fixture, never normal server delivery evidence. |
| Session expiry/revocation | Public logout/replacement; `createAuthService(database,{now,sessionTtlMs})` | Use real API for logout/replacement/permissions; imported auth clock for exact eight-hour equality. Do not change shared system time or edit product files. |
| Independent CCTV/audio/position faults | Stop owned uploads; measured input selector; worker voice-failed/unsupported response; tracking age refresh | Real process/HTTP tests can exercise these without product edits. Keep input authenticity synthetic for administrator fixtures. Actual audio and physical device behavior remain client/device QA evidence. |

Backend's constructor/clock confirmation arrived through QA Lead after the initial filesystem evidence was recorded. The binding is now resolved; only the QA-owned adapter implementation and candidate-specific execution command remain to be prepared. Create a fresh isolated database and repository, seed/authenticate the fixture's actors, construct the runtime, issue start and explicit advance commands with current versions, then dispose the runtime, close the DB and restore real timers. Do not import the service singleton. Fake Date/performance applies only to the labelled deterministic engine fixture: it does not backdate actual document review/audit evidence or replace live HTTP/model/device UTC. Capture each fake-clock value and explicit virtual advancement separately.

Call the production construction functions explicitly in that controlled order after G3. `createDatabase` creates directories, opens a writable DB and migrates immediately. Do not import `runtime-test-fixtures.ts` as a neutral production factory: it depends on Vitest and loads configuration at module evaluation. Its example is a source reference only; the QA adapter owns setup, teardown and independently authored expectations.

## S01–S22 source and contract binding

The expected outcomes remain in the preserved cards; this table binds execution interfaces without adapting acceptance to incumbent output. `002`, `005` and `006` below refer to the archived sources and line anchors in [source-gap audit v1](source-gap-audit-v1.md).

| Card / governing input | Canonical source to bind | Execution slice and remaining need |
| --- | --- | --- |
| S01 / AC01, 002 scenarios and completion | Scenario schema/loaders, config/map/catalog/policies, migration/seed, runtime/clock | Three fresh DBs; scheduler-free deterministic engine traces plus normal HTTP startup/scenario controls. Candidate and clock adapter pending. |
| S02 / AC02, 002 equipment risk | Equipment geometry/control boundaries, route engine, profile contract | Authored geometry/path oracle, public pose controls plus exact-time import fixture. Six frozen catalog presets are inputs, not certified manufacturer geometry. |
| S03 / AC02, 002 alternate/no route/position loss/arrival | Route engine, scenario closures, measured input, worker response destination checks | Isolated blocked-edge scenarios; real input/source and response API checks. Latest destination recovery additionally S20. |
| S04 / AC03, 002 fire/gas/compound | Fire/gas engine, scenario event and response-policy schemas | Frozen DEMO-GAS-X fixtures; imported exact hazard changes and public catalog scenarios. No inferred real gas interpretation. |
| S05 / AC03, 002 policy/sensor/release | Policy pairs, sensor event state, incident clear/reopen | Isolated yes/no shelter policy fixtures and authorized public transitions. Clear never means reopen. |
| S06 / AC04, 002 isolation + 005 connection lifecycle | Runtime per-mode clock/run, publication stream/sequence, reset and persisted checkpoint | Both engine isolation and actual production process restart. Final build/process harness pending. |
| S07 / AC04, G0 1000 + 005 delivery | Strict wire schema, guidance binding/expiry, client publication gate, worker response guard | Base 1000 unchanged; replay adapter and ledger registration pending. Inner invalid guidance uses forward valid outer publications. |
| S08 / AC05, 002/005 profiles | WorkerProfile, command profile, route permissions and guidance profile snapshot | A/B/C independent expected constraints. WORKER-C can be represented through custom configuration/virtual-worker fixture; a dedicated public login or ready-made QA constructor fixture is not supplied. |
| S09 / AC05, 002/005 non-inference | Strict profile parser, guidance projection, provider input boundary | Paired demographic canaries are rejected or behaviorally inert; no propagation. Actual model payload capture coordinated with RAG QA. |
| S10 / AC05,10, 005/006 response distinctions | WorkerResponse, incident support actions, response/audit repositories | Independent intermediate HTTP and DB states. SSE subscription count is never a worker receipt. |
| S11 / AC10, 006 first guidance | Primary lineage, immutable guidance history, incident lifecycle | Digest original sent envelope and stored first guidance; real action/response/actor/time records. Delayed supplement additionally S17. |
| S12 / AC11, 006 concurrent intervention | expectedVersion/expectedIncidentVersion, request receipts, authenticated actions | Two admin sessions and synchronized HTTP requests; one committed effect and explicit conflict/idempotence, then scoped SSE convergence. |
| S13 / AC11, 005 reconnect + 006 recovery | Latest-only SSE, owned stream baseline, current replay response, runtime checkpoint | Actual socket reconnect and new process. Historical response expectation corrected by [replay addendum](replay-current-binding-addendum-v1.md). |
| S14 / AC11, 005/006 separate failures | Tracking age/source, camera status, WorkerResponse voice outcomes | Separate faults and hazard continuity; physical/audio proof delegated to its QA slice. |
| S15 / AC14, goal auth + 006 permissions | Stored account authorization, route guards, fresh-session checks | Real denied/allowed API mutations; imported expiry boundary; before/after QA DB facts. No copied token evidence. |
| S16 / AC14, goal minimization + 002/006 storage | Node API boundary, projection, production bundles, RAG provider projection | Final built assets required; sanitized network/model observations and nonsecret canaries. |
| S17 / QR003, AC08–11, 006 first guide + 005 audio | `updateKind`, `guidanceVersion`, stable `primaryGuidanceVersion`, attachRag, history | Active [supplement v2](delayed-supplement-addendum-v2.md); deferred provider plus actual UI09 overlap. New immutable envelope, same primary playback identity, no repeat. |
| S18 / IO001, AC03,10–11 | Incident-scoped hazard and closure ownership, transition/audit schemas | Independent A/B hazards and PATH-A/B/C ownership from preserved recovery fixture; imported custom scenario plus normal API lifecycle checks. |
| S19 / IO004, AC04,11 | Versioned runtime checkpoint, pose/profile/input/hazard/passage state, receipts | Actual new process same QA DB, no recovery reset. Original receipt bytes unchanged; HTTP retry returns current snapshot. |
| S20 / IO004, AC02,10–11 | Last validated destination checkpoint and arrival response | Rerouted REFUGE-02 survives process restart while immutable first guidance remains REFUGE-01. Imported scenario must preserve frozen expected coordinates. |
| S21 / AC05,10–11 | SSE subscriber accounting, scoped projection, explicit worker response | Observe admin/observer/extra-admin subscriptions without worker response; subscriber counts prove transport subscribers only. Actual target delivery requires matching worker/client evidence. |
| S22 / AC04,11, QR004 | Freeze1.0.1 stream/sequence/wire schema, owned SSE baseline | Apply ordering resolution below; immutable base1000 preserved, extra focused handshake probes separate. |

## Ordering resolution against the published freeze

[S22 proposal v1](temporal-ordering-binding-proposal-v1.md) remains preserved. The published freeze now resolves its earlier questions on wire compatibility, HTTP before SSE and basic owned reconnect behavior:

1. A fresh real UUID identifies each runtime. Each mode's safe-integer sequence increases on every changed publication, including transient tracking and run reset; `run.version` and mutable timestamps cannot order publication.
2. HTTP before the first owned SSE baseline may be held pending or ignored, but cannot establish a stream or claim authoritative current state. HTTP cannot switch an established stream. Superseded connection callbacks have no authority.
3. Same-stream reconnect retains the high watermark and requires strictly higher sequence; an identical snapshot is a no-op. The first valid snapshot on the owned reconnect may establish a genuinely new runtime stream even with lower sequence/persisted revision.
4. A higher-sequence same-stream snapshot may legitimately introduce a new run. That reset is not a wrong-run failure. Every contained guidance still binds to the accepted envelope's run, worker, map and validity window; wrong-run inner guidance is rejected independently.
5. Live wire snapshots require explicit real UUID/sequence through `SimulationWireSnapshotSchema`. Missing fields/default `legacy` are old-DB migration compatibility only; restored state is stamped before exposure. SSE ID is diagnostic identity; parsed envelope controls acceptance.

Remaining focused method questions: identify the final client connection-generation adoption point; confirm handling of same-sequence changed content and a known retired-stream identity on an otherwise owned reconnect (no silent rollback proposed); publish sequence-exhaustion behavior; bind expiry equality/future-clock tolerance to the appropriate guidance/device clock; identify the actual replay consumer adapter. These are concrete verification bindings, not new criteria or permission to order by wall time. Actual hardware clock uncertainty remains subject to QR004 and device QA.

## Read-only database observation plan

Use parameterized queries and explicit columns; never `SELECT *` from accounts/sessions. The current schema's relevant names were verified in `src/server/db/schema.ts`:

```sql
SELECT a.mode, a.run_id, h.version
FROM active_runs AS a JOIN run_heads AS h ON h.run_id = a.run_id;
SELECT run_id, version, actor_id, created_at, payload_json
FROM run_snapshots WHERE run_id = ? ORDER BY version;
SELECT run_id, version, payload_json
FROM run_runtime_state WHERE run_id = ? ORDER BY version;
SELECT guidance_id, version, run_id, incident_id, worker_id, created_at, payload_json
FROM guidance_versions WHERE incident_id = ? ORDER BY guidance_id, version;
SELECT event_id, run_id, incident_id, actor_id, occurred_at, payload_json
FROM incident_audit WHERE run_id = ? ORDER BY occurred_at, event_id;
SELECT mode, run_id, request_id, actor_id, payload_json, snapshot_json
FROM request_receipts WHERE mode = ? AND request_id = ?;
SELECT run_id, worker_id, request_id, actor_id, payload_json, snapshot_json
FROM response_receipts WHERE run_id = ? AND worker_id = ? AND request_id = ?;
```

Record pre/post counts, keys and hashes for append-only history; preserve relevant sanitized content for semantic review. An audit sorting display by time does not make time the source of snapshot ordering. Distinct terminal events require separate IDs/actors/timestamps and payload meanings. Snapshot and checkpoint versions must join coherently. Real checkpoint corruption/failure injection is only against a sacrificial isolated QA DB with its untouched prior file retained; never alter the submitted source, developer DB or shared model service. The exact fault adapter and expected transaction outcome must be registered before that attempt.

## Required handoff to QA Lead / Technical Lead

| ID | Required path, command or resource | Why it is needed |
| --- | --- | --- |
| R1 | Final G3 source manifest, artifact hashes, candidate cwd, production `.next/BUILD_ID`, validated native dependency environment | Contracts alone do not identify the executable candidate; shared checkout currently has no production artifact. |
| R2 | Post-G3 free port4101 check, absolute per-attempt QA DATABASE_PATH and nonlogged explicit PIN, owner process stop/start control | Fresh DB, independent admin sessions and actual process restart without touching other work. |
| R3 | QA-owned scheduler-free adapter and its candidate-specific command; production constructor and fake Date/performance binding are now confirmed by Backend through QA Lead | Exact virtual09:00 traces and independent A/B hazard fixtures. The export/factory question is resolved; adapter implementation remains QA preparation. Public HTTP remains separately tested. No new product endpoint is requested. |
| R4 | QA replay adapter bound to final browser/native acceptance consumer, with connection generation, outer/inner fields and pre-hashed 1000 ledger | Stale/foreign/duplicate/reverse/old-stream handling cannot be proved by successful normal GET alone. |
| R5 | Deferred RAG factory fixture and coordinated UI09 actual speech overlap; separate RAG Lead model8092 measurement window | Server persistence/lineage and actual audio dedupe are different observations; no model mock can satisfy real inference evidence. |
| R6 | QA-owned read-only SQL adapter using candidate native driver; explicit fault fixture mapping | Preserve immutable first/history/receipts and attribute failure/recovery correctly without product edits. |

Backend G2 runtime evidence currently reports 94 tests in nine files in `integrated-fixed-07.log`, including preserved earlier replay/recovery failures; SSE evidence reports 23 producer tests and preserves a live stale-dev-HMR failure with fresh-process live rerun pending. These inform test selection but are not this slice's G4 results. Preserve maximum two product rework rounds and one identical environment retry. QA Lead alone registers final bindings and issues overall/whole-AC acceptance.
