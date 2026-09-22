# C4 incident browser core v1 — source preparation, NOT_RUN

Owner: `/root/qa_lead/qa_ui_device/c4_incident_harness`. Candidate: `sha256:cd8a2428d3d9e44703c25b4ae135f0ed5821b6b3b3794bbca6abc1ec37197eba`, immutable root `/home/b/.cache/gs-safety-c4.q2FD40`, BUILD_ID `czkc6DgDv3UUlTrSfDMqX`. No application, browser, model, network or device execution was performed during preparation. Only `node --check` is authorized and has been performed on the new QA script. This document is not an execution grant.

The independent core is [c4-incident-browser-v1.mjs](c4-incident-browser-v1.mjs). It reads the explicit C4 binding, process receipt, private PIN and independently prepared fixture. It opens the production application already owned by the W3 resource holder at `http://127.0.0.1:4103`; it never launches or stops that application. All writes are under the C4 UI/device evidence root. Browser cleanup is mandatory; it does not restore the mutated fixture. Use a disposable fresh C4 DB for this slice, separate from surface/assets fixtures, and preserve the final DB for server audit.

## Source mechanisms and practical prerequisites

- Incident selection is local store state; `.incident-list-item[aria-pressed=true]` and `.incident-detail > .guidance-context` identify the viewed incident. The camera select with `aria-label="카메라 모드"`, value `locked`, pins the selected incident's camera framing. No shared or persisted pin is asserted.
- `src/components/scene/SiteStage.tsx` renders `.scene-risk-notice[data-priority]`. Its visible text is generic: new risk, priority, retained viewpoint, and an explicit “위험 구역 보기” action. It does not render the notice incident ID. Source inspection alone cannot satisfy the amendment's visible B identity requirement; capture and classify the actual alert separately.
- `related-camera.ts` selects a camera by hazard zone and matching floor, preferring connected, stale, then disconnected metadata. The fixture must provide independently expected camera ID, floor and zones (or explicit `null` for no match); the runner checks rendered text against those inputs. Current source headings identify GROUND. It does not invent another floor or treat an unrelated latest frame as incident video.
- UI actions post `/api/incidents/{id}/actions` with mode, run revision, incident revision and request ID. Two administrator contexts race assignment from the same observed revisions. The harness holds both real UI requests until both exist, then releases them once. One 200 and one 409 are required; no retry repairs the race.
- Only the assigned **support role** can accept or complete support. The core creates a third isolated browser context for the winning support ID. Two admin contexts alone cannot exercise support acceptance. Administrative assignment, support acceptance, completion and worker arrival are distinct facts.
- C4 `Field` wraps its hint inside the `<label>`; the runner locates the exact label-title child and native control rather than assuming the accessible name excludes the hint.
- `simulation-stream.ts` constructs a native `EventSource`, stores `active` and connection epoch, and closes the old connection when the mode changes. The recorder keeps native behavior. After a mode roundtrip, the runner requires the former connection to be closed, invokes its old open/error/snapshot callbacks with a higher sequence and conspicuously higher run revision, and checks current visible revision and connection state remain unchanged. This is an instrumented callback case, not an actual network failure or server restart.
- No public command injects arbitrary hazards. `FG-COMBINED` places fire and gas inputs together at 1000 ms; it is not evidence of independent B arriving later while A is pinned. Do not fabricate a new public endpoint, modify frozen scenarios, or present intercepted fake snapshots as server incident creation.

## Executable core

1. Verify candidate/BUILD_ID/source member hashes, granted script/binding/fixture/process hashes, valid grant interval, fresh isolated C4 process, private PIN path, and fixture provenance hash.
2. Log in two distinct administrators; enter the requested mode; use 2D for evidence; select A in both. Require a paused scenario-input run, active and unacknowledged A, and nonempty actual first-guidance records. If B is supplied, require a distinct active incident with nonoverlapping hazard IDs and inspect its camera context explicitly in administrator 2 before returning to A. Without B, the report explicitly cannot certify isolation.
3. Pin A; record both administrator views and authoritative snapshot. Race `qa-support-1` and `qa-support-2` assignment from equal revisions. Preserve both request bodies, response statuses and response snapshots/error.
4. Log in a support context matching the winning assignee. Operate support acceptance and completion. Confirm worker semantic response objects are unchanged by connection, assignment and support actions; subscriber counts do not become worker receipt or arrival.
5. Switch administrator 1 away and back through actual mode controls; require an actual new owned SSE subscription. Inject delayed old callbacks only into the closed former native instance. Record first/last raw wire snapshots, every ingress ordering tuple and close evidence. These are received-frame observations, not a claim to expose the internal accept/reject reason or epoch.
6. Operate acknowledgment, field check, clear, reopen and close separately. Preserve original first guidance byte-for-byte in all existing incidents. With B supplied, require B to remain active with its hazard identities, clear/reopen timestamps and active hazards unchanged. Recomputed B guidance is retained for separate route review; this core does not require an unchanged envelope.
7. Before every screenshot, require the isolated tracking API to report `camera === null` and `receivedFrames === 0`. Preserve complete snapshots, action responses, incident text, expected/actual camera context, screenshots and SHA-256s. The screenshots are viewport evidence, not full scroll or visual acceptance.

