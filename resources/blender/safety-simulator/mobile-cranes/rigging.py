# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# ─── How to run ───
# Imported by upper.py inside Blender's bundled Python.
"""Editable telescope chain, physical anchors, normalized cables and actuators."""
from __future__ import annotations

from math import pi

import bpy

from configuration import Crane, Vec3
from crane_geometry import Builder
from rig_controls import apply_pose, baseline, section_length


def anchor(h: Builder, name: str, location: Vec3) -> bpy.types.Object:
    node = h.link(bpy.data.objects.new(name, None))
    node.location = location
    return node


def build(h: Builder, c: Crane) -> None:
    """Keep individual moving geometry under explicitly named transform nodes."""
    pivot, slew = bpy.data.objects["BOOM_PIVOT"], bpy.data.objects["SLEW"]
    h.root = pivot
    h.collection("04_TELESCOPIC_BOOM")
    length = section_length(c)
    for section in range(4):
        if section > 0:
            h.root = anchor(h, f"TELESCOPIC_{section}", ((c.boom_length - length) / 3, 0, 0))
        width = 0.94 - section * 0.145
        h.box(f"Boom_Section_{section + 1}", (length / 2, 0, 0), (length, width, width * 1.06), c.boom_color, 0.11)
        h.box(f"Boom_SlideCollar_{section + 1}", (length - 0.14, 0, 0), (0.22, width + 0.045, width * 1.06 + 0.055), "charcoal", 0.035)
        for side in (-1, 1):
            h.box(f"Boom_WearStrip_{section}_{side}", (length / 2, side * (width / 2 + 0.005), -width * 0.25), (length - 0.3, 0.019, 0.06), "metal", 0.005)
    h.box("Boom_Head", (length, 0, -0.05), (0.52, 0.61, 0.65), c.body_color, 0.12)
    for y in (-0.20, 0.20):
        h.cylinder(f"Boom_HeadSheave_{y}", (length, y - 0.06, -0.15), (length, y + 0.06, -0.15), 0.26, "metal", 24)
    anchor(h, "BOOM_AXIS_TIP", (length, 0, 0))
    h.root = anchor(h, "BOOM_TIP", (length, 0, -0.05))
    anchor(h, "BOOM_ROPE_TOP", (0, 0, 0))
    h.root = pivot
    anchor(h, "BOOM_RAM_ANCHOR", (4, 0, -0.45))
    h.label("Boom_Make_Label", "TADANO" if c.rough_terrain else "LIEBHERR", (length * 0.52, -0.487, 0.12), 0.33, "blue" if c.rough_terrain else "charcoal", (pi / 2, 0, 0))
    h.root = slew
    anchor(h, "RAM_BASE", (0.30, 0, 2.02))
    for name, radius, material in (("RAM_BARREL", 0.22, c.body_color), ("RAM_ROD", 0.13, "chrome")):
        h.root = anchor(h, name, (0, 0, 0))
        h.cylinder(f"{name}_Geometry", (0, 0, 0), (0, 0, 1), radius, material, 24)
        h.root = slew
    hoist(h)
    apply_pose(c, baseline(c))


def hoist(h: Builder) -> None:
    """Four normalized ropes and a separately moving hook with attachment datum."""
    h.collection("05_HOIST")
    slew = h.root
    h.root = anchor(h, "HOIST_ROPES", (0, 0, 0))
    for index, y in enumerate((-0.21, -0.07, 0.07, 0.21)):
        h.cylinder(f"Hoist_Rope_{index}", (0, y, 0), (0, y, 1), 0.014, "charcoal", 8)
    h.root = slew
    h.root = anchor(h, "HOOK", (0, 0, 4.2))
    anchor(h, "HOOK_ATTACH", (0, 0, 0.4))
    h.box("HookBlock_Shell", (0, 0, 0.05), (0.57, 0.64, 0.58), "yellow", 0.15)
    for y in (-0.33, 0.33):
        h.cylinder(f"HookBlock_Sheave_{y}", (0, y - 0.025, 0.05), (0, y + 0.025, 0.05), 0.22, "charcoal", 24)
    h.cylinder("HookBlock_Swivel", (0, 0, -0.25), (0, 0, -0.48), 0.10, "metal")
    h.line("Hook_ForgedCurve", [(0, 0, -0.40), (-0.18, 0, -0.62), (-0.16, 0, -0.91), (0.05, 0, -1.02), (0.26, 0, -0.92), (0.28, 0, -0.74)], 0.075, "metal")
    h.line("Hook_SafetyLatch", [(0.0, 0, -0.48), (0.28, 0, -0.74)], 0.022, "chrome")
    h.root = slew
