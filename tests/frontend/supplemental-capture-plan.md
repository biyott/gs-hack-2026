# Bounded production supplements

Status: preparation only. No browser/API/fixture action is authorized until the frontend owner releases the replacement production candidate after the current phone/contract fixes. Preserve `console-production-r1` unchanged as the expired-guidance candidate, including its automated PASS and independent REVISE findings.

## Candidate and sequence

1. Tech supplies the new preview URL, immutable source root, BUILD_ID and candidate identity. Verify those files before launch; use that source root for all before/after fingerprints.
2. After the tracking gate releases the server, rerun the complete 50-case console matrix on the replacement candidate. Verify persistent simulation identity at every width. Retain actual stale/expired state; do not refresh guidance solely to make this general matrix appear fresh.
3. Capture the bounded lower-panel supplement below through native scrolling. These panels do not require fresh route guidance.
4. Run the valid-route supplement last, one width at a time. Warm real observer pages, scene assets and current-mode UI **before** the fixture owner refreshes authoritative guidance. Signal `READY_FOR_FIXTURE_REFRESH` only after both mode pages are ready, then the owner refreshes the fixture through its authorized real API workflow. The browser owner sends no fixture commands.
5. Close all browser contexts immediately after capture, report cleanup, and review stored artifacts only. Final review uses a complete fresh set for the actual new candidate.

No device/session credentials, cookies, auth headers or request bodies are written to evidence. Read the preview's private PIN locally and map only the observer login input; never print its value.

## Lower panels: 18 logical states with overlapping viewport frames

Executable contract: `console-lower-panels.scenario.json`, using `run-surface.mjs` and `focused-scroll.mjs`. Viewports: 375×812, 768×1024, 1280×720. Both modes are covered at each width, using paused EQ-PROFILE-ROUTES (WORKER-A/B/C) and FG-FIRE (WORKER-A/B only). Each mode/width has three logical states:

| State | Focused target |
| --- | --- |
| `first-guidance-a` | Immutable original WORKER-A record in `[aria-label="최초 안내 기록"]` |
| `current-guidance-delivery-a` | WORKER-A `.incident-worker-guidance`, including current guidance and delivery/support status, followed by the observer permission note |
| `worker-board` | Each actual `.worker-card` separately: A/B/C for equipment, A/B for fire-gas; fire-gas C absence is asserted |

The 18 logical states contain 33 explicit focus targets before additional overlap frames; report actual logical-state, frame and PNG counts separately. Scroll the actual ancestor panel/window to each target and record every relevant scroll position, target bounds and clipping ancestor. Account for sticky/fixed occluders, including the phone header; require sampled hit tests and full-width overlapping visible ranges. Preserve the original requested viewport. If a target is taller than the usable viewport, add explicit overlapping frames; never claim a blank full-page companion shows hidden content. No CSS height/overflow changes, DOM edits or stitched substitute screenshots. All copy visible in each target, including the new device-confirmation status labels, receives direct review.

Observer sessions deliberately have no `.incident-actions` controls; their permission note and delivery/support state are covered. This does not claim interactive operator/admin support controls. Collapsed details stay collapsed, independent worker/device pages remain separate, and the tracking owner captures CCTV/calibration tables. The source-verified active incident selectors require exactly one active equipment hazard or fire incident in its corresponding fixture and fail if this precondition is absent.

## Valid routes: eight frames, two fresh fixture windows

Viewports: 1440×900 first, then 390×844. Four captures per width:

1. Equipment valid-route 2D.
2. Equipment valid-route 3D.
3. Fire-gas valid-route 2D.
4. Fire-gas valid-route 3D.

Open two real observer pages for the width, one per mode. Warm actual GLB resources and both view switches before emitting readiness. The fixture owner then regenerates genuine 60-second guidance. Wait for guidance generated after the browser readiness timestamp, matching the active run/map/mode and known worker positions. Require at least two authoritative waypoints and a non-null route version for the applicable worker. Observe freshness at capture start **and end**; remaining lifetime must be positive. Do not require a full 60 seconds remaining after creation, alter timestamps, extend expiration, inject snapshots or mock response data.

