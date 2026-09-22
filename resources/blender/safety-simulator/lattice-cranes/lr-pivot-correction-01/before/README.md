# Liebherr lattice cranes — source008 selections

These are metre-scale, editable visual reconstructions of the selected LR 1100.1 and 172 EC-B 8 configurations. They are not manufacturer CAD. Source dimensions are separated below from illustrated details and derived heights.

## Files and reproducibility

- `liebherr-lr1100.blend` and `liebherr-172ecb.blend`: individual named components, materials, rig nodes, inspection cameras and studio lights.
- `../../../../public/assets/cranes/liebherr-lr1100.glb` and `liebherr-172ecb.glb`: meshes grouped by material within each moving rig node, retaining the rig hierarchy and custom metadata.
- `liebherr-*-overview.png`, `-side.png`, `-detail.png`: rendered from reopened source files.
- `liebherr-*-glb-overview.png`: rendered after fresh GLB import.
- `liebherr-*-blend-reopen.json`, `-glb-reimport.json`: measured vertices, bounds, node positions and actual motion assertions.
- `lr1100-build.log`, `172ecb-build.log`: successful background Blender build/export/reopen/reimport/render output.

From the repository root under WSL:

```bash
BLENDER='/mnt/c/Program Files/Blender Foundation/Blender 5.2/blender.exe'
SCRIPT="$(wslpath -w "$PWD/resources/blender/safety-simulator/lattice-cranes/build_assets.py")"
"$BLENDER" --background --factory-startup --python-exit-code 1 --python "$SCRIPT" -- lr1100
"$BLENDER" --background --factory-startup --python-exit-code 1 --python "$SCRIPT" -- 172ecb
```

Blender 5.2.2 LTS was used. No live Blender session or original SK1265 source file is modified. The helper geometry follows the established SK builder pattern, with explicit parent-local positions and shared cylinder mesh data. Export evaluates each source mesh and bakes its transform into a fresh batch mesh; it never joins mutable shared primitive data.

## Reference and scale contract

Reference archive: `docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/sources/emul-008.body.md`, its `emul-008-attachment/references/` dimension images, plus archived manufacturer PDFs and dimension pages under `evidence/research/manufacturer/liebherr/`.

Both assets have `ROOT` at the ground-level slew centre, identity scale, +X boom direction and Blender +Z up. glTF converts +Z to +Y and Blender +Y to glTF -Z. One unit is one metre. When importing a GLB back into Blender, control objects use quaternion rotation mode; the test selects XYZ mode before exercising Euler rotation.

### LR 1100.1

- Main boom 32 m = 5.5 m foot + 6 m + 12 m + 8.5 m head; no fixed or auxiliary jib. Selected demonstration boom angle is 60°, not a source operating limit.
- Underframe 6.60 × 5.00 m and track length 6.27 m are rounded US dimension-sheet conversions. Track belt width is 0.90 m, a visual approximation of the published 2′11″.
- The separate access-platform envelope is 5.535 m wide. It is not substituted for the track support footprint.
- Rear ballast contour follows an approximate 4.70 m radius. Small handrail/hazard markings may extend a few centimetres; a rectangular tail proxy is conservative relative to this curved outline.
- Slew joint is at Z=1.70 m, boom foot local `(2.1, 0, 0.25)` under it. These fitting positions are visual reconstructions. Default main head centre is world `(18.1, 0, 29.662813)` and hook control is `(18.1, 0, 17.662813)`.
- Cabin glazing/frames, vents, track shoes/rollers, gantry, winches, pendant ropes, stacked counterweights and hook are individually editable. Tube diameters, fittings and panel details are illustrative.
- `BOOM_PIVOT` supports absolute boom luffing over a chosen 45–70° demo range. The 32 m lattice assembly remains fixed length. This range is a visual simulation policy, not a manufacturer operating plan. Two suspension-line controls follow explicit gantry/boom anchors, and the vertical hoist follows `BOOM_TIP` while preserving the commanded 2–22 m hook ground height.

### 172 EC-B 8

The detailed dimensional derivation and source-page notes are in [tower-notes.md](tower-notes.md).

