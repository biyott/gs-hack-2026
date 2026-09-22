#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.13"
# dependencies = []
# ///
# ─── How to run ───
# Imported by build_maeda.py in Blender 5.2.
# ──────────────────
"""Mini tracked carrier and four slanted outriggers in meter coordinates."""
from __future__ import annotations

from math import cos, pi, sin

import bpy

from geometry import Rod, Solid, beam, box, parent_keep, rod


def make_tracks(root: bpy.types.Object) -> None:
    """Make the compact 2.17 m crawler tracks with discrete rubber tread shoes."""
    rubber, steel = bpy.data.materials["Rubber"], bpy.data.materials["Steel"]
    for side in (-1, 1):
        y = side * 0.49
        box(Solid(f"Track_{side}_rubber_belt", (-0.25, y, 0.3075), (1.75, 0.21, 0.435)), rubber, 0.10)
        box(Solid(f"Track_{side}_sideframe", (-0.25, y, 0.32), (1.69, 0.21, 0.24)), steel, 0.10)
        for wheel_index in range(7):
            x = -1.015 + wheel_index * 0.255
            radius = 0.167 if wheel_index in (0, 6) else 0.106
            rod(Rod(f"Track_{side}_wheel_{wheel_index}", (x, y - 0.138, 0.31), (x, y + 0.138, 0.31), radius), steel)
            rod(Rod(f"Track_{side}_hub_{wheel_index}", (x, y + side * 0.138, 0.31), (x, y + side * 0.148, 0.31), radius * 0.43), rubber)
        for segment in range(2):
            sign = 1 if segment == 0 else -1
            for index in range(15):
                x = -1.09 + index * 0.12
                box(Solid(f"Tread_{side}_{segment}_{index}", (x, y, 0.3075 + sign * 0.2175), (0.09, 0.30, 0.035)), rubber, 0.01)
        for end in (-1, 1):
            for index in range(8):
                angle = -pi / 2 + index * pi / 7
                x = -0.25 + end * (0.87 + 0.1975 * cos(angle))
                z = 0.3075 + 0.1975 * sin(angle)
                shoe = box(Solid(f"TreadEnd_{side}_{end}_{index}", (x, y, z), (0.08, 0.30, 0.035)), rubber, 0.008)
                shoe.rotation_euler[1] = -end * angle + pi / 2
    box(Solid("Carrier_chassis", (-0.20, 0, 0.57), (2.46, 0.91, 0.30)), steel, 0.045)
    box(Solid("Carrier_upper_deck", (-0.12, 0, 0.76), (2.65, 1.16, 0.18)), bpy.data.materials["Maeda Teal"], 0.04)
    for mesh in list(bpy.context.scene.objects):
        if mesh != root and mesh.parent is None:
            parent_keep(mesh, root)


def make_outriggers(root: bpy.types.Object) -> None:
    """Preserve official OUTER dimensions using explicitly approximate pad centers."""
    teal = bpy.data.materials["Maeda Teal"]
    steel, chrome = bpy.data.materials["Steel"], bpy.data.materials["Chrome"]
    for fore in (-1, 1):
        for side in (-1, 1):
            suffix = f"{'FRONT' if fore > 0 else 'REAR'}_{'L' if side > 0 else 'R'}"
            pad_y = 2.264 if fore > 0 else 2.212
            start = (fore * 0.82, side * 0.45, 0.79)
            hinge = (fore * 1.5, side * 1.28, 0.49)
            foot = (fore * 2.445, side * pad_y, 0.17)
            leg = beam(Rod("Outrigger_main_" + suffix, start, hinge, 0.1), (0.19, 0.21), teal)
            leg["supportRole"] = "slanted outrigger"
            beam(Rod("Outrigger_extension_" + suffix, hinge, foot, 0.1), (0.135, 0.15), steel)
            beam(Rod("Outrigger_sleeve_" + suffix, hinge, (fore * 1.9, side * 1.70, 0.35), 0.1), (0.17, 0.19), teal)
            pad = box(Solid("PAD_" + suffix, (foot[0], foot[1], 0.035), (0.28, 0.28, 0.07)), steel, 0.012)
            pad["coordinateStatus"] = "demo center derived from assumed 0.28m pad, official outer envelope retained"
            rod(Rod("Outrigger_footpin_" + suffix, (foot[0], foot[1], 0.07), foot, 0.07), chrome)
            actuator_start = (fore * 0.90, side * 0.47, 1.02)
            actuator_mid = (fore * 1.35, side * 0.99, 0.73)
            actuator_end = (fore * 1.70, side * 1.42, 0.49)
            rod(Rod("Leg_hydraulic_barrel_" + suffix, actuator_start, actuator_mid, 0.066), teal)
            rod(Rod("Leg_hydraulic_piston_" + suffix, actuator_mid, actuator_end, 0.038), chrome)
            rod(Rod("Leg_hinge_pin_" + suffix, (start[0], start[1] - 0.15, start[2]), (start[0], start[1] + 0.15, start[2]), 0.066), chrome)
    for mesh in list(bpy.context.scene.objects):
        if mesh != root and mesh.parent is None:
            parent_keep(mesh, root)
