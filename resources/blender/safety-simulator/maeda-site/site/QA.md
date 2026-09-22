# Site asset verification

Verified with a separate Windows Blender 5.2.2 LTS background process on 2026-09-21. No live Blender MCP state was used.

- Editable `hvo-demo.blend` reopened successfully: 1,008 separate mesh objects.
- Exported GLB independently imported successfully: 22 mesh nodes, 121,016 triangles, 5,769,148 bytes.
- Source and imported full bounds agree: Blender XYZ `[-33,-23,-0.7]` to `[179,104,31.53464]` m. Measurements use each mesh vertex transformed to world coordinates, avoiding inflated local batch-box bounds. These include surrounding context.
- `SITE_SLAB` bounds agree exactly: `[0,0,-0.3]` to `[140,50,0]` m.
- Work, stock, destination, obstacle, both corridor and both refuge meshes preserve their names and `regionId` properties. The obstacle is exactly 15 × 12 × 6 m. Region-by-region measurements are in `verification.json`.
- `SITE_ROOT` retains unit scale and synthetic provenance.
- Source code audit found no programming-rule violations in all five Python files. Ruff E/F/I checks passed with E402 omitted because Blender script-local imports follow explicit path setup. Every file is below 250 pure lines.
- `overview.png` and `operational-detail.png` were visually inspected: tanks, columns, ladders, handrails, pipe racks and buildings read as industrial context; the operational area remains unobstructed except for the specified static obstacle. Floor paving and labels are deliberately muted for runtime overlays.
- Eni's published Daesan complex photograph was opened and visually inspected as a general industrial reference; its source URL and synthetic-approximation boundary are recorded in `README.md`.

Executed commands from the repository root:

```bash
'/mnt/c/Program Files/Blender Foundation/Blender 5.2/blender.exe' \
  --background --factory-startup --python-exit-code 1 \
  --python '\\wsl.localhost\Ubuntu\90-biyott@github\gs-hack-2026\resources\blender\safety-simulator\maeda-site\site\build.py'
'/mnt/c/Program Files/Blender Foundation/Blender 5.2/blender.exe' \
  --background --factory-startup --python-exit-code 1 \
  --python '\\wsl.localhost\Ubuntu\90-biyott@github\gs-hack-2026\resources\blender\safety-simulator\maeda-site\site\verify.py'
```

The complete logs are `build.log` and `verify.log`. The initial acceptance check failed because the required editable source did not yet exist; the completed artifact passed the same source/import checks. A factory-empty scene initially lacked world lighting; explicitly creating the world resolved that initialization error and the isolated regression command and complete build both passed.

This evidence covers Blender source and GLB geometry. Runtime Three.js loader and application interaction acceptance belong to the integration QA pass. The model does not establish real facility geometry, engineering performance, or safe refuge availability.
