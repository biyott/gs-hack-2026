# Maeda MC305C-5 — editable articulated dimensional study

QD010 correction 01 was generated and checked in one isolated Blender process on 2026-09-21. The editable source has 245 objects; the exported GLB has 57 nodes, 38 mesh nodes and 22,160 triangles in 1,062,092 bytes. The prior four-section source/GLB and measurements are preserved in `qd010-correction-01/before/`. The corrected asset has five physical pentagonal principal shells, one fixed and four moving, as required by the archived manufacturer MC305C-5 brochure (page 2). `maeda-mc305.blend` is the editable source and `public/assets/cranes/maeda-mc305.glb` is the runtime export. Decorative geometry is batched by material within each rig parent; the five principal shell meshes, controls, stage hierarchy and link anchors remain separate. No original SK1265 file or live Blender MCP session was used. These are producer checks, not independent QA acceptance.

The official dimension-page reference is `docs/field-demo/references/maeda-mc305c5-dimensions-p1.png`, visually reviewed against archived proposal 008. This is a recognizable approximate model, not manufacturer CAD or a load-chart implementation. Official transport metadata remains 4.110 × 1.280 × 1.695 m. The displayed crane is deployed, so its whole bounds differ from the transport envelope. Manufacturer maxima 12.16 m radius and 12.52 m hook height are independent specification values, not this pose.

Blender XY is ground and Z is up. Standard glTF export converts to Y-up. One unit is one meter; the root is the ground projection of the slew axis, root scale is one, and zero heading points the boom along +X. The four pads retain the official outside envelope: length 5.170 m, front width 4.808 m, rear width 4.704 m. Pad centers are approximate, derived from assumed 0.280 m square pads: front `(2.445, ±2.264)`, rear `(-2.445, ±2.212)`. These outside dimensions are neither added together nor represented as support-center dimensions.

## Runtime controls

The catalog merge payload is `rig-catalog.json`, matching `packages/contracts/src/articulation.ts`. `rig-contract.json` additionally records the local coordinate formulas and geometric assumptions. The corrected rig version is `3.0.0`; the contract schema stays `2.0.0`.

| Control | Nodes | Default | Demo range |
| --- | --- | --- | --- |
| Slew | `SLEW`, glTF local +Y | 0° | Continuous; table restrictions belong to runtime |
| Boom angle | `BOOM_PIVOT`, glTF local +Z | 55° | 30–75° |
| Boom length | Nested `TELESCOPIC_1/2/3/4`, local +X | 10 m | 8–10.6 m |
| Hoist | `HOOK`, directly under `SLEW` | 3 m reference height | 1–4.5 m |

Four nested moving stages have baseline local X offsets 3.02, 1.93, 1.73 and 1.53 m. Each receives one quarter of the length delta from the 10 m baseline. The five principal shell lengths are 3.42, 2.33, 2.13, 1.93 and 1.79 m; the last shell carries `BOOM_TIP` at local X 1.79. Overlaps are 0.90 m at length 8 m, 0.40 m at baseline 10 m and 0.25 m at length 10.6 m. These are authored model dimensions and bounded kinematics, not manufacturer section lengths or certified operating limits.

Each principal mesh is an unbeveled hollow pentagonal prism with five exact outer longitudinal planar facets, five inner facets, and annular end faces. Outer height/width pairs in meters are `(0.46,0.37)`, `(0.37,0.30)`, `(0.29,0.245)`, `(0.235,0.20)` and `(0.185,0.16)`. The inner profile is scaled by 0.88; this is a representative hollow-shell reconstruction with nonuniform wall thickness, not an OEM angle or wall-thickness claim. The source-independent geometry oracle checks every principal shell and nested profile clearance.

