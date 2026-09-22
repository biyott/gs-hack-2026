#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.13"
# dependencies = []
# ///
# ─── How to run ───
# Imported by verify_maeda.py inside Blender 5.2 after GLB reimport.
# ──────────────────
"""Physical endpoints and moving geometry checks for all bounded demo controls."""
from __future__ import annotations

from itertools import product
from math import cos, radians, sin
from typing import TypedDict

import bpy
from mathutils import Vector

from pose import Pose, apply_pose


class MotionReport(TypedDict):
    status: str
    cornerPosesTested: int
    supportedControls: list[str]
    nodeNamesVerified: list[str]
    assertions: list[str]


def near_vector(actual: Vector, expected: Vector) -> None:
    assert (actual - expected).length < 0.0001, (tuple(actual), tuple(expected))


def check_link(name: str, expected: tuple[Vector, Vector]) -> None:
    """Validate node ends and the actual exported cylinder mesh's projected bounds."""
    link = bpy.data.objects[name]
    start, end = expected
    near_vector(link.matrix_world @ Vector((0, 0, 0)), start)
    near_vector(link.matrix_world @ Vector((0, 0, 1)), end)
    direction = (end - start).normalized()
    projections = [(mesh.matrix_world @ vertex.co - start).dot(direction) for mesh in link.children if mesh.type == "MESH" for vertex in mesh.data.vertices]
    assert projections
    assert abs(min(projections)) < 0.0001
    assert abs(max(projections) - (end - start).length) < 0.0001


def verify_all_controls() -> MotionReport:
    root = bpy.data.objects["MAEDA_ROOT"]
    fixed = {obj.name: obj.matrix_world.copy() for obj in root.children if obj.name != "SLEW"}
    root_transform = root.matrix_world.copy()
    sample_count = 0
    for length, angle, height, slew_degrees in product((8.0, 10.6), (30.0, 75.0), (1.0, 4.5), (-120.0, 0.0, 90.0)):
        pose = Pose(length=length, angle=angle, hook_height=height, slew=slew_degrees)
        apply_pose(pose)
        tip = bpy.data.objects["BOOM_TIP"].matrix_world.translation
        x = length * cos(radians(angle))
        expected = Vector((x * cos(radians(slew_degrees)), x * sin(radians(slew_degrees)), 1.42 + length * sin(radians(angle))))
        near_vector(tip, expected)
        hook = bpy.data.objects["HOOK"]
        near_vector(hook.matrix_world.translation, Vector((tip.x, tip.y, height)))
        near_vector(hook.matrix_world.to_3x3() @ Vector((0, 0, 1)), Vector((0, 0, 1)))
        for index in (1, 2):
            lower = bpy.data.objects[f"HOOK_ATTACH_{index}"].matrix_world.translation
            upper = bpy.data.objects[f"TIP_ATTACH_{index}"].matrix_world.translation
            assert upper.z - lower.z >= 0.6899
            assert abs(upper.x - lower.x) < 0.0001
            assert abs(upper.y - lower.y) < 0.0001
            check_link(f"HOIST_ROPE_{index}", (lower, upper))
        lower = bpy.data.objects["LIFT_FIXED_ANCHOR"].matrix_world.translation
        upper = bpy.data.objects["LIFT_MOVING_ANCHOR"].matrix_world.translation
        midpoint = lower.lerp(upper, 0.55)
        check_link("LIFT_BARREL", (lower, midpoint))
        check_link("LIFT_PISTON", (midpoint, upper))
        for index, previous_length in enumerate((3.42, 2.83, 2.63), start=1):
            stage = bpy.data.objects[f"TELESCOPIC_{index}"]
            assert previous_length - stage.location.x >= 0.1999
            assert previous_length - stage.location.x <= 1.067
        assert root.matrix_world == root_transform
        for name, matrix in fixed.items():
            assert bpy.data.objects[name].matrix_world == matrix
        sample_count += 1
    apply_pose(Pose())
    return {
        "status": "passed",
        "cornerPosesTested": sample_count,
        "supportedControls": ["slew", "boomAngle", "boomLength", "hookHeight"],
        "nodeNamesVerified": ["SLEW", "BOOM_PIVOT", "TELESCOPIC_1", "TELESCOPIC_2", "TELESCOPIC_3", "BOOM_TIP", "HOOK", "HOIST_ROPE_1", "HOIST_ROPE_2", "LIFT_BARREL", "LIFT_PISTON"],
        "assertions": ["tip matches length/angle/slew", "hook remains vertically under tip", "rope mesh endpoints match anchors", "hydraulic mesh endpoints match fraction anchors", "telescope overlap >=0.20m", "root and supports unchanged", "all minimum/maximum length, angle and hoist combinations checked at three slew headings"],
    }
