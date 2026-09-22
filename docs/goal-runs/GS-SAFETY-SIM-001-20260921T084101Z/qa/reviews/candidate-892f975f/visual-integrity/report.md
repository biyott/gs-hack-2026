# C6 visual QA Pass A — design-system and functional integrity

VERDICT: **REVISE**. CONFIDENCE: **HIGH for the bounded observations and incomplete accounting; no whole-surface verdict**. Product acceptance remains **NOT_RUN**. This fresh independent review finds no new confirmed product defect in the inspected C6 correction paths, but complete visual/functional coverage is absent. C5 behavior results do not transfer.

Reviewer: `/root/qa_resume/c6_visual_integrity`. Candidate `sha256:892f975f083d159e9d354e1bda511a2cf1b81bc4964a0c3335f69d9a498ca40b`; production build `QS7DkAZLSyX00oQ4fvGHL`; staged source `/home/b/.cache/gs-safety-c6.pSgWxT`. Review performed 2026-09-22 UTC. No product edits, app/browser launch, provider call, device operation, or subagent invocation. Review files are the only outputs.

## Criteria and evidence boundary

Applied `visual-qa` Pass A and the frontend design/perfection rules against the existing `DESIGN.md`, immutable `requirements/scope-freeze.v1.0.md`, and `qa/ui-device/ac15-visual-performance.md`. The frozen protocol governs acceptance: generic skill preferences do not replace G0 or introduce new mandatory outcomes. The design concept is composition/material guidance with explicitly illustrative scene details; this pass does not invent an approved exact pixel target. Missing supplemental Lighthouse/React diagnostics are not converted into a frozen performance failure or a measured score.

All paths below are under `docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z`. The machine-readable [evidence summary](evidence-summary.json) records absolute source/report paths, hashes, every unattempted state, and every missing target.

| Evidence | SHA-256 |
|---|---|
| `evidence/qa/ui-device/candidate-892f975f/c6-quick-dom-v1.1/2026-09-22T00-13-02-460Z-2ebbaa36/report.json` | `331814582009c827d98831a4a8485910d955c6bc34ee00e7da172f9cddb2d034` |
| `evidence/qa/ui-device/candidate-892f975f/c6-incident-suite-v1/2026-09-22T00-13-29-719Z-0bd64c64/report.json` | `f5b57e99d56143095fd890329e7982ae028801096a88d56692b29cce866cab15` |
| Partition A `surface-partition-v1/2026-09-22T00-16-31-245Z-97ab1644-93f1-4646-9722-7b39607ef7e9/report.json` | `f14350d676e47d57c790040bfbf2bbf319434f6c99fc05ea344e55f2f702d70d` |
| Partition B `surface-partition-v1/2026-09-22T00-16-31-300Z-db0bbdfb-db3d-417b-bd9c-b202f8b04e3c/report.json` | `a91502e05ce9cb105969be2f892ec8810e50dca5d30a37e25966af36602cfa9c` |

Both partition reports bind the same candidate/build, record unchanged frozen inputs and source during capture, and end at the 00:19 UTC subwindow cutoff. The report-level operational failure is a cutoff/incomplete-execution result, not independently established product failure.

## Exact matrix accounting

| Partition | Semantic states attempted / declared | Focus targets attempted / declared | Capture records recorded / total | Actual PNG files |
|---|---:|---:|---:|---:|
| A: 375, 390, 1280 widths | 34 / 93 | 72 / 198 | 115 / 116 | 127 |
| B: 768, 1440 widths | 33 / 62 | 68 / 132 | 94 / 94 | 106 |
| Disjoint union | **67 / 155** | **140 / 330** | **209 / 210** | **233** |

Attempted states by width: 375 = 31, 768 = 31, 390 = 3, 1440 = 2, 1280 = 0. **88 states and 190 targets were not attempted.** Attempted is not passed. The failed A capture is `equipment-panels-header-and-run-controls-390x844-target-4-frame-1-failure`, with `Outside C6 surface subwindow`. The reports correctly retain `INCOMPLETE_OR_FAILED`, `capturePartitionComplete:false`, `originalStrictWalkerExecuted:false`, and incomplete strict/radius coverage. 233 PNGs are not 233 semantic states and do not prove the 155-state inventory complete.

## Bounded correction review