Keep preparation out of the freshness window. Capture immediately after actual SSE propagation, with each mode's 2D/3D pair adjacent. Before starting the second width, close the first width and repeat the warm/readiness/owner-refresh sequence. If the minimum expiry is too close to finish a pair, record the attempt and coordinate a new authoritative refresh; never relabel an expired picture as valid.

Evidence for each frame:

- UTC start/end, real guidance generated/expiry timestamps, run/map/mode IDs, worker and guidance IDs, route version, action, authoritative waypoint coordinates and position provenance from an authenticated read-only snapshot.
- Current rendered state version and UI `현재 안내`/expiry status, retained verbatim.
- For 2D: visible `[data-testid="site-map"] .map-route[data-route-version]`; record `title`, version and `points`, then compare the rendered points with the authoritative waypoints under the documented map-axis transform.
- For 3D: visible actual route lines in the screenshot, actual GLB readiness and the immediately paired valid 2D/server waypoint evidence, compared directly by the visual reviewer against the frozen `SceneOverlays.tsx`/coordinate code. The current candidate uses anonymous Drei `Line` objects; do not infer route presence from canvas existence or annotations, and do not claim machine-readable Three route identity. No new product telemetry or instrumentation is needed for this manual substantiation.

All fixture writes belong to Tech/backend owners. Browser actions remain observer login, local mode/camera/view/selection changes, scrolling and read-only API inspection. Proposed output directories are `console-production-r2`, `console-lower-panels-r1`, and `console-valid-routes-r1`; if a run already exists, use a new suffix and preserve its failures.

## Exact launch and owner handshake

Do not run these commands until the frontend owner releases the replacement preview. All three runs require the supplied source root's real `.next/BUILD_ID`; use fresh output paths. Main/lower accept an empty directory, while the route runner requires a path that does not already exist. Keep supplied Tech manifest provenance outside the output path until the run has completed.

The private preview file uses `GS_DEMO_PIN`; the runners require `QA_DEMO_ACCESS_CODE`. This wrapper reads only that key and never prints the value. Supply the appropriate runner and arguments after the candidate root:

```bash
node --input-type=module - "$QA_PREVIEW_SOURCE_ROOT" run-surface.mjs \
  --base-url "$QA_PREVIEW_URL" --build-type production \
  --build-id "$QA_PREVIEW_BUILD_ID" \
  --scenario tests/frontend/console.scenario.json \
  --output-dir tests/frontend/artifacts/console-production-r2 <<'NODE'
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { parseEnv } from 'node:util';
import { pathToFileURL } from 'node:url';
const [root, runner, ...args] = process.argv.slice(2);
if (!['run-surface.mjs', 'run-valid-routes.mjs'].includes(runner)) throw new Error('Unknown QA runner');
const pin = parseEnv(await readFile(join(root, '.env.preview'), 'utf8')).GS_DEMO_PIN;
if (!pin) throw new Error('Private preview PIN is missing');
process.env.QA_DEMO_ACCESS_CODE = pin;
const file = resolve('tests/frontend', runner);
process.argv = [process.execPath, file, '--source-root', root, ...args];
await import(pathToFileURL(file).href);
NODE
```

For lower panels, use the same wrapper with `--scenario tests/frontend/console-lower-panels.scenario.json --output-dir tests/frontend/artifacts/console-lower-panels-r1`. For valid routes, use `run-valid-routes.mjs` and these arguments (omit the surface-only `--build-type` and `--scenario`):

```text
--base-url <released-origin> --build-id <actual-BUILD_ID>
--output-dir tests/frontend/artifacts/console-valid-routes-r1
--handoff-dir tests/frontend/artifacts/console-route-handoff-r1
--handoff-timeout-ms 300000
```

The route runner warms separate observer contexts for both modes at one width, including the real selected GLBs and both view toggles, then creates a unique `<width>x<height>-<nonce>.ready.json` and emits its `readyPath` and `releasePath` on stdout. The ready record contains:

