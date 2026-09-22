# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# ─── How to run ───
# Imported by build_mobile_cranes.py in Blender's bundled Python.
"""Wheel carriers and deployed hydraulic ground supports."""
from __future__ import annotations

from math import cos, pi, sin

from crane_geometry import Builder
from configuration import Crane, Vec3


def build(h: Builder, c: Crane) -> None:
    """Build model-specific axles, chassis, engine and support geometry."""
    h.collection("01_CARRIER")
    half_width = c.transport[1] / 2
    wheel_half_track = 1.085 if c.rough_terrain else 1.08
    h.box("Carrier_Frame", (c.body_center, 0, 0.94), (c.body_length, 1.72, 0.42), "charcoal", 0.08)
    h.box("Carrier_Deck", (c.body_center, 0, 1.38), (c.body_length, c.transport[1], 0.26), c.body_color, 0.08)
    for side in (-1, 1):
        h.box(f"SideDeck_{side}", (c.body_center, side * (half_width - 0.10), 1.50), (c.body_length - 0.45, 0.19, 0.07), "metal")
    for axle, x in enumerate(c.wheel_x):
        h.cylinder(f"Axle_{axle}", (x, -1.10, 0.70), (x, 1.10, 0.70), 0.13, "metal")
        for side in (-1, 1):
            y = side * wheel_half_track
            h.cylinder(f"Wheel_{axle}_{side}_Tire", (x, y - 0.1925, 0.70), (x, y + 0.1925, 0.70), 0.70, "rubber", 32)
            h.cylinder(f"Wheel_{axle}_{side}_Rim", (x, y + side * 0.1900, 0.70), (x, y + side * 0.1940, 0.70), 0.39, "metal", 24)
            h.cylinder(f"Wheel_{axle}_{side}_Hub", (x, y + side * 0.17, 0.70), (x, y + side * 0.195, 0.70), 0.16, "charcoal", 16)
            for lug in range(8):
                angle = lug * pi / 4
                lx, lz = x + cos(angle) * 0.23, 0.70 + sin(angle) * 0.23
                h.cylinder(f"WheelBolt_{axle}_{side}_{lug}", (lx, y + side * 0.1945, lz), (lx, y + side * 0.195, lz), 0.027, "chrome", 8)
            for tread in range(24):
                angle = tread * pi / 12
                block = h.box(f"Tread_{axle}_{side}_{tread}", (x + cos(angle) * 0.684, y, 0.70 + sin(angle) * 0.684), (0.10, 0.36, 0.035), "rubber", 0.007)
                block.rotation_euler[1] = pi / 2 - angle
            h.box(f"Fender_{axle}_{side}", (x, side * (half_width - 0.255), 1.51), (1.57, 0.5, 0.10), "charcoal")
    for side in (-1, 1):
        for step in range(3):
            h.box(f"AccessStep_{side}_{step}", (1.2, side * (half_width - 0.10), 0.55 + step * 0.30), (0.52, 0.19, 0.08), "metal")
    h.box("RearEngineHousing", (-2.15, 0, 1.95), (1.55, 2.23, 0.85), c.body_color, 0.09)
    for grille in range(9):
        h.box(f"EngineVent_{grille}", (-2.45 + grille * 0.09, -1.127, 2.0), (0.035, 0.025, 0.48), "charcoal", 0)
    for side in (-1, 1):
        for end in (-1, 1):
            x = c.body_center + end * (c.body_length / 2 + 0.01)
            h.box(f"BumperLamp_{side}_{end}", (x, side * 0.91, 1.15), (0.03, 0.28, 0.15), "white" if end > 0 else "red")
    if not c.rough_terrain:
        road_cab(h, c)
    supports(h, c)


def road_cab(h: Builder, c: Crane) -> None:
    """Full-width low road cab, characteristic of the three-axle LTM."""
    x = 5.05
    folded_mirror_y = c.transport[1] / 2 - 0.09
    h.box("RoadCab_Lower", (x, 0, 1.58), (1.61, 2.48, 0.83), c.body_color, 0.16)
    h.box("RoadCab_Glass", (x - 0.14, 0, 2.35), (1.44, 2.27, 0.86), "glass", 0.16)
    h.box("RoadCab_Roof", (x - 0.18, 0, 2.83), (1.63, 2.45, 0.13), c.body_color, 0.10)
    h.box("RoadCab_CentrePillar", (x + 0.59, 0, 2.34), (0.08, 0.06, 0.86), "charcoal")
    for side in (-1, 1):
        h.box(f"RoadCab_DoorPillar_{side}", (x - 0.18, side * 1.15, 2.33), (0.055, 0.05, 0.88), c.body_color)
        h.line(f"RoadCab_MirrorArm_{side}", [(x + 0.38, side * 1.15, 2.38), (x + 0.63, side * folded_mirror_y, 2.42)], 0.022, "metal")
        h.box(f"RoadCab_Mirror_{side}", (x + 0.63, side * folded_mirror_y, 2.36), (0.08, 0.13, 0.24), "charcoal")
        h.box(f"RoadCab_DoorHandle_{side}", (x - 0.51, side * 1.251, 1.91), (0.22, 0.03, 0.04), "charcoal")
    h.box("RoadCab_Grille", (x + 0.82, 0, 1.45), (0.04, 1.2, 0.23), "charcoal")


def supports(h: Builder, c: Crane) -> None:
    """Four telescoping steel beams, cylinder shoes and labelled ground pads."""
    h.collection("02_GROUND_SUPPORTS")
    for index, (x, y, _) in enumerate(c.pad_centers):
        start_x = (1 if x > 0 else -1) * 1.45 if c.rough_terrain else x
        start_y = (1 if y > 0 else -1) * 0.78
        a, b = (start_x, start_y, 1.14), (x, y, 1.02)
        h.cylinder(f"Support_{index}_OuterBeam", a, b, 0.225, c.body_color, 4)
        mid: Vec3 = (a[0] + (b[0] - a[0]) * 0.48, a[1] + (b[1] - a[1]) * 0.48, a[2] + (b[2] - a[2]) * 0.48)
        h.cylinder(f"Support_{index}_SlidingBeam", mid, b, 0.16, "metal", 4)
        h.cylinder(f"Support_{index}_JackHousing", (x, y, 0.60), (x, y, 1.36), 0.16, c.body_color, 16)
        h.cylinder(f"Support_{index}_ChromeRod", (x, y, 0.15), (x, y, 0.64), 0.095, "chrome", 16)
        h.box(f"Support_{index}_GroundPad", (x, y, 0.055), (c.pad_size, c.pad_size, 0.11), "charcoal", 0.05)
        h.cylinder(f"Support_{index}_FootJoint", (x, y, 0.10), (x, y, 0.19), 0.13, "metal")
        h.line(f"Support_{index}_Hose", [(x, y, 1.4), (x + 0.13, y, 1.5), (x + 0.22, y, 1.20), (x + 0.13, y, 0.74)], 0.018, "rubber")
