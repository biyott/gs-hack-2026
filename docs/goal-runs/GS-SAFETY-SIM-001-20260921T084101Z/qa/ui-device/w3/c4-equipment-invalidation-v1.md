# C4 equipment invalidation / table limits v1

Source-ready only, NOT_RUN. This separately versioned helper preserves `c4-asset-interactions-v1.mjs` and all prior incident helpers. It complements the six-crane/21-control/GLB capture; it does not replace that work or certify whole AC-12. Candidate `sha256:cd8a2428d3d9e44703c25b4ae135f0ed5821b6b3b3794bbca6abc1ec37197eba`, root `/home/b/.cache/gs-safety-c4.q2FD40`, BUILD_ID `czkc6DgDv3UUlTrSfDMqX`.

The script was syntax-checked with `node --check`; a separate read-only source review checked its selectors, limits, projection, ordering and grant boundary. No browser/application/import/network execution occurred in this preparation. Reading frozen Next's local Playwright guide preceded the new QA code. An explicit new subwindow grant is still required.

## Required existing fixture

Use the parent-owned fresh C4 process described by `evidence/qa/ui-device/candidate-cd8a2428/w3a-process-01.json`: PID 981422, start ticks 5003481, loopback 4103, BUILD_ID above, fresh private DB and private credential file. The script rechecks PID start ticks and actual cwd and never starts/stops the application. The process receipt is hash-bound, so a replacement process requires a new grant and receipt binding.

The equipment run must already be paused, use scenario positions and synthetic equipment position provenance, and contain at least one worker's actual current guidance. Use the existing `EQ-PROFILE-ROUTES` fixture after the parent's surface/assets work. The grant supplies its actual `runId` and exact `scenarioId`. No scenario reset or guessed run ID is issued by this helper. Actual camera input must remain excluded; `camera === null` and `receivedFrames === 0` are required before every screenshot. A retained synthetic image also stops this strict capture helper rather than weakening the no-frame boundary.

Login uses the seeded `admin` account. No synthetic worker, support or phone sessions are issued. Source inspection confirmed `src/server/auth/config.ts` permits only seeded identities by default; arbitrary QA usernames must not be assumed valid.

## Actions and assertions

1. Read initial state and order the six catalog IDs so each is selected through the actual `data-testid="equipment-select"` control, with the initially selected ID last. Capture request, response and before/after state for all six selections.
2. Require `geometryVersion + 1`, same run/stream, higher mutation revision and publication sequence. All new equipment hazard IDs must encode the selected preset and new geometry version. No old hazard ID may remain.
3. Require regenerated current guidance to bind the new geometry, worker/run/mode/map scope, and a new primary identity or increased version in the same lineage. Current hazard references must refer to current hazards. Preserve every existing immutable first-guidance record.
4. Check route version against the published implementation's route identity: destination plus waypoint identity, with the first waypoint's continuously moving coordinates excluded but its node/floor retained. An unchanged route can keep its version; a changed route increments from the previous route version. A route-less current guide cannot retain old waypoints or destination.
5. In actual 2D UI, click “전체 범위”, wait for rendering, and compare every visible hazard polygon/ID and route polyline/title/version with the authoritative current snapshot. Compare full-view viewBox with metre-based site/equipment reach bounds. Retain raw DOM observations and screenshot even when an assertion subsequently fails. Mathematical route safety and geometry correctness remain joins to independent engine/assets evidence.
6. Select SK1265, explicitly prepare linked slew 0 if necessary, then operate actual slider Home/End and Apply for **−15° and +15°**. Full view must leave the table link true and slider limits at `[-15,15]`.
7. There is **no rendered table-link toggle** in frozen C4. Perform the explicitly granted authenticated public `control` API `{tableLinked:false}`, then use actual UI endpoint controls for **+180° and −180°**, asserting `[-180,180]` slider limits. This is an API setup transition followed by UI operation, not a claimed UI unlink action.
8. Restore `{tableLinked:true,slewDeg:0}` through the explicit API and capture final linked state. This restores only the stated SK link/slew baseline; prior preset/guide/incident history and DB are intentionally retained as evidence.

All successful mutation response bodies are expected to contain a newly issued primary, before any asynchronous supplement. Raw responses are saved before assertions. The script creates no fake SSE snapshots and imports no product source helpers. Settled wire/DOM consistency is observed; this does not prove there was no transient stale pixel between every paint. A stale worker-response rejection requires separate server evidence and is not performed by this browser helper.

## New grant format and command

Grant under the C4 evidence root must contain:

- `phase: "EQUIPMENT-INVALIDATION"`, `parentGrant: "W3A-C4-01"`, exact C4 `candidateId`, `grantedBy: "/root/qa_lead/qa_ui_device"`, `baseUrl: "http://127.0.0.1:4103"`, matching `serverPid`, actual `runId` and `scenarioId`.
- Actual ISO UTC `grantedAt <= validFrom < expiresAt`; `expiresAt` must not exceed the current parent cutoff `2026-09-21T18:37:30.000Z`.
- Exact `scriptSha256`, `bindingSha256`, `processSha256`, and SHA-256 of `c4-equipment-invalidation-v1.freeze.json` in `freezeSha256`.
- All true: `syntheticOnly`, `retainedRealFramesAbsent`, `realSendersExcluded`, `exclusiveBrowser`, `noConcurrentBlenderOrPerformance`, `publicTableLinkCommandsAuthorized`, `lifecycleEvaluationAuthorized`. Equipment commands can trigger application evaluation/provider work; the parent must authorize that occupancy.

The checked-in freeze records helper/doc/binding inputs and relevant frozen C4 sources. Freeze membership is verified before launch and helper inputs again after cleanup. The grant's supplied process hash binds the actual current receipt. Do not rewrite a frozen helper after a granted attempt; use a new version if correction is needed.

```bash
node /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/c4-equipment-invalidation-v1.mjs \
  --binding /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/candidate-binding-c4.v2.json \
  --grant /absolute/C4-evidence/approved-equipment-invalidation-grant.json \
  --process /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/ui-device/candidate-cd8a2428/w3a-process-01.json
```

Estimated browser/application occupancy **2–4 minutes**, with roughly 11 viewport PNGs; direct image/report review another **3–5 minutes outside the browser slot**. This is a planning estimate, not measured execution. Output is `equipment-invalidation/<actual-UTC>-<suffix>/report.json`. Success is `REVIEW_REQUIRED`, `productAcceptance: NOT_RUN`; failures, expiration, changed helper or forbidden requests are preserved as `FAIL`. Browser closes on expiration and in final cleanup. No actual Android, camera, calibrated physical accuracy, late independent B, shared-edge ownership or overall acceptance claim is made.