- Selected 16 HC 175 / UC-0460m, 50 m working outreach, 51.5 m physical jib extent and 14.5 m counterjib.
- 1.8 m tower width; 10 m TSB component, eleven regular 2.5 m sections, and a 2.5 m upper component. The 10 m component is shown as four lattice bays, not four additional standard sections.
- Published selected maximum hook height: 42.3 m, page 8 first UC-0460m column, row 11, with the manufacturer's starred condition. This is not the steel height.
- Modeled slew height 44.5 m and jib underside 45.2 m are derived fitting elevations. Their exact datums are not independently published in the archived configuration metadata.
- The 4.6 m value is the nominal UC support reference. The model shows rail bogies and illustrative short rails. Its measured base envelope is approximately 6.40 × 5.38 m including those rails. This is not a manufacturer support polygon or foundation design.
- Default trolley radius 30 m; default hook control at ground height 18.8 m. The hook maximum local Z=-2.7 gives the selected 42.3 m world height.
- Cab, ladders, lattice bracing, section joints, trolley wheels, winch, handrails, ballast and hook are visual reconstructions. Ground movement is disabled by simulation policy despite the physical rail undercarriage.

## Motion interface

Both assets support `SLEW` Z rotation and `HOOK` Z movement. The tower also supports `TROLLEY` X translation. Use the mapped Y axis for vertical movement/rotation/rope scale directly in glTF/Three.js. The tower hook and ropes are both descendants of TROLLEY, so they follow trolley movement and slewing.

LR controls are defined by [liebherr-lr1100-rig.json](liebherr-lr1100-rig.json), matching the canonical `EquipmentArticulationSchema`. `BOOM_PIVOT` rotates Blender -Y / glTF +Z by the absolute boom angle. `BOOM_TIP` is exactly the main sheave centre at boom-local X=32 m. The hook and rope controls remain children of SLEW. Both suspension attachments lie on the upper chords of the tapered boom head at local X=31.4 m; their named anchors remain on the gantry crossbar. Secondary pin and sheave dimensions are illustrative.

Each LR link has fresh mesh geometry from local 0 to +1 along Blender Z / glTF Y. After changing angle, slew or hook height, transform each named endpoint into its link parent's space, position at the start, rotate the positive unit axis toward the end, and scale that axis by the endpoint distance. `HOIST_ROPES` joins `BOOM_TIP` to `HOOK`; the two `BOOM_PENDANT_*` links join their `*_ANCHOR_*` and `*_ATTACH_*` nodes. Their varying lengths illustrate luffing reeving without an engineering winch model. The hook endpoint is a block reference and the head endpoint is the sheave centre, with small physical rope tangent offsets omitted.

Tower-only Blender-coordinate rope formula, with metadata carried in its GLB:

```text
HOIST_ROPES.scale.z =
  (HOIST_ROPES["top_z_local_m"] - HOOK.location.z
   - HOIST_ROPES.get("hook_attachment_local_z_m", 0))
  / HOIST_ROPES["rest_length_m"]
```

For tower: top=-0.32, rest=24.73, attachment=1.15; both are under TROLLEY. This explicit formula replaces nonportable Blender-only drivers. Tests move the hook by 2 m and confirm the rope upper anchor remains fixed while its lower end meets the hook attachment. LR tests instead exercise all 27 combinations of angles 45/57.5/70°, hook heights 2/12/22 m, and slew -35/0/70°, proving constant 32 m boom length, vertical hook alignment, preserved hook height, and both endpoints of all three links in reopened source and reimported GLB. `liebherr-lr1100-*-luff.json` records those cases; `*-glb-luff-min.png` and `*-glb-luff-max.png` show the range extremes.

## Verification boundaries

The build saves source before export optimization, reopens the `.blend`, exercises/restores supported motions, renders source views, starts an empty scene, imports the GLB, repeats the motion/ground/dimension tests, and renders the imported asset. No simulator safety result or load rating is inferred from these visual tests.

The Python modules each own geometry primitives, crawler geometry, tower geometry, studio presentation, export batching, build orchestration, or boundary verification. They contain no untyped escape annotations. The bundled programming-rule checker passes all modules; actual Blender execution is the authoritative API integration check.
