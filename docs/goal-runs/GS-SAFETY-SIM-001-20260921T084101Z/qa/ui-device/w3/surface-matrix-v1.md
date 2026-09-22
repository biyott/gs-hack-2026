# W3A surface scenario matrix v1

Status: PREPARATION ONLY / NOT_RUN. No browser, server, API, device, model, Blender, harness or test process was launched for this preparation. These are independently authored scenario instructions, not execution evidence or a G4 verdict.

## Candidate, privacy and fixture preconditions

- Product source and all product asset/fixture inputs come only from the frozen stage `/home/b/.cache/gs-safety-ci.u7pR52`. This document does not authorize use of the mutable checkout, port 3000, existing preview databases or another owner's server. The authored JSON is [surface.scenario.v1.json](./surface.scenario.v1.json).
- Before execution, QA Lead assigns the production origin, matching stage `.next/BUILD_ID`, candidate manifest, fresh QA-owned database and storage, fixture owner and time window. Preserve manifest/hash checks before and after. The runner's default source fingerprint does not cover every asset/data file; retain the full candidate manifest separately.
- Require isolated synthetic-only ingestion, with real phones/camera ingestion disconnected. Independently verify frame provenance locally before screenshots are captured or sent to reviewers. A simulation badge, scenario position input or a `source: synthetic` label alone does not prove the underlying frame bytes are synthetic. If isolation cannot be proved, do not run this camera-containing matrix. Real camera pixels and camera-containing screenshots stay local and must never enter model/image tools.
- Login uses role `admin`, actor ID `admin`, and only the environment variable `QA_DEMO_ACCESS_CODE`. There is no fallback secret in the JSON; do not echo the value or save cookies/auth headers/request bodies. All routes use fresh contexts.
- Fixture owner prepares paused `EQ-PROFILE-ROUTES` after its 1000 ms event, before its 8000 ms profile change, and paused `FG-FIRE` after its 1000 ms event. Both use scenario position input and `sk1265-at6`. Require known WORKER-B position, one uniquely matching active incident per mode, equipment workers A/B/C and fire-gas A/B. Equipment first/current records must contain A/B/C; fire-gas first/current records need A only. Do not assume fire-gas B receives guidance merely because B exists.
- Capture the actual current/expired status. A paused virtual clock does not stop wall-clock guidance expiry. No main-matrix state claims a live valid route. The WORKER-C no-route state checks the recorded `ROUTE_UNAVAILABLE` policy output and empty destination/route.
- No independent actor changes these fixtures during the matrix. Asynchronous supplements and expiration must remain visible and be recorded, never relabelled as original or fresh. If they change target geometry during a focused capture, retain the failed attempt and coordinate a new bounded attempt.
- This main JSON permits only `POST /api/session`. It does not select scenarios/equipment, progress time, save profiles/calibration, acknowledge incidents or submit worker responses. The general runner observes unexpected mutations and fails; it does not intercept/abort them. Isolation remains mandatory.

## Executable inventory

Five viewports: 375×812, 390×844, 768×1024, 1280×720 and 1440×900. Three route entries, all at `/`, contain 31 logical states; the harness expands them to **155 semantic cases**. Focused targets generate as many overlapping viewport frames as their real scroll geometry requires. Report semantic cases, frames and PNGs separately.

