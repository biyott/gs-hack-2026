# C3 three-target diagnostic result

The narrowly authorized diagnostic ran on the preserved paused synthetic C3 database from **2026-09-21 16:49:25.243 to 16:49:41.455 UTC**. Server PID 934849 and Chromium stopped within the grant ending 16:50:52.390 UTC. Port 4103 was released; provider 8092 PID 332445 was preserved. Three targets were tested, with no broad matrix, performance, phone or actual camera activity.

All three original strict assertions failed and remain unchanged. The additional evidence identifies a **decorative-corner sampling false positive in each of these three fresh observations**: eight original sample points hit the panel or its descendants, while the bottom-right sample, 4px from each rectangular edge, hit the underlying parent at the panel's 14px rounded cutout. No foreign overlay caused the failed sample. The exact geometry, all nine raw hits, hit ancestry, computed radii and scroll offsets were persisted before the unchanged assertion threw.

| Target | Observed UTC | Failed sample / underlying hit | Assertion caught UTC |
|---|---|---|---|
| `.entry-session`, 768×1024 | 16:49:28.173 | (732, 901.3125), `div.entry-content` | 16:49:28.232 |
| `#tracking .camera-panel`, 375×812 | 16:49:30.680 | (351, 792.046875), `section.tracking-panel.stack` | 16:49:31.232 |
| `#tracking .calibration-panel`, 375×812, frame 5 | 16:49:41.283 | (351, 386.234375), `section.tracking-panel.stack` | 16:49:41.352 |

The independent executor directly viewed the three saved failure PNGs after collection. The connected-entry status/control is visible; the camera card and its empty synthetic metadata are visible; the calibration tail, save button and reset button are visible. The entry control and currently visible calibration controls had positive center hits. No control was activated in this diagnostic, so those observations do not establish complete operability, keyboard accessibility or calibration correctness.

Both preserved runs were confirmed paused with scenario position input before target checks. Only three login POSTs occurred; no select/start/advance/profile/control command was issued. Each screenshot was preceded by metadata confirming `camera: null`, `receivedFrames: 0`. Automatic initialization/inference was not deliberately invoked; the retained server log has no matching RAG/model lines, but this is not a dedicated provider trace and must not be called proof of zero inference activity.

## Immutable evidence and scope

The packet is under `evidence/qa/ui-device/candidate-1a7c95cd/focus-diagnostic/2026-09-21T16-49-25-237Z/`:

- `report.json`: exact candidate/grant/freeze inputs, server lifecycle, paused runs, three original errors, request list and resource release.
- `entry-session-768.jsonl`, `camera-375.jsonl`, `calibration-375.jsonl`: durable pre-assert observations and screenshot references; raw nine-point decisions unchanged.
- `entry-session-768-diagnostic-0.png`, `camera-375-diagnostic-0.png`, `calibration-375-diagnostic-10.png`: the three directly reviewed synthetic failure frames.
- `classification-v1.json`: per-case geometry, exact times, PNG signatures/dimensions/hashes and source packet hashes.

The frozen v1 runner/grant were never executed; static configuration inspection produced a separately frozen v1.1 runner before START. Grant 02 bound that v1.1 execution. No original helper, C3 product source or earlier evidence was edited.

This packet does **not** clear all nineteen historical failures, replace their missing failure geometry, complete the full matrix, or certify a replacement candidate. Next-candidate complete coverage remains required. It provides no evidence justifying a product layout repair for these three decorative-corner failures. The original raw FAIL results, nineteen-case INCONCLUSIVE audit and all interrupted captures remain preserved.
