# C4 surface evidence adapter v1 — source preparation

This is a QA-owned adapter for the unchanged historical `surface.scenario.v1.json`: 31 states at five viewports (155 states), with 66 target invocations per viewport (330 total). Frozen candidate identity is `sha256:cd8a2428d3d9e44703c25b4ae135f0ed5821b6b3b3794bbca6abc1ec37197eba`, root `/home/b/.cache/gs-safety-c4.q2FD40`, BUILD_ID `czkc6DgDv3UUlTrSfDMqX`. The old scenario's historical source note remains unedited; the adapter's canonical C4 binding and grant determine the actual served candidate. No product file, historical helper, report, or scenario is changed.

Preparation status: source written and syntax checked only. The continuation fixtures and C4 surface adapter have not been executed by this preparation task. The separately granted radius v1.1 check is independent evidence, not a continuation-check or application PASS. Source hashes are in `continuation.freeze.json` and `adapter.freeze.json`.

## Modules and preserved behavior

- `run.mjs`: bounded adaptation of frozen `tests/frontend/run-surface.mjs`; same viewport/route/state order, setup action phases, incremental state actions, image settling, screenshot settings, original observations, event checks, and source fingerprints. It predeclares all 155 states and records missing targets after an interrupted run.
- `events.mjs`: exact frozen event-listener logic, extracted without changing expected HTTP/console/request rules or occurrence limits.
- `guard.mjs`: explicit C4 binding, source-input hashes, BUILD_ID/manifest checks, fresh private DB/process provenance, process PID/start-time/cwd and DB/PIN binding, separate continuation-check receipt, timed grant, synthetic-only metadata guards, fresh output, and fresh browser contexts.
- `focus-evidence.mjs`: native scrolling and geometry checks copied from the frozen traversal, using the separately frozen radius v1.1 observer. Its `captureFocusTargets(page, selectors, {writeObservation, captureViewport})` attempts each target independently. `walkFocusForEvidence` returns geometry, strict projection, and radius results separately. It does not execute the original strict walker and records that fact explicitly.
- `check-focus-continuation.mjs`: five inline HTML fixtures, seven selector results, fresh offline contexts; only a separately authorized helper check may launch it.

The adapter deliberately continues collecting native viewport evidence after raw/effective visibility failure. Root-origin policy, nearest native scroll owner, 1px geometry tolerance, eight movement attempts, 100-frame limit, size stability, no gap/stall, overlap, horizontal completeness, and post-capture geometry equality remain unchanged. Geometry completion is only evidence collection. It cannot repair failed or unsupported visibility.

Route setup or action errors are retained. Every declared target is still attempted for diagnostics; those images do not establish the intended semantic state. A preceding action error also invalidates later state reconstruction. If an entire execution is interrupted, untouched states/targets remain explicitly missing instead of being counted as executed.

## Evidence and decisions

`focus-observations.jsonl` is appended and `fsync`ed before each screenshot and before geometry checks. Each returned observation retains its original `visible`, raw nine samples, strict usability verdict/error, actual four computed corner-shape strings, radii, normalized contour decisions, unsupported reasons, target/clip geometry, scroll offsets, and timestamp. Each native frame gets a viewport PNG, original page observations, event snapshot, and frame JSON. Failure handling attempts its own separately named PNG. Subsequent targets continue after that failure.

If the observer itself throws before returning (for example an unsupported transformed clipping ancestor or interior fixed/sticky occluder), no new geometry/raw samples exist. The failure record labels any attached geometry as the last successfully returned observation, or null; the failure PNG is diagnostic only. This adapter does not claim to reconstruct missing evaluator telemetry. Screenshot/sink errors are retained and cannot become supported coverage.

Frame JSON uses an explicit two-phase status: `PENDING`, then `RECORDED` or `FAILED`. An interrupted pending record is incomplete evidence. The durable JSONL is written before PNG capture; the PNG receipt is appended afterward. A PNG that cannot be saved or verified does not count as a successful screenshot. A full-page companion is requested only for the historical non-focused states, never as a substitute for focused viewport traversal.

Each target keeps `traversal.complete`, `strict.complete`, and `radius.complete` independently. Raw misses remain raw misses even when the radius helper proves an empty cutout. An actual foreign raw hit or a proven meaningful corner occupant remains `VISIBILITY_FAILURE`, including a foreign hit accompanied by global paint uncertainty. Unsupported paint with no definite rejection stays `INCONCLUSIVE`; it never becomes radius-supported coverage. Complete supported geometry still requires stored-image review.

Global foreign generated paint is intentionally still uncertain. Frozen `.site-legend > span::before` and `.timeline-entry::before` can therefore make real application targets inconclusive even when their nine samples hit. The helper's `radiusAware.visible` can remain true in such an all-hit observation while `unsupported` is nonempty; the adapter preserves both and keeps `radius.complete=false`. No claim is made that this helper can approve all 155 application states.

Top-level `captureMatrixComplete` requires all 155 state records, all 330 target results, at least one PNG per state, and complete geometric traversal per target. `originalStrictCoverageComplete` and `radiusCoverageComplete` add their respective checks and valid state reconstruction. `operationalHealth: PASS` describes only harness/page checks. Final `verdict` is `INCOMPLETE_OR_FAILED`, `VISIBILITY_FAILURE`, `INCONCLUSIVE`, or `REVIEW_REQUIRED`, never product PASS. `productAcceptance` remains `NOT_RUN`.

## Source-only check

These commands parse source and do not execute the harness:

