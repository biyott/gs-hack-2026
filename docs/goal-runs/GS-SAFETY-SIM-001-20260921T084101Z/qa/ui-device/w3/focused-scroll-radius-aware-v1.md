# Radius-aware focused coverage v1 — next-candidate preparation

Status: **SOURCE PREPARED; HELPER RUNTIME NOT RUN**. This is a separate QA helper, not a product change or a revised historical verdict. The frozen original and diagnostic v1 remain unchanged. Only syntax checks have run. A separately issued isolated helper-check grant is required before the command below; a later application capture requires its own candidate binding and run grant.

## API and freeze

- `observeFocusedTargetRadiusAware(locator)` returns one read-only DOM observation. It does not scroll or grant runtime authority.
- `walkFocusedTargetRadiusAware(page, selector, captureFrame, recordObservation)` retains the original native traversal. Both callbacks must be awaited, must not mutate/focus/scroll the page, and must preserve failures. `recordObservation({phase, frameIndex, evidence})` runs initially and immediately before each pre-/post-capture usability assertion. The caller must durably write it before returning and separately preserve thrown errors.
- `SOURCE_HELPER_SHA256`: `54b92b43fc05389e9a43bd32380619cd8c9e753bfe71909765c03b849b2e010d`, read from `/home/b/.cache/gs-safety-c3.eulo4t9w/tests/frontend/focused-scroll.mjs`.
- Helper SHA-256: `dc0ebe0cd361de57853cdcb190550994794b6e1f40072e8b5a18d9fca5b6e737`.
- Checker SHA-256: `d4faa1c11e17909f7dfabe89b19b38f1cd3b5ca171f6531e20fa5070252edfe4`.

The adjacent `focused-scroll-radius-aware-v1.freeze.json` pins helper, checker, documentation, unchanged diagnostic/original helpers, and frozen runtime entry files. The checker verifies these before/after the synthetic run. The dependency root supplies only Playwright and frozen helper utilities; it does not authorize a C3 application run. The standalone library does not perform binding checks itself: any later caller must bind and verify its own candidate/build, source-helper hash, library hash, scenario, grant, process, and read-only source state.

## Exact allowance and retained strict result

Every observation retains the original nine coordinates, hit labels, `targetHit` values, and raw `visible` predicate. `strictOriginalUsability` records the original visibility/horizontal-coverage decision and exact error. `radiusAware.visible` is separate. The checker also runs the untouched original walker independently on each synthetic fixture and records its actual error. Effective coverage may complete while `strictRawVisibilityAllFrames` is false; this explicitly records the strict discrepancy.

A missed sample can be allowed only when **all** of these are proven in the same synchronous observation:

1. The hit is a real ancestor of the target. Null and foreign hits are rejected.
2. The target has one supported, axis-aligned HTML box with ordinary paint and computed **pixel** corner radii. Percentages, unresolved expressions, transforms/zoom, non-round corner shapes, masks, clip paths, relevant filters/pseudo paint, and uncertain layouts cannot create an exception. A control/replaced-content target itself cannot claim empty control corners.
3. CSS radii use the one common normalization factor: the minimum of 1 and each side length divided by its adjacent radius sum. A sample must be inside the actual target border box, inside a corner rectangle, and strictly outside that normalized ellipse. A conservative lower bound on distance outside the contour must be at least 0.05 CSS px. Zero-radius corners and uncertain boundary points receive no allowance.
4. The **whole corner rectangle**, not only the hit point, has no intersecting rendered descendant box, text-range box, or foreign element/text box. Pointer-events do not suppress this inventory. Meaningful text/controls clipped by the target still block the exception. Generated or unbounded descendant/foreign paint disables allowances conservatively.

Each allowed/rejected sample records its reason, ancestor-hit status, normalized radii, ellipse value, margin, corner rectangle, and intersecting blockers. Target/ancestor/foreign boxes are not evidence of text readability or control operation. Decorative card backgrounds/shadows do not become product acceptance. Unsupported cases retain a strict failure when raw hits fail; no general CSS layout implementation is attempted.

Only the derivative's visibility predicate in `assertUsable` uses the effective result. The original root reset, scroll owner choice, clipping/fixed-sticky occluder handling, tolerance, eight movement attempts, 100-frame cap, gap/stall/overlap checks, horizontal coverage, stable size, and post-capture geometry comparison are retained. This does not add DOM-identity detection. Exceptions inside observation before it returns have no guaranteed returned record. Successful effective coverage is helper evidence, not visual/content/actionability acceptance.

## Isolated synthetic cases

| Fixture | Original strict | Effective expectation |
| --- | --- | --- |
| Camera-like 339 × 677.1875 box at (16, 118.859375), radius 14 px | Reject corner misses | Complete |
| Entry-like 260 × 581.5625 box, radius 14 px | Reject corner misses | Complete |
| Foreign overlay at a raw corner point | Reject | Reject |
| Foreign overlay with pointer-events none | Reject | Reject |
| Corner button with pointer-events none | Reject | Reject; control box blocks |
| Corner text with pointer-events none | Reject | Reject; text range blocks |
| Square box | Accept | Complete |
| Square box returning ancestor hits | Reject | Reject |
| Radius 14 with unsupported transform | Reject | Reject |
| Oversized elliptical pixel radii | Reject corner misses | Complete; common factor 4/7 |
| Percentage radii | Reject corner misses | Reject as unsupported |
| Tall radius-14 target in nested overflow owner | Reject corner misses | Multiple overlapping frames; positive owner scroll and root Y = 0 |

All pages are inline synthetic HTML on `about:blank`, with an offline context, service workers blocked, and every request aborted and counted. There is no application, provider, model, camera, device, or server access. Viewport PNGs, raw observations, exact strict/effective errors, hashes, and cleanup status are retained in fresh owned output even for failed fixture expectations. A successful helper check would prove only these synthetic assertions, not the next candidate or historical cases.

## Pending granted command

Estimated runtime: **20–45 seconds**, unmeasured. Internal browser cutoff is 75 seconds or grant expiry, whichever comes first; the external bound allows at most 88 seconds including forced termination. A timeout, setup error, missing case, changed input, unexpected request, or cleanup failure prevents `helperAssertionsSatisfied` from being true. Runtime failures must be preserved and investigated; do not repeatedly rerun under an expired grant.

```bash
timeout --signal=TERM --kill-after=3s 85s node /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/check-focused-scroll-radius-aware-v1.mjs --freeze /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/focused-scroll-radius-aware-v1.freeze.json --grant /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/radius-helper-check-grant-v1.json
```

The grant file is **not created or implied by this preparation**. The QA Lead must issue it with `id`, `phase: "RADIUS-HELPER-CHECK"`, `grantedBy: "/root/qa_lead"`, `resourceReleased: true`, `syntheticHtmlOnly: true`, `applicationAccess: false`, bounded `notBefore`/`notAfter`, the exact freeze-receipt SHA in `freezeSha256`, and `outputRoot` equal to `/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/ui-device/radius-helper-check`.

Static-only validation, already completed with exit 0:

```bash
node --check /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/focused-scroll-radius-aware-v1.mjs
node --check /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/check-focused-scroll-radius-aware-v1.mjs
```