| Route/state | Planned observation | Scope |
| --- | --- | --- |
| entry-admin / unauthenticated | Login form, disabled mode choices, entry hierarchy | 5 cases |
| entry-admin / admin-connected | Explicit admin identity and both enabled mode choices | 5 cases |
| equipment-panels and fire-gas-panels / header-and-run-controls | Visible simulation identity, mode title, status counts, paused run controls | 10 cases |
| both / 3d-full | Real GLB canvas, completed site and SK1265 asset loads, full camera | 10 cases |
| both / 3d-risk | Risk camera selected, actual 3D stage | 10 cases |
| both / 3d-worker-b-selected | Worker-card B selection, pressed state and follow camera | 10 cases |
| both / 2d-full-zoom-reset | Real SVG, zoom in/out, reset, full scope and computed 12 px map scale | 10 cases |
| both / incident-selected-2d-locked | Unique active incident selection, pressed state, locked 2D camera | 10 cases |
| both / first-current-records | Every applicable first/current record, delivery and support state; preserve expiry | 10 cases |
| both / guidance-details-expanded | A/B equipment and A fire-gas original/current personalization, route and source details | 10 cases |
| equipment / unverified-profile-no-route-record | C has no destination, no route and recorded ROUTE_UNAVAILABLE action | 5 cases |
| both / admin-incident-controls | Administrator controls, disabled reasons, distinct final actions; no submit | 10 cases |
| both / worker-board-and-profile | All actual worker cards and B's expanded English profile | 10 cases |
| both / related-camera-and-event-ledger | Selected incident camera context and event history | 10 cases |
| both / tracking-camera-and-observations | Tracking toolbar, isolated camera-free/synthetic frame state, observation tables | 10 cases |
| both / calibration-all-fields | Calibration, all three marker offset details, UWB yaw, empty/actual values | 10 cases |
| both / settings-and-equipment-spec | Scenario, mode, position input, speed, facts and expanded manufacturer configuration | 10 cases |

Every screenshot needs direct layout, CJK, hierarchy, clipping and operability review on this frozen candidate. Canvas/resource presence alone does not establish a correctly rendered model or route. Main actions do not prove physical output, dynamic incident policy or measured performance. The harness retains its own `producer-browser-check` and `productAcceptance: NOT_RUN` labels; do not rewrite them into independent acceptance. Attach independent execution/review provenance separately.

The settings drawer is hidden below 1280 px until opened. The exact source-backed action selector `.scenario-rail .settings-toggle:visible, #scenario-settings > h2:visible` clicks the one visible toggle on narrow layouts or the already-visible heading on desktop. It is used once at the end of each mode route. Focus targets are the drawer's individual content children, so the real `#scenario-settings` overflow owner can scroll; capturing the owner's bounding box alone would not prove all its content was visited. No styles or DOM are rewritten. Generic focus coverage still does not prove horizontally scrollable table columns; independently inspect/scroll such tables in a followup if required.

## Six-crane interaction suite: separate runtime followup

Status: NOT_RUN. The main JSON deliberately contains no equipment writes. A later independently prepared interaction harness requires its own W3 grant and its own synthetic database/fixture. Run after the static suite or reset the fixture between viewport runs; the general surface runner loops **viewports first, then routes**, so inserting mutating crane states into the main matrix would change the next viewport's fixture.

All six presets and declared controls come from the frozen `data/equipment/catalog.json` and `EquipmentControls.tsx`:

| Preset option value | Displayed model | Rendered motion fields |
| --- | --- | --- |
| sk1265-at6 | Spierings SK1265-AT6 | 선회, 트롤리, 훅 높이 |
| tadano-gr250n4 | Tadano GR-250N-4 | 선회, 훅 높이, 붐 각도, 붐 길이 |
| liebherr-ltm1050 | Liebherr LTM 1050-3.1 | 선회, 훅 높이, 붐 각도, 붐 길이 |
| maeda-mc305 | Maeda MC305C-5 | 선회, 훅 높이, 붐 각도, 붐 길이 |
| liebherr-lr1100 | Liebherr LR 1100.1 | 선회, 훅 높이, 붐 각도 |
| liebherr-172ecb | Liebherr 172 EC-B 8 Litronic | 선회, 트롤리, 훅 높이 |

For each preset, under an explicitly writable, paused equipment fixture:

