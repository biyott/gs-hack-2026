# C4 deferred timing collector — source preparation v1

Status: **SOURCE_ONLY / NOT_RUN**. This derivative adds an executable collector and two deferred helper checkers to the already frozen `c4-performance-protocol-v1.md`. It does not change that protocol, its G0 thresholds, the frozen primary observer, frozen transition ledger, candidate bytes, scenarios, provider configuration, or product APIs. The collector always emits `acceptance: NOT_EVALUATED`; syntax success is not a helper, product, workload or performance PASS.

Candidate: `/home/b/.cache/gs-safety-c4.q2FD40`, `sha256:cd8a2428d3d9e44703c25b4ae135f0ed5821b6b3b3794bbca6abc1ec37197eba`, build `czkc6DgDv3UUlTrSfDMqX`. All relative source names below are in this document's directory. The separate runner freeze pins the exact bytes before authorization. A source proposal for app-origin callsites needs Technical concurrence and a separately hashed approved binding; observing the corresponding callsite/PID on the live controller remains required.

Technical static concurrence is now available at `RUN/evidence/technical/c4-app-origin-sites-binding-v1.json`, SHA256 `d834c92f30557ad72b80b09cb6dfdb402da7e8e762f3d40ce3623a145b68d89d`, status `APP_ORIGIN_SOURCE_BOUND`. Its independent18-check report has zero failures, SHA256 `206adb5f4cf3e25b720b034dd30dea1fb4b4c80e5eed137418d47d69885d0b7b`. This resolves the static source proposal only; runtime installation/stack/client proof and authorization remain separate.

## Deferred helper commands

These commands are prepared for an execution owner after a separate helper grant. They were not run during source preparation.

```sh
node /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/test-c4-dispatch-observer-v2.mjs --grant /ABSOLUTE/ISSUED-dispatch-helper-grant.json

node /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/test-c4-primary-transition-ledger-v1_1.mjs --grant /ABSOLUTE/ISSUED-ledger-helper-grant.json --freeze /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/c4-primary-transition-ledger-checker-freeze-v1_1.json
```

The dispatch grant requires `phase: QA-HELPER-CHECK`, `grantedBy: /root/qa_lead`, `syntheticOnly: true`, `applicationAllowed: false`, `modelAllowed: false`, strict UTC `notBefore`/`notAfter`, the exact candidate ID, `observerSha256`, `checkerSha256`, and an existing canonical `outputDirectory` below the candidate's QA evidence root. Its prepared 37 cases evaluate the **same v2 source bytes** with synthetic fs/process/timers and an isolated native-branded controller. They cover exactly-once forwarding, receiver/argument/result/throw preservation, malformed matching frames, closure/restoration, partial failure and stop identity. They do not load the application or establish app origin.

The ledger grant additionally requires `id`, exact `freezeSha256`, and an existing canonical `evidenceDirectory`; optional `maxDurationMs` is at most 45000. Its eight pure-HTML cases cover reversal, disappearance/reappearance, duplicate current records, original-only changes, supplement lineage, ambiguous identity, reset/pane change and phase reuse. It uses fresh contexts, blocks HTTP networking and retains the frozen observer's first qualification timestamps. Installation occurs once per context/document: repeated start/stop does not create additional MutationObservers. The checker does not prove a real application rendering result. Use its full `raw-output.json` as the timing prerequisite, not the smaller summary, because the source inputs are in the full report.

Both helper checkers remain bounded by their issued grant and their documented 45-second helper ceiling. This helper ceiling is not an application performance threshold. A failed helper stops timing readiness; it does not become a product failure by itself.

Execution-owner update during source preparation: the separately granted dispatch v2 checker passed37cases; ledger v1 failed before cases with Chromium's retained fatal `Socket path too long` diagnostic. The original checker, freeze and failed evidence remain intact. The additive v1.1 ledger checker changes only owned short temporary/profile placement and cleanup, retaining all eight cases and observer bytes. Its sole environment retry requires a new parent grant; no retry was performed by this source-preparation task.

## Resource handoff and observer launch

