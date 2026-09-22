# C2 W1 independent ordering slice

Grant W1-C2-01. Executor `/root/qa_lead/qa_server/ordering_execution`. Candidate `0d42bacc04c50cd21c9c133e262838acb6f47e2e8d33d37ea450ce160f46bc3e`, source `0f50d5d6cc16ca78718e88adc88669b3420ffef416b58d4c1d20d63ab9a35f77`, build `QZCOSOj4hgBWlUIGbGUxu`; read-only root `/home/b/.cache/gs-safety-qd001.7e7jy5oy`. Node22.23.2.

**All requested pure-consumer cases matched their acceptance checks:** original1000/1000, focused24/24, and logical-alert/route10/10. This is a bounded subcase result, not a whole-AC or overall product verdict. One alert launcher failure and its single environment retry remain preserved.

| Slice | Actual UTC execution,2026-09-21 | Outcome |
| --- | --- | --- |
| Original10 labels×100 |15:04:41.771–15:04:42.171|1000PASS,0FAIL; every class100PASS |
| Focused handshake/expiry/supplement |15:05:14.306–15:05:14.584|24PASS,0FAIL |
| Logical alerts and route projections |15:06:31.379–15:06:31.660|10PASS,0normative failures,0raw diagnostic mismatches |

The unchanged original input ledger SHA is `4f86a9a6bf723a2cdc83f4ab9c593388086d7675ddaa17550f39dfb98a0fa772`. The24focused input SHA remains `c9f936cd19a820c96f95530ad4ba7f78bff529b891e3b688691d4d20761a313c`;10alert input SHA remains `d33531206dce8af92d2b3c6d92d6eb9b8a7498abeaf5614a485fc4b36c04e4b7`. No original inputs, class counts, C1 artifacts, preparation templates or product files changed.

## Observed C1 regression retests

For all100 reverse-version inputs, the actual C2 store accepts the legitimate newer outer publication but quarantines the older inner guidance. The current worker-guidance projection is null in all100. This satisfies the frozen `reject-invalid` null OR exact-baseline oracle; `samePrimary:null` remains unconstrained. The C1 behavior where primary/guidance/route2 became current over3 was not reproduced in this workload.

For all six wrong-run/map-ID/map-version alert cases—indices5,7,8,15,17,18—the real AlertLedger produces zero new announcements, worker-guidance projection is null, and `visibleRoutes` returns an empty array. The four valid/duplicate controls also meet their original expectations. The C1 logical-announcement discrepancy was not reproduced. These observations come from product exports and the actual store after snapshot admission, not from a QA prefilter or producer test verdict.

The original null/empty-route comparisons are retained as diagnostics in the10probe results; independent normative checks implement the lead-authorized null OR still-valid exact-baseline option, zero new invalid-guidance announcements, and no invalid route projection. In this execution all raw diagnostics matched, so no baseline-retention interpretation affects the result.

## Clock and environment

The immutable pure fixture time remains2026-09-21T13:19:30.934Z, distinct from actual execution UTC. Product pure projection APIs receive that explicit time. The C2 store's guidance high-water logic does not read wall time; its `lastReceivedAt` wall timestamp is observational metadata. No global clock override or expiry-field rewrite occurred. These are deterministic pure-consumer expiry tests, not live UI/audio timing evidence.

Parent's existing `typecheck-bindings-02.log` had no diagnostics before execution; no TypeScript changes were made during this run. Base and focused scopes executed through the candidate's existing tsx CLI and generated shared tsconfig. The parallel alert CLI failed before loading the QA runner with `EADDRINUSE` in `createIpcServer`, referring to its owned TMPDIR socket. The exact lower-level socket collision cause is not asserted.

The initial failure is preserved at `ordering-01/alerts-initial.log`. Exactly one alert-only environment retry used Node `--import` the same candidate's tsx loader, the same generated tsconfig through `TSX_TSCONFIG_PATH`, and fresh attempt `ordering-02`. This avoids the optional CLI IPC server; the retry completed. Candidate, inputs, expected results, grant and clock binding remained identical. Base1000 and focused24 were not rerun. No further retries occurred.

## Evidence and integrity

Evidence paths below are relative to this goal run's `evidence/qa/server/candidate-0d42bacc/`:

- `ordering-01/ordering-base-results.json`: all1000 expectations, accepted projections, input hashes and per-class totals.
- `ordering-01/ordering-focused-results.json`: all24 expected/actual results.
- `ordering-02/ordering-alert-results.json`: all10 logical announcements, accepted raw guidance, route/worker projections, diagnostics and normative checks.
- `ordering-01/base-initial.log`, `focused-initial.log`, `alerts-initial.log`; `ordering-02/alerts-loader-retry.log`: complete invocation output, including original startup failure.
- `ordering-02/environment-adjustment.md`: preserved reason and bounds of the single retry.
- `ordering-01/imports-before.json`, `ordering-02/imports-after.json`: ten directly relevant candidate source imports and all three immutable inputs matched expected hashes before/after. The parent owns full candidate/source/build integrity across the W1 window; this report does not substitute selected hashes for that full check.
- `ordering-02/summary.json`: compact joined counts and six negative-alert projections.

The raw result files carry receipt-bound candidate identity and attempt metadata. The binding receipt remains unchanged; the explicit execution grant was supplied as requested. Outputs are exclusively created within each owned attempt.

Actual rendering, browser EventSource callback scheduling, speech, vibration, physical devices, server response validation, database persistence, model behavior and route geometry were **NOT_RUN** here. `visibleRoutes` verifies identity/expiry projection, not graph safety or rendered pixels. No app, DB, model or network operation was initiated. The optional tsx CLI IPC startup is an execution-environment issue, not a product server run. QA Lead retains final acceptance authority.
