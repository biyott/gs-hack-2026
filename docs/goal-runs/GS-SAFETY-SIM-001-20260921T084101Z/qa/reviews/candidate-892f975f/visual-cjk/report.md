# C6 visual QA Pass B — REVISE (evidence incomplete)

Candidate: `sha256:892f975f083d159e9d354e1bda511a2cf1b81bc4964a0c3335f69d9a498ca40b`  
Build: `QS7DkAZLSyX00oQ4fvGHL`  
Frozen source root supplied by QA: `/home/b/.cache/gs-safety-c6.pSgWxT`  
Review: independent, read-only visual fidelity/CJK pass; 2026-09-22 UTC. Confidence: high for the visible pixels, incomplete for whole-surface acceptance.

All **216 available declared-viewport PNGs were opened individually at original detail and directly inspected**. There are **0 uninspected available viewport PNGs**. No new blocking rendered clipping, overlap, missing-glyph, or Korean word-fragment defect was established in their visible content. This is not a whole C6 PASS: the capture partitions terminated before the matrix was complete, the pending incident notice is absent from this image scope, and range controls lack visible screenshot coverage.

## Exact terminal coverage

Only these explicitly allowed synthetic capture folders were opened:

- `c6-quick-dom-v1.1/2026-09-22T00-13-02-460Z-2ebbaa36`: 7/7 viewport PNGs inspected (six quick views plus the nested `risk-projection/viewport.png`).
- `surface-partition-v1/2026-09-22T00-16-31-245Z-97ab1644-93f1-4646-9722-7b39607ef7e9`: 115/115 available viewport PNGs inspected; 12 full-page supplements not used.
- `surface-partition-v1/2026-09-22T00-16-31-300Z-db0bbdfb-db3d-417b-bd9c-b202f8b04e3c`: 94/94 available viewport PNGs inspected; 12 full-page supplements not used.

The paths, individual hashes, direct-inspection flags, and exact missing-state list are in [pixel-inspection-ledger.json](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/reviews/candidate-892f975f/visual-cjk/pixel-inspection-ledger.json). The 24 full-page supplements are explicitly uninspected and do not count as declared-viewport evidence. No real phone camera image, unlisted screenshot folder, C5 screenshot, or earlier visual PASS was used.

| Viewport | Available viewport PNGs | Directly inspected | Uninspected |
|---|---:|---:|---:|
| 375 × 812 | 111 | 111 | 0 |
| 390 × 844 | 6 | 6 | 0 |
| 768 × 1024 | 93 | 93 | 0 |
| 1280 × 720 | 3 | 3 | 0 |
| 1440 × 900 | 3 | 3 | 0 |
| Total | 216 | 216 | 0 |

Both partition `report.json` files are terminal at approximately **00:19:00 UTC**, report `INCOMPLETE_OR_FAILED`, and retain `capturePartitionComplete: false`, `originalStrictCoverageComplete: false`, and `radiusCoverageComplete: false`. Partition A attempted 34/93 semantic states and 72/198 focus targets; B attempted 33/62 states and 68/132 targets. Thus **67/155 states were attempted, 88 not attempted; 140/330 focus targets were attempted**. An attempted state is not a strict-visibility or functional PASS. There are 209 recorded partition viewport captures plus one failed capture record: `equipment-panels-header-and-run-controls-390x844-target-4-frame-1-failure`, with no PNG. The six quick captures and one nested mounted-projection viewport do not replace the missing matrix states.

Every opened viewport PNG has a valid PNG signature and the enumerated viewport dimensions. The images contain coherent composited UI; blank surroundings at the bottom of unequal-height tablet columns and content cropped by an intentionally scrolled viewport were not mistaken for compositor failures. No reference-image packet was supplied for an exact pixel-diff comparison.

## Scoped findings and closure limits

| Requirement | Direct pixel observation | Remaining gap |
|---|---|---|
| QD011 controls / worker annotations | Visible 2D/3D buttons, zoom/reset controls, and worker labels are readable at the available 375/390/768/1280 states. Available full/risk/selected-worker scene images show label text fitting its boxes without observed label-to-label overlap. The quick DOM report records the restored approximately 44 px heights. | Pixel readability does not prove hitboxes, keyboard selection change, dense corner cases, or every 44 px target. Equipment motion ranges are measured in quick DOM but are not visible in the six associated screenshots or the partition viewport images; range pixel clearance remains unestablished. No 1440 scene/control captures exist here. |
| QD012 full selected Korean scenario name | The expanded 375/768 equipment settings show the entire companion label `이동 제약별 경로와 미확인 프로필`; the native select may still truncate but the companion is legible. At 1280, the quick image shows the companion wrapping at whole-word boundaries as `이동 제약별 경로와 미확인` / `프로필`, with no glyph clipping. The fire/gas companion `화재와 시간별 위험 영역 확대` is fully readable at 375/768. | No 1440 selected-scenario panel, 390 expanded settings, 1280 fire/gas settings, or 200% zoom capture is present. This review cannot establish label updates after selection changes. |
| QD013 new-incident notice identity | **Not inspected / not established.** The scene's pending new-incident notice is not visible in any image in this allowlist. | Expanded GUIDANCE IDs and incident-card UUIDs are readable at 375/768, but they are different UI elements and do not close QD013. The separately referenced incident-suite images are outside this review's explicit image allowlist and were not opened. |
| Korean layout and fonts | Visible headers, fields, guidance copy, worker profiles, empty camera/measurement states, and selected-scenario helper text remain readable. No tofu, clipped baseline, overlapping glyphs, or orphan final syllable was observed. Long technical IDs wrap within their containers. | Only captured content is covered. Source or DOM overflow checks cannot supply pixel clearance for missing states. |

Concrete pixel anchors in the ledger: indices 0–5 are the quick 1280/375/768 2D/3D views; 12–15 and 76–79 are 375 scene modes; 127–130 and 177–180 are 768 scene modes. Index 215 is the separately opened nested mounted-risk projection viewport. QD012 equipment helpers are visible in indices 55, 57–58, 157, 159–160 and 0–1/215; fire/gas helpers are visible in 104, 106–107, 198 and 200–201. Expanded guidance IDs, distinct from QD013, are legible in 33/36/39/42/68/91/94 and 142/144/146/148/170/187/189.

## Blocking evidence findings

1. **[evidence] C6-VB-01 — incomplete responsive surface.** Complete the 88 unattempted semantic states and the failed 390 run-controls capture on the same frozen candidate, retaining strict/radius visibility limitations until separately established. Re-review the new images. No acceptance is inferred from historical C5 coverage.
2. **[evidence] C6-VB-02 — QD011 ranges and QD013 pending notice have no pixel clearance here.** Supply current, explicitly authorized synthetic screenshots with the range controls visible and the pending incident notice displaying its own full incident identity. Measure behavior separately; these pixels alone cannot prove selection, priority, or incident binding.
3. **[evidence] C6-VB-03 — QD012 requested desktop coverage incomplete.** Current 375/768 equipment and fire/gas, plus 1280 equipment helper observations are favorable. The 1440 selected-scenario panel and additional required zoom/selection cases remain uncaptured in this scope.

No product files, runtime, browser, device, database, or capture process were changed or operated by this reviewer. The report and ledger are the only authored artifacts. Overall visual completion remains **REVISE / PARTIAL**, with **no new blocking product pixel defect observed in the 216 inspected viewport images**.