The collector does not launch or restart Next. The resource owner first releases the independent basic W3 work and explicitly grants the existing QA-only runtime/DB, two browser instances, synthetic bank generation/feed, read-only immutable rows, and the model policy actually configured on that runtime. Reuse the assigned QA DB; no fresh-DB-per-interval requirement exists. The ordinary public reset/select/start commands create and record new run IDs.

If the current application was launched without an observer, one coordinated restart is required before timing. The owner launches the unchanged candidate with the normal frozen launch command and external `--require` preload `c4-dispatch-observer-v2.cjs`. The observer's required environment is:

- `GS_QA_DISPATCH_OBSERVER=1`
- `GS_QA_DISPATCH_GRANT=/absolute/issued-observer-grant.json`
- `GS_QA_DISPATCH_CANDIDATE_ROOT=/home/b/.cache/gs-safety-c4.q2FD40`
- `GS_QA_DISPATCH_OUTPUT_DIR=/absolute/prepared/candidate-qa-evidence-subdirectory`

Use the launch owner's existing Node/Next process recipe; do not guess or replace its model environment. The observer grant has `phase: QA-C4-BROWSER-PERFORMANCE`, `grantedBy: /root/qa_lead`, `applicationAllowed: true`, `observerMethod: sse-controller-enqueue-v2`, candidate ID/root, observer SHA, exact `outputDirectory`, UTC bounds, and a **fresh nonexistent** normalized `stopFilePath` directly in that directory. This is an external native controller prototype observer. It does not modify candidate files, runtime settings, the bus, scenario state or public inputs.

Retain the `observer-installed` record from the actual app-origin PID. A launcher/forwarder PID is insufficient. The granted runtime receipt must independently bind that PID, `/proc/PID/stat` start ticks (field22), cwd, candidate/build, origin and database. The collector checks this receipt, the PID lifetime and the live installed record. It then observes the exact approved compiled/source callsite and matches baseline plus a fresh public command on the administrator's same native SSE request ID. Source approval alone never proves installation on the actual app controller.

Anonymous controller mapping is staggered: inventory existing controllers; open A; match the unique new app-origin controller; issue ordinary `speed:1` with a fresh expected version/request ID; require its exact stream/mode/sequence/run/version/frame hash on that controller and A's browser request. Repeat with B using a new inventory, then require a shared public proof on both. Both modes are publicly paused during setup. Default equipment stream activity during fire-gas login is retained as setup evidence and cannot serve as the fire-gas mapping. An extra target-mode stream, closure or reconnect makes the mapping incomplete; no timing-based or earliest-controller guess is used.

The preload records pre-enqueue UTC/monotonic, post-return/error, IDs, full-frame hash, callsite, prefix/preparation/tail costs, and buffer failures. It calls the original native method once with the original receiver/arguments. Full decoding/hashing happens after the original call where practical. The endpoint is application `controller.enqueue`, not socket/network flush. Parsing, buffers, writes, browser probes and collector overhead remain in the workload; no subtraction or finite-overhead claim is made.

## Deferred collector command and grant contract

```sh
node /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/run-c4-performance-v1.mjs --grant /ABSOLUTE/ISSUED-timing-grant.json --freeze /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/c4-performance-runner-freeze-v1.json --origin-binding /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/technical/c4-app-origin-sites-binding-v1.json
```

`/ABSOLUTE/...` paths denote future issued artifacts, not existing grants. Required timing-grant fields:

