# C6 independent code review

**Scoped verdict: PASS with one nonblocking static finding.** No demonstrated blocking defect in the C5 → C6 delta for a required product state was established. The annotation algorithm does not guarantee priority retention for every otherwise accepted input; the exact counterexample and reachability limits are recorded below. This is not overall product acceptance or a declaration that QD011/12/13 have passed fresh visual/runtime QA.

- Issuer: `/root/qa_resume/c6_review_code`, an independent read-only leaf delegated by `/root/qa_resume`.
- Review window: 2026-09-22, approximately 00:04–00:13 UTC.
- Candidate: `sha256:892f975f083d159e9d354e1bda511a2cf1b81bc4964a0c3335f69d9a498ca40b`.
- Source: `a7b49298f553030d30674e7b8397ca08a5304cd54cf0f1f678269068e92da411`.
- Stage: `/home/b/.cache/gs-safety-c6.pSgWxT`.
- Build ID: `QS7DkAZLSyX00oQ4fvGHL`.
- Full HEAD: `9dc020a7c0160af17e2ac9157dcb8c390890309a`; HEAD alone does not identify this candidate.
- Comparison stage: `/home/b/.cache/gs-safety-c5.H4mElI`.

## Identity, authorization and scope

Read the [G3 C6 freeze](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/g3-freeze-c6.json), the frozen [r5 implementation binding](/home/b/.cache/gs-safety-c6.pSgWxT/docs/contracts/implementation-binding-v1.0.4-r5.json), the correction authorization/producer source-ready receipt, and the current [independent QA receipt](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/g4/candidate-892f975f/receipt-validation.json). The r5 authorization records the contemporaneous Root QD013 instruction in addition to QD011/12. No authority was inferred from mutable source.

Independently rehashed all **1,026 source files**, checked all six r5 source bindings, and recomputed the source digest and candidate ID from the manifest identity structure: all matched, with zero source failures. Compared both source tables: **six changed files, one added r5 binding, zero removals**. The complete changed-source comparison is preserved in [source-delta.diff](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/reviews/candidate-892f975f/code/source-delta.diff).

This lane also independently hashed G3, the staged manifest/r5, build receipt and BUILD_ID. G3 SHA-256 is `537c1411b1dc3a1328aa098a58e789361bd5e7982a23ff776f745fef13dd3f50`; manifest SHA-256 is `2325d673562225a0daf24fb7da060a65e3aab6091e300971e3ea3a83842f1792`. The current QA receipt is `RECEIPT_VERIFIED`, records 1,026 sources / 673 artifacts / 28 sidecars with zero failures, and binds that exact G3 hash, candidate, source and build. Its SHA-256 when read was `c42795855bbdc2f0f64f6dfcc6de28bf658b5689e5883315777465f86222c29c`. Artifact contents were rehashed by the parent QA receipt, not rerun by this code lane. Full observations are in [binding-audit.json](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/reviews/candidate-892f975f/code/binding-audit.json).

The review used the repository R&R/QA evidence rules, programming TypeScript guidance, frontend design/perfection guidance, frozen DESIGN.md, and installed Next.js client-boundary/CSS documentation. The assigned lane is source review: no application, browser, provider, device, Blender, performance interval, production import, product test or build was executed. Only this lane's report/evidence files were written. C5 reports and raw QD011/12/13 FAIL records remain unchanged; no C5 behavioral PASS is transferred.

## Requirement review

| Change | Source-backed result |
| --- | --- |
| Stage view buttons and range minimum | Removing the shorter overrides exposes `.button { min-height: 44px }` at [globals.css:165](/home/b/.cache/gs-safety-c6.pSgWxT/app/globals.css:165) and the shared native input minimum at [globals.css:281](/home/b/.cache/gs-safety-c6.pSgWxT/app/globals.css:281). The narrow-screen stage override only adds `flex: 1`; it does not restore a smaller minimum. Existing handlers, disabled state and focus rules are unchanged. Actual rectangles and native slider interaction remain browser QA matters. |
| Worker targets and collision extent | [annotation-layout.ts:1](/home/b/.cache/gs-safety-c6.pSgWxT/src/components/scene/annotation-layout.ts:1) now supplies 98 × 44 dimensions to both layouts. The unchanged [SceneAnnotations.tsx:99](/home/b/.cache/gs-safety-c6.pSgWxT/src/components/scene/SceneAnnotations.tsx:99) uses those dimensions for the SVG foreignObject. The added [console.css:1550](/home/b/.cache/gs-safety-c6.pSgWxT/app/console.css:1550) makes the native worker button fill it; global border-box sizing includes padding/border in that extent. Both 2D and 3D call the same component. |
| Dense layout geometry | The fit guard ensures at least one column and row for finite real viewport dimensions. Packed spacing is 102 horizontally and 48 vertically, leaving a 4 px gap around 98 × 44 rectangles. The floor formulas keep the final rectangle within the 4 px margin. At 390 × 180 the grid has nine slots, enough for the eight-anchor fixture. Spreading the original anchor preserves its identity/position/priority. Offscreen filtering and deterministic priority/ID ordering precede both layouts. Cardinality never decreases relative to the greedy result. Universal priority retention has the exception below. |
| Full selected scenario | [scenario-rail.tsx:92](/home/b/.cache/gs-safety-c6.pSgWxT/src/components/console/scenario-rail.tsx:92) derives the visible companion directly from the same catalog/snapshot lookup already used for duration and coverage. It introduces no duplicated selection state, effect, new request or event handler. A missing catalog lookup omits the companion. [console.css:278](/home/b/.cache/gs-safety-c6.pSgWxT/app/console.css:278) allows wrapping, including unbroken text. Full selected Korean text at required widths/zoom still requires visual evidence. |
| New incident identity and pin | [SiteStage.tsx:90](/home/b/.cache/gs-safety-c6.pSgWxT/src/components/scene/SiteStage.tsx:90) displays `camera.notice.incidentId`, not the pinned incident or a separately chosen latest incident. The existing focus action uses the same notice ID at [use-scene-camera.ts:113](/home/b/.cache/gs-safety-c6.pSgWxT/src/components/scene/use-scene-camera.ts:113). No pin, handler, priority, audio, live-region or camera state logic changed. |
| Notice lifecycle | Existing [camera-policy.ts:46](/home/b/.cache/gs-safety-c6.pSgWxT/src/components/scene/camera-policy.ts:46) retains an unhandled critical notice against a lower-priority incoming notice; its displayed ID therefore remains coupled to the retained notice. [use-scene-camera.ts:123](/home/b/.cache/gs-safety-c6.pSgWxT/src/components/scene/use-scene-camera.ts:123) excludes notices whose incident is no longer active. Scope changes clear notice/focus at line 49. The new wrapping span does not alter these paths. |

