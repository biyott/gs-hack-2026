# Design and 3D asset self-check handoff

GS-SAFETY-SIM-001, 2026-09-21. Asset production and bounded implementation checks are complete. This is a handoff for integrated review, not an independent QA verdict or a manufacturer operating certification.

## Delivered

- `DESIGN.md` version 1.0.1: Korean/English operational layout, tokens, component states, accessibility constraints and coordinate/articulation contracts. Two generated concept explorations and their explicit exclusions are in `resources/design/`; 34 declared opaque contrast pairs pass their stated thresholds.
- Six individually loadable, meter-scale crane GLBs in `public/assets/cranes/`, each with an editable `.blend` source and reproducible generation/verification modules under this directory.
- `public/assets/site/hvo-demo.glb` and its editable source: synthetic 140×50 m operational rectangle, exact source 008 regions and separate illustrative industrial context. No workers, cranes, hazards, routes or inferred live safety state are baked into the site asset.
- `data/equipment/catalog.json` version 1.0.1: fixed editions/configurations, original citations and hashes, null unknown manufacturer values, distinct demo poses, required motion controls and independent synthetic risk polygons. Version 1.0.0 remains preserved.
- `artifact-manifest.json`: exact GLB/Blend/catalog hashes, per-asset source/reimport evidence, motion ranges, integration evidence and review limitations.

## Required motion coverage

SK1265 supports chassis translation, upper slew, trolley and hoist with its selected 60 m assembly; table-linked slew is limited to ±15°. Tadano, LTM and Maeda support translation, slew, luff, section extension and hoist. LR supports translation, slew, luff and hoist with the selected fixed 32 m lattice assembly. The 172 supports slew, trolley and hoist while its origin stays fixed. Chosen ranges are documented in the catalog README; they are not manufacturer mechanical limits.

Four rigs use the shared typed articulation contract: preserved local-Z pivot, local-X nested stages, physical boom-tip/hook alignment, and normalized local-Y endpoint links. TD/LTM also preserve a separate nominal boom-axis tip so length/angle verification does not confuse the physical sheave offset with nominal boom length. No GLB is scaled to fit a phone or table.

## Executed evidence

- All six sources reopened and all seven GLBs exported/reimported with measured geometry. SK default bounds are identical across the export boundary. Mobile source and imported checks each cover 27 combinations and eight invalid inputs per crane; Maeda covers 24 corner combinations; LR covers 27 combinations at each boundary.
- Frontend production GLTFLoader/rig checks passed 84 focused tests, including 64 combined endpoint cases (56 unique, because LR fixed-length endpoints coincide) across all four articulated models, six baseline loads and SK/172 relative controls. Durable renderer evidence is `.omo/teams/team-08d29e60/artifacts/scene-rig/loader-verification.md`. The scene owner also reported 106 passing tests across the complete scene suite. The reproducible focused command is `npx vitest run src/components/scene/equipment-rig.test.ts src/components/scene/articulation.test.ts src/components/scene/rig-math.test.ts`.
- Backend engine checks passed 148 tests, including 60 independent motion-extrema checks and 14 authoritative control integration checks. Durable evidence is `docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/backend/engine/catalog-1.0.1/README.md`.
- Independent asset review imported all seven real GLBs, resolved every required node/anchor, checked identity/unit roots and finite geometry, and directly inspected 12 endpoint captures. Its report and reproducible runner are under `.omo/teams/team-08d29e60/artifacts/asset-review/`. TD/LTM endpoint PNGs are source-scene renders; LR/Maeda endpoint PNGs are imported-GLB renders. Separate numerical import checks cover the TD/LTM exports.
- Final read-only Blender MCP inspection is preserved in `live-scene-continuity.json`: the existing SK scene remains open with 1,084 objects and 24 materials. Production used isolated background processes; existing SK files and the interactive scene were not modified by these builds.

## Candidate identity and boundaries

The executed renderer and engine candidate catalog was `390dcbe9082206a74b5af9d41da08fdff4e810ac16241de171a18cda2a0c508f`. After engine-owner concurrence, exactly six `riskGeometryStatus` values changed from unverified to verified. The current catalog is `7b0953b6cf6505d1421d4117ef3ac042af660d1e0f50331b5caa34fb7a544219`. Independent reconstruction confirms all other data are identical; the transition receipt is linked in the manifest. All GLB and Blend hashes remain unchanged.

Verified risk geometry means the chosen synthetic polygon model and declared controls were tested. It does not certify manufacturer working limits, ground bearing, capacity, complete visual mesh containment or vertical collision physics. Unknown official support coordinates and tower outer footprint remain null. The 172's 4.6 m source dimension remains nominal support width.

Independent review retains two minor mesh-hygiene observations: 40 zero-area triangles in Maeda and 46 in the 172. No new visible breakage or blocking asset defect was identified in that bounded review. Final product manipulation, browser screenshots, model-change invalidation, table calibration, device operation and overall acceptance remain with the relevant implementation leads and independent QA.