1. Open the narrow settings drawer if needed. Use supported action `select`, selector `[data-testid='equipment-select']`, and the exact option value above. Wait for the checked option to match, for that select to be enabled again, for the expected model in `[data-testid='selected-equipment-name']`, for `/assets/cranes/<preset-id>.glb` to complete, and for all `.scene-loading, .scene-failure` indicators to disappear.
2. Capture the actual 3D full scene and a paired 2D full scene; preserve geometry/state version and preset identity. A completed asset entry alone is not a visual pass.
3. Open `details.equipment-controls > summary`. For motion label L, scope the field as `details.equipment-controls label.field:has(> span:has-text('L'))`, its slider as the descendant `input[type='range']`, and its Apply button as the descendant `button:text-is('적용')`. The 선회 label also matches the bookended “책상 데모 제한” wording.
4. The supported harness `press` action can operate these native range sliders; `fill` cannot. Record the actual min/max/step/current value first. A bounded test may use Home then ArrowRight to request min+0.1, provided it differs from the observed pose and is valid under the catalog. Click that field's enabled Apply, then wait for the equipment selector to be enabled again and its Apply to return disabled. Capture the resulting model and independently verify the authoritative pose and expected articulated nodes before/after. Do not infer server motion from the draft label or a disabled button.
5. Repeat every declared field above, including all applicable trolley/hook/boom controls. Declare `POST /api/simulation` only for this suite and record authorized command kinds (`equipment`, `control`) without secret/session bodies. The general harness's path-only allowlist cannot distinguish these commands from other simulation writes; a separately reviewed interaction harness must preserve that narrower boundary.
6. Restore/reset only that suite's QA fixture through its approved owner workflow; report the result and cleanup. Selecting the old preset alone does not restore the old position: fixed-tower selection writes the catalog crane origin. Translation is an input capability, not a rendered slider, and requires a distinct scenario/measurement run. Declared absence of a motion field is not a missing-control defect.

Preset selection applies its `demoPose`, resets speed/heading and changes geometryVersion; fixed towers use the map crane origin (`src/server/simulation/commands.ts`). Rendered controls depend on catalog flags, movement limits and non-null pose values. No numeric UWB or real crane capability is inferred from these synthetic controls.

## Remaining independent runtime inventory

All items below are **NOT_RUN** and need explicit fixtures/observations beyond the main JSON.

| Area | Exact candidate surface or fixture | Evidence required |
| --- | --- | --- |
| Fresh route in both modes | EQ-PROFILE-ROUTES A/B; FG-FIRE A; `[data-testid='site-map'] .map-route[data-route-version]` and actual 3D lines | Warm UI first, owner refresh receipt, primary identity and expiry positive at both boundaries, server waypoints versus SVG transform, paired real 3D inspection. Frozen `tests/frontend/run-valid-routes.mjs` / supplemental plan describe a producer implementation; do not inherit its acceptance. |
| Current no-route in both modes | EQ-NO-ROUTE and FG-NO-ROUTE, 1000 ms event; A ROUTE_UNAVAILABLE, empty destination/route and blocked PATH-A/B/C | Approved owner preparation, fresh matched current guidance, no misleading route/destination/shelter. C's main-matrix historical no-route record does not cover these. |
| Expired, replacement and wrong-map/run route | Existing route renderer, current/first panels and worker cards | Actual stale envelope / revalidation fixture, suppressed active overlay, preserved immutable original, identity-based assertions. |
| 3D orbit and annotation selection | `[data-testid='site-canvas'] canvas`; `svg[aria-label='현장 위치 주석'] [data-annotation-id='WORKER-B'] button` | Supported `drag-unobscured-canvas` with `stateVersionSelector: .status-strip-version` and `projectionSelector: svg[aria-label='현장 위치 주석'] line`; stable version, actual projection change. Candidate annotation selector existence/visibility is a runtime precondition. |
| Concurrent incident A/B, pin and lifecycle | Incident list, risk/locked controls, related camera, final administrator actions | Two separate admin contexts, explicit transitions and immutable first/history checks, no silent repin, shared edge ownership, correct floor/camera. Static action visibility does not execute any transition. |
| Worker web preview | Public route `/worker`; separate worker session, guidance/response panels | New dedicated worker browser profile and explicitly scoped worker credentials/actions. Main suite intentionally uses admin only; its worker board is not this route and is not Android evidence. |
| Profile update/locale | `.profile-details` fields named preferredLocale, canUseStairs, needsAssistance, needsCompanion, speedMin, speedMax, voice, vibration | Actual save/invalidation, ko/en/unsupported fallback, unknown capability and validation errors, current versus original profile. Main B editor capture is read-only. |
| Camera/tracking failure states | `#tracking .camera-panel`, `#incident-camera .camera-panel`, tracking tables | Separately isolated synthetic no-frame, receiving, stale, disconnected, unavailable image and wrong-camera fixtures. Record exact expected errors; do not broadly whitelist failures in the main suite. Never substitute real camera pixels into model review. |
| Calibration save/error/reset | `#tracking .calibration-panel`; fields version, cameraId, cameraX/Y/Height, entity marker/height/reference/antenna, uwbYawRad, evaluationErrorM | Approved synthetic measurements or explicit empty values, real save/reset/validation, null handling. Never invent measured values to fill the form. Main opens offsets without saving. |
| Entry/authorization failures | Entry login, API errors and role-dependent controls | Wrong-code and role fixtures separate from normal login. No hardcoded access code; no credential output. |
| Scene fallback/loading | SceneBoundary and 2D fallback | Controlled asset/WebGL failure without hiding product errors; exact source-backed fallback selector must be verified for this fixture. |
| Other product routes | `/design-system`, `/markers/sheet.html` | Supporting primitive/print surface review and print dimensions where required; neither replaces actual product pages or physical marker accuracy. No popup navigation in this matrix. |
| Performance/accessibility | Both mode stages, all actionable controls, nested tables | Frozen warmup/180s/10Hz/per-version/1000-envelope protocols; 200% zoom, keyboard/focus traversal, reduced motion and assistive-technology observations. Screenshot counts or 300 ms waits are not measurements. |
| Physical/Android/model/source work | Actual phones, UWB, camera, APK, provider and Blender source | Separate owners/windows and acceptance cards. W3A does not launch them or claim their results. |