```bash
node --check /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/c4-surface-adapter-v1/run.mjs
node --check /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/c4-surface-adapter-v1/guard.mjs
node --check /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/c4-surface-adapter-v1/events.mjs
node --check /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/c4-surface-adapter-v1/focus-evidence.mjs
node --check /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/c4-surface-adapter-v1/check-focus-continuation.mjs
```

## Separate synthetic helper grant and command

The new grant file is owned by the QA lead, not supplied by this preparation. It must contain `phase: C4-FOCUS-CONTINUATION-CHECK`, `grantedBy: /root/qa_lead`, nonempty `id`, `resourceReleased: true`, `syntheticHtmlOnly: true`, `applicationAccess: false`, `maxAttempts: 1`, `notBefore`, `notAfter`, the exact `continuation.freeze.json` SHA as `freezeSha256`, and `outputRoot` equal to `/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/ui-device/c4-focus-continuation-check`. The checker claims an exclusive permanent `single-attempt.json`; no automatic retries are allowed.

Only after that separate grant exists, this is the proposed exact command (the grant path is reserved for the lead's future file):

```bash
timeout --signal=TERM --kill-after=3s 85s node /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/c4-surface-adapter-v1/check-focus-continuation.mjs --freeze /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/c4-surface-adapter-v1/continuation.freeze.json --grant /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/c4-surface-adapter-v1/continuation.grant.json
```

Estimated helper duration is 15–35 seconds, unmeasured; internal cutoff 75 seconds, external TERM at 85 seconds and KILL after 3 seconds. All requests are blocked and recorded. No application/provider/server/device is accessed. Fixtures cover tall foreign overlay plus global paint uncertainty, missing/hidden then a later independent target, all-hit square plus unsupported pseudo paint, a pointer-none meaningful rounded-corner control, and a clean tall nested square. The last two retain the distinct radius20 raw-corner miss and radius0 all-hit expectations. The overlay shares the positioned scroll owner's content coordinates with the target; its initial 10×10 box contains the first raw sample after the owner scroll.

## Later C4 application binding

The lead must separately prepare and release the owned C4 process/DB/fixtures and issue a new `SURFACE-BROWSER` grant after the continuation check succeeds. This adapter never starts a server or prepares/mutates simulation fixtures. Do not use the helper's 90-second budget for the full application matrix; full-matrix runtime is unmeasured and needs its own interval.

The future command shape is `node <this-directory>/run.mjs --freeze <this-directory>/adapter.freeze.json --grant <C4-evidence-root>/<new-surface-grant.json> --process <C4-evidence-root>/<fresh-process-receipt.json>`. Keep stdout/stderr in a new parent-owned run log so even static/preflight rejection remains evidence. No command without all three exact files is supported.

The process/provenance schema matches `c4-asset-interactions-v1.mjs`: process `grant`, `stage`, `candidateId`, `sourceSha256`, `buildId`, `pid`, `startTimeTicks`, `startedAt`, `baseUrl`, private `databasePath`/`credentialsPath`, `freshDatabase:true`, `actualCameraInput:false`, and `realPhoneSessionsIssued:0`; adjacent private `admin-session.json` supplies the existing read-only metadata token. The grant pins process/provenance/binding/freeze bytes; no secret/token is serialized. DB creation and process start must fall within the parent grant, before provenance and subwindow issuance. `/proc` confirms start-time/cwd and actual DB/PIN environment binding.

The grant requires:

- `id` matching `W3A-C4-SURFACE-[A-Za-z0-9-]+`, `parentGrant` matching `W3A-C4-[A-Za-z0-9-]+`, `phase:SURFACE-BROWSER`, `grantedBy:/root/qa_lead/qa_ui_device`.
- Exact C4 `candidateId`, `sourceSha256`, `buildId`, `serverPid`, `baseUrl:http://127.0.0.1:4103`; `parentGrantedAt <= grantedAt <= validFrom < expiresAt`.
- `syntheticOnly`, `retainedRealFramesAbsent`, `realSendersExcluded`, `exclusiveBrowser`, `noConcurrentBlenderOrPerformance`, `fullHistoricalMatrix`, all true; `maxAttempts:1`.
- `bindingSha256`, `freezeSha256`, `processPath`, `processSha256`, `provenancePath`, `provenanceSha256`; successful separate `continuationReportPath` and `continuationReportSha256` matching the exact frozen checker report.
- `outputRoot` equal to the canonical C4 evidence root plus `/surface-adapter-v1`. Each grant is claimed exclusively once; output has a new timestamp/UUID.

Provenance must include the same parent/candidate/source/build/root/PID/start-time/DB/base URL fields, `databaseCreatedAt`, `processStartedAt`, `recordedAt`, `freshDatabase:true`, `priorDatabaseReused:false`, `priorProcessStopped:true`, `syntheticOnly:true`, `retainedRealFramesAbsent:true`, `realSendersExcluded:true`, and `recordedBy:/root/qa_lead/qa_ui_device`.

Read-only preflight requires paused scenario-input `EQ-PROFILE-ROUTES` at virtual time >=1000 and <8000ms, paused `FG-FIRE` at >=1000ms, preset `sk1265-at6`, and tracking camera null/receivedFrames zero. The latter is repeated before every screenshot. The browser permits same-origin GET/HEAD/OPTIONS and exact admin/admin session login only; no simulation/profile/incident/calibration/device mutation is allowed. Full fixture membership, route availability, actual expiry, and displayed content are still checked by the unchanged scenario and subsequent image review. Fresh contexts contain no reused role/session/local-storage state.
