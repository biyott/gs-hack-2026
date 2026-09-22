# QD005 LR boom-foot correction — rework 01

Scope: LR 1100.1 horizontal boom-foot reference and corresponding synthetic load center. Root authorized this correction within original goal E / AC12; QA identified the affected AC02 geometry retest. Frozen candidate `70da1337` remains unchanged. This receipt is implementation evidence, not independent QA acceptance.

## Confirmed defect and source distinction

The functional `BOOM_PIVOT` was placed 2.1 m forward of the slew axis during approximate body layout. The asset author confirmed it represents the physical boom-foot hinge, with no alternate datum or compensating parent transform. The archived manufacturer EN page 8 explicitly dimensions that point `1200*`, with the footnote “Boom pivot point.” The corresponding EN-US page 8 label is 3 ft 11 in, whose literal conversion is 1.1938 m. Both are preserved as their own rounded unit-edition values; the correction uses the published metric 1.2 m value already recorded in the research packet.

Metric source: LR 1100.1, 8503.02.03 / EN v01.092022 / 13646717, page 8, PDF SHA-256 `843ac3a7fb711bd2fede5dc5f5ba2b2798cfbf3cb52faeff4515cacf1e082e52`. Original selected EN-US source remains 8503.02.03 / EN-US v01.092022 / 13646718, PDF SHA-256 `d0398be38dcc2c12ae0b8e5dc6e2b12b822184fc606011b0aa672179a6ae8e26`. No new physical precision criterion or pivot-height claim is introduced.

## RED proof and preservation

`before/manifest.json` records seven ordinary byte copies from the frozen C1 stage: failed LR Blend/GLB, generator/verification source, README and catalog/generator data. `red-proof.json` records a built-in Node GLB-JSON assertion at 13:41:35Z: actual forward offset 2.0999999046 m, expected published metric datum 1.2 m, error +0.8999999046 m; process exit 1 was expected. The ROOT and SLEW parent chain has no longitudinal compensation and every root/rig scale is one.

The earlier tests verified boom length and connected links relative to the modeled hinge; they did not assert the known manufacturer hinge datum. Their earlier green results therefore did not detect this source-fidelity defect.

## Correction and executed asset checks

Only the LR hinge and initial tip X formulas changed from 2.1 to 1.2. The selected 32 m assembly, no-fixed-jib state, all control ranges, height baselines, root scale and other geometry remain unchanged. The manufacturer hinge height is still unknown; the chosen visual height remains 1.95 m. At 60°, the nominal tip/hook horizontal distance becomes 17.2 m instead of 18.1 m. The catalog's LR load polygon center likewise moves from 2.1 to 1.2 before the engine adds `32*cos(angle)` and current azimuth.

QA granted one isolated background Blender process. It ran 13:43:21Z–13:43:42Z, 21 seconds, WSL interop PID 810403, exit 0, and then released the resource. The Windows native PID was not observed before exit; the empty query and limitation are retained. No live Blender MCP or interactive scene was used. `execution-01.json` and `build-01.log` retain the execution details.

The source/reimport regression now independently checks the EN page 8 horizontal 1.2 m datum, signed forward direction and zero lateral offset across all 27 angle/hoist/slew combinations at each boundary. Existing 32 m boom, hook height and all cable/pendant endpoint assertions remain. Both boundaries passed. Six refreshed LR renders were produced; the two imported-GLB luff extremes were directly inspected with connected and fully framed geometry.

`green-proof.json` independently parses the new exported GLB without Blender: hinge X is 1.2000000477 m, error 0.0000000477 m; the same numeric assertion passes. This tolerance checks export representation, not an added manufacturer accuracy requirement. `catalog-and-unaffected-proof.json` proves the other five catalog entries, LR non-load parts/controls/pose/articulation, and twelve other crane/site GLB/Blend artifacts remain unchanged.

## Corrected asset identity

- LR GLB: `13698f139bcb79b877786259d4b3f4fe625a3534f3550a41dcaae4933422acca`.
- LR Blend: `23dac3b561bdc1c0b2b43938c43ee56075fa3901c4d002a27646cbc438599bff`.
- Catalog: `3a0cdc1ab07bd993028fac9c462c34e3d7812b8baf4447c9ad34a40db6c7758b`; schema format stays 1.0.1.

Affected renderer regression passed 85 tests with one worker, including an actual old-GLB RED and corrected-GLB GREEN that check the 1.2 m foot and `1.2 + 32*cos(angle)` hook radius after slew. Durable receipt: `.omo/teams/team-08d29e60/artifacts/scene-rig/lr-pivot-correction/receipt.md`. Backend passed 10 affected LR datum/control/extrema tests on this exact catalog; receipt: `docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/backend/engine/qd005-lr-datum/README.md`. The independent bounded correction review verified actual node chain, corrected hashes, unchanged five catalog entries and twelve unaffected assets. Its receipt is `.omo/teams/team-08d29e60/artifacts/asset-review/qd005-lr-correction-review.md`. The aggregate asset manifest is refreshed. Independent W3 source reopen/export and integrated acceptance remain separate.
