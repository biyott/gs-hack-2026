# C3 W1 independent ordering slice

Grant `W1-C3-01`; attempt `ordering-01`; executor `/root/qa_lead/qa_server/ordering_execution`. Candidate `1a7c95cd1a15df738492a368d36cc6cb98985ec1c2618b10e807c82076b247c4`, source `10f658c44bc4bd511302900e02b467058b6dc558b767f2acc4b2c49773d5f6ab`, build `BLy4PJy6kc0sEf4JQFnE0`, manifest SHA256 `8d9b031f68374ea939dcdebb570e76aeba4b09d1154165cab53d186e7d27c4bc`. Read-only candidate root `/home/b/.cache/gs-safety-c3.eulo4t9w`; Node v22.23.2.

All requested pure-consumer subcases matched their acceptance checks on the first attempt: original 1,000/1,000, focused 24/24, and logical alert/route 10/10. All three processes exited 0. No retries, clock override, fixture edits, oracle changes or product edits occurred. This report does not issue a whole-AC or overall product verdict.

| Slice | Actual UTC execution on 2026-09-21 | Outcome |
| --- | --- | --- |
| Original ten labels × 100 | 15:52:46.707–15:52:47.110 | 1,000 PASS, 0 FAIL; each label 100 PASS |
| Focused handshake, expiry and supplement | 15:52:47.707–15:52:47.969 | 24 PASS, 0 FAIL |
| Logical alerts and route projections | 15:52:48.571–15:52:48.826 | 10 normative PASS, 0 diagnostic mismatches |

## Frozen inputs and observations

The original input ledger remains at the immutable C1 path and was read without regeneration. Its SHA256 is `4f86a9a6bf723a2cdc83f4ab9c593388086d7675ddaa17550f39dfb98a0fa772`. The focused input SHA256 is `c9f936cd19a820c96f95530ad4ba7f78bff529b891e3b688691d4d20761a313c`; the alert input SHA256 is `d33531206dce8af92d2b3c6d92d6eb9b8a7498abeaf5614a485fc4b36c04e4b7`. These hashes matched before and after execution.

All ten original labels are preserved: current-valid-forward, exact-duplicate, reverse-version, expired, wrong-run, wrong-worker, wrong-map-id, wrong-map-version, old-snapshot-after-reconnect and delayed-pre-reset. Each has 100 cases, with 50 per simulation mode. Each injected case receives its own uncounted baseline control.

For all 100 reverse-version inputs, the store accepts the legitimate forward outer publication and quarantines the older inner guidance. The worker projection is null in all 100. This satisfies the frozen rejection oracle permitting null OR exact baseline; `samePrimary:null` remains unconstrained. The C1 regression where version 2 became current over version 3 was not reproduced in this workload.

The six invalid logical-alert cases (indices 5, 7, 8, 15, 17, 18: wrong run, map ID and map version across both modes) produce zero new announcements, null worker guidance and empty visible routes after the actual store accepts the forward outer publication. The four valid/duplicate controls also pass. Positive controls record the actual generic message `현장 위험 안내. 1명에게 현재 행동 안내를 전송했습니다. 작업자 대응을 확인하세요.` as a logical object only; no physical speech occurred.

Raw null/empty-route expectations remain separate diagnostic assertions. Normative checks allow null or exact still-valid baseline retention, require zero new announcements from invalid envelopes, and reject invalid projected routes or identities. All raw diagnostics also matched in this run, so the retained-baseline option does not affect the result.

The 24 focused checks cover unowned HTTP before owned SSE baseline, equal/reverse sequence handling, stream ownership, retired connections, legitimate new runs, independent mode watermarks, malformed wire order, expiry boundaries, paused expiry, floor/profile/incident filtering, supplement lineage, response-version binding and logical alert deduplication. These are actual product-export checks rather than producer test verdicts.

## Runtime and integrity

The parent confirmed strict shared C3 typechecking exited 0 before any candidate imports. Every runner used `/home/b/.local/bin/node --import /home/b/.cache/gs-safety-c3.eulo4t9w/node_modules/tsx/dist/loader.mjs`, the generated C3 tsconfig through `TSX_TSCONFIG_PATH`, and receipt-matched candidate/evidence environment values. Exact invocation fields are preserved in `invocation.json`.

The immutable fixture clock remains `2026-09-21T13:19:30.934Z`, distinct from actual execution UTC. Pure projection APIs receive it explicitly. Store `lastReceivedAt` uses wall time only as metadata. No global clock change or expiry-field rewrite was needed. Deterministic pure expiry checks do not establish live UI/audio timing.

Selected before/after provenance was recorded at `15:50:26.228Z` and `15:53:32.989Z`: ten directly relevant candidate source files, three immutable inputs, manifest identity and BUILD_ID matched with zero mismatches. The parent owns full candidate/source/build integrity across W1; selected hashes do not replace that check. A separate read-only evidence review by `/root/qa_lead/qa_server/ordering_execution/oracle_review` found no actionable discrepancy in counts, assertions, input bindings or scope.

## Evidence

All evidence below is under this run's `evidence/qa/server/candidate-1a7c95cd/ordering-01/`:

- `ordering-base-results.json`: all 1,000 original expectations, input hashes, actual projections and class totals; SHA256 `bd82964b293ef13d990550e1a28faf93b979917c47fce9cd3018133fc291d38f`.
- `ordering-focused-results.json`: all 24 expected/actual probes; SHA256 `e70600bdec00283a3c4ef2f51c3da537181403dd46cc5062cf4bc15eb278d60c`.
- `ordering-alert-results.json`: all ten logical announcements, accepted raw guidance, worker/routes, diagnostics and normative checks; SHA256 `8908142f8d10c5eb03720fb6290b603f171ba1ffd54884556ebccd16191c2746`.
- `base-initial.log`, `focused-initial.log`, `alerts-initial.log`: initial invocation output; all exits 0.
- `imports-before.json`, `imports-after.json`: selected provenance checks.
- `summary.json`, `invocation.json`, `artifact-manifest.json`: compact counts, six invalid-alert observations, exact execution binding and output hashes.

Actual rendering, browser EventSource callback scheduling, speech, vibration, physical devices, server response validation, database persistence, model behavior and route geometry safety were **NOT_RUN**. `visibleRoutes` establishes current projection filtering only. No app, model, DB, browser or device operation was initiated. C1 and C2 artifacts remain preserved; QA Lead retains final acceptance authority.
