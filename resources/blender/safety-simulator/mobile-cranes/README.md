# Source-008 mobile cranes

Two individually editable Blender sources and optimized GLBs for the field safety simulator. These are dimension-guided exterior visualizations, not certified engineering or load-chart models.

| Asset | Source | Web GLB | Demo pose |
| --- | --- | --- | --- |
| Tadano GR-250N-4 / GR-250N(IV) | `tadano-gr250n4.blend` | `public/assets/cranes/tadano-gr250n4.glb` | 20m main boom, 50° |
| Liebherr LTM 1050-3.1 | `liebherr-ltm1050.blend` | `public/assets/cranes/liebherr-ltm1050.glb` | 26m main boom, 50°, no folding jib |

Tadano uses a compact two-axle carrier, four diagonally deployed X supports, blue/white exterior and one operator cab. LTM has three axles, a separate road cab, longitudinally staggered transverse outriggers and yellow exterior. Both include tire treads/hubs, access steps, glazing/pillars, radiator vents, hydraulic jacks/hoses, stacked counterweights, four nested boom sections, sheaves, four hoist ropes, hook block and curved hook.

## References and dimensional limits

The fixed selection is documented in `docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/sources/emul-008.body.md`. The supplied Tadano p1 and LTM p3 dimension images in `docs/field-demo/references/` were inspected visually. Supplemental manufacturer findings are preserved in the same goal run under `research/manufacturer/compact/tadano/facts.json` and `research/manufacturer/liebherr/ltm1050/facts.json`.

