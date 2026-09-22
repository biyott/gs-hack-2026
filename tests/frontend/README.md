# Frontend browser evidence

These are producer checks. The QA Lead owns G0 acceptance and its fresh database/candidate protocol. A browser pass never substitutes for device, model, Blender-source, or handoff evidence.

Run against a production build on a dedicated test server:

```bash
node tests/frontend/run-surface.mjs --base-url http://127.0.0.1:3000 --routes /,/design-system
```

The default viewports are 375×812, 390×844, 768×1024, 1280×720, and 1440×900. `--output-dir` selects an evidence directory; defaults use a fresh UTC timestamp. Each enumerated state produces a viewport PNG, full-page PNG, and JSON observation, plus a combined `report.json`. Reports contain route/state coverage, browser version, UTC times, frontend source hashes before/after, console/page/HTTP errors, failed requests, body copy, control sizes, canvas dimensions, offscreen elements, clipped text, broken images, horizontal overflow, PNG signature/dimension verification, and screenshot SHA-256.

For the coordinated isolated production preview, use the URL and source tree supplied by the server owner. No port is hardcoded in the scenario. `--build-type production` overrides the development scenario label, and `--source-root` fingerprints the actual candidate tree (including its `.next/BUILD_ID` when present) instead of an unrelated working directory. These are declared candidate metadata, not independent proof of how the server was built; retain the technical owner's build/manifest evidence with the final gate. Example command after those concrete values are supplied:

```bash
node tests/frontend/run-surface.mjs \
  --base-url "$QA_PREVIEW_URL" \
  --build-type production \
  --source-root "$QA_PREVIEW_SOURCE_ROOT" \
  --build-id "$QA_PREVIEW_BUILD_ID" \
  --scenario tests/frontend/console.scenario.json \
  --output-dir tests/frontend/artifacts/console-production-r2
```

Production capture requires `--build-id` to match the actual source root's `.next/BUILD_ID`, recorded with the source fingerprint. An output directory must be empty; old artifacts are never overwritten. `--validate-only --scenario path.json` parses and enumerates a contract locally without opening a browser or making requests. This parse-only check does not prove live selectors or rendering.

The preview must have an observer-capable demo session and a stable paused scenario fixture containing visible WORKER-B. The harness does not seed, reset, start, pause or otherwise prepare that fixture. The production matrix uses its isolated preview only, leaving the shared development port available to phone testing.

A failed page action, horizontal overflow, broken image, unexpected console/page/HTTP/request error, invalid PNG, missing capture, or concurrent source modification causes a nonzero exit. Offscreen descendants and text clipping are review leads; a labeled scroll area can be intentional. Independent visual reviewers must inspect every screenshot for compositing, design fidelity, CJK wrapping and the required interaction states. Capture again after the last product change.

`--scenario path.json` supplies the exact route and interaction inventory. States execute in order on the same route and viewport. Selectors should use accessible semantics or explicit test IDs agreed with the UI owner. Example contract (replace the example selectors with actual UI selectors before running):

```json
{
  "routes": [{
    "id": "showcase",
    "path": "/design-system",
    "readySelector": "main",
    "states": [
      {"id": "rest"},
      {"id": "focus", "actions": [{"kind": "focus", "selector": "#example-button"}]},
      {"id": "hover-mid", "actions": [{"kind": "hover", "selector": "#example-button"}], "afterActionMs": 100},
      {"id": "hover-settled", "afterActionMs": 250}
    ]
  }]
}
```

Supported actions: `click`, `focus`, `hover`, `fill`, `select`, `press`, `check`, `uncheck`, `wait-visible`, `wait-hidden`, `wait-all-hidden`, `wait-text`, `wait-resource`, `scroll`, `expect-text`, `expect-attribute`, `expect-visible-unique`, and `expect-map-scale`. Values use `value`; attribute assertions also use `name`. `expect-visible-unique` requires exactly one CSS-visible match with exact text; `inViewport: true` additionally requires the entire box inside the viewport. `expect-map-scale` verifies the actual SVG label's computed font size multiplied by its screen transform is 12±0.5 pixels and the label remains inside its map. `press` can omit a selector to use the keyboard. `wait-all-hidden` accepts multiple matching loading indicators. `wait-text` waits for a visible matching element containing its value. `wait-resource` requires a completed browser performance resource entry with the exact pathname in `value`. A loaded asset is only one readiness check: direct image inspection must confirm actual scene rendering. `fill` may use `valueEnv` to select an environment variable, with `value` as an optional local-demo fallback; the script does not record input values or request bodies.

Optional contract fields: `viewports`, `reducedMotion` (`reduce` or `no-preference`), `buildType` (recorded verbatim), and `sourceScope` (explicit dependency paths for an isolated component gate). The default fingerprint covers all app/src/packages sources and root config. A component-specific scope must list every rendered dependency; it is not a full product candidate manifest. Explicit expected states fail when missing; the runner does not invent state coverage.