| Field | Required binding |
| --- | --- |
| `id`, `phase`, `grantedBy` | Nonempty ID; `QA-C4-BROWSER-PERFORMANCE`; `/root/qa_lead` |
| `candidateId`, `candidateRoot` | Exact C4 values above |
| `applicationAllowed`, `syntheticOnly`, `fixtureGenerationAllowed`, `databaseReadAllowed`, `exclusiveEventClients`, `qaDatabaseOnly` | All explicitly `true` |
| `notBefore`, `notAfter`, `teardownReserveMs` | Current UTC interval and an explicitly assigned positive cleanup reserve; collection ends before the full grant by this reserve |
| `freezeSha256`, `originBindingSha256` | Exact frozen source inventory and approved origin binding hashes |
| `baseUrl`, `serverPid`, `databasePath`, `outputDirectory` | Assigned local origin, actual app PID, canonical existing QA DB and prepared candidate evidence directory |
| `runtimeBindingPath`, `runtimeBindingSha256` | Independently captured runtime receipt, not a self-declared process guess |
| `observerLogPath` | Exact live installed v2 log; preload deadline contains the collector's entire grant |
| `credentialsPath` | Canonical existing private file, no group/other permission bits; never copied into evidence |
| `modes`, `maxIntervalsPerMode` | Exactly `["equipment","fire-gas"]`; integer1..3 |
| `browserOptions` | Two explicit Playwright Chromium launch options with `headless` boolean and frozen `executablePath`; viewport1440×900/locale ko-KR are recorded |
| `helperReports` | Exactly one dispatch and one ledger full report: `{path,sha256}`, each PASS with exact checker/observer source bindings and `productAcceptance: NOT_RUN` |
| `modelAllowed`, `modelPolicy` | Boolean permission plus exact existing runtime policy object described below; this collector never reconfigures it |

The runtime receipt contains `candidateId`, `buildId`, `serverPid`, `processStartTicks`, `databasePath`, `baseUrl`, `qaDatabaseOnly:true`, `modelEnabled` and `modelPolicy`. `modelPolicy` is an explicit credential-free object with exactly `enabled`, `provider`, `model`, `configurationSha256`; the latter hashes the retained nonsecret configuration receipt. Mirror the same object in the timing grant. If enabled, `modelAllowed` must be true. Actual model coverage still requires retained provider/model-call traces; permission and configuration do not prove calls occurred.

The private credential file shape is `{ "administrators": [{ "actorId": "admin", "pin": "PRIVATE", "workerId": "WORKER-A" }, { "actorId": "admin-2", "pin": "PRIVATE", "workerId": "WORKER-B" }] }`. The literal `PRIVATE` is not a credential. The execution owner supplies the already authorized QA code privately. The app's ordinary login issues sessions. Tokens stay in memory, never in recorded request headers, copied payloads or error text. Any alternative actor IDs must actually exist as distinct administrators in the assigned QA DB.

## Concrete collection sequence

1. Verify grant, freeze, helper reports, candidate/component/browser inputs, live PID/observer, assigned DB and approved callsite binding before importing application-dependent packages. Local QA modules only define functions before this gate.
2. Register the frozen candidate's existing `tsx` loader temporarily and generate the 100 named JPEG fixtures with existing `createTrackingFixture`, then unregister it. No package installation or candidate copy occurs. Record fixture source hashes, geometry, dimensions, JPEG signatures/hash and compute boundaries. A currently executing Sharp call may finish after abort; checks prevent starting another frame or writing it after the grant ends, and retain that limitation.
3. Open two separate administrator browser instances through public controls, select the mode and 2D view, bind their own native SSE streams as above. Record actual environment/foreground state. A headless run is identified as such and does not prove a physical display. Read-only `/api/clock` probes bind browser/server and generator/server clocks with observed uncertainty; HTTP Date, same-host assumptions, snapshot generation times and CDP receipt timestamps are not dispatch.
4. Set the separately named synthetic calibration via the public calibration endpoint. Feed every bank index once at scheduled100ms slots in a separately logged10-second preflight. Require all100 distinct frames, IDs0,1,2,3,10,11,12, and all three valid entity observations in actual responses; retain independent immutable database joins and any rejection. A failed bank does not proceed to timed measurement or silently regenerate/retry.
5. For each mode, run30seconds warmup with public cycle offsets0/18seconds, then a full180second measured window with offsets0,18,36,54,72,90,108,126,144,162. Every cycle fetches the current version before each ordinary `select(seed20260921)`, `position-input(measured)`, `speed(1)`, `start`. Equipment uses EQ-NO-ROUTE; fire-gas uses FG-ROUTE-BLOCK. No `advance`, synthetic clock, extended scenario or injection hook exists. Late/missed slots and conflicts are retained.
6. A continuous independent100ms sender supplies the pre-generated three-marker frames, including public cycle resets and warmup/measurement handoff. It uses fresh stream/frame/sequence IDs, conservative measured capture-clock bounds, actual current run IDs and no catch-up burst. Generator clock probes refresh alongside every18-second cycle. Accept/busy/transport-uncertain/missed input, timer jitter and all three entity outcomes remain explicit. A scheduler timer is never accepted input rate.
7. The unchanged frozen observer qualifies actual current primary text at rAF. The additive ledger records every callback-visible identity transition, including disappear/revert. Ordinary pane selection/scrolling is logged within timing. A fresh pre-measure baseline scan and screenshot bind the mapped worker's known current readable primary. The measurement itself retains all frames across reset, completed/paused state, rerender, scroll and slow/model work. Supplemental raw rAF also spans phase RPC handoffs; it supplies no primary qualification and does not replace the frozen observer.
8. Both page clocks are bracketed by actual clock probes; actual window starts/stops are retained separately. The shared stop is180seconds after the later start-return anchor, so neither administrator is shortened; small extra duration is reported rather than cut. Terminal guidance DB reads occur immediately after the observer stops, before public pause. The source boundary is not atomic with the browser; later versions remain explicit boundary uncertainty, never discarded by generatedAt.
9. Read all immutable guidance versions and run snapshots for the recorded run universe, subtract the explicitly retained baseline keys, and retain every generated primary including skipped/coalesced/missing versions. Join full run/incident/worker/guidance/version/primary lineage, stream/mode/sequence, actual controller/client request ID and text/wire hashes. Supplements/repeats/baselines do not fill the quota. Separately drain sent inputs, then read immutable measurement rows for their run IDs to resolve late commits. Record rates and jitter with clock-domain and UTC-bucket uncertainty.
10. Retain all intervals. Repeat a full interval only while either administrator remains below20 valid observed primary joins, at most3 per mode. Counts are per administrator/mode; there is no pooled quota or missing-version survivor filter. Actual route/hazard evidence is audited separately from completed commands. Write raw data, analyses and source counts before closure. Only QA may evaluate G0 against the complete results.

