# C4 keyboard and native zoom supplement — source v1

Prepared by `/root/qa_lead/qa_ui_device/c4_accessibility_supplement`. Runtime is **NOT_RUN**. This file creates no grant and is not an acceptance decision.

## Requirement and scope

The frozen `DESIGN.md` v1.0.1 sections 4/8 require 375px, 200% zoom, long 80-character identifiers, bilingual text, keyboard operation, visible 2px accent focus with 3px offset, and labels/landmarks. `qa/ui-device/ac15-visual-performance.md` UI15-01/UI15-03 require actual browser observations. The C4 local Next.js accessibility guide was read before preparation; this runner changes no product source. The existing full surface matrix and performance protocol remain separate.

This bounded supplement uses fresh isolated browser contexts at 1440×900, 768×1024 and 375×812, each with both delivered modes. It records Tab traversal (up to 160 actual Tab presses per target), Shift+Tab then Tab return, and Enter/Space activation. No `focus()` or DOM rewrite is used to manufacture keyboard reachability. Targets are native mode entry, scenario select, 2D map, full extent, equipment details, selected worker profile details, delivered guidance details, and mode exit. Missing or unreachable targets remain explicit observations; they do not become PASS. It records focus-visible, outline width/style/color/offset, target/text rectangles, nine raw hit samples, scrollable/clipping ancestors, document overflow, actual viewport/DPR, fonts and landmarks. Rounded-corner raw hit misses are retained without blanket product-failure inference. Screenshots and computed metrics need independent visual review.

The scenario select is reached through Tab, its selected value and full option text are recorded, then `Alt+ArrowDown` requests the native option menu and `Escape` closes it. No selection-changing key or confirmation is sent. Before/after selected index and value must match, with all scenario POSTs still blocked. The 768px collapsed select may truncate its label; this alone is not a product failure. Native popup pixels may be absent from viewport screenshots, so accessible full text, actual visible popup text and screenshot scope remain distinct facts until image review.

The only server POST allowed is exact admin session setup using the private C4 PIN. Same-origin GET/HEAD/OPTIONS support the existing UI. All simulation, profile, support, incident, calibration, camera and other mutations are blocked and recorded. Mode/map/detail actions change client presentation only. This does not exercise locked/follow camera modes, full tab-order accessibility, screen readers, hover/error/loading/dialog states, normal-motion behavior, physical display, or audio/haptics. Context reduced-motion setting is recorded in this method; it is not proof of all reduced-motion animations.

## Native 200% method and boundaries

At each mode/viewport, save a baseline, press actual `Control+0`, then five actual `Control+Equal` chords. Record DOM geometry after every chord. The standard sequence is attempted, not presumed. Native 200% is recorded only if the reset baseline has DPR 1, the requested layout width/height and visualViewport scale 1; the final DPR doubles; layout viewport width/height halve within 0.03 ratio tolerance; visualViewport scale stays unchanged; and root/body computed CSS zoom stay unchanged. This separates native layout zoom from pinch zoom and CSS zoom. No CDP emulation, CSS zoom, transform, injected style, or shortened viewport is a substitute. Failure to observe that signature remains `UNRESOLVED_NATIVE_200_PERCENT`; no repeated alternative attempts are hidden. On observed native zoom, the full-range and equipment-detail keyboard interactions are repeated. Reset is attempted and its actual geometry retained before leaving the mode. A shortcut may be unsupported in this headless full-Chromium configuration.

English evidence is limited to existing `.guidance-primary[lang='en']` and `.worker-action[lang='en']` delivered content. Each rendered item is scrolled into view through the browser's existing scroll containers and captured with its text/geometry; the scroll is explicitly evidence navigation, not keyboard reachability. Exact text, language and containing worker/incident text are preserved. Missing English content remains count zero; no global English locale switch is invented. Paused current guidance may expire, so original English incident guidance and current worker guidance are not interchangeable.

The existing public application/scenario sources examined do not provide an intentional 80-character ID fixture. This case remains **NOT_RUN**. The runner never rewrites product DOM text or configuration to imply such coverage.

## Grant and command

The main UI owner must issue a new file under `evidence/qa/ui-device/candidate-cd8a2428/` after acquiring a serial browser window. Required fields:

- `id`: `W3A-C4-ACCESSIBILITY-<unique>`; `parentGrant`: `W3A-C4-<id>`; `phase`: `ACCESSIBILITY-BROWSER`; `grantedBy`: `/root/qa_lead/qa_ui_device`.
- Exact `candidateId`, `sourceSha256`, `buildId`, `serverPid`, `baseUrl` = `http://127.0.0.1:4103`; `scriptSha256`, `bindingSha256`, `processSha256`, `freezeSha256`; `provenancePath` and `provenanceSha256`.
- `parentGrantedAt <= grantedAt <= validFrom < expiresAt <= parentExpiresAt`, all parseable UTC timestamps. The main owner is responsible for the real parent bound; source preparation does not extend the parent window.
- `syntheticOnly`, `retainedRealFramesAbsent`, `realSendersExcluded`, `exclusiveBrowser`, `noConcurrentBlenderOrPerformance`, `nativeZoomAttemptAuthorized`: all true. `serverMutationsAllowed`: false (admin login remains the documented setup exception); `maxAttempts`: 1.
- `outputRoot`: `/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/ui-device/candidate-cd8a2428/accessibility-supplement-v1`.

Use the existing main-owned fresh C4 process/provenance receipt schema, private database/PIN/admin session, actual PID/start ticks/cwd and process environment. No server starts, setup fixtures, mutations, model actions, ADB or camera operations are performed by this runner. Both modes must already be paused with `positionInput=scenario`. Every screenshot separately rechecks `/api/tracking` and requires no camera and zero received frames. Actual camera content retained after stop still prohibits capture.

Exact future command (the two `w3a-...-01.json` files below are main-owned receipts, not created here):

```bash
timeout --signal=TERM --kill-after=3s 480s node /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/c4-accessibility-supplement-v1.mjs --binding /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/candidate-binding-c4.v2.json --grant /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/ui-device/candidate-cd8a2428/w3a-accessibility-grant-01.json --process /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/ui-device/candidate-cd8a2428/w3a-process-01.json
```

Plan 4–6 minutes, reserve up to 8 minutes inside the real parent/subgrant interval. One exclusive attempt file per granted ID prevents unrecorded reruns. Internal grant expiry closes the browser. Every focus capture and mode step persists the report; finalization closes contexts/browser and checks frozen inputs. An external kill may prevent a final closure receipt; report that as incomplete rather than claiming successful cleanup. PNG signatures, dimensions and hashes are recorded; compositing remains pending actual image review. No browser or helper runtime has been executed during preparation; only `node --check` is authorized now.

## Source review

Independent source reviewer: `/root/qa_lead/qa_ui_device/c4_accessibility_supplement/accessibility_source_review`. Review includes the frozen candidate control source and complete supplement. Its durable receipt is additive and separate from the source freeze to avoid circular hashes. Source READY permits later consideration for a grant; it is not a runtime or product PASS.
