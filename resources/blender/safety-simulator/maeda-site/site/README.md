# HVO-inspired synthetic site

Editable, metre-scale industrial context for `SITE-CONSTRUCTION-01`, map version `1.0.0`, floor `GROUND`. This is a synthetic demonstration setting, not a surveyed or approved LG/GS/LG-Eni plant layout. The source contract is [DESIGN.md §9](../../../../../DESIGN.md) and the archived [emul-008 proposal](../../../../../docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/sources/emul-008.body.md).

The completed context was visually compared against Eni's published photograph captioned **LG Chem’s Daesan Chemical Complex in Seosan, South Korea**, in its [4 August 2025 HVO/SAF announcement](https://www.eni.com/en-IT/media/press-release/2025/08/turning-waste-and-residues-into-sustainable-fuels-lg-chem-and-enilive.html). The [original image](https://s7g10.scene7.com/is/image/eni/LG-Chem-s-Daesan-Chemical-South-Korea:horizontal-16-9?bfc=on&fit=crop,1&hei=946&wid=1680) was inspected on 2026-09-21 and retained locally as `eni-daesan-reference.jpg` for reference. Observed visual motifs are pale cylindrical tank groups, tall metallic process columns, long pipe galleries, and low service buildings. Those general forms inform the visual comparison; the asset's facility counts, positions, sizes, colors, and simplified density are synthetic. The photograph is not embedded as a texture, and its coastline or internal facility layout is not reproduced.

The operational slab occupies exactly Blender XY `(0,0)` through `(140,50)` metres. Blender is Z-up; the standard glTF export is Y-up, so web coordinates are `[mapX, height, -mapY]`. `SITE_ROOT` has origin `(0,0,0)` and unit scale. The surrounding refinery architecture is illustrative context outside the operating rectangle; its ground support extends underneath the complete scene.

| Node | Region ID | XY footprint / height (m) |
| --- | --- | --- |
| `SITE_SLAB` | `SITE-BOUNDARY` | x 0–140, y 0–50, top z 0 |
| `REGION__WORK-AREA` | `WORK-AREA` | x 15–100, y 12–38 |
| `REGION__STOCK` | `STOCK` | x 55–75, y 17–29 |
| `REGION__DESTINATION` | `DESTINATION` | x 80–95, y 17–29 |
| `REGION__OBSTACLE-01` | `OBSTACLE-01` | x 105–120, y 18–30, z 0–6 |
| `REGION__PATH-A` | `PATH-A` | x 8–132, y 6–10 |
| `REGION__PATH-B` | `PATH-B` | x 8–132, y 40–44 |
| `REGION__REFUGE-01` | `REFUGE-01` | center (125,8), illustrative radius 1.5 |
| `REGION__REFUGE-02` | `REFUGE-02` | center (125,42), illustrative radius 1.5 |

Refuge radii and all surrounding plant architecture are visual design choices. The stated candidate centers come from the contract. Refuge patches indicate candidates only; the runtime route engine determines availability. Floor overlays are raised by a few centimetres to avoid rendering conflicts. Static corridor paving is not a computed route. No crane, worker, live hazard or computed route is embedded.

`hvo-demo.blend` preserves named, separately editable mesh objects and the `OPERATIONAL_SITE` and `INDUSTRIAL_CONTEXT` collections. Tanks include shell courses, roof rails and access ladders; process columns include platforms, handrails, risers and ladders; pipe racks use braced portals; service buildings include cladding, windows and vents. Flat PBR materials and text geometry make the GLB self-contained without external textures or fonts. The runtime export merges decorative geometry by material for fewer draw calls, while retaining each operational region as its own named node. Presentation cameras and lights remain in the source and are excluded from GLB selection export.

From this folder, using an independent Blender 5.2 process:

```sh
blender --background --factory-startup --python-exit-code 1 --python build.py
blender --background --factory-startup --python-exit-code 1 --python export.py
blender --background --factory-startup --python-exit-code 1 --python verify.py
```

Blender supplies `bpy`, so these scripts run with its embedded Python. They do not use the live Blender MCP connection. `build.py` saves the source, exports `public/assets/site/hvo-demo.glb`, and renders `overview.png` and `operational-detail.png`. `verify.py` reopens the source and independently imports the export, verifies named regions and bounds, then writes `verification.json`.

The site is a visual model. Decorative structures do not define engine collision geometry, engineering dimensions, process behavior, load calculations, or safety instructions.
