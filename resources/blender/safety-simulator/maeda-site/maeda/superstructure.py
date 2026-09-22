#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.13"
# dependencies = []
# ///
# ─── How to run ───
# Imported by build_maeda.py inside Blender 5.2.
# ──────────────────
"""Maeda upper carriage and controls, with an independently articulated boom rig."""
from __future__ import annotations

from math import radians

import bpy

from geometry import Rod, Solid, box, empty, label, parent_keep, polyline, rod
from rig_builder import make_rig


def make_upper(root: bpy.types.Object) -> bpy.types.Object:
    """SLEW carries the upper structure; nested motion nodes retain separate parents."""
    start_names = set(bpy.data.objects.keys())
    teal, dark = bpy.data.materials["Maeda Teal"], bpy.data.materials["Dark Teal"]
    steel, chrome = bpy.data.materials["Steel"], bpy.data.materials["Chrome"]
    rubber, white = bpy.data.materials["Rubber"], bpy.data.materials["Lettering"]
    slew = empty("SLEW", root)
    slew["motionAxisBlender"] = "+Z"
    slew["motionAxisGLTF"] = "+Y"
    rod(Rod("Slew_ring", (0, 0, 0.79), (0, 0, 0.95), 0.39), steel)
    box(Solid("Upper_platform", (-0.24, 0, 0.99), (1.72, 0.88, 0.19)), teal, 0.05)
    box(Solid("Engine_cover", (-0.77, 0, 1.18), (0.73, 0.90, 0.38)), teal, 0.07)
    box(Solid("Compact_counterweight", (-1.11, 0, 1.04), (0.32, 0.86, 0.40)), dark, 0.08)
    for index in range(8):
        box(Solid(f"Engine_vent_{index}", (-0.99 + index * 0.065, -0.455, 1.23), (0.025, 0.018, 0.20)), rubber, 0.004)
    for side in (-1, 1):
        plate = box(Solid(f"Boom_support_cheek_{side}", (-0.03, side * 0.23, 1.25), (0.38, 0.09, 0.48)), teal, 0.06)
        plate.rotation_euler[1] = radians(-8)
    rod(Rod("Boom_heel_pivot_pin", (0, -0.35, 1.42), (0, 0.35, 1.42), 0.085), chrome)
    rod(Rod("Winch_drum", (-0.57, -0.29, 1.35), (-0.57, 0.29, 1.35), 0.19), steel)
    for index in range(14):
        rod(Rod(f"Winch_reeving_{index}", (-0.57, -0.25 + index * 0.037, 1.34), (-0.57, -0.23 + index * 0.037, 1.34), 0.194), rubber)
    console = box(Solid("Operator_control_console", (-0.74, -0.58, 1.04), (0.48, 0.21, 0.19)), dark, 0.025)
    console.rotation_euler[0] = radians(15)
    for index in range(5):
        x = -0.91 + index * 0.08
        rod(Rod(f"Operator_lever_{index}", (x, -0.62, 1.13), (x, -0.65, 1.24), 0.014), chrome)
        rod(Rod(f"Lever_grip_{index}", (x, -0.65, 1.22), (x, -0.65, 1.27), 0.024), rubber)
    polyline("Operator_grabrail", [(-1.23, -0.62, 0.82), (-1.23, -0.62, 1.35), (-0.90, -0.62, 1.40), (-0.70, -0.62, 1.25)], steel)
    label(Solid("MAEDA", (-0.74, -0.456, 1.24), (0.115, 0, 0)), white)
    for mesh in list(bpy.context.scene.objects):
        if mesh.name not in start_names and mesh != slew:
            parent_keep(mesh, slew)
    make_rig(slew)
    return slew