```json
{
  "event": "READY_FOR_FIXTURE_REFRESH",
  "nonce": "<actual UUID from runner>",
  "viewport": { "width": 1440, "height": 900 },
  "readyAt": "<actual UTC time from runner>",
  "buildId": "<actual candidate BUILD_ID>",
  "modes": ["equipment", "fire-gas"]
}
```

Only after reading that readiness record, Tech performs its authorized real fixture refresh for **both** modes and leaves them paused with known positions: equipment A/B have `FOLLOW_VALIDATED_ROUTE`, fire-gas A has `FOLLOW_VALIDATED_ROUTE`. Each applicable guide must have a destination, step, route version and at least two waypoints, generated at or after `readyAt`. Tech records the actual completion time and atomically publishes exactly this release object at the runner's `releasePath`:

```json
{
  "event": "FIXTURE_REFRESH_RELEASED",
  "nonce": "<same UUID>",
  "viewport": { "width": 1440, "height": 900 },
  "readyAt": "<same readiness time>",
  "refreshCompletedAt": "<actual owner refresh completion time>",
  "releasedAt": "<actual receipt publication time>"
}
```

No additional release fields are accepted. `refreshCompletedAt >= readyAt` and `releasedAt >= refreshCompletedAt`, with no future publication time. Publish a temporary JSON file in the same directory and atomically rename it to the new `releasePath`; never reuse a prior nonce. Writing a partial file directly to `releasePath` is not supported. The browser runner does not refresh fixtures, does not generate this owner receipt and does not accept elapsed time as release.

After release it waits for matching real snapshot/UI versions, reselects full camera locally because a new incident may have changed the camera, then captures adjacent equipment 2D/3D and fire-gas 2D/3D views. Each pair preserves the same worker profile/provenance and complete primary guidance context: identity, primary version, hazards, route, profile, locale, message and original time window. The full envelopes remain in both before/after records. A forward `supplement` may change only the six fields excluded by the candidate's database lineage policy: eventId, guidanceVersion, updateKind, supplementalExplanation, evidence and mode. Version rollback, same-version rewrites, new primary guidance or any changed primary context fail. This permits the genuine asynchronous supplement observed in failed R1 without ignoring versions or route changes. Every screenshot retains positive lifetime at both boundaries. Both mode contexts close before the next width begins its own warm/readiness/owner-refresh window (two contexts per width, four across the run). On expiry or error, the failed attempt remains and all contexts close; coordinate another run with a new output path and fresh nonce rather than editing evidence.

`valid-route-browser.mjs` guards against unexpected non-read requests: only the UI login POST is allowed; other writes are aborted and fail the evidence. Read responses are never substituted. Actual snapshots come from authenticated `GET /api/simulation?mode=...`; the real catalog supplies equipment asset paths. Parsed evidence deliberately excludes unrelated response fields. Mechanical success is `REVIEW_REQUIRED` until independent reviewers inspect the actual 3D route lines against paired SVG/server waypoints and the candidate scene code.

Preparation validation is local only: `node --check` on the QA modules, both surface contracts via `--validate-only`, and `node --test tests/frontend/check-valid-route-evidence.mjs`. None of these preparation checks launches a browser or contacts a server. The focused-scroll helper still requires actual runtime exercise after release.

## Build04 follow-up paths

Build03 main R2 completed its independent dual review. Lower R2 retained complete readable target content but needs an evidence-only scroll repair; fresh-route R1 remains a failed, partially captured run. Preserve all three directories. The coordinated next run uses `console-lower-panels-r3`, `console-valid-routes-r2` and `console-route-handoff-r2`, after the tracking owner's contexts close and the frontend owner explicitly releases build04. A prepared four-state `console-build04-smoke.scenario.json` is optional only if the tracking owner's actual 375/1280 console captures do not cover bootstrap/header/scene. No extra main50 run or duplicate smoke is implied.
