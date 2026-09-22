# C4 focal articulation source v1

Source preparation only. Runtime, visual articulation, camera clearance and product acceptance are NOT_RUN. The original C4 asset runner and its 31 stored PNGs remain untouched. This source does not grant execution.

Candidate is `sha256:cd8a2428d3d9e44703c25b4ae135f0ed5821b6b3b3794bbca6abc1ec37197eba`, frozen stage `/home/b/.cache/gs-safety-c4.q2FD40`, exact binding `candidate-binding-c4.v2.json`. Outputs go only to the bound C4 evidence root under `focal-articulation/<timestamp>-<unique suffix>`.

## Gate and exact receipt schema

Deferred invocation: `node c4-focal-articulation-v1.mjs --binding <absolute C4 binding> --grant <absolute new focal grant> --process <absolute fresh C4 process receipt>`.

The gate preserves the C4 asset source's candidate, canonical root, evidence paths, private credentials, manifest, input hashes, source fingerprints, timed grant, PID start ticks and cwd checks. No module is imported from the candidate until the grant is valid. All browser requests stop outside its interval; expiry closes the owned context. The new focal window must be at most **300000 ms**, with no retry. Expected collection budget is 3–5 minutes. No server/process/DB setup is performed by this runner.

- Focal grant: `id` matches `^W3A-C4-FOCAL-[A-Za-z0-9-]+$`; `phase: FOCAL-BROWSER`; `parentGrant` matches `^W3A-C4-[A-Za-z0-9-]+$`; exact `candidateId`, `buildId`, `sourceSha256`; `grantedBy: /root/qa_lead/qa_ui_device`; `serverPid`; `baseUrl`; `parentGrantedAt`, `grantedAt`, `validFrom`, `expiresAt`; `processPath`, `provenancePath`; exact SHA-256 fields `bindingSha256`, `processSha256`, `provenanceSha256`, `scriptSha256`. `syntheticOnly`, `retainedRealFramesAbsent`, `realSendersExcluded`, `exclusiveBrowser`, `noConcurrentBlenderOrPerformance` must all be true.
- Process receipt: `grant` equals parent grant; exact `stage`, `candidateId`, `sourceSha256`, `buildId`; positive live `pid`, decimal-string `startTimeTicks`, `startedAt`, matching `baseUrl`, `databasePath`, `credentialsPath`; `freshDatabase: true`, `actualCameraInput: false`, `realPhoneSessionsIssued: 0`.
- Provenance receipt: matching `parentGrant`, `candidateId`, `sourceSha256`, `buildId`, `stage`, `pid`, `startTimeTicks`, `processStartedAt`, `databasePath`, `baseUrl`; `databaseCreatedAt`, `recordedAt`; `recordedBy: /root/qa_lead/qa_ui_device`; `freshDatabase: true`, `priorDatabaseReused: false`, `priorProcessStopped: true`, `syntheticOnly: true`, `retainedRealFramesAbsent: true`, `realSendersExcluded: true`.

Receipts must resolve inside the exact C4 evidence root; DB and credential files must be distinct files in `.private`. URL is explicit `http://127.0.0.1:<port>` without extra path, credentials, query or fragment. Required ordering is `parentGrantedAt ≤ databaseCreatedAt ≤ startedAt ≤ recordedAt ≤ grantedAt ≤ validFrom ≤ now < expiresAt`. An existing fresh process from this same parent window is eligible only with truthful matching provenance. Receipt assertions do not independently establish socket ownership or frame-byte provenance.

## Four pairs, eight PNGs

| Pair | Fixed preparation pose | Target motion | Zoom after one reset |
| --- | --- | --- | --- |
| Tadano GR250N4 hook | boom 20 m, 50°, slew 0°, hook 3 m | hook 3 → 10 m | Two clicks, 1.69 |
| LTM1050 hook | boom 26 m, 50°, slew 0°, hook 3 m | hook 3 → 10 m | Two clicks, 1.69 |
| SK1265 trolley | slew 0°, hook 16 m, trolley 20 m | trolley 20 → 50 m | Zero clicks, 1 |
| SK1265 hook | slew 0°, trolley 50 m, hook 6 m | hook 6 → 28 m | Zero clicks, 1 |

Preparation selection and pose commands are logged separately from the four target motions. Already-correct preparation fields are checked without a no-op command. Every mutation uses actual UI selection or a native range keyboard sequence followed by Apply. Range min/max/0.1 step are checked, the closest endpoint is selected with Home/End, then at most 180 native arrow presses reach an asserted target (slew preparation alone permits up to 1800 if an already-selected model needs its 0° pose restored). Every key checks the grant deadline. The request gate permits only the one pending exact single-field control pose or preset command; no mutation fetch or DOM value assignment is used.

For each pair the runner selects 3D, explicitly clicks the exact existing authoritative incident ID—even if the fallback UI already reports it pressed—then requires the locked option enabled and selects it. It resets once, applies the table's zoom recipe and performs exactly one bounded native canvas orbit using the frozen `drag-unobscured-canvas` helper. That helper chooses an unobscured horizontal segment up to 60 px, checks changed projected anchors and stable visible state version, and saves coordinates. No retry, pan or extra image is requested. No camera reset, mode/view change, zoom or orbit occurs between the before and after image. Scrolling to controls and back is permitted and paired screen rectangles must agree exactly.

Locked framing uses incident hazard/worker/route bounds or map bounds; it is not equipment focus. There is no equipment-focus UI. SK uses zero zoom clicks conservatively because the locked camera targets world height zero; even this does not establish hook/rope clearance. No live recipe adjustment is authorized by this source.

Each image records actual `/api/tracking` top-level `camera === null` and `receivedFrames === 0` before capture. This exact unwrapped schema comes from `app/api/tracking/route.ts`, `packages/contracts/src/tracking.ts` and the tracking service. `droppedFrames` is recorded separately. Snapshot requirements are equipment mode, paused run, scenario position input, synthetic equipment source, known equipment position, same run and stream. Wire response and authoritative poses must agree. Target controls strictly advance sequence, run version and geometry version; unrelated pose fields and equipment position must remain unchanged.

Saved projection evidence contains camera select value, stage camera mode, stage/canvas/SVG rectangles and `[data-annotation-id]` line-start coordinates. At least two equipment/worker anchors with unchanged authoritative world points must be present and unchanged in pixels across each pair. This is only a **pixel projection proxy**; it cannot establish camera internals or model articulation. The recorded PNGs still require independent review of the hook, ropes, trolley and framing.

Served GLB checks use observed HTTP 200 response bodies hashed against the frozen candidate-manifest-checked GLBs. The runner hashes all seven frozen GLBs but requires only the site and three selected crane response bodies. A grant-bounded wait of at most 20 seconds lets required response bodies arrive before checking identity; scene loading/failure is checked again afterwards. It does not consult the browser's bounded resource-timing buffer. Frozen input hashes and the candidate helper's source fingerprint are compared before and after future execution.

Missing assets, tracking provenance, readiness, camera mode/projections or authoritative identity fail collection. Four completed target motions and exactly eight returned captures are mandatory. Maximum successful status is `REVIEW_REQUIRED`; uncertainty in visual clearance/articulation is not cleared by source or pose checks. `productAcceptance` remains `NOT_RUN`, `routeInvalidationCoverage` remains `NOT_IMPLEMENTED`, and the isolated fixture is not restored.

## Preparation verification

`node --check` returned exit 0. Relevant frozen source and the installed Next route-handler guide were read as text. No browser, runtime imports, server, model, network, device, Blender, candidate hash or full-source scan was executed. No frozen product files or prior evidence were modified.
