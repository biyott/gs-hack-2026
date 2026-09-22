# Maeda MC305C-5 — editable articulated dimensional study

`maeda-mc305.blend` is the editable source: 241 individually editable objects. `public/assets/cranes/maeda-mc305.glb` is the runtime asset: 35 mesh nodes, 53 total nodes, 22,564 triangles and 1,081,424 bytes. Decorative geometry is batched by material within each rig parent. Named controls, stage hierarchy and link anchors remain separate. No original SK1265 file or live Blender MCP session was touched.

The official dimension-page reference is `docs/field-demo/references/maeda-mc305c5-dimensions-p1.png`, visually reviewed against archived proposal 008. This is a recognizable approximate model, not manufacturer CAD or a load-chart implementation. Official transport metadata remains 4.110 × 1.280 × 1.695 m. The displayed crane is deployed, so its whole bounds differ from the transport envelope. Manufacturer maxima 12.16 m radius and 12.52 m hook height are independent specification values, not this pose.

Blender XY is ground and Z is up. Standard glTF export converts to Y-up. One unit is one meter; the root is the ground projection of the slew axis, root scale is one, and zero heading points the boom along +X. The four pads retain the official outside envelope: length 5.170 m, front width 4.808 m, rear width 4.704 m. Pad centers are approximate, derived from assumed 0.280 m square pads: front `(2.445, ±2.264)`, rear `(-2.445, ±2.212)`. These outside dimensions are neither added together nor represented as support-center dimensions.

## Runtime controls

The catalog merge payload is `rig-catalog.json`, matching `packages/contracts/src/articulation.ts`. `rig-contract.json` additionally records the local coordinate formulas and geometric assumptions. Rig version is `2.0.0`.

| Control | Nodes | Default | Demo range |
| --- | --- | --- | --- |
| Slew | `SLEW`, glTF local +Y | 0° | Continuous; table restrictions belong to runtime |
| Boom angle | `BOOM_PIVOT`, glTF local +Z | 55° | 30–75° |
| Boom length | Nested `TELESCOPIC_1/2/3`, local +X | 10 m | 8–10.6 m |
| Hoist | `HOOK`, directly under `SLEW` | 3 m reference height | 1–4.5 m |

Three nested moving stages have baseline local X offsets 3.02, 2.43 and 2.23 m. Each receives one third of the length delta from the 10 m baseline. Their section lengths are 2.83, 2.63 and 2.32 m; the fixed base section is 3.42 m. The last section carries `BOOM_TIP` at local X 2.32. Baseline overlaps are 0.40 m, decreasing to 0.20 m at maximum extension. These ranges are demonstrable model kinematics, not certified manufacturer operating limits.

`HOOK` moves horizontally under `BOOM_TIP` but retains a vertical orientation independent of luffing. `HOOK_ATTACH_1/2` are 0.23 m above its origin and ±0.07 m across the sheave. `TIP_ATTACH_1/2` use corresponding lateral offsets at the boom tip. The two hoist links are `HOIST_ROPE_1/2`. The lift actuator uses `LIFT_FIXED_ANCHOR` under `SLEW` and `LIFT_MOVING_ANCHOR` under `BOOM_PIVOT`; `LIFT_BARREL` spans the first 55% of this anchor distance and `LIFT_PISTON` the remainder. Every link has native geometry from local +Y 0..1 in glTF. A renderer computes its anchor endpoints in the link parent's coordinates, assigns its position and quaternion, then assigns absolute Y scale equal to endpoint distance. Radial scale remains one. Link mesh children and parent boundaries are preserved during batching.

The fixed hook range is valid across every angle/length combination: the shortest cable is 0.69 m at length 8 m, angle 30°, hook height 4.5 m. The default tip is `(5.735764, 0, 9.611521)` in Blender and the hook origin is `(5.735764, 0, 3.0)`.

## Verification and regeneration

Run from the repository root in WSL with installed Windows Blender 5.2:

```bash
'/mnt/c/Program Files/Blender Foundation/Blender 5.2/blender.exe' --background --factory-startup --python-exit-code 1 --python "$(wslpath -w "$PWD/resources/blender/safety-simulator/maeda-site/maeda/build_maeda.py")"
'/mnt/c/Program Files/Blender Foundation/Blender 5.2/blender.exe' --background --factory-startup --python-exit-code 1 --python "$(wslpath -w "$PWD/resources/blender/safety-simulator/maeda-site/maeda/verify_maeda.py")"
```

Blender supplies bundled Python and `bpy`; geometry generation runs inside it. The verifier reopens the source, deletes that scene, independently imports the GLB, measures actual transformed mesh vertices, checks dimensions and exercises 24 poses: every minimum/maximum length, angle and hoist combination at three slew headings. It asserts tip position, vertical hook alignment, actual cable and actuator mesh endpoints, stage overlap, and unchanged chassis/support transforms. Imported quaternion nodes are explicitly put into the rotation mode used by the Blender test driver.

`verification.json` records the successful checks and final measurements. `build.log` and `verification.log` record the runs. `maeda-overview.png`, `maeda-side.png` and `maeda-carrier-detail.png` show the reimported baseline asset and were visually inspected after the rig update. Studio floor and lights are generated only for review and are absent from the runtime GLB. All ten Python modules pass the programming audit and stay under 250 pure lines. Runtime GLTFLoader acceptance is a separate integration check.

## Collision footprint measurements

The fixed carrier footprint is x `[-1.445, 1.205]`, y `[-0.640, 0.640]` m. Initial hubs measured 1.32 m across; their depths and internal frame were corrected individually to preserve visible rollers inside the final 1.280 m track envelope. There is no global scaling.

The counterweight alone is x `[-1.270, -0.950]`, y `[-0.430, 0.430]`. A conservative rectangle covering the complete rotating upper carrier, including controls and handrail but excluding the raised boom/hoist, is x `[-1.270, 0.620]`, y `[-0.706010, 0.450]`, z `[0.790, 1.540]` m. It was measured from named source part bounds in a separate Blender reopen. This complete upper rectangle covers the moving control platform more accurately than a counterweight-only footprint. Engine hazard distances and exclusion buffers remain separate runtime policy.

Separate current-GLB endpoint captures are in `endpoint-evidence/`: six fixed-camera angle/length/hoist minimum and maximum renders. Their evidence JSON records exact poses, measured tip/hook positions, image hashes and unchanged source/GLB hashes. All six were visually inspected; the existing model and source were not rebuilt or saved during capture. See `endpoint-evidence/README.md` for the command and observations.
