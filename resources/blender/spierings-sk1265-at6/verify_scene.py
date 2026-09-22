# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# ─── How to run ───
# Blender Python: import verify_scene; verify_scene.run()
"""Check measured scene geometry against the selected reference configuration."""

from __future__ import annotations

import json
from pathlib import Path

import bpy
from mathutils import Vector


def corners(obj: bpy.types.Object) -> list[Vector]:
    return [obj.matrix_world @ Vector(point) for point in obj.bound_box]


def run() -> None:
    """Validate actual objects and write a compact evidence record beside the blend."""
    scene = bpy.context.scene
    bpy.context.view_layer.update()
    model = [o for o in scene.objects
             if o.type in {"MESH", "CURVE", "FONT"} and o.name != "Studio_Ground"]
    tires = [o for o in model if o.name.startswith("Axle_") and o.name.endswith("_Tire")]
    pads = [o for o in model if o.name.endswith("_GroundPlate")]
    assert len(tires) == 12, "The six-axle carrier must have twelve tires"
    assert len(pads) == 4, "The deployed crane must have four outrigger plates"
    axle_x = sorted({round((min(p.x for p in corners(o)) + max(p.x for p in corners(o))) / 2, 3)
                     for o in tires})
    assert axle_x == [-5.305, -3.008, -1.394, -0.049, 1.296, 2.638]
    pad_x = sorted({round((min(p.x for p in corners(o)) + max(p.x for p in corners(o))) / 2, 3)
                    for o in pads})
    pad_y = sorted({round((min(p.y for p in corners(o)) + max(p.y for p in corners(o))) / 2, 3)
                    for o in pads})
    assert abs(pad_x[-1] - pad_x[0] - 7.95) < 0.001
    assert abs(pad_y[-1] - pad_y[0] - 7.66) < 0.001
    tip = scene.objects["Jib05_UpperChord"]
    tip_end = tip.matrix_world @ Vector((0, 0, 0.5))
    assert abs(tip_end.x - 60) < 0.001
    top = max(p.z for p in corners(scene.objects["Telescopic mast section 3"]))
    assert abs(top - 37.2) < 0.001
    rungs = [o for o in model if o.name.startswith("Section 1 ladder rung")]
    rung_min_y = min(p.y for o in rungs for p in corners(o))
    ram_max_y = max(p.y for o in model if o.name.startswith("Erection ram") for p in corners(o))
    assert rung_min_y - ram_max_y > 0.3, "Ladder must clear the erection ram"
    pedestal = corners(scene.objects["Carrier slew pedestal"])
    assert min(p.z for p in pedestal) <= 1.58 and max(p.z for p in pedestal) >= 1.72
    points = [p for o in model for p in corners(o)]
    report = {
        "status": "passed",
        "blender_version": bpy.app.version_string,
        "scene": scene.name,
        "geometry_object_count": len(model),
        "tire_count": len(tires),
        "axle_centres_x_m": axle_x,
        "outrigger_plate_count": len(pads),
        "outrigger_spread_m": [round(pad_x[-1] - pad_x[0], 3), round(pad_y[-1] - pad_y[0], 3)],
        "jib_tip_centreline_x_m": round(tip_end.x, 3),
        "mast_top_m": round(top, 3),
        "ladder_ram_lateral_clearance_m": round(rung_min_y - ram_max_y, 3),
        "model_bounds_min_m": [round(min(p[i] for p in points), 3) for i in range(3)],
        "model_bounds_max_m": [round(max(p[i] for p in points), 3) for i in range(3)],
        "source": "Spierings Specs-SK1265_EN.pdf",
        "approximate_details": "Truss section layout, tube diameters, cab and mechanical fittings",
        "original_scene_preserved": "Scene" in bpy.data.scenes,
    }
    path = Path(bpy.data.filepath).parent / "verification.json"
    path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False))
