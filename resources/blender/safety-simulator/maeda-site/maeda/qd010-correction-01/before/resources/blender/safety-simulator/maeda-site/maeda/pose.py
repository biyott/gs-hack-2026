#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.13"
# dependencies = []
# ///
# ─── How to run ───
# Imported by build_maeda.py and verify_maeda.py in Blender 5.2.
# ──────────────────
"""Demo Maeda kinematics mirrored by the runtime's rig-contract.json formulas."""
from __future__ import annotations

from dataclasses import dataclass
from math import cos, radians, sin
from typing import Final

import bpy
from mathutils import Vector

STAGE_OFFSETS: Final = (3.02, 2.43, 2.23)


@dataclass(frozen=True, slots=True)
class Pose:
    length: float = 10.0
    angle: float = 55.0
    hook_height: float = 3.0
    slew: float = 0.0


def fit_cylinder(node: bpy.types.Object, endpoints: tuple[Vector, Vector]) -> None:
    """Align a unit +Z cylinder, whose origin is the bottom, to two local points."""
    start, end = endpoints
    delta = end - start
    node.location = start
    node.rotation_mode = "QUATERNION"
    node.rotation_quaternion = delta.to_track_quat("Z", "Y")
    node.scale = (1, 1, delta.length)


def apply_pose(pose: Pose) -> float:
    """Apply bounded local kinematics; return the hook reference height."""
    assert 8.0 <= pose.length <= 10.6
    assert 30.0 <= pose.angle <= 75.0
    assert 1.0 <= pose.hook_height <= 4.5
    angle = radians(pose.angle)
    slew = bpy.data.objects["SLEW"]
    slew.rotation_mode = "XYZ"
    slew.rotation_euler = (0, 0, radians(pose.slew))
    pivot = bpy.data.objects["BOOM_PIVOT"]
    pivot.rotation_mode = "XYZ"
    pivot.rotation_euler = (0, -angle, 0)
    for index, baseline in enumerate(STAGE_OFFSETS, start=1):
        bpy.data.objects[f"TELESCOPIC_{index}"].location.x = baseline + (pose.length - 10) / 3
    tip_x = pose.length * cos(angle)
    tip_z = 1.42 + pose.length * sin(angle)
    height = pose.hook_height
    bpy.data.objects["HOOK"].location = (tip_x, 0, height)
    for index, side in enumerate((-1, 1), start=1):
        rope = bpy.data.objects[f"HOIST_ROPE_{index}"]
        rope.location = (tip_x, side * 0.07, height + 0.23)
        rope.scale = (1, 1, tip_z - height - 0.23)
    anchor = Vector((0.59, 0, 1.02))
    attachment = Vector((2.3 * cos(angle) + 0.22 * sin(angle), 0, 1.42 + 2.3 * sin(angle) - 0.22 * cos(angle)))
    midpoint = anchor.lerp(attachment, 0.55)
    fit_cylinder(bpy.data.objects["LIFT_BARREL"], (anchor, midpoint))
    fit_cylinder(bpy.data.objects["LIFT_PISTON"], (midpoint, attachment))
    bpy.context.view_layer.update()
    return height
