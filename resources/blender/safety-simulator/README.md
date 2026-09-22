# GS safety simulator assets

Seven self-contained meter-scale glTF 2 GLBs: six replaceable crane presets and one synthetic 140×50 m operational site with surrounding industrial context. All were built/exported in isolated Blender 5.2.2 LTS background processes; the original SK1265 files and live Blender scene were preserved.

| Catalog ID | Source directory | Browser asset |
|---|---|---|
| sk1265-at6 | sk1265-derived | /assets/cranes/sk1265-at6.glb |
| tadano-gr250n4 | mobile-cranes | /assets/cranes/tadano-gr250n4.glb |
| liebherr-ltm1050 | mobile-cranes | /assets/cranes/liebherr-ltm1050.glb |
| maeda-mc305 | maeda-site/maeda | /assets/cranes/maeda-mc305.glb |
| liebherr-lr1100 | lattice-cranes | /assets/cranes/liebherr-lr1100.glb |
| liebherr-172ecb | lattice-cranes | /assets/cranes/liebherr-172ecb.glb |
| hvo-demo | maeda-site/site | /assets/site/hvo-demo.glb |

Each directory has `.blend` source, procedural production modules, actual Blender reopen/reimport evidence, render PNGs and reproduction instructions. Procedural source is an editable reconstruction from source dimensions, not downloaded manufacturer CAD. Construction details inferred from drawings/images remain labeled approximate. Source-source comparisons distinguish transport dimensions, working extents, support centers, pad envelopes, boom lengths, outreach and hook heights.

The source and browser coordinate contract is in root `DESIGN.md` section 9. Catalog `data/equipment/catalog.json` version 1.0.1 is authoritative for source editions, unknown null values, demo poses, controls and distinct synthetic engine polygons. Rebuild it using `node data/equipment/build-catalog.mjs`. Engine geometry status records the 148-test validation of the chosen synthetic polygon model and declared motions; it does not certify complete visual mesh containment or manufacturer safety. A visual export/reimport check never confers safety acceptance. Frontend loads only selected crane plus the site at unit scale; table 1:100 conversion is not applied to GLBs.

Rig transforms are relative to catalog baselines. Preserve initial loaded node transforms, then apply pose deltas. SK and 172 use glTF local-Y slew, local-X trolley and relative local-Y hoist with linked rope scaling. Tadano, LTM and Maeda expose luffing, nested section extension and hoist through the shared typed articulation contract. LR's selected 32 m lattice assembly has fixed length and 45–70° demo luffing. Endpoint links keep ropes, pendants and hydraulic parts connected; their physical mesh coordinates are normalized local +Y from 0 to 1 m. Hook world height stays independent of boom angle and matches the catalog datum. Chosen model ranges are not manufacturer operating limits.

The 172 uses fixed 50 m outreach and 16 HC 175 / UC-0460m tower, with its origin fixed by simulator policy. Its maximum 42.3 m hook height is independent of source steel height. The 4.6 m dimension is nominal support width; exact manufacturer outer footprint remains null.

Executed source/reimport motion evidence: mobile cranes `evidence/*-verification.json` record 27 angle/length/hoist combinations plus eight invalid-input rejections for each model at both boundaries; Maeda `verification.json` records 24 corner poses; LR `*-luff.json` records 27 angle/hoist/slew poses. These tests also preserve static support geometry and confirm hook/link connections. Frontend's `src/components/scene/equipment-rig.test.ts` exercises the actual exported models through GLTFLoader and the production rig handler. Final candidate hashes and independent review are recorded in `artifact-manifest.json`, not inferred from filenames. TD/LTM min/max PNGs are source-scene renders; their exported GLBs have separate numerical reimport checks. LR min/max PNGs are GLB reimport renders.

The site is explicitly synthetic. It references published Daesan industrial forms but is not a measured LG/GS facility plan. Refuges are candidates; live availability and all hazards/routes/workers/cranes come from authoritative application state, not baked map geometry.

Acceptance still requires final app import/manipulation and independent QA. Source evidence and test logs document what was executed, not blanket completion of the integrated goal.
