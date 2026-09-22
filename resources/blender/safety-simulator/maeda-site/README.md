# Maeda crane and synthetic HVO demonstration site

Both assets use editable Blender sources and standard Y-up GLB exports. Blender construction coordinates are meters in local XY with Z up. Sources and generators are isolated from the original SK1265 project files and the live Blender MCP session.

| Asset | Editable source | Runtime export | Evidence |
| --- | --- | --- | --- |
| Maeda MC305C-5 | `maeda/maeda-mc305.blend` | `public/assets/cranes/maeda-mc305.glb` | `maeda/verification.json`, three PNGs, build/verification logs |
| Synthetic HVO demo site | `site/hvo-demo.blend` | `public/assets/site/hvo-demo.glb` | `site/site-metadata.json`, verification report, overview/detail PNGs and logs |

See each subdirectory README for regeneration commands, coordinate interpretation and approximation boundaries. Each generator runs using the installed Windows Blender 5.2 background process with a path converted through `wslpath -w`. The Maeda crane origin is the ground projection of the slew axis. The site slab uses the exact 140 × 50 m demonstration region with `(0, 0)` at one corner; illustrative refinery context extends beyond it. Runtime GLBs merge decorative detail by material while the saved sources retain individual objects.

The Maeda pad dimensions are official outside envelopes. Pad centers, selected boom pose and small mechanical details are stated visual approximations. The site is a synthetic reconstruction inspired by general published industrial imagery, not a surveyed or georeferenced HVO layout. It contains no permanent workers, movable crane, dynamic hazard surfaces or computed evacuation route. Runtime equipment, workers and danger/route overlays belong to the simulator.