- [Tadano Korean GR250N-4 source](https://mediahub.tadano.com/m/20be7de269e4d894/original/doc_Tadano_GR250N-4_specsheet_korean-pdf-pdf.pdf): selected transport envelope 11.53 × 2.62 × 3.475m; boom range 9.35–30.5m. Nominal maximum support width 6.6m and pad outer width 7.18m remain separate. The 6.68m longitudinal span per side is from p6; the chosen 0.22m row stagger and coordinates relative to our origin are demo estimates. Exact manufacturer-oriented XY pad coordinates remain unconfirmed.
- [LTM official selected PDF](https://assets-cdn.liebherr.com/versions/e57b2c0c-a794-4463-bfdc-40af69903c8d/original/): selected 385/95R25 transport envelope 11.83 × 2.55 × 3.785m. The alternate 12.391m envelope is not used. Full transverse support centers are 6.4m; fore/aft row spans are 7.151m and 7.169m. Their different offsets are preserved. Centering the transverse span on our slew axis is a demo interpretation.

Transport envelopes are catalog data. These assets depict deployed poses and therefore have different measured bounds. Carrier proportions, cabin profiles, wheel radius, telescopic section profiles/overlaps, heel position and fittings are approximations. Do not infer operating clearance, ground bearing, rated load, stability or collision safety from these meshes. Manufacturer maxima are not asserted to occur simultaneously in either chosen pose. Tadano's 3.1m source tail radius and LTM's unresolved tail radius remain separate from the modeled counterweight envelope.

The carrier's measured lateral width conforms to the selected transport width even in this deployed pose: Tadano 2.620m and LTM 2.550m. An initial overwidth in steps/wheels/mirrors was corrected locally without scaling the model or moving its supports; see `evidence/carrier-width-correction.md`. LTM road mirrors are folded inward. The deployed support envelope remains separate.

## Axes and articulation

One Blender unit is one metre. Root `(0,0,0)` is the modeled slew axis projected onto the ground. Blender uses +Z up, +X along the unrotated boom. The GLB export converts to glTF +Y up: `(x,y,z)` in Blender becomes `(x,z,-y)` in glTF.

| Node | Blender | glTF / Three.js | Status |
| --- | --- | --- | --- |
| `SLEW` | local Z rotation, base 0 | local Y rotation, base 0 | Verified 15° rotation before and after roundtrip |
| `BOOM_PIVOT` | local Y = −elevation | local Z = +elevation | 35–65° bounded demo elevation, default 50° |
| `TELESCOPIC_1/2/3` | nested local X translations | nested local X translations | Each takes one third of requested length delta |
| `HOOK` | child of `SLEW`, selected Z height | child of `SLEW`, selected Y height | 3–10m block-center height, default 4.2m; follows physical tip horizontally |
| `HOIST_ROPES` | unit geometry along local +Z | unit geometry along local +Y | Link from `HOOK_ATTACH` to `BOOM_ROPE_TOP` |
| `RAM_BARREL` / `RAM_ROD` | unit geometry along local +Z | unit geometry along local +Y | Linked to `RAM_BASE` and `BOOM_RAM_ANCHOR`, fractions 0–0.55 / 0.55–1 |

All controls above are implemented and verified as bounded demo kinematics. `HOOK` is intentionally a sibling of `BOOM_PIVOT` under `SLEW`. After changing angle or length, project the actual `BOOM_TIP` world position into the hook parent's local frame, preserve the requested vertical height, then update every normalized link from its anchor endpoints. Link geometry remains exactly 0–1m along its local axis; pose scale is on the EMPTY node and is not baked into the mesh. `*-rig.json` contains the exact renderer articulation contract, control names, limits and scalar baselines.

The three telescopic parents form a chain; each local X baseline is `(initialLength − sectionLength) / 3`. Add `(requestedLength − initialLength) / 3` to each baseline. Tadano's fixed section mesh length is 8.95m, with an 18–24m demo boom range and at least 3.933m section overlap. LTM's section length is 11m, with a 24–30m demo range and at least 4.667m overlap. These bounded choices are separate from manufacturer boom ranges of 9.35–30.5m and 11.4–38m.

`BOOM_AXIS_TIP` marks the nominal centerline endpoint used to verify boom length. `BOOM_TIP` is the physical sheave suspension point, 0.05m below that point in boom-local coordinates. `BOOM_ROPE_TOP` is its identity child, so the hook and ropes share exactly the same horizontal position at every angle. `HOOK_ATTACH` is 0.4m above hook-block center. A risk engine using the nominal boom-axis projection therefore differs from the physical sheave projection by at most 0.05m; the selected 0.36m load polygon is a conservative approximation. Hydraulic anchors are `(0.3,0,2.02)` in Blender's upper frame and `(4,0,-0.45)` in boom-local coordinates.

## Rebuild

From the repository root with Blender 5.2 installed:

```sh
blender --background --factory-startup --python-exit-code 1 \
  --python resources/blender/safety-simulator/mobile-cranes/build_mobile_cranes.py
```

In WSL with the installed Windows binary:

```sh
"/mnt/c/Program Files/Blender Foundation/Blender 5.2/blender.exe" \
  --background --factory-startup --python-exit-code 1 \
  --python "$(wslpath -w "$PWD/resources/blender/safety-simulator/mobile-cranes/build_mobile_cranes.py")"
```

Scripts discover the repository from their own location. They import the existing `resources/blender/spierings-sk1265-at6/crane_geometry.py` primitive builder read-only. The original SK source and live Blender session are not opened or modified. All work runs in isolated background processes. The reusable palette's internal `SK1265_` material prefixes are retained; they are material names, not reused SK model geometry.

## Evidence

`evidence/blender-build.log` records successful Blender 5.2.2 builds. Each model has overview, side, ground-contact/detail and two min/max control-pose PNGs plus `*-verification.json`. Source files retain 252 and 338 individual geometry objects, while web exports merge evaluated meshes by material and articulated parent into 34 and 32 batches (1.14MB and 1.57MB respectively).

`tableSlewDeg` is null for these mobile cranes; the project's ±15° table demonstration restriction belongs to SK1265 only. The 15° slew measurement here is a verification probe, not an equipment limit.

The pipeline saves and reopens each actual `.blend`, exports via Blender's glTF API, imports the GLB into a fresh scene, checks all articulation nodes, and compares evaluated-vertex bounds to 1mm. A 15° slew test verifies hook displacement and constant height. Both original and imported rigs run all 27 minimum/middle/maximum length, elevation and hoist combinations, plus eight invalid-input rejection checks. Tests measure nominal/physical tip positions, vertical ropes, normalized link extents, hydraulic endpoints, positive section overlap, hook ground clearance and unchanged chassis/support geometry. Pads contact Z=0; tire tread geometry reaches −0.0015m due to the small rounded tread blocks.

`*-verification.json` includes exact carrier/counterweight bounds and drawn pad centers for catalog integration. These are visual mesh envelopes; they do not replace unconfirmed manufacturer fields. The initial reimport test failure and its quaternion-mode correction are recorded in `evidence/rig-debug.md`.

Build modules separate configuration, carrier, upper body, articulation geometry, pose math, rig verification, catalog output, studio, export merging and orchestration. All are below 250 non-comment lines. The programming no-excuse audit and Ruff syntax/undefined-name checks pass; Ruff E402 is excluded because Blender requires explicit sibling-module search paths before importing the builders. Full Blender API static typing is not claimed without matching API stubs.
