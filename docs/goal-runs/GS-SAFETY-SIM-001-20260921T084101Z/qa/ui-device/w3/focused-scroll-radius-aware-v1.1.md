# Radius-aware helper v1.1 — bounded retry preparation journal

Status: source preparation only; no new browser/runtime operation. QA Lead permits at most one future isolated helper retry, after a concrete change, new freeze, and new grant. No probe or automatic rerun is authorized. All v1 sources, freeze receipts, and failed-run evidence are retained unchanged.

## Preserved evidence and hypotheses

Source evidence: `evidence/qa/ui-device/radius-helper-check/2026-09-21T17-12-34-395Z/report.json` (SHA-256 `e9a6392f0d0bbf629d1af89d6291c952cb3bfad40f686a291a444e547ac4284d`) and `observations.jsonl` (`bd5cdc3ec24daf3340e854f1549f826182ac0cfc0d17b24f3cf2a28bd1edbe5d`). Recorded Chromium: `153.0.8010.12`. The report has 4/12 satisfied cases, eight failures, unchanged frozen inputs, no timeout, and empty request/page-error arrays.

Three distinct causal hypotheses guide this preparation:

1. **Serialization mismatch:** default circular corners were exposed as a valid semantic alias rejected by the narrow v1 string allowlist. Distinguishing evidence is the exact four computed strings for default, explicit `round`, and explicit `superellipse(1)` fixtures. The spec proves the alias; the old run did not record its actual string. Proposed correction: explicit equivalence, with raw strings retained.
2. **Actual non-round contour:** browser defaults, feature behavior, or a style cascade produced a different shape. Distinguish by observing default versus explicit round values and a supported explicit `bevel` negative in the same bounded fixture run. Unknown/non-round values must remain rejected; no inference from a radius alone.
3. **Fixture/runtime mismatch or additional blocker:** incorrect loaded helper/fixture, browser differences, or a later geometry/content blocker caused the failure. The old receipt's unchanged input hashes and sole unsupported reason on ordinary positives disfavor source drift but do not prove the remaining assertions succeed. Preserve exact fixture HTML/hash, browser version, geometry, all raw hits, and all rejection reasons in the future retry. Do not declare the fix verified until those cases execute.

The camera fixture's exact recorded border box is left 16, top 118.859375, right 355, bottom 796.046875, width 339, height 677.1875. Viewport is 375 × 812 at scroll (0, 0). Eight raw hits were `article.target`; only (351, 792.046875) returned `body` with `targetHit: false`. All radii were `14px`; the sole unsupported reason was `non-round-corner-shape`.

The entry fixture's box is left 16, top 118.859375, right 276, bottom 700.421875, width 260, height 581.5625. Its only raw miss was (272, 696.421875), also `body`; the other eight hit `article.target`. All radii were `14px`, with the same sole unsupported reason. Neither record contains computed corner-shape strings. Any claim that they returned `superellipse(1)` remains an unverified hypothesis.

## Primary semantic evidence

CSS Borders 4 defines `round` as an elliptic corner, identifies `superellipse(1)` as its equivalent, and makes round the initial behavior. Its property definition specifies the corresponding `superellipse()` computed value. `bevel` corresponds to `superellipse(0)` and is not equivalent. This supports accepting the exact round alias while retaining the existing ellipse mathematics. It does not identify the historical Chromium build's actual serialization, which remains unrecorded. [CSS Working Group specification, corner shaping](https://drafts.csswg.org/css-borders-4/#corner-shaping).

## Artifact journal and boundaries

Planned retained QA deliverables: `focused-scroll-radius-aware-v1.1.mjs`, `check-focused-scroll-radius-aware-v1.1.mjs`, this document, and `focused-scroll-radius-aware-v1.1.freeze.json`. These are separately named artifacts; no existing module, app/candidate source, previous report, scenario, or receipt is edited. The debugging skill's temporary-artifact cleanup guidance does not remove these explicitly requested evidence artifacts. No temporary process, port, environment override, or instrumentation is created during preparation.

## Minimal v1.1 change and proof

Every returned observation now records `radiusAware.rawCornerShapes`, keyed by the four physical corners, with the exact computed strings, plus `cornerShapeSupport`. No normalized string replaces the raw evidence. Accepted strings are exactly `round` and `superellipse(1)`. An empty string is eligible only when that longhand does not support `round`, retaining legacy radius-only behavior; an exposed but empty property is uncertain and rejected. No other superellipse parameter or shape is allowed. The current environment's serialization is still a hypothesis until the granted fixtures record it.

The parent identified a second static over-rejection in v1: a descendant intersecting the corner rectangle can be completely inside the actual ellipse. V1.1 clips each blocker rectangle to that corner rectangle and calculates the maximum ellipse value over the four vertices:

`qMax = max(abs(left-cx), abs(right-cx))²/rx² + max(abs(top-cy), abs(bottom-cy))²/ry²`.

This is the maximum over the whole axis-aligned intersection because each separable squared term reaches its maximum at an endpoint. Only `qMax < 1` with a conservative inside-distance lower bound of at least 0.05 CSS px proves that intersection cannot occupy the cutout. Such blockers remain recorded as `interiorOnlyOccupants`. Outside or uncertain intersections remain `occupants` and prevent an allowance. For radius 14 and a child ending 5 px from the outer right/bottom, the maximum is `(9²+9²)/14² ≈ 0.82653`, safely inside. A child extending to the outer corner has maximum 2 and still blocks. This does not ignore descendants merely because pointer events are disabled.

All original nine hit coordinates/labels/booleans, raw `visible`, and `strictOriginalUsability` remain separate from the effective result. Traversal, clipping, overlap, gap, stalled scrolling, size, horizontal coverage, and post-capture geometry checks remain as in v1. The underlying original helper remains separately executed in each synthetic case. No DOM-identity guarantee is added.

## Sixteen bounded fixtures and readiness limit

The twelve v1 fixtures are retained. Four additions exercise explicit `round`, explicit `superellipse(1)`, explicit non-round `bevel`, and a meaningful inner button ending 5 px from both corner edges. The existing pointer-events-none cutout text/button and foreign overlay negatives remain required. Percentage radii remain unsupported. Each case saves its exact synthetic HTML and SHA, then writes the initial full observation and raw four shape strings before its assertions. Explicit shape support and the returned serialization are recorded; unsupported or unexpected values fail the helper check rather than count as covered.

The global generated/unknown foreign-paint guard remains deliberately conservative. Static inspection confirms frozen `/home/b/.cache/gs-safety-c3.eulo4t9w/app/console.css:801` defines `.timeline-entry::before` and line 1315 defines `.site-legend > span::before`. They may trigger `unbounded-foreign-paint` even when offscreen. This is a **helper uncertainty/application-readiness limitation**, not proof that those markers obstruct a corner. V1.1 contains no bounded pseudo-element paint exclusion proof and does not claim readiness for the full 155-state application capture. A synthetic result cannot close that gap or revise historical application results.

## Freeze, API, and pending one-shot command

Helper SHA-256: `8c55033a7b4dca6d4edd3103dc8e6430176a96b1bd749ac8331e720a752a6002` (231 lines).

Checker SHA-256: `c6a89d0cc1dafdac72ef18d60840be9cd5c42ea20b111dbc6e9122b135cd34cc` (148 lines).

Source-helper SHA remains `54b92b43fc05389e9a43bd32380619cd8c9e753bfe71909765c03b849b2e010d`. The adjacent `focused-scroll-radius-aware-v1.1.freeze.json` pins new inputs and the preserved v1/failure evidence. Both new modules passed `node --check`; no module, browser, fixture, app, provider, or model was executed during preparation. Independent static review found no raw-nine-point/traversal or blocker-math defect; runtime verification remains pending.

API remains `observeFocusedTargetRadiusAware(locator)` and `walkFocusedTargetRadiusAware(page, selector, captureFrame, recordObservation)`. Any application caller still requires its own candidate/source/build binding and grant; this library grants none.

Estimated helper runtime: 20–60 seconds, unmeasured for v1.1. Internal cutoff is 75 seconds or grant expiry; external termination plus grace is bounded to 88 seconds. The fixed, exclusive `single-retry-attempt.json` in the new output root prevents a second launch. Preserve that marker even if setup or fixtures fail. Do not reuse the old grant, delete the marker, probe separately, or automatically rerun.

```bash
QA_W3=/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3
timeout --signal=TERM --kill-after=3s 85s node "$QA_W3/check-focused-scroll-radius-aware-v1.1.mjs" --freeze "$QA_W3/focused-scroll-radius-aware-v1.1.freeze.json" --grant "$QA_W3/radius-helper-check-grant-v1.1.json"
```

The new grant is not created by this preparation. It must carry `phase: "RADIUS-HELPER-CHECK-V1.1"`, `grantedBy: "/root/qa_lead"`, `id`, `resourceReleased: true`, `syntheticHtmlOnly: true`, `applicationAccess: false`, `retryOrdinal: 1`, `maxAttempts: 1`, valid `notBefore`/`notAfter`, the exact new receipt SHA as `freezeSha256`, and output root `/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/ui-device/radius-helper-check-v1.1`.

Any future failed or unsupported fixture remains failure evidence. Product/application acceptance remains NOT_RUN regardless of this helper result.