| Item | Independent C6 observation | Disposition |
|---|---|---|
| QD011 control heights | Quick DOM captures show both 2D/3D toggle buttons and all three captured equipment ranges at 44px at 375/768/1280. Worker buttons and their foreignObject boxes are approximately 98×44px in all five views where markers were present; deviations of 0.00003px are floating-point measurement. | The specific height correction is observed. No claim that every control/state or full keyboard/touch behavior passed. |
| QD011 implementation | `app/globals.css` gives shared buttons/fields 44px minimum; `annotation-layout.ts:2` reserves 44px label height; `app/console.css:1550` makes worker buttons fill the foreignObject. `SceneAnnotations.tsx:107` uses native buttons with accessible description, pressed state, and selection handler. | Real clickable DOM control area, not only a larger surrounding box. |
| QD012 complete scenario name | `scenario-rail.tsx:92` renders the full catalog label as a separate paragraph. Quick 1280 observations show a 190×42px wrapping paragraph with complete text. Independently opened synthetic 375 and 768 matrix settings target-3 captures: the entire `이동 제약별 경로와 미확인 프로필` companion paragraph is readable in both. | Corrected in these observed states. The native select may still truncate at 768; the full adjacent paragraph supplies the omitted text. |
| QD013 new incident identity | `SiteStage.tsx:90` prints `camera.notice.incidentId`. A/B report records A remaining selected/locked when B arrives, a visible notice containing B's exact ID, and explicit notice navigation selecting B. | Corrected for this actual UI with declared synthetic constructor/shim input. No stock HTTP/SSE claim. |
| Required risk geometry | Fresh mounted R3F projection uses the actual camera/object matrices and remains stable across the screenshot. The selected incident's required hazard vertices and all three affected worker positions are inside the canvas/browser viewport. | Bounded geometry evidence; it does not prove final pixel visibility, annotation readability, or general framing. |
| Route absence | The sampled projection records zero routes. Source `visibleRoutes` requires matching identity, known position, at least two waypoints, and unexpired guidance. | Zero route projection is not route-fit success; the sample's route-validity limitation remains. |

The two directly viewed settings images were `equipment-panels-settings-and-equipment-spec-375x812-target-3-frame-1-before-capture.png` (SHA `37385cd26b23c18ef6c53a300e482660a5da141f6e3eb46335b116dd0e977992`) and the equivalent 768x1024 image (SHA `a79221318ee52e9ea90c0f3b100a8bab0c685431336dfb77112645cd6816ecea`). Their records report valid PNG signatures and matching dimensions; each has `camera:null` and `receivedFrames:0`. These are synthetic UI captures only. No real camera image was opened.

## Design-system and functional integrity

- **Good, retain:** shared color/type/spacing/radius/motion tokens in `app/globals.css`; reused `Button`, `Panel`, `Field`, `StatusBadge`, `Banner`, and `EmptyState`; semantic main/nav/aside structure and independently scrollable panes; CSS responsive rules; reduced-motion suppression; native labeled controls. The inspected screens are React DOM plus SVG/Three.js scene objects. No pasted screenshot substitutes for the interactive surface.
- **Good, retain:** native worker marker selection path; stable risk/locked camera requests rather than recentering on every position update; explicit follow mode; readable synthetic/live/unknown provenance; null camera metrics remain unknown; actual camera frame rendering is conditional; first guide and current guide are separate records, with version/expiry/profile details and inert React text for supplemental explanations.
- **Scope limit:** this source assessment is not an exhaustive design-token compliance audit, visual/CJK Pass B, whole-page alpha/compositing verification, accessibility certification, motion-state review, full six-model operation review, or device/performance acceptance. Screenshot scores or unloaded font-family names would not establish those results.

## Findings and blockers

1. **[evidence] [coverage] [blocking] Incomplete fresh surface set.** The matrix lacks 88 states/190 target attempts and includes one cutoff capture failure. Complete the same-candidate set and independently inspect every required state before any whole-surface PASS. Full physical/worker-app surfaces, zoom/long-ID/motion/fault/performance requirements are not closed by this matrix.
2. **[evidence] [interaction] [blocking for keyboard-selection closure] Enter tests do not demonstrate a change.** All five quick actions have `before:"true"` and `after:"true"` for WORKER-A. Source proves a handler exists; these actions do not prove an unselected worker can be selected by keyboard. Capture focus and Enter on an initially unselected worker and show the changed selected identity/pressed state.
3. **[evidence] [annotation coverage] [unresolved] The early 375px 3D quick observation has zero worker-marker items.** That observation cannot certify marker dimensions or operation at 375px in 3D. It is not by itself evidence that settled markers fail; use settled matching evidence to close it. The 1280 mounted projection does not replace this missing small-viewport check.
4. **[evidence] [functional breadth] [blocking for the missing scenarios] The A/B fixture is bounded.** Both hazards are critical, so higher-priority B remains NOT_RUN. Only A-only PATH-B and shared PATH-C are exercised; B-only path coverage remains absent. No real SSE/reconnect, stock lifecycle, worker receipt, Android/device, or provider result follows from the fixture.

Raw visibility diagnostics retain recurring `카메라 모드` and `보정 측정값` clip flags and native-scroll focus failures around tracking/camera/calibration (plus entry-session corner failures). These require the stored geometry/pixel review's disposition; this source pass does not convert them into proven clipping or silently waive them. Likewise, observed supplemental manufacturer links are 14px high; this is not used to reopen the specifically repaired button/range/marker-height claim or invent a new frozen product outcome.

**New confirmed product defects: none in the inspected correction paths.** **Completion gate: not satisfied.** The source/design system is real and the bounded C6 corrections have supporting evidence; the evidence gaps above prevent an independent whole-surface PASS. No debt or incomplete criterion was accepted on the user's behalf.
