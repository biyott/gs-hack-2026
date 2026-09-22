# G0 product scope freeze — GS-SAFETY-SIM-001 v1.0

Run: `GS-SAFETY-SIM-001-20260921T084101Z`. Product owner: `/root/product_lead`; execution owner: `/root`; acceptance owner: `/root/qa_lead`. Scope frozen from the user's executed input, SHA-256 `5acf113eee7b75724f5b9e9b3e7d92f8bf99d714f812a35c6946f7a2d4239796`. This is a requirements baseline, not implementation completion or a QA verdict. G0 execution readiness additionally requires QA's frozen acceptance inputs, environments and delegated performance protocol.

## Authority and source bundle

The exact [goal input](../goal.input.txt) controls scope. The preserved [authored goal](../goal.document.original.md) and shortened [native goal objective](../goal.tool-objective.txt) do not replace it. [Run metadata](../run.json) records the three distinct hashes and actual execution timestamps. The six retrieved documents are preserved with full bodies, original JSON/HTML, timestamps, titles and hashes in [source manifest](../sources/emul-manifest.json).

Read together: 002 supplies independent simulations and stack; 003 supplies RAG; 004 supplies the synthetic-data specification; 005 and 006 supply worker and manager acceptance behavior; 008 fixes site, scale, six cranes and device roles. The executed goal's explicit integration rules resolve conflicts. Source examples, prompts and old implementation-order recommendations cannot reduce the goal.

The six execution documents are `docs/codex/README.md`, `harness.md`, `responsibilities.md`, `operating-mode.md`, `roles.md`, and `research.md`. They govern this execution. Their discussion of raphthon, Discord, enforcement mechanisms and future harness tests does not add a harness product to this goal. Existing dirty files and Blender assets are preserved. Current role controls are **규칙 안내 모드**, not claimed OS/tool enforcement.

## Required integrated outcome

All A–G and AC-01–16 are mandatory on one candidate: local single Node.js server; both independent sensor-free simulations; Flutter Android application; manager web; actual document indexing, hybrid retrieval and model-backed explanation path; 3D field; six interchangeable crane assets; and four physical-phone table demonstration. Static pages, documents, video, mocks, capability flags or software-only tests cannot replace real app, model and device execution requirements.

Users are Korean/English workers, workers with confirmed movement/assistance needs, safety managers and demo operators. The application is a simulation; it does not certify real-world safety. The engine decides risk, policy, route and destination; RAG only retrieves applicable evidence and adds validated explanation after immediate reviewed guidance.

The frozen map is synthetic `SITE-CONSTRUCTION-01`, 140m × 50m corresponding to a 140cm × 50cm table at 1:100. Display **서산 HVO 현장 참고 / 상세 배치 재구성**. Origin is table lower-left, +X long side, +Y short side. Table cm values equal world m values; table m values multiply by 100. Server, Blender and web remain 1 unit = 1m. Layout coordinates in goal E and 008 are fixed; reference points are candidates whose present safety/connectivity must be checked.

## Mandatory equipment inventory

One `EQUIPMENT-A` is displayed at a time; all six presets are deliverables. Existing SK1265 assets remain the default. Priority 1–4 is an implementation order, never a scope cap.

| Preset | Fixed edition/configuration and critical distinctions |
| --- | --- |
| Spierings SK1265-AT6 | Legacy 60m horizontal jib; transport 16.279 × 3.000 × 4.000m; support centres 7.95 × 7.66m; jib underside 37.2m and hook height 35.0m. Do not import eLift dimensions. Table slew ±15° is a demo rule, not a mechanical limit. |
| Tadano GR-250N-4 / GR-250N(IV) | Korean IV spec sheet; transport 11.530 × 2.620 × 3.475m; maximum support width 6.6m; boom 9.35–30.5m. Width alone does not establish four support coordinates. |
| Liebherr LTM 1050-3.1 | 385/95 R25 configuration: transport 11.830 × 2.550 × 3.785m; support spacing 7.151 × 6.400m; boom 11.4–38.0m. Do not mix alternate rear body, tyre height or reduced support width. |
| Maeda MC305C-5 | Metric CE sheet; transport 4.110 × 1.280 × 1.695m; pad exterior envelope length 5.170m, front width 4.808m, rear width 4.704m. Front/rear widths are not additive and are not support centre coordinates. |
| Liebherr LR 1100.1 | 32m main boom, no fixed jib. Approximately 6.60 × 5.00m operating undercarriage, 6.27m tracks, 4.70m tail radius; retain the imperial-conversion/approximation provenance. |
| Liebherr 172 EC-B 8 Litronic | 16 HC 175 / UC-0460m, 50m jib, 42.3m hook height; tower width 1.8m, standard section 2.5m, base exterior 4.6m, rear length 14.5m. Fixed equipment origin; hook height is not total steel height. |

Manufacturer evidence and uncertainty belong in the catalog. Unknown values remain null/미확인. Transport, operating exterior, support centres, pads, boom length, working radius and hook height are separate concepts. Independent analytical body/support/tail/load/predicted-movement geometry drives risk. Model replacement invalidates old risk, route and guidance versions before recalculation.

