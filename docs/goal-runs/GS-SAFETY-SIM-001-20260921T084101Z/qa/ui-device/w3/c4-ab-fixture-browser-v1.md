# C4 A/B constructor fixture and actual browser protocol v1

Status: source preparation, runtime **NOT_RUN**. No grant is created by this document. Preserve this version and its freeze after publication. No application files are changed.

This bounded helper imports the frozen C4 production constructor under a scoped tsx loader, creates a separate in-memory database and a declared QA scenario, and retains canonical schema-parsed envelopes. The browser then renders those envelopes in the actual C4 application using an explicitly installed QA EventSource replacement and intercepted snapshot/catalog GET responses. It is evidence about production-constructor results and actual UI behavior under fixture delivery. It is not evidence that stock HTTP can create these concurrent incidents, that the real server owns this run, or that native SSE delivered them.

## Bound input and mechanism

- Candidate: `sha256:cd8a2428d3d9e44703c25b4ae135f0ed5821b6b3b3794bbca6abc1ec37197eba`.
- Frozen root: `/home/b/.cache/gs-safety-c4.q2FD40`; build `czkc6DgDv3UUlTrSfDMqX`.
- Existing process receipt: `evidence/qa/ui-device/candidate-cd8a2428/w3a-process-01.json`, parent grant `W3A-C4-01`, loopback port 4103. Require a fresh database, private PIN, no real phone sessions, no actual camera input, matching PID start time/cwd, manifest, build and source hashes.
- Production entry points: `src/server/simulation/runtime.ts`, `configuration.ts`, `src/server/db/index.ts`, `run-repository.ts`, `src/server/auth/index.ts`, `src/server/scenarios/schema.ts` and the contracts. No test fixture import, scheduler, RAG callback, model or external request is used.
- The existing `runtime-isolation.integration.test.ts` supplies the four-event design: A fire in ZONE-B at 1000 ms; PATH-B closure at 1500 ms while only A exists; independent B fire in ZONE-C at 2000 ms; PATH-C closure at 2500 ms while both exist. A connected ZONE-C fire sensor is included. Default scenarios remain available; the QA scenario has a distinct ID and declared expectations.
- Pause at virtual 1500 ms for A, then resume/advance/pause at 2500 ms for A+B. Clear A and reopen A through direct, guarded production constructor methods. Preserve raw command results, checkpoint closure ownership, first guidance and current B worker/incident lineage.

Both fires have critical priority. This does **not** cover a strictly higher-priority B. PATH-B is A-only and PATH-C shared; the original S18 B-only path case remains **NOT_RUN**. Real UTC timestamps and ordinary guidance expiration remain intact. Pausing may attach stop intent; this helper does not claim worker playback behavior.

## Actual browser observations

1. Open separate 1440×900 contexts, log in through the actual C4 account endpoint as seeded `admin` and `admin-2`, and enter fire/gas in the real UI. App bytes, authentication and tracking reads come from the bound server.
2. Render canonical A through the QA adapter. Select A in both contexts and set admin 1 camera mode to locked.
3. Deliver the canonical A+B envelope through the adapter. Wait for its run version in each rendered status strip. Capture both actual views; require A to remain selected and locked in admin 1 and both incident IDs to appear for both admins.
4. Record the new-risk notice text, priority and whether it visibly names B. Missing notice or missing identity becomes a review finding. If visible, click its actual `위험 구역 보기` button and require explicit navigation to B.
5. Restore admin 1 to A/locked and select B in admin 2. Inject the canonical cleared-A and reopened-A snapshots, retaining the different local selections and recording both views and canonical ownership. These are injected lifecycle states; no stock lifecycle HTTP action is claimed.

The adapter blocks native `/api/events` and all non-login mutations. Any blocked request fails the run. Before each capture, the actual server's `/api/tracking` must report `camera === null` and `receivedFrames === 0`. Images contain synthetic fixture views only. Store raw page errors as findings. The helper closes only its own browser; it does not stop or mutate the parent simulation process.

## Run only under a new explicit serial grant

Required grant fields are: `phase: "AB-FIXTURE-BROWSER"`, `parentGrant: "W3A-C4-01"`, exact `candidateId`, `grantedBy: "/root/qa_lead/qa_ui_device"`, `baseUrl: "http://127.0.0.1:4103"`, actual `serverPid`, `bindingSha256`, `processSha256`, `scriptSha256`, `freezeSha256`, `grantedAt`, `validFrom`, `expiresAt`; and these booleans true: `constructorFixtureAuthorized`, `qaTransportInjectionAuthorized`, `syntheticOnly`, `retainedRealFramesAbsent`, `realSendersExcluded`, `exclusiveBrowser`, `noConcurrentBlenderOrPerformance`. Grant and process receipts must live under the C4 evidence root. Expiry cannot exceed `2026-09-21T18:37:30.000Z`. Hashes must be calculated from the frozen files and actual receipts, not copied from a stale example.

Use the existing fresh process with synthetic-only tracking and its private credentials; no particular live simulation scenario is required because this run is separate fixture delivery. Run only when the parent has released serial browser occupancy. Estimated execution: 2–3 minutes; review is separate. The script enforces expiry but does not extend the grant or start an application.

```bash
/home/b/.local/share/gs-safety-runtime/node-v22.23.2-linux-x64/bin/node \
  /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/c4-ab-fixture-browser-v1.mjs \
  --binding /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/candidate-binding-c4.v2.json \
  --grant /ABSOLUTE/C4/EVIDENCE/ACTUAL-SERIAL-GRANT.json \
  --process /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/ui-device/candidate-cd8a2428/w3a-process-01.json
```

Outputs go to a unique C4 evidence `ab-fixture-browser` subdirectory: incremental constructor progress, full canonical fixture and hash, actual viewport PNGs and hashes, QA ingress ledger, raw text and selections, request decisions, findings and report. Preserve failures and partial traces. A completed run remains `REVIEW_REQUIRED` or `FINDINGS_REVIEW_REQUIRED`; overall product acceptance stays **NOT_RUN**. Native SSE/reconnect, support assignment/acceptance/arrival, RAG supplement, real worker receipt, physical devices, strictly higher-priority B and the S18 B-only path require other evidence. The separate frozen incident v1.1 public-workflow helper remains necessary.

Preparation validation is limited to `node --check` on the two new `.mjs` files plus source inspection. No runtime assertion or visual result has been observed in preparation.
