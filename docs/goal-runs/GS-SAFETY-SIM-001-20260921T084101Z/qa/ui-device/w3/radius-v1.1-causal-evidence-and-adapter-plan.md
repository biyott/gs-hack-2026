# Radius v1.1: retained causal evidence and QA adapter scope

The qMax correction has **actual retained layout-wrapper geometry**, not only an invented fixture. It does not establish that a real control passed a new hit rule.

Evidence: `evidence/qa/ui-device/candidate-1a7c95cd/focus-diagnostic/2026-09-21T16-49-25-237Z/camera-375.jsonl`, line 2, sequence 1, `before-assertUsable`, observed `2026-09-21T16:49:30.680Z`; file SHA `387aad9d4d8a69ca2994d3ce3db5f978af7565a24229cda4bf60c4cf6c1c523b`.

| Saved element | Border-box coordinates |
| --- | --- |
| `section.panel.camera-panel` | left 16, top 118.859375, right 355, bottom 796.046875; all four radii 14 px |
| Descendant `div.panel-content` | left 21, top 238.046875, right 350, bottom 791.046875 |

The descendant is recorded in sample 4's hit ancestry: `strong → div.empty-state → div.stack → div.panel-content → section.panel.camera-panel`. Its intersection with the bottom-right corner rectangle is `[341,350] × [782.046875,791.046875]`. Relative to ellipse center `(341,782.046875)`, qMax is `(9²+9²)/14² = 0.8265306122448981`; the conservative inside margin is `1.2720779386421437` px. Thus v1's whole-corner-rectangle rule would reject this real layout wrapper even though this intersection cannot occupy the cutout. V1.1's qMax change has a concrete geometric cause.

Frozen source corroborates the wrapper: `/home/b/.cache/gs-safety-c3.eulo4t9w/src/components/ui/primitives.tsx:30` renders `Panel` as a section with `div.panel-content`; `camera-panel.tsx:69` uses that component. `app/globals.css:220` gives the panel its border/radius, and line 429 overrides panel padding while line 437 styles its content wrapper. Geometry above comes from the saved DOM, not CSS inference.

Limits: the original bottom-right sample `(351,792.046875)` still hit ancestor `section.tracking-panel.stack` and failed strict visibility. The record lacks CSSOM corner-shape strings and is not an exhaustive descendant inventory. The synthetic inner-button fixture is additional adversarial coverage of the mathematical predicate; it is not saved evidence of a real control being obscured or passing. Keep both cutout control/text negatives. Neither this calculation nor v1.1 source readiness proves the camera view passes; global pseudo-paint uncertainty remains. Preserve v1.1 and its freeze unchanged.

## Bounded adapter implementation authorized after this source report

The immutable runner `/home/b/.cache/gs-safety-c3.eulo4t9w/tests/frontend/run-surface.mjs` has SHA `452315b83f491821bbd9e6e1231affc884c80d277c863d386bbbc5bad5616620`. Its static focus import is line 5; capture writing is lines 149–164; the focused branch is lines 166–175. One catch currently surrounds all selectors, and the helper can reject before its screenshot callback. The QA wrapper `run-surface-v2.mjs:52` merely selects that frozen executable; changing an unrelated helper import cannot affect it.

Implement only separately named QA files under `c4-surface-adapter-v1/`: a bounded runner copy, C4 grant/binding guard, focused evidence traversal, and separately granted inline-HTML checker. Import actions, observations, browser utilities, and dependencies from the explicitly bound immutable C4 root. Keep the historical scenario bytes unchanged: 31 states × five viewports = 155 semantic states; 66 focus selectors × five = 330 target attempts. Record adapter/helper/candidate/scenario hashes separately; do not patch candidate modules, use an ESM loader rewrite, or edit historical reports.

For each target, persist raw nine-point/strict/radius/CSSOM observations and an unchanged viewport PNG before deciding failure. Catch errors **per target** and continue the remaining selectors/states. Distinguish capture health from visibility. The original strict predicate and radius result remain recorded even when evidence collection continues.

Full tall-target PNG collection on an unsupported helper result needs an explicit evidence-only traversal: keep original native owner/reset, settle, eight adjustments, tolerance, range/gap/stall/overlap, size, horizontal and post-capture geometry checks, but record visibility failures rather than aborting the image sequence. This is not supported visibility coverage. Report `traversal.complete` separately from `strict.complete` and `radius.complete`; unsupported/global paint stays INCONCLUSIVE and real overlay/content misses stay visibility failures. Never substitute `visible: true`, mark evidence images as accepted focus coverage, or imply the untouched strict walker executed when only its raw predicate was evaluated.

An evaluator failure before observation, missing target, broken geometry, sink failure, or screenshot failure may prevent complete content capture. Preserve an attempted failure viewport/error, mark the target incomplete, and still attempt later targets. Do not manufacture a 330-target completeness result from placeholder records. Capture success, geometric range completion, and validated visibility are three distinct counts. Global generated-paint uncertainty can still prevent radius acceptance on real C4 screens.

The adapter needs its own fresh-DB/synthetic-only C4 process binding and run grant. The helper's single retry grant cannot authorize a 155-state application capture. The continuation checker must separately prove a failing first selector does not hide a later one, tall evidence continues with failed visibility retained, and genuine control/overlay failures are not promoted. No implementation or fixture result is a runtime PASS until a later granted run supplies that evidence.
