# C4 W1 independent ordering slice

Fresh execution under grant `W1-C4-01`, attempt `ordering-01`, by `/root/qa_lead/qa_server/ordering_execution`. Candidate `cd8a2428d3d9e44703c25b4ae135f0ed5821b6b3b3794bbca6abc1ec37197eba`, source `e17322b2faf5b5181f6a50bcd5cd4baeae2ca31f57f7bfd1653399b4e9e28efa`, build `czkc6DgDv3UUlTrSfDMqX`, manifest SHA256 `a4ae231987936e6a91cc05ff380eb71a69597c7e689e315dd6e21e7222d0b53d`. Read-only candidate root `/home/b/.cache/gs-safety-c4.q2FD40`; Node v22.23.2.

All requested pure-consumer subcases matched their unchanged acceptance checks: original **1,000/1,000**, focused **24/24**, and logical alert/route **10/10**. Each runner executed against the actual C4 imports once and exited 0. There were no test retries, fixture edits, clock overrides, oracle changes or product edits. These are bounded subcase results, not a whole-AC or overall product verdict.

| Slice | PID | Runner UTC on 2026-09-21 | Outcome |
| --- | --- | --- | --- |
| Original ten labels × 100 | 955229 | 17:19:54.296–17:19:54.705 | 1,000 PASS, 0 FAIL |
| Focused ordering/expiry/lineage | 955263 | 17:19:55.046–17:19:55.313 | 24 PASS, 0 FAIL |
| Logical alerts/routes | 955283 | 17:19:55.636–17:19:55.898 | 10 normative PASS, 0 diagnostic mismatches |

Process launch and exit times, which include module loading, are also preserved separately: base `17:19:53.925–17:19:54.744Z`, focused `17:19:54.745–17:19:55.334Z`, alerts `17:19:55.334–17:19:55.920Z`. Process receipts retain the actual argv, environment binding, supervisor PID and exit status.

## Inputs, assertions and observed behavior

The immutable original ledger was read from its C1 path without copying or regeneration. All ten labels remain at 100 cases each, with 50 per mode: current-valid-forward, exact-duplicate, reverse-version, expired, wrong-run, wrong-worker, wrong-map-id, wrong-map-version, old-snapshot-after-reconnect and delayed-pre-reset. Each injected case receives an independent uncounted baseline control.

The original input hashes matched before and after execution:

- Original 1,000: `4f86a9a6bf723a2cdc83f4ab9c593388086d7675ddaa17550f39dfb98a0fa772`.
- Focused 24: `c9f936cd19a820c96f95530ad4ba7f78bff529b891e3b688691d4d20761a313c`.
- Logical alert/route 10: `d33531206dce8af92d2b3c6d92d6eb9b8a7498abeaf5614a485fc4b36c04e4b7`.

All 100 reverse-version cases accept the legitimate forward outer publication and quarantine the older inner guidance. Their worker projection is null. This satisfies the existing rejection oracle permitting null OR exact baseline; `samePrimary:null` remains unconstrained. The C1 reverse-version discrepancy was not reproduced.

All six wrong-run/map-ID/map-version alert cases (indices 5, 7, 8, 15, 17, 18 across both modes) produce zero new announcements, null worker guidance and empty visible routes after the store accepts the forward outer publication. The four valid/duplicate controls also pass. Positive controls record the actual generic logical message `현장 위험 안내. 1명에게 현재 행동 안내를 전송했습니다. 작업자 대응을 확인하세요.` No physical speech was invoked or observed.

The raw null/empty-route comparisons remain diagnostic assertions, separate from normative checks. The normative invalid-guidance outcome permits null or exact still-valid baseline retention, requires zero new announcements, and rejects invalid route/identity projections. Zero diagnostic mismatches occurred, so the retention option does not affect this result.

The 24 focused probes retain the original expected outcomes for unowned HTTP before owned SSE baseline, sequence equality/reversal, stream ownership, retired connections, legitimate new runs, per-mode watermarks, malformed wire ordering, expiry boundaries, paused expiry, floor/profile/incident filtering, supplement lineage, response-version binding and logical announcement deduplication. These invoke actual candidate pure exports; no producer PASS/test output was substituted.

## Preflight, clock and integrity

The parent explicitly confirmed the complete shared strict C4 typecheck exited 0 before candidate imports. Every runner used direct Node `--import` with C4's own `node_modules/tsx/dist/loader.mjs`, the generated C4 `TSX_TSCONFIG_PATH`, and receipt-matched candidate/evidence paths. All tests used first-attempt `ordering-01`.

One initial QA-only provenance comparison exited 1 before any candidate import or test: the manifest stores `sha256:cd8a2428…`, while the receipt stores the same bare 64-digit hash. The original `imports-before.json` preserves `identityMatches:false` and zero file mismatches. The additive `imports-before-validated.json` records removal of only the optional `sha256:` prefix and exact equality of the full hash. The parent and lead confirmed this permitted representation normalization. Source SHA, manifest bytes, BUILD_ID, selected sources and frozen inputs matched throughout. This was a pre-import metadata-format correction, not product drift or a test execution failure. No same-adapter retry history was exhausted; no candidate test was retried.

The unchanged explicit fixture clock is `2026-09-21T13:19:30.934Z`, distinct from actual execution UTC. Pure guidance/alert/route APIs receive this clock. Store `lastReceivedAt` uses wall time only as metadata. There was no global clock override or expiry rewrite. Pure expiry results do not establish live UI/audio timing.

Selected integrity observations occurred at `17:18:40.060Z` (original preflight), `17:19:34.669Z` (validated preflight) and `17:20:22.353Z` (after execution). Ten relevant product source files and all three immutable inputs matched. Ordering harness code, binding receipt and tsconfig also remained unchanged. The parent owns the full candidate/source/build integrity check across W1; these selected hashes do not replace it.

## Evidence

All artifacts below are under this run's `evidence/qa/server/candidate-cd8a2428/ordering-01/`:

- `ordering-base-results.json`: all 1,000 inputs/expectations/projections/counts; SHA256 `b1585bad70794c8ea3d775b0854eeaaa7963fa0b2dddf420266f5e203566b39c`.
- `ordering-focused-results.json`: all 24 expected/actual probes; SHA256 `df8b4149ddca096004309692701e5c93cd0a65d4120e2c7b14af87cc5392364c`.
- `ordering-alert-results.json`: all ten logical announcements, raw accepted guidance, worker/routes, normative checks and diagnostics; SHA256 `339bb6057807043688fa1306d71c6665c463221ac3487b6ddf386927554f0ee5`.
- `base-initial.log`, `focused-initial.log`, `alerts-initial.log` and corresponding `*-process.json`: original execution output and PID/start/end/argv/exit receipts.
- `imports-before.json`, `imports-before-validated.json`, `preflight-format-observation.md`, `imports-after.json`: preserved format comparison and integrity evidence.
- `summary.json`, `artifact-manifest.json`: compact joined counts, six invalid-alert observations and artifact hashes.
- `read-only-review.md`: independent read-only review found no actionable discrepancy in scope, preserved inputs, assertions, counts or provenance.

Actual rendering, browser EventSource scheduling, physical speech/vibration, devices, server response validation, database persistence, model behavior and route geometry safety were **NOT_RUN** in this slice. `visibleRoutes` establishes current projection filtering only. No app, model, DB, browser or device operation was initiated. Prior candidate evidence and original fixture/oracle bytes remain preserved. QA Lead retains final acceptance authority.
