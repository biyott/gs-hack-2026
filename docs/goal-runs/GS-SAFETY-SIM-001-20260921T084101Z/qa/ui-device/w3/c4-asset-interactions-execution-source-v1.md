# C4 asset interaction execution source v1

Status: **source preparation only; all C4 runtime observations NOT_RUN**. This note does not grant an execution window. The new `c4-asset-interactions-v1.mjs` adapts the preserved `c3-asset-interactions-v1.mjs`; neither that C3 source, its HOLD, nor its evidence was edited. Only this note and the new C4 source belong to this preparation.

## Explicit candidate and execution gate

- Candidate: `sha256:cd8a2428d3d9e44703c25b4ae135f0ed5821b6b3b3794bbca6abc1ec37197eba`.
- Immutable stage: `/home/b/.cache/gs-safety-c4.q2FD40`.
- Binding: `qa/ui-device/w3/candidate-binding-c4.v2.json`, maintained by the binding owner; read here, not generated or modified here.
- Owned evidence root: `evidence/qa/ui-device/candidate-cd8a2428` under this goal run. It must resolve to that actual path, not a prior candidate or alias.
- Binding-declared BUILD_ID: `czkc6DgDv3UUlTrSfDMqX`; source digest: `e17322b2faf5b5181f6a50bcd5cd4baeae2ca31f57f7bfd1653399b4e9e28efa`. These values were read from the supplied C4 binding, not independently rehashed during preparation.

The source requires all three CLI inputs explicitly, in this order:

```text
node <absolute path>/c4-asset-interactions-v1.mjs \
  --binding <absolute path>/candidate-binding-c4.v2.json \
  --grant <new C4 evidence-root asset-subwindow grant JSON> \
  --process <new C4 evidence-root process receipt JSON>
```

That command remains deferred. There is no inherited C3 grant, process-file default, server URL default, or execution authority supplied by this note. The runtime source expects the following **QA receipt fields**, not new product/API fields. The owner must issue truthful receipts after the parent W3A C4 resource grant and process setup. Placeholders or a copied preparation card are not execution authority.

| Receipt | Required fields and relations |
| --- | --- |
| Asset-subwindow grant | `id` matching `W3A-C4-ASSET-<unique suffix>`; `phase: ASSET-BROWSER`; `parentGrant` matching the newly assigned `W3A-C4-<suffix>`; `candidateId`, `buildId`, `sourceSha256`; `grantedBy: /root/qa_lead/qa_ui_device`; `serverPid`; explicit `baseUrl`; `parentGrantedAt`, `grantedAt`, `validFrom`, `expiresAt`; `processPath`, `provenancePath`; SHA-256 fields `bindingSha256`, `processSha256`, `provenanceSha256`, `scriptSha256`. The owner also attests `syntheticOnly`, `retainedRealFramesAbsent`, `realSendersExcluded`, `exclusiveBrowser`, and `noConcurrentBlenderOrPerformance`, all true. |
| Fresh process receipt | `grant` equals the new parent grant; exact C4 `stage`, `candidateId`, `sourceSha256`, `buildId`; live positive `pid` and `/proc/<pid>/stat` field-22 `startTimeTicks` as a decimal string; `startedAt`; matching `baseUrl`; `databasePath`, `credentialsPath`; `freshDatabase: true`, `actualCameraInput: false`, `realPhoneSessionsIssued: 0`. |
| Fresh provenance receipt | `parentGrant`, candidate/source/build identity, `stage`, `pid`, `startTimeTicks`, `processStartedAt`, `databasePath`, `baseUrl` all join the process/grant; `databaseCreatedAt`, `recordedAt`; `recordedBy: /root/qa_lead/qa_ui_device`; `freshDatabase: true`, `priorDatabaseReused: false`, `priorProcessStopped: true`, `syntheticOnly: true`, `retainedRealFramesAbsent: true`, `realSendersExcluded: true`. |

Grant, process, provenance, DB and credential paths must resolve inside the owned C4 evidence root. DB and credentials must be distinct files under `.private`. The loopback URL must use `http://127.0.0.1:<assigned port>` with no credentials/query/fragment/path, and match the process receipt. The grant hashes bind the exact reviewed harness, binding, process receipt and provenance receipt. The source neither creates these receipts nor starts/stops a server, seeds a database, installs dependencies, or starts a model process.

The gate requires `parentGrantedAt ≤ databaseCreatedAt ≤ process.startedAt ≤ provenance.recordedAt ≤ grantedAt ≤ validFrom ≤ now < expiresAt`. This permits a fresh C4 W3A process prepared before the asset subwindow, but rejects an older process/database advertised as fresh. Live `/proc` start ticks and process cwd are checked before browser launch and before every authorized UI command; PID reuse or a different cwd aborts. The source checks the grant window before frozen helper imports, browser launch, UI mutations and camera-state checks; requests outside the window are blocked, and a deadline timer closes the owned browser context. Server cleanup remains with its owner. Receipt fields and process cwd/start ticks do not independently prove listening-socket ownership, the DB contents, or exclusion of real camera senders; the named owner must supply that actual provenance, not infer it from a synthetic label.

