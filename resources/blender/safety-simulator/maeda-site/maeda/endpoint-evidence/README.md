# Maeda control endpoint render evidence

Each PNG comes from an independent Blender process importing the current runtime GLB. No geometry rebuild, GLB export, or Blender-source save is performed. `render_endpoints.py` uses the existing `pose.py` driver and a fixed camera across six captures, changing exactly one control against the default length 10 m, angle 55°, hook height 3 m, slew 0°.

| PNG | Length | Angle | Hook height |
| --- | --- | --- | --- |
| `angle-min.png` | 10 m | 30° | 3 m |
| `angle-max.png` | 10 m | 75° | 3 m |
| `length-min.png` | 8 m | 55° | 3 m |
| `length-max.png` | 10.6 m | 55° | 3 m |
| `hoist-min.png` | 10 m | 55° | 1 m |
| `hoist-max.png` | 10 m | 55° | 4.5 m |

`evidence.json` records exact requested poses, observed hook/tip positions, PNG SHA-256 values, and source/GLB SHA-256 values before and after capture. `render.log` records the run. The renderer asserts that the `.blend` and `.glb` remain byte-identical throughout.

Executed from the repository root:

```bash
'/mnt/c/Program Files/Blender Foundation/Blender 5.2/blender.exe' --background --factory-startup --python-exit-code 1 --python "$(wslpath -w "$PWD/resources/blender/safety-simulator/maeda-site/maeda/render_endpoints.py")"
```

These images supplement the 24-pose numerical reimport checks in `../verification.json`. They document model kinematics within demo ranges, not manufacturer-certified operating conditions.

Visual inspection completed for all six PNGs after rendering: every boom tip, hook and support pad remains within the frame; angle endpoints show luffing with an attached hydraulic actuator; length endpoints show the nested stages moving while retaining visible overlaps; hoist endpoints show the same boom position with the vertical cable/hook at 1.0 m and 4.5 m. The ground carrier and support placement match across the fixed-camera captures. No detached link or frame clipping was observed.

Run result: `ENDPOINT_RENDER_PASS six captures; source and GLB hashes unchanged`.
