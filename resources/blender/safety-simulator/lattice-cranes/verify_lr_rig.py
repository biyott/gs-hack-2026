# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# ─── How to run ───
# Imported by verify_assets.py for both reopened Blend and reimported GLB.
"""Exercise the LR luff/slew/hoist combinations against actual transformed endpoints."""
from __future__ import annotations

import json
from itertools import product
from math import cos, radians, sin
from pathlib import Path

import bpy
from mathutils import Vector

from lr_rig import LINKS, Pose, apply_pose


def verify_luff(stage: str) -> None:
    """Assert rigid boom length, vertical hoist endpoints and suspension line endpoints."""
    root = bpy.data.objects["ROOT"]
    boom = bpy.data.objects["BOOM_PIVOT"]
    slew = bpy.data.objects["SLEW"]
    ropes = bpy.data.objects["HOIST_ROPES"]
    hook = bpy.data.objects["HOOK"]
    assert boom.parent == slew and ropes.parent == slew and hook.parent == slew
    assert root["units"] == "metres"
    assert abs(bpy.context.scene.unit_settings.scale_length - 1) < 0.0001
    assert (root.matrix_world.to_scale() - Vector((1, 1, 1))).length < 0.0001
    assert (slew.matrix_world.to_scale() - Vector((1, 1, 1))).length < 0.0001
    root_basis = root.matrix_world.to_3x3()
    up = root_basis @ Vector((0, 0, 1))
    # Independent manufacturer oracle: EN LR 1100.1 page 8, "1200*" boom pivot dimension.
    expected_forward_m = 1200.0 / 1000.0
    for name, _, _ in LINKS:
        node = bpy.data.objects[name]
        inverse = node.matrix_world.inverted()
        local_points = [inverse @ child.matrix_world @ vertex.co
                        for child in node.children_recursive if child.type == "MESH"
                        for vertex in child.data.vertices]
        assert abs(min(point.z for point in local_points)) < 0.0001
        assert abs(max(point.z for point in local_points) - 1) < 0.0001
    samples: list[dict[str, float | list[float]]] = []
    for angle, height, azimuth in product((45.0, 57.5, 70.0), (2.0, 12.0, 22.0), (-35.0, 0.0, 70.0)):
        apply_pose(Pose(angle, height, azimuth))
        foot = boom.matrix_world.translation
        offset = foot - slew.matrix_world.translation
        forward = root_basis @ Vector((cos(radians(azimuth)), sin(radians(azimuth)), 0))
        horizontal = offset - up * offset.dot(up)
        assert abs(horizontal.length - expected_forward_m) < 0.0001, "EN p8 requires a 1200 mm horizontal boom-foot offset"
        assert abs(offset.dot(forward) - expected_forward_m) < 0.0001, "Boom foot must remain forward of the slewing axis"
        assert abs(offset.dot(up.cross(forward))) < 0.0001, "Boom foot must remain on the slew heading centreline"
        tip = boom.matrix_world @ Vector((32, 0, 0))
        bottom = ropes.matrix_world @ Vector((0, 0, 1))
        assert abs((tip - foot).length - 32) < 0.0001
        assert (tip - ropes.matrix_world.translation).length < 0.0001
        assert (bottom - hook.matrix_world.translation).length < 0.0001
        assert abs(hook.matrix_world.translation.z - height) < 0.0001
        assert abs(tip.x - hook.matrix_world.translation.x) < 0.0001
        assert abs(tip.y - hook.matrix_world.translation.y) < 0.0001
        for name, start_name, end_name in LINKS:
            node = bpy.data.objects[name]
            line_start = node.matrix_world @ Vector((0, 0, 0))
            line_end = node.matrix_world @ Vector((0, 0, 1))
            anchor = bpy.data.objects[start_name].matrix_world.translation
            attachment = bpy.data.objects[end_name].matrix_world.translation
            assert (line_start - anchor).length < 0.0001
            assert (line_end - attachment).length < 0.0001
        samples.append({"boom_angle_deg": angle, "hook_height_m": height, "slew_deg": azimuth,
                        "pivot_offset_world_m": list(offset), "pivot_horizontal_offset_m": horizontal.length,
                        "pivot_forward_projection_m": offset.dot(forward),
                        "tip_world_m": list(tip), "hook_world_m": list(hook.matrix_world.translation)})
    apply_pose(Pose())
    result = {"status": "passed", "boundary": stage, "case_count": len(samples),
              "manufacturer_pivot_horizontal_mm": 1200, "manufacturer_datum_source": "LR 1100.1 EN p8, 1200* boom pivot point",
              "root_scale_m_per_unit": 1.0,
              "boom_length_m": 32.0, "telescoping": False, "samples": samples}
    output = Path(__file__).resolve().parent / f"liebherr-lr1100-{stage}-luff.json"
    output.write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(f"LR_LUFF_PASSED {stage}: {len(samples)} angle/slew/hoist combinations")
