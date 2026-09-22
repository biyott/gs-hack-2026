#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.13"
# dependencies = []
# ///
# ─── How to run ───
# Imported by build_maeda.py inside Blender 5.2.
# ──────────────────
"""Editable nested telescope, independently suspended hook and unit-length links."""
from __future__ import annotations

from math import cos, radians, sin

import bpy

from geometry import Rod, Solid, box, empty, label, polyline, rod
from pentagonal_shell import pentagonal_shell
from pose import Pose, apply_pose


def make_boom(slew: bpy.types.Object) -> None:
    """All telescope joints translate along their parent's local +X axis."""
    teal, dark = bpy.data.materials["Maeda Teal"], bpy.data.materials["Dark Teal"]
    steel, rubber = bpy.data.materials["Steel"], bpy.data.materials["Rubber"]
    pivot = empty("BOOM_PIVOT", slew)
    pivot.location.z = 1.42
    parent = pivot
    dimensions = ((0, 3.42, 0.46, 0.37), (3.02, 2.33, 0.37, 0.30), (1.93, 2.13, 0.29, 0.245), (1.73, 1.93, 0.235, 0.20), (1.53, 1.79, 0.185, 0.16))
    for index, (offset, length, depth, width) in enumerate(dimensions):
        if index > 0:
            parent = empty(f"TELESCOPIC_{index}", parent)
            parent.location.x = offset
        section = pentagonal_shell(Solid(f"Telescopic_section_{index + 1}", (length / 2, 0, 0), (length, width, depth)), teal)
        section.parent = parent
        collar = pentagonal_shell(Solid(f"Wear_collar_{index + 1}", (length - 0.05, 0, 0), (0.13, width + 0.045, depth + 0.045)), dark, 0.94)
        collar.parent = parent
        cable = rod(Rod(f"Boom_top_cable_{index + 1}", (0, 0, depth / 2 + 0.035), (length, 0, depth / 2 + 0.035), 0.013), rubber)
        cable.parent = parent
    tip = empty("BOOM_TIP", parent)
    tip.location.x = 1.79
    sheave = rod(Rod("Boom_head_sheave", (0, -0.20, 0), (0, 0.20, 0), 0.18), steel)
    sheave.parent = tip
    decal = label(Solid("MC305C-5", (1.8, -0.19, 0), (0.20, 0, 0)), bpy.data.materials["Lettering"])
    decal.parent = pivot
    for index, side in enumerate((-1, 1), start=1):
        attachment = empty(f"TIP_ATTACH_{index}", tip)
        attachment.location.y = side * 0.07
    moving = empty("LIFT_MOVING_ANCHOR", pivot)
    moving.location = (2.3, 0, -0.22)


def make_hook(slew: bpy.types.Object) -> None:
    """The hook stays vertical because it belongs directly to SLEW, not the boom."""
    hook = empty("HOOK", slew)
    steel, chrome = bpy.data.materials["Steel"], bpy.data.materials["Chrome"]
    block = box(Solid("Hook_block", (0, 0, 0.09), (0.21, 0.22, 0.29)), bpy.data.materials["Warning Yellow"], 0.04)
    block.parent = hook
    crosspin = rod(Rod("Hook_block_crosspin", (0, -0.13, 0.11), (0, 0.13, 0.11), 0.075), steel)
    crosspin.parent = hook
    points = [(0.11 * cos(radians(a)), 0, -0.13 + 0.13 * sin(radians(a))) for a in range(90, 351, 15)]
    forged = polyline("Forged_safety_hook", points, chrome)
    forged.parent = hook
    latch = rod(Rod("Hook_latch", (0.10, 0, -0.16), (0.015, 0, -0.035), 0.012), steel)
    latch.parent = hook
    for index, side in enumerate((-1, 1), start=1):
        attachment = empty(f"HOOK_ATTACH_{index}", hook)
        attachment.location = (0, side * 0.07, 0.23)


def make_links(slew: bpy.types.Object) -> None:
    """Link mesh origins are at their lower end; their native length is one meter."""
    for name, radius, mat_name in (("HOIST_ROPE_1", 0.012, "Rubber"), ("HOIST_ROPE_2", 0.012, "Rubber"), ("LIFT_BARREL", 0.095, "Dark Teal"), ("LIFT_PISTON", 0.060, "Chrome")):
        link = empty(name, slew)
        mesh = rod(Rod(name + "_unit_mesh", (0, 0, 0), (0, 0, 1), radius), bpy.data.materials[mat_name])
        mesh.parent = link
        link["unitLengthMeters"] = 1.0
        link["nativeAxisGLTF"] = "+Y"
        link["origin"] = "start"
    fixed = empty("LIFT_FIXED_ANCHOR", slew)
    fixed.location = (0.59, 0, 1.02)


def make_rig(slew: bpy.types.Object) -> None:
    make_boom(slew)
    make_hook(slew)
    make_links(slew)
    apply_pose(Pose())