## Graceful closure and evidence limits

The collector stops its own browser work at the granted collection boundary, leaving the explicitly granted cleanup reserve. It closes its owned browsers, publicly pauses both modes where still authorized, and atomically publishes the observer stop request using a fsynced temporary file plus a no-replace hard link in the exact granted directory. The request binds kind, candidate, PID, observer hash and installed log ID. It does not signal or terminate the application.

Chromium temporary/profile files use one newly created private `/tmp/gs-c4-run-*` root, not the long evidence path. The path is recorded, the process's prior `TMPDIR` is restored, and only that owned directory is removed after browser closure. Unconfirmed closure retains the directory and marks cleanup incomplete. Artifact files remain in the assigned evidence directory. This is an environment accommodation for the observed Unix socket-path failure, not a change to viewport, rendering flags, observation expectations or acceptance thresholds.

The v2 observer restores only its own prototype wrapper, removes its timer/listener, drains pending metadata, fsyncs/closes the log once, and writes `${logFile}.closed.json`. The collector requires identity, zero drop/parse/observer/write/invalid-request counters, `restorationStatus: restored`, and independent full-log hash equality. Temporary partial receipt reads are retained and retried only within the existing grant. The receipt itself is not fsynced; absent receipt or failed rehash means incomplete. A changed wrapper is left untouched and cannot receive a completeness claim. Deadline/forced termination cannot be treated as a successful flush.

The raw event logger is buffered; its I/O remains workload overhead. The resource sampler records Linux CPU ticks/RSS and process identity without assuming CLK_TCK. Incomplete intervals, clock/source ambiguity, insufficient primary quota, missed cycles, unexpected stream changes and cleanup failures are retained. Even a zero-exit collector means only `COLLECTED_REVIEW_REQUIRED`; it is not G0 PASS.

Minimum measured occupancy remains7minutes, maximum21minutes, plus bank generation/preflight, setup, source/controller/clock proof and teardown. No fixed setup wait or per-interval restart was added. Readiness still requires both helper runs, approved runtime/origin artifacts, explicit timing resources and actual browser/input/provider observations. This source preparation establishes none of those observations and establishes no four-physical-role coverage.