Each route may declare `setupActions` before its named states. A setup action may label its observation phase with `eventPhase`; later named states replace that phase. A state may declare `focusTarget` as a selector or selector array. The focused walker uses the actual nearest scrolling overflow owner, captures overlapping viewport frames and records target bounds, visible ranges, ancestor scroll positions and occlusion. With a nested owner it restores the document origin and never falls back to window scrolling; when the document is the owner, normal window scrolling remains available. The recorded `scrollPolicy` makes this choice explicit. Focused frames do not generate misleading document full-page companions. `report.semanticStates` distinguishes the expected logical inventory from `report.captures` and `pngCount`; one logical state can require multiple frames. Missing or incomplete focused coverage fails the run. `node tests/frontend/check-focused-scroll.mjs <fresh-output-path>` exercises tall targets in an offline, zero-request inline fixture; its results are QA algorithm evidence only.

The console contract uses a real observer login and real GET/SSE traffic. `expectedHttpErrors` narrowly declares unauthenticated same-origin `GET /api/session` responses as expected 401 (including matching browser resource errors); original events remain in evidence. Each rule requires `method`, `path`, and `status`, with optional `maxOccurrences` (default one) and `beforeMutation` (only before any non-read request). The development console empirically issues two initial session GETs, so its contract permits at most two 401s before login. Other errors fail, including any 401 after login begins. `allowedMutations` records an allowlist of same-origin `method`/`path` pairs; the console permits only `POST /api/session`. Any other observed mutation fails the report. This is observation, not request interception. No route response or screenshot data is mocked. A fresh browser context per viewport prevents role/session leakage. Mode and camera changes are local view actions; fixture owners retain simulation/incident/worker mutations. Captures are labelled current state because another owner can legitimately change the shared run.

Run `--scenario tests/frontend/console.scenario.json` for ten actual entry/observer/equipment/fire-gas states at all five widths. It records selected model/version copy, run ID/state version, camera mode, position provenance, SVG hazards/routes and completed resource sizes. Read-only camera risk/full, zoom/reset, 2D/3D, canvas orbit and WORKER-B annotation selection are exercised. `drag-unobscured-canvas` chooses a segment whose endpoints hit the actual canvas, performs a real pointer drag, and requires projected annotation anchors to change; before/after coordinates and the unchanged scene state version are retained in `actionResults`. A changing scene version fails the orbit check rather than attributing a live update to camera input. Annotation selection requires that the current shared fixture actually contains a visible WORKER-B. This contract is labelled development; use a separately identified production candidate/contract for the final build gate. The optional `QA_DEMO_ACCESS_CODE` supplies a configured local access code; the public local-demo default is used otherwise.

`settleImages: true` scrolls pending images into view, waits for native image decoding with a 15s bound, then restores window and nested scroll positions before observation/capture. It changes no image or source attributes. This prevents valid offscreen lazy images from being misclassified as broken and ensures full-page captures include them. `node tests/frontend/check-lazy-image.mjs` verifies this with a valid offscreen image on an isolated harness-only server. All fixture artifacts are labelled `harness-only-fixture` / `harness-regression-only` and cannot substitute for application captures.

All failed requests fail by default. `expectedRequestFailures` can declare a narrowly expected cancellation using exact same-origin `method`, `path`, `query`, `error`, executing `state` ID and `maxOccurrences`. The console allows only one `GET /api/events?mode=equipment` cancellation with `net::ERR_ABORTED` during the switch to fire-gas; this is the previous mode's intentional EventSource cleanup. Other API, SSE, asset or frame failures fail. `node tests/frontend/check-request-failure.mjs` runs an isolated local-browser regression that deliberately aborts a request without a console error and requires the runner to return FAIL. These fixture artifacts are harness-only evidence, never product screenshots or acceptance.

The lower-panel setup uses the exact phase `fire-gas-initial-mode-selection` for that initial cancellation. It does not permit later cancellations or an unspecified setup error. The valid-route monitor separately permits one equivalent startup cancellation and one active-mode cancellation during context cleanup, with original events retained. `node --test tests/frontend/check-valid-route-monitor.mjs` checks the boundaries without browser or server activity.

Use `--probe` to verify only the local browser runtime with a minimal data page. Probe artifacts are readiness evidence and carry `productAcceptance: NOT_RUN`.

Browser selection uses `QA_BROWSER_CHANNEL`, then `QA_BROWSER_EXECUTABLE`, then an installed full Chromium browser under the Playwright Linux cache. `PLAYWRIGHT_MODULE_PATH` can point to an existing Playwright `index.mjs` when the project dependency install is still in progress. The full browser is preferred over `chromium_headless_shell`. The coordinated production preview uses an explicitly released observer session; private input comes from the environment, is redacted from error strings, and is not retained as input values, request bodies, cookies or auth headers.

The final production supplements and the exact private PIN mapping/fixture-owner handshake are documented in [supplemental-capture-plan.md](supplemental-capture-plan.md). `console-lower-panels.scenario.json` covers 18 logical states across both modes and three widths, with real overlapping scroll frames. `run-valid-routes.mjs` warms both modes before waiting for an owner nonce receipt, then captures eight route views across two widths without refreshing fixtures. Its local schema/identity/freshness/SVG checks are exercised by `node --test tests/frontend/check-valid-route-evidence.mjs`; these pure checks produce no product evidence. The specialized route monitor guards unexpected writes; unlike the general surface monitor, it aborts them as well as failing the report. Neither runner substitutes network responses.

Frozen performance tests (180s foreground frame samples, 10Hz input, 20 guidance versions per mode, 1000 ordering envelopes) belong to an explicit fixture-driven run. This visual harness does not infer them from screenshots or a short page load. It also does not claim 200% zoom, assistive technology, camera latency, or Lighthouse results.
