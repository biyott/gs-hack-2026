# SK1265 legacy 60m articulated derivative

This derivative preserves the supplied original under `resources/blender/spierings-sk1265-at6/`. It opens that saved file in an isolated Blender process, inserts articulation parents, corrects only the +Y support row to the manufacturer's staggered p7 centers, saves a separate editable source, and exports compact material batches. It never accesses or changes the user's running Blender scene.

- Source: `sk1265-at6.blend` — 1,075 editable geometry objects.
- Export: `public/assets/cranes/sk1265-at6.glb` — 27 geometry batches.
- Meter scale, root `(0,0,0)` and unit scale; Blender XY ground/Z up; standard glTF Y up.
- Legacy jib60m, structural underside37.2m, rated hook35m retained; selected hanging hook pose16.24m is separate.
- Manufacturer p7 support centers: `(-4.885,+3.83),(3.065,+3.83),(-4.615,-3.83),(3.335,-3.83)`, front road cab at negativeX. Ground plates2.5×1m are distinct from jack pads0.75×0.6m and center spans7.95×7.66m.
- Source PDF and hash evidence: `docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/research/manufacturer/spierings/`.

## Motion

Read the catalog's machine-readable baselines. In glTF, `SLEW` rotates localY. `TROLLEY` moves localX from30m. `HOOK` moves localY from16.24m. `HOIST_ROPES` scales localY about its fixed36.62m top, using `(18.52 - hookHeightDelta) / 18.52`; the rope attachment is1.86m above the hook datum. Apply both hook and rope updates together. Chosen demo hook limits1–34m avoid overlap between the visual hook assembly and trolley; this does not alter the published35m rated height. Trolley2–59m is the chosen visual demonstration range. Table-linked slew±15° is a demo rule, not a mechanical limit. No mast erection, jib folding or luffing is declared.

## Reproduction and checks

```sh
blender --background --factory-startup --python-exit-code 1 --python build.py
blender --background --factory-startup --python-exit-code 1 --python test_parenting.py
blender --background --factory-startup --python-exit-code 1 --python verify.py
```

Blender5.2.2LTS supplies `bpy`; run these commands from this directory. Python scripts resolve the repository relative to their own location. Existing original assets are the source dependency. `build.log`, `reimport.log`, `verification.json` and `reimport-verification.json` retain actual execution evidence; `overview.png` was visually inspected. Reopening and actual GLB reimport give identical evaluated vertex bounds `[-8.162,-4.33,0.01]` to `[60.07,4.33,42.11]`m, maximum error0m. SLEW15° and trolley30→40m move the expected geometry; root scale stays1.

The parenting regression records the initial failing lazy-matrix anchor in `parenting-red.log` and passing updated test in `parenting-green.log`. Export batching was corrected to bake evaluated vertices into fresh per-material/per-parent mesh data, avoiding shared-mesh contamination from `convert/join`; final bounds and render are from the corrected exporter. Raw detailed source remains editable; ornamental fitting sizes are inherited visual approximations, not engineering assembly data. Final app operation and safety geometry require separate integration QA.