## Preserved interaction scope

The interaction recipe remains catalog-driven and uses actual UI selection, sliders, Apply buttons, 2D/3D controls and orbit dragging. It does not issue bypass mutation requests to manufacture pose results. Six unique catalog presets and exactly 21 completed slider motions are required. Source-read C4 control allocation is:

| Crane | Slider controls exercised once | Count |
| --- | --- | --- |
| sk1265-at6 | slew, trolley, hook height | 3 |
| tadano-gr250n4 | slew, hook height, boom angle, boom length | 4 |
| liebherr-ltm1050 | slew, hook height, boom angle, boom length | 4 |
| maeda-mc305 | slew, hook height, boom angle, boom length | 4 |
| liebherr-lr1100 | slew, hook height, boom angle | 3 |
| liebherr-172ecb | slew, trolley, hook height | 3 |

The recipe checks rendered slider count, min/max/0.1 step, keyboard `Home` then `ArrowRight`, a non-no-op target, and authoritative pose equality. Translation is not one of these 21 slider motions. Each baseline and completed motion has paired 3D/2D captures: 12 baseline plus 42 motion captures if every case completes. Six additional orbit captures are planned; actual orbit verification can remain `NOT_RUN` if projected annotations are unavailable. No screenshot or render was generated in this preparation.

The runtime source reads actual frozen stage GLB files, hashes their bytes, and compares those hashes with the exact C4 candidate manifest entries before they become expected response hashes. It then requires HTTP 200 response bodies for the six crane assets plus the site asset to match those frozen bytes, along with nonzero resource timing bytes and absence of scene-loading/failure elements. The C4 source explicitly requires seven expected and seven loaded asset paths. It also authenticates the asset-manifest file as a whole; it does not separately iterate that manifest's seven per-GLB records as a second assertion. A response match proves served-byte identity for those observations, not visual articulation or geometry quality.

Each paired capture selects `전체 범위` and requires `data-camera-mode="full"`. The 2D viewBox calculation retains the 140×50 m site, equipment position, maximum selected jib/boom reach and 8 m margins; coordinate comparisons use the existing `1e-6` tolerance. The map-scale observation is retained. Before/after pose identity must remain unchanged during each capture. 3D full bounds and articulation still require direct review of fresh permitted images; they are not numerically established by a server pose or camera-mode attribute.

Table linking remains separate from full camera framing. C4's SK catalog has `tableSlewDeg: [-15, 15]`; the other five entries have null and use the existing `[-180, 180]` fallback. The source preserves the check against those slider min/max/step values and applies one step above the minimum. It does **not** execute both -15°/+15° endpoints, out-of-range rejection, or a table-unlinked transition. Do not describe those missing endpoint cases as covered.

## Route/version coverage — explicit remaining gap

Implemented assertions are command response preset/mode and pose identity; response-to-snapshot run ID continuity and nondecreasing sequence/run/geometry versions; visible `.status-strip-version` at least the command's run version; and strict sequence/run/geometry version advancement after each pose control. Model selection checks selected preset and run identity, but does not independently require a strict pre-selection/post-selection version increment. Existing `streamId` values are recorded, not joined in a same-stream assertion.

The snapshot helper retains `run` and `equipment` but drops guidance/route records. Frozen `tests/frontend/browser-observations.mjs` records DOM `[data-route-version]` values in `scene.routeVersions`; the interaction harness never compares them with authoritative routes. It does not assert old-route invalidation, route replacement, worker/route/guidance identity, fresh route geometry after model/pose changes, delivery of a replacement route, or stale-route rejection. No URL pathname transition or API schema-version assertion fills that gap either. Every C4 report explicitly carries `routeInvalidationCoverage: NOT_IMPLEMENTED`; `productAcceptance` remains `NOT_RUN`.

A separately authorized route scenario must retain a baseline worker route/guidance identity, trigger the declared equipment/geometry change, join the new authoritative route and guidance to that change, and observe replacement/invalidation in the applicable UI without accepting the obsolete route. The existing 21-control run does not gain that coverage merely by advancing `geometryVersion`. No new product requirement or acceptance threshold is introduced here.

## Source verification performed

`node --check <absolute path>/c4-asset-interactions-v1.mjs` returned exit 0. This parses source without importing or executing its modules. Text diff review confirms the C3 interaction sequence is retained; changes bind C4 execution/provenance, enforce expiry, require the seven-asset count, and make the route gap explicit. C4 catalog controls and the route-version observation source were read as text. The installed Next Playwright guide and frontend/visual-QA guidance were consulted for the production-browser evidence boundary.

No browser, app, model, Blender or device was started or imported. No candidate/full-source hash was executed, and no frozen source was modified. Future runtime before/after input hashes and source fingerprints remain part of the gated recipe only. Syntax success is not a working grant test, runtime validation, image review or product PASS. Successful collection can end only at `REVIEW_REQUIRED`; incomplete or failed collection preserves its report. The synthetic fixture may remain changed (`fixtureRestored: false`), so its fresh isolated DB must not be handed off as an untouched fixture.