## Source binding and local-only validation

Read-only selector sources: frozen `tests/frontend/run-surface.mjs`, `browser-actions.mjs`, `focused-scroll.mjs`, `browser-observations.mjs`; `src/components/console/{entry-screen,safety-console,scenario-rail,worker-board,worker-card,profile-editor,run-controls}.tsx`; `src/components/scene/{SiteStage,SiteCanvas,StageCameraControls,EquipmentControls}.tsx`; `src/components/incidents/{incident-panel,guidance-record,incident-actions}.tsx`; `src/components/tracking/{tracking-panel,camera-panel,calibration-form,calibration-fields}.tsx`; `app/console.css`; frozen catalog/scenarios.

Hashes read during preparation:

| Frozen file | SHA-256 |
| --- | --- |
| tests/frontend/run-surface.mjs | 452315b83f491821bbd9e6e1231affc884c80d277c863d386bbbc5bad5616620 |
| tests/frontend/browser-actions.mjs | a3f7d2a06ae7228c92ecc8d6854bd61222f7eddbcdab59e91934c9e30f477416 |
| tests/frontend/focused-scroll.mjs | 54b92b43fc05389e9a43bd32380619cd8c9e753bfe71909765c03b849b2e010d |
| data/equipment/catalog.json | 7b0953b6cf6505d1421d4117ef3ac042af660d1e0f50331b5caa34fb7a544219 |
| data/scenarios/equipment/eq-profile-routes.json | e95e04db955846f453f8c118fe367979e5866116643e7133d52ad084eb93381f |
| data/scenarios/fire-gas/fg-fire.json | bde4e91470eaa90a03bf7b515c72563e01eba70aa06c9a7803f9cbd79764960e |

The following exact command is for QA Lead's **local contract parsing only**. It was not executed by this author. The frozen runner returns before Playwright loading, browser launch, source fingerprinting or requests when `--validate-only` is supplied. It does not require the secret or a production build ID in this mode:

```bash
node /home/b/.cache/gs-safety-ci.u7pR52/tests/frontend/run-surface.mjs \
  --validate-only \
  --build-type production \
  --source-root /home/b/.cache/gs-safety-ci.u7pR52 \
  --scenario /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/surface.scenario.v1.json
```

Expected enumeration: `CONTRACT_PARSED_ONLY`, `browserLaunched: false`, `expectedSemanticStates: 155`. The frozen validator checks route/state IDs, viewport dimensions and focus-target shapes; it does not prove selector matches, supported action semantics, fixture setup, source identity, safe frame provenance or visual quality. Parent-owned wrapper validation may add its own source/permission checks; do not replace or run that wrapper here.

