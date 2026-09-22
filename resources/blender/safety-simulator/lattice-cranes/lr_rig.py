# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# ─── How to run ───
# Imported by build_assets.py in Blender; JSON counterpart is liebherr-lr1100-rig.json.
"""Explicit LR fixed-length boom luffing, vertical hoist and suspension-line controls."""
from __future__ import annotations

from dataclasses import dataclass
from math import radians
from typing import Final

import bpy
from mathutils import Vector

PENDANTS: Final = (("BOOM_PENDANT_LEFT", -0.48), ("BOOM_PENDANT_RIGHT", 0.48))
LINKS: Final = (("HOIST_ROPES", "BOOM_TIP", "HOOK"),
               ("BOOM_PENDANT_LEFT", "BOOM_PENDANT_ANCHOR_LEFT", "BOOM_PENDANT_ATTACH_LEFT"),
               ("BOOM_PENDANT_RIGHT", "BOOM_PENDANT_ANCHOR_RIGHT", "BOOM_PENDANT_ATTACH_RIGHT"))


@dataclass(frozen=True, slots=True)
class Pose:
    """Chosen visual demo controls; ranges are not a manufacturer operating plan."""

    boom_angle_deg: float = 60.0
    hook_height_m: float = 17.662812921102035
    slew_deg: float = 0.0


def apply_pose(pose: Pose) -> None:
    """Update parent-local nodes, then reanchor the vertical hoist and suspension lines."""
    slew = bpy.data.objects["SLEW"]
    boom = bpy.data.objects["BOOM_PIVOT"]
    hook = bpy.data.objects["HOOK"]
    slew.rotation_mode = "XYZ"
    slew.rotation_euler.z = radians(pose.slew_deg)
    boom.rotation_mode = "XYZ"
    boom.rotation_euler.y = -radians(pose.boom_angle_deg)
    bpy.context.view_layer.update()
    boom_to_slew = slew.matrix_world.inverted() @ boom.matrix_world
    tip = boom_to_slew @ Vector((32, 0, 0))
    hook.location = (tip.x, tip.y, pose.hook_height_m - slew.location.z)
    bpy.context.view_layer.update()
    for name, start_name, end_name in LINKS:
        node = bpy.data.objects[name]
        parent_inverse = node.parent.matrix_world.inverted()
        start = parent_inverse @ bpy.data.objects[start_name].matrix_world.translation
        end = parent_inverse @ bpy.data.objects[end_name].matrix_world.translation
        direction = end - start
        node.location = start
        node.rotation_mode = "QUATERNION"
        node.rotation_quaternion = direction.to_track_quat("Z", "Y")
        node.scale = (1, 1, direction.length)
    bpy.context.view_layer.update()