## Mandatory physical-device inventory

008 records **S24+ ×2, user phrase “Galaxy Z Fold8 와이드”, and Note20 Ultra**. Preserve that phrase until actual model identifiers are read; do not silently rename it. Manufacturer capability statements are source claims, not proof about the four units' installed OS, permissions or successful simultaneous sessions.

One common Flutter app allows every device to select `EQUIPMENT`, `WORKER_1`, `WORKER_2`, or `CCTV`; no model whitelist or permanent assignment. Demo uses one device per role and prefers the relatively lower-performance device for CCTV. `WORKER_1 → WORKER-A`, `WORKER_2 → WORKER-B`; optional virtual `WORKER-C` is never a third measured worker.

Actual Controller plus two Controlee concurrent distance reception is mandatory. Actual Android screen/voice/vibration and frontmost/screen-on operation are mandatory. CCTV must send rear-camera JPEG 5–10fps and track table corners plus individually identified phone markers. Measure frame rate, end-to-end latency, position error, occlusion/disconnection and recovery separately. Record visual positions and UWB ranges with their true origins, timestamps and error state. Null angles or range-only data never become invented 2D positions. Calibration includes antenna/marker/slew offsets, height projection and equipment movement. Device unavailability is an execution blocker, not a waived criterion.

## Frozen interpretation and delegated detail

| Topic | Scope-preserving interpretation |
| --- | --- |
| Opening phrase “six completion items” vs A–G | A–G and all sixteen explicit ACs are authoritative enumeration; none is deleted. |
| 003 versus 004 metadata | Preserve `common`, `siteIds`, and four approval states. Single `siteId` maps to `[siteId]`; common plus request mode is searched with site filtering always applied. Demo-reviewed synthetic documents become `approved_for_demo`, never `approved`. |
| 004 initially `draft` versus usable demo retrieval | Preserve draft origin, version 0.1.0 and review history; only reviewed in-date `approved_for_demo` synthetic documents enter demo search. |
| PATH-D and source illustrative IDs | Do not add example PATH-D to the fixed graph. Use goal/004/008 IDs; graph topology is an explicit technical contract. |
| 008 marker tracking as proposal | Goal F expressly includes marker tracking, so implementation is authorized and mandatory. |
| Range-only UWB and precision | Visual tracking supplies calibrated table positions; UWB remains genuine range observation unless valid planar coordinates exist. No accuracy guarantee is inferred from manufacturer figures. |
| No-route versus shelter | `ROUTE_UNAVAILABLE` is explicit with support workflow. Shelter only follows an explicit scenario policy; no universal stay-put fallback. |
| Simultaneous screen/audio/vibration | Same validated guidance version starts the outputs; screen is immediate and does not wait for TTS/RAG. Short warning sound precedes action speech. |
| Performance numbers | QA and Technical Leads may specify measurement methods and tolerances before execution in G0, with provenance and device conditions. They cannot relax criteria after failure or replace required user outcomes. |
| G0 artifact updates | This baseline is immutable. New source traceability and command evidence may be appended in new artifact versions without changing goal v1.0; changed mandatory outcomes require explicit user-approved goal version. |

## Approval boundary and non-goals

The user already authorizes repository/source research, planning, UI/3D production, implementation, synthetic test data, local runs/builds, verification, fixes, independent work splitting and integration within this scope. Internal choices and worker additions require no repeat confirmation. Technical/design owners decide delegated details and document contracts with affected Leads; frozen contract changes require a new version and impact review.

Changing scope, user outcomes, required features, six-model composition, scale, core stack, safety policy or pass conditions requires user approval of a concrete proposal. Purchases, expanded account/permissions, external personal-data transfer, destructive data changes, remote push, public deploy and external messages require existing explicit authority or a separate approval. This assignment authorizes none of those external actions.

Excluded: real field certification/safety assurance; full measured factory restoration; claims of real plant safety approval or actual crane deployment; fire/gas fluid simulation; gas detection from ordinary CCTV; real gas thresholds, PPE/rescue/first-aid generation; load calculation or certified safety distances; real equipment automatic control; UWB-distance-only pose inference; scaling equipment to phone size; iOS; continuous background/lock-screen safety service; commercial cloud deployment; Discord; a new harness product.

## Completion and evidence boundary

The [lossless inventory](inventory.v1.0.json) maps original clauses to ACs, owners and planned implementation/evidence surfaces. QA owns [acceptance.md](../acceptance.md); PM does not write verdicts. G2 is implementation/self-check submission; G3 fixes one candidate; only independent G4 QA Lead may issue overall PASS/FAIL/BLOCKED. G5 reports the same verdict and limitations. All mandatory ACs must pass against the same identified code/assets/DB/configuration before ACCEPTED/DONE.

Evidence includes goal/run/task/spec, candidate hash including uncommitted changes, environment/devices/data, commands, expectations, observed results, timestamps and artifact paths. Software and actual-device/model evidence remain separate. Preserve previous failures. Default rework is two rounds and same-environment retry once; exhausted attempts are reported with remaining alternatives. Eight-hour target in run.json is an operating target, not success evidence. No product goal change is made by this freeze.