## Nonblocking finding C6-CODE-01: equal-count layouts can keep the wrong priority subset

**Location:** [annotation-layout.ts:62](/home/b/.cache/gs-safety-c6.pSgWxT/src/components/scene/annotation-layout.ts:62). **Classification:** latent algorithm correctness issue; source counterexample, no demonstrated required-screen AC failure. It is not grounds in this report for a new candidate or a runtime FAIL.

For viewport `{ width: 310, height: 52 }`, use these ordered, visible anchors:

| ID | x | y | priority |
| --- | ---: | ---: | ---: |
| a | 0 | 0 | 0 |
| b | 310 | 0 | 1 |
| c | 0 | 0 | 2 |
| d | 102 | 0 | 3 |

The source trace is exact arithmetic, not an executed product test:

1. `a` takes `(4,4)`; `b` takes `(208,4)` after right-edge clamping.
2. The only remaining legal horizontal slot is `left = 106`: `4 + 98 + 4 = 106` and `106 + 98 + 4 = 208`. Only `top = 4` fits.
3. `c`'s nearby positions clamp to the occupied left slot. `closestGridPosition` checks x values `4, 8, …, 208`, which omit 106, so `c` is skipped.
4. `d`'s first nearby position is `(106,4)`, so greedy placement retains `[a,b,d]`.
5. Packed placement has three slots and retains `[a,b,c]`. Both have length three; the strict `>` comparison selects `[a,b,d]` and discards higher-priority `c`.

The earlier greedy/grid implementation already contains the sampling weakness; the new fallback does not repair it when cardinalities tie. Therefore this report does not claim the defect was newly introduced by C6 or that r5 proves universal priority preservation. A future bounded correction can compare retained priority/ID subsets when counts tie, retaining the current geometry when the subsets are identical. A regression test should assert which identities survive, not a preferred pixel arrangement.

**Reachability limits:** The 3D annotation viewport receives the actual canvas size; CSS uses a 420 px stage height, or 320 px below 768 px, so the exact 52 px input is not demonstrated there. For 2D, CSS height alone is insufficient to rule it out: [SiteMap.tsx:39](/home/b/.cache/gs-safety-c6.pSgWxT/src/components/scene/SiteMap.tsx:39) fits the viewBox aspect ratio, then passes `width * scale` and `height * scale` at lines 192–193. Risk/locked bounds depend on actual hazards/routes/worker positions, while full/follow bounds use other shapes. This lane has not mapped the counterexample's combined dimensions and anchor positions to the fixed scene data at 375/390/768/1280/1440 widths or 200% browser zoom. It neither declares such a state reachable nor incorrectly treats the CSS minimum as a lower bound on every 2D content height.

## Tests, quality and remaining verification

Read the revised annotation tests, unchanged camera-policy tests and annotation/map rendering tests. The new dense-edge test checks target dimensions, order, bounds and pairwise separation. The strengthened eight-label test checks retained identities, unchanged anchor coordinates and pairwise separation. These assertions would detect a dropped dense label or insufficient target extent; they do not cover C6-CODE-01. Exact-fit and offscreen behavior are represented in existing tests. Producer red/packing-red and final green logs were inspected as provenance, including the failed intermediate log; this lane does not claim fresh test passes.

The delta adds no API/schema boundary, asynchronous operation, mutable selection state, untyped escape hatch, error handler or resource lifetime. Changed TypeScript files measure 188/137/226/172 nonblank, non-line-comment lines; the rail is in the guidance warning band but below 250. Existing large CSS files remain existing stylesheets, with small rule changes and no introduced unrelated refactor.

Fresh browser/device lanes still own actual hitboxes, keyboard/pointer/slider operation, 2D/3D clipping and focus, dense real scene layout, complete Korean scenario text, incident A staying pinned while notice identifies B, and explicit focus selecting B. This code report grants no Lighthouse, performance, physical-phone, camera, LAN, audible/haptic, marker-table or overall AC acceptance. Only `/root/qa_resume` may issue official AC and overall verdicts.