`HOOK` moves horizontally under `BOOM_TIP` but retains a vertical orientation independent of luffing. `HOOK_ATTACH_1/2` are 0.23 m above its origin and ±0.07 m across the sheave. `TIP_ATTACH_1/2` use corresponding lateral offsets at the boom tip. The two hoist links are `HOIST_ROPE_1/2`. The lift actuator uses `LIFT_FIXED_ANCHOR` under `SLEW` and `LIFT_MOVING_ANCHOR` under `BOOM_PIVOT`; `LIFT_BARREL` spans the first 55% of this anchor distance and `LIFT_PISTON` the remainder. Every link has native geometry from local +Y 0..1 in glTF. A renderer computes its anchor endpoints in the link parent's coordinates, assigns its position and quaternion, then assigns absolute Y scale equal to endpoint distance. Radial scale remains one. Link mesh children and parent boundaries are preserved during batching.

The fixed hook range is valid across every angle/length combination: the shortest cable is 0.69 m at length 8 m, angle 30°, hook height 4.5 m. The default tip is `(5.735764, 0, 9.611521)` in Blender and the hook origin is `(5.735764, 0, 3.0)`.

## Verification and regeneration

After an explicit QA serial grant, run the single isolated producer from the repository root in WSL with installed Windows Blender 5.2:

```bash
bash resources/blender/safety-simulator/maeda-site/maeda/qd010-correction-01/run-producer.sh
```

Blender supplies bundled Python and `bpy`; geometry generation runs inside it. `run_qd010.py` first measures the preserved old source and requires a real RED against `verify_shapes.py`, whose five-section/five-facet criteria are pinned to the archived manufacturer PDF hash. It then resets isolated Blender data, builds the correction and checks source shape conformance before export. The verifier reopens the source, checks shapes and 24 motion poses, then independently imports the GLB and repeats shape and 24-pose checks. These exercise every minimum/maximum length, angle and hoist combination at three slew headings, asserting tip position, vertical hook alignment, actual cable and actuator mesh endpoints, stage overlap, and unchanged chassis/support transforms. Old and corrected static source mesh vertices/topology and world transforms are compared separately. Imported quaternion nodes are explicitly put into the rotation mode used by the Blender test driver.

`verification.json` records successful shape checks and 24 motion poses at each source/import boundary, 48 poses total. `qd010-correction-01/` contains the observed old RED, source/import conformance reports, static geometry snapshots/comparison, copied verification, producer log and execution receipt with native Windows PID, UTC times and hashes. Only `maeda-overview.png`, `maeda-side.png` and `maeda-carrier-detail.png` were regenerated from the imported baseline GLB. Studio floor and lights are generated only for review and are absent from the runtime GLB. The affected actual GLTFLoader suite passed 88 tests, the Maeda engine slice passed 17, and the independent direct GLB review passed 14 checks. Exact bindings and review limits are in the correction receipt. Integrated candidate acceptance remains with QA.

## Collision footprint measurements

The fixed carrier footprint is x `[-1.445, 1.205]`, y `[-0.640, 0.640]` m. Initial hubs measured 1.32 m across; their depths and internal frame were corrected individually to preserve visible rollers inside the final 1.280 m track envelope. There is no global scaling.

The counterweight alone is x `[-1.270, -0.950]`, y `[-0.430, 0.430]`. A conservative rectangle covering the complete rotating upper carrier, including controls and handrail but excluding the raised boom/hoist, is x `[-1.270, 0.620]`, y `[-0.706010, 0.450]`, z `[0.790, 1.540]` m. It was measured from named source part bounds in a separate Blender reopen. This complete upper rectangle covers the moving control platform more accurately than a counterweight-only footprint. Engine hazard distances and exclusion buffers remain separate runtime policy.

Historical endpoint captures remain in `endpoint-evidence/`: six fixed-camera angle/length/hoist minimum and maximum renders of the previous four-section asset. Their evidence JSON binds them to the old source/GLB hashes. They are not evidence of the QD010 correction and are not overwritten by its producer. See `endpoint-evidence/README.md` for that earlier command and observations.
