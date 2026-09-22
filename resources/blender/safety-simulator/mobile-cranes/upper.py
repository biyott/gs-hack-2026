# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# ─── How to run ───
# Imported by build_mobile_cranes.py in Blender's bundled Python.
"""Editable slewing superstructure and operator cabin."""
from __future__ import annotations

from math import radians

import bpy
import rigging

from crane_geometry import Builder
from configuration import Crane


def build(h: Builder, c: Crane) -> None:
    """Construct named rig pivots with +X boom direction and Z-up metre units."""
    model = h.root
    h.collection("03_SLEW_SUPERSTRUCTURE")
    h.cylinder("Slew_Bearing_Lower", (0, 0, 1.46), (0, 0, 1.75), 0.86, "charcoal", 48)
    slew = h.link(bpy.data.objects.new("SLEW", None))
    slew["control"] = "Blender rotation_euler.z / glTF-Three rotation.y; radians; base=0"
    h.root = slew
    h.cylinder("Slew_Bearing_Upper", (0, 0, 1.70), (0, 0, 1.90), 0.80, "metal", 48)
    h.box("Upper_Platform", (-0.4, 0, 1.99), (3.8, 2.38, 0.27), c.body_color, 0.07)
    for level in range(3):
        h.box(f"Counterweight_Layer_{level}", (-2.02, 0.1, 2.17 + level * 0.23), (1.22, 2.39, 0.20), "charcoal" if c.rough_terrain else c.body_color, 0.08)
    h.box("BoomHeel_Pedestal", (-1.10, 0, 2.43), (0.95, 0.8, 1.0), c.body_color, 0.12)
    h.cylinder("BoomHeel_Pin", (c.pivot[0], -0.60, c.pivot[2]), (c.pivot[0], 0.60, c.pivot[2]), 0.16, "metal", 24)
    operator_cab(h, c)
    for side in (-1, 1):
        h.line(f"Upper_Railing_{side}", [(-2.5, side * 1.1, 2.18), (-2.5, side * 1.1, 2.93), (-1.5, side * 1.1, 2.93)], 0.022, "metal")
    h.cylinder("Winch_Drum", (-1.5, -0.4, 2.55), (-1.5, 0.4, 2.55), 0.28, "charcoal", 24)
    pivot = h.link(bpy.data.objects.new("BOOM_PIVOT", None))
    pivot.location = c.pivot
    pivot.rotation_euler[1] = -radians(50)
    pivot["base_elevation_degrees"] = 50.0
    pivot["axis"] = "Blender local Y=-elevation; glTF local Z=+elevation"
    rigging.build(h, c)
    h.root = model


def operator_cab(h: Builder, c: Crane) -> None:
    """Chamfered operator glazing and exterior access details."""
    before = set(bpy.data.objects)
    h.box("OperatorCab_Base", (0.52, -0.96, 2.13), (1.90, 1.01, 0.41), c.body_color, 0.13)
    h.box("OperatorCab_Glass", (0.56, -0.96, 2.95), (1.69, 0.92, 1.20), "glass", 0.18)
    h.box("OperatorCab_Roof", (0.46, -0.96, 3.60), (1.92, 1.12, 0.12), c.boom_color, 0.07)
    for x in (-0.24, 0.59, 1.34):
        h.box(f"OperatorCab_Pillar_{x}", (x, -1.44, 2.95), (0.075, 0.06, 1.16), c.body_color)
    h.box("OperatorCab_DoorHandle", (0.05, -1.48, 2.62), (0.21, 0.025, 0.045), "metal")
    h.box("OperatorCab_Seat", (0.17, -0.93, 2.56), (0.42, 0.52, 0.61), "charcoal", 0.08)
    h.line("OperatorCab_Wiper", [(1.42, -1.25, 2.58), (1.42, -0.70, 3.17)], 0.012, "charcoal")
    h.cylinder("AmberBeaconBase", (0.0, -0.97, 3.66), (0.0, -0.97, 3.72), 0.12, "charcoal")
    h.cylinder("AmberBeacon", (0.0, -0.97, 3.72), (0.0, -0.97, 3.89), 0.10, "amber")
    if c.rough_terrain:
        for obj in set(bpy.data.objects) - before:
            obj.location.z = 2.0 + (obj.location.z - 2.0) * 0.77
            obj.scale.z *= 0.77

