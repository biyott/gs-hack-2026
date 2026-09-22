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
from pathlib import Path

import bpy
from mathutils import Vector

from lr_rig import LINKS, Pose, apply_pose


def verify_luff(stage: str) -> None:
    """Assert rigid boom length, vertical hoist endpoints and suspension line endpoints."""
    boom = bpy.data.objects["BOOM_PIVOT"]
    slew = bpy.data.objects["SLEW"]
    ropes = bpy.data.objects["HOIST_ROPES"]
    hook = bpy.data.objects["HOOK"]
    assert boom.parent == slew and ropes.parent == slew and hook.parent == slew
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
                        "tip_world_m": list(tip), "hook_world_m": list(hook.matrix_world.translation)})
    apply_pose(Pose())
    result = {"status": "passed", "boundary": stage, "case_count": len(samples),
              "boom_length_m": 32.0, "telescoping": False, "samples": samples}
    output = Path(__file__).resolve().parent / f"liebherr-lr1100-{stage}-luff.json"
    output.write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(f"LR_LUFF_PASSED {stage}: {len(samples)} angle/slew/hoist combinations")
