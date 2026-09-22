# C4 stored asset visual review v1

Disposition: **partial visual evidence with limits; no product verdict**. Reviewed all **31 stored PNGs** from the completed asset run, across Tadano (11), LTM1050 (11), and SK1265 (9). No runtime, browser, server, network or product edits were performed by this review.

The unchanged raw report is **FAIL**, completed 2026-09-21T18:02:00.578Z: **11/21 motions**, 3 of 6 presets pictured. All seven GLB response bodies match frozen hashes; input/source hashes are unchanged. Maeda, LR1100 and 172ECB have no captures because readiness timed out at runner line 138.

## Visible outcomes

| Preset | Directly visible changes | Inconclusive from pixels |
| --- | --- | --- |
| Tadano GR-250N-4 | Slew reversal, lower boom angle, shorter boom, orbit viewpoint | Hook-height delta at full-site scale |
| Liebherr LTM 1050 | Slew reversal, lower boom angle, shorter boom, orbit viewpoint | Hook-height delta at full-site scale |
| SK1265 | Jib direction/2D heading, orbit viewpoint | Trolley and hook deltas at full-site scale with annotation overlap |

Equipment labels mask portions of Tadano/LTM baseline boom/rope near x554–650, y641–668. The images therefore do not provide wholly unobscured geometry evidence. Manual orbit crops some surrounding site/table edges, including SK near x530–570 at y875; without an acceptance requirement for full bounds during manual orbit, this is recorded as a framing limit, not a product defect. No malformed mesh, blank scene or partial compositing defect was established in this bounded review. Apparent movement is not a physical-accuracy or exact-dimension assertion.

## Collection evidence

LTM boom-length 3D/2D and subsequent SK baseline/final-hook 2D observations all retain exactly 250 resource entries, with identical last responseEnd 119474.5 and only the original four GLB paths. Maeda, LR1100 and 172ECB response bodies subsequently returned HTTP200 with matching frozen hashes. Frozen observer source line76 maps the full resource list without a 250-entry slice. These saved facts support resource-timing buffer saturation as the readiness failure cause; failure-time diagnostics/live reproduction were not performed. Raw FAIL is preserved.

## Integrity and provenance

All 31 PNG signatures, 1440×900 dimensions, and hashes were independently checked against producer metadata. Every image was directly opened by the named reviewer recorded in the JSON. The owner grant/provenance attest a fresh isolated synthetic DB, retained real frames absent and real senders excluded. The runner checks camera state before captures, but does not persist each raw tracking response; this review does not claim independent frame-byte provenance measurement.

The durable JSON records exact paths, hashes, poses, reviewer identities, findings and saved timing evidence: [asset-visual-review-v1.json](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/ui-device/candidate-cd8a2428/asset-visual-review-v1.json). Its SHA256 is 5e8417bc92458195ef12af88ba9264ace88006f291fbcc101caecc925fa648a0.

Route freshness remains **NOT_IMPLEMENTED**. Missing 10 motions and 3 unpictured models remain unreviewed. The prior source-only STATIC READY receipt is historical; it is not a runtime PASS.