The core uses no worker session, camera/frame upload, sound-enable control, browser speech mock, DB mutation or product-source import. Incident lifecycle evaluation can schedule provider work in the application; the grant must explicitly authorize that workload and the shared provider resource. The core's browser request allowlist permits only local reads, its specific logins and A's declared incident actions; it rejects other mutations and external requests. Auth tokens are not written to the report; PIN replacement is applied to the serialized report as a final safeguard.

## Required inputs and future command

The fixture JSON contains these fields, all bound to the fresh process and independent preparation record:

```json
{
  "candidateId": "sha256:cd8a2428d3d9e44703c25b4ae135f0ed5821b6b3b3794bbca6abc1ec37197eba",
  "mode": "fire-gas",
  "runId": "ACTUAL_FRESH_RUN_ID",
  "incidentAId": "ACTUAL_A_ID",
  "incidentBId": null,
  "cameraByIncident": {
    "ACTUAL_A_ID": { "cameraId": "ACTUAL_EXPECTED_CAMERA_ID", "floorId": "GROUND", "zoneIds": ["ACTUAL_EXPECTED_ZONE"] }
  },
  "provenancePath": "/absolute/qa/independent-fixture-preparation.json",
  "provenanceSha256": "ACTUAL_SHA256"
}
```

These are placeholders, not executable fixture identities. A non-null B needs its own camera mapping. A null camera mapping explicitly expects the unmapped-incident UI. Provenance must identify actual hazard inputs, incident correlation and any expected A-only/B-only/shared edges; a producer unit fixture by itself is not independent live browser fixture creation.

The explicit grant must contain `phase: "INCIDENT-BROWSER"`, this `candidateId`, `grantedBy: "/root/qa_lead/qa_ui_device"`, `baseUrl: "http://127.0.0.1:4103"`, actual `grantedAt`/`expiresAt` UTC timestamps, `scriptSha256`, `bindingSha256`, `fixtureSha256`, absolute `processPath`, `processSha256`, and matching `serverPid`. These flags must all be true: `syntheticOnly`, `retainedRealFramesAbsent`, `realSendersExcluded`, `exclusiveBrowser`, `noConcurrentBlenderOrPerformance`, `lifecycleEvaluationAuthorized`. The process receipt must bind C4 root/candidate/build, `freshDatabase: true`, `actualCameraInput: false`, `realPhoneSessionsIssued: 0`, and `credentialsPath` under the C4 evidence `.private` directory. No grant was created by this subtask.

Only after the parent grants this exact script and actual fixture:

```bash
node /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/c4-incident-browser-v1.mjs \
  --binding /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/candidate-binding-c4.v2.json \
  --grant /absolute/approved-incident-grant.json \
  --fixture /absolute/independent-c4-incident-fixture.json
```

Allow approximately **3–5 minutes of browser/application occupancy** for the bounded core, excluding fixture construction and model queue time. This is an unmeasured planning estimate. Expected captures are roughly 28 viewport PNGs. Allow another **5–10 minutes outside the exclusive runtime slot** for snapshot/audit correlation and image review. Full amendment completion takes additional fixture, server recovery, delayed supplement and actual-device slots.

## Explicit NOT_RUN boundaries

The runner always ends at `INCOMPLETE_REVIEW_REQUIRED` when its assertions succeed, and `productAcceptance: "NOT_RUN"`; any failed assertion, forbidden request, expired grant, cleanup failure or changed source is `FAIL`. An `OBSERVED` case entry records completed narrow assertions, not an AC verdict.

Remaining independent evidence: later independent higher-priority B and visible alert identity while A stays pinned; A-only/B-only/shared-edge restriction ownership and DB joins; current route and destination correctness after A changes; field follow-up guidance; true worker receipt/understanding/help/arrival; changed-destination arrival after recovery; delayed supplement with higher envelope version and stable primary playback key; actual outage/server restart establishing a new stream; delayed HTTP and invalid/reversed/duplicate ordering classes; separate camera/audio/position faults; full visual review. Actual Android speech/vibration, four physical phones and camera evidence remain separate W3B/W3C gates.

Preparation review: a separate read-only reviewer checked native EventSource lifecycle, role selectors, race semantics and grant/privacy cleanup. It found no blocker in that bounded read; subsequent exact `Field` title selectors were corrected from source inspection. This is static readiness only. No runtime result or product PASS exists.
