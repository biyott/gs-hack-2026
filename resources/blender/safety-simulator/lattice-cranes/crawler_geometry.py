# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# ─── How to run ───
# Imported by build_assets.py inside Blender's bundled Python.
"""LR 1100.1 visual reconstruction: selected 32 m main boom at 60 degrees."""
from __future__ import annotations

from math import cos, pi, radians, sin

import bpy

from geometry import Builder
from lr_rig import PENDANTS, Pose, apply_pose


def build_tracks(h: Builder, root: bpy.types.Object) -> None:
    """Build paired crawler belts at the selected 6.27 by 5.00 m footprint."""
    for side in (-1, 1):
        y = side * 2.05
        name = "Track_L" if side < 0 else "Track_R"
        belt = h.empty(name, (0, y, 0), root)
        h.box(name + "_Frame", (0, 0, 0.64), (5.3, 0.74, 0.67), "dark", belt)
        for i in range(9):
            h.cylinder(name + f"_Roller_{i}", (-2.43 + i * 0.6075, 0, 0.57),
                       0.37, 0.76, "metal", belt, (pi / 2, 0, 0))
        for i in range(27):
            for z in (0.075, 1.175):
                h.box(name + f"_Tread_{i}_{z}", (-2.55 + i * 5.1 / 26, 0, z),
                      (0.19, 0.90, 0.15), "metal", belt)
        for end in (-1, 1):
            for i in range(9):
                angle = -pi / 2 + i * pi / 8
                x = end * (2.55 + 0.51 * cos(angle))
                z = 0.625 + 0.55 * sin(angle)
                tread = h.box(name + f"_CurvedTread_{end}_{i}", (x, 0, z),
                              (0.18, 0.9, 0.15), "metal", belt)
                tread.rotation_euler.y = -end * angle - pi / 2
    h.box("Undercarriage_body", (0, 0, 0.95), (4.5, 3.3, 0.65), "dark", root)
    for x in (-3.18, 3.18):
        h.box("Undercarriage_end", (x, 0, 0.89), (0.24, 3.30, 0.50), "dark", root)


def build_body(h: Builder, slew: bpy.types.Object) -> None:
    """Model asymmetrical cab, machinery house, gantry, platforms and rear ballast."""
    h.box("Upper_deck", (-0.6, 0, 0.25), (6.7, 3.45, 0.50), "dark", slew)
    h.box("Engine_housing", (-1.45, 0.47, 1.25), (3.50, 2.50, 1.62), "yellow", slew, 0.08)
    h.box("Engine_top", (-1.45, 0.47, 2.12), (3.55, 2.60, 0.15), "metal", slew)
    for x in (-2.85, -2.48, -2.11, -1.74):
        h.box("Engine_vent", (x, -0.79, 1.35), (0.22, 0.02, 0.98), "dark", slew)
    h.box("Cab_shell", (1.18, -1.39, 1.18), (1.95, 1.30, 1.77), "yellow", slew, 0.08)
    h.box("Cab_side_glazing", (1.28, -2.047, 1.46), (1.49, 0.025, 1.05), "glass", slew)
    h.box("Cab_front_glazing", (2.166, -1.39, 1.47), (0.025, 1.10, 1.07), "glass", slew)
    h.box("Cab_door_frame", (0.94, -2.07, 1.23), (0.06, 0.025, 1.48), "metal", slew)
    h.box("Cab_roof", (1.18, -1.39, 2.10), (2.05, 1.41, 0.10), "white", slew)
    for side in (-1, 1):
        y = side * 2.2675
        h.box("Walkway_platform", (-1.35, y, 0.39), (4.88, 1.0, 0.15), "metal", slew)
        for x in (-3.72, -2.25, -0.75, 1.1):
            h.rod("Walkway_rail_post", (x, side * 2.70, 0.47), (x, side * 2.70, 1.42), 0.025, "metal", slew)
        h.rod("Walkway_top_rail", (-3.72, side * 2.70, 1.42), (1.1, side * 2.70, 1.42), 0.025, "metal", slew)
        for level in range(3):
            h.box("Cab_access_step", (1.25, side * (2.15 + level * 0.10), 0.3 - level * 0.25),
                  (0.55, 0.3, 0.08), "metal", slew)
    outline = [(-3.25, -1.75), (-3.25, 1.75)]
    outline.extend([(-(4.7**2 - y**2)**0.5, y) for y in (1.75, 1.3, 0.85, 0.4, 0, -0.4, -0.85, -1.3, -1.75)])
    for level in range(7):
        z = 0.62 + level * 0.26
        vertices = [(x, y, height) for height in (z - 0.12, z + 0.12) for x, y in outline]
        count = len(outline)
        faces = [tuple(range(count - 1, -1, -1)), tuple(range(count, count * 2))]
        faces.extend([(i, (i + 1) % count, (i + 1) % count + count, i + count) for i in range(count)])
        h.mesh(f"Rear_ballast_slab_{level}", vertices, faces, "dark", slew)
    for y in (-1.55, 1.55):
        for level in range(7):
            h.box("Rear_hazard_mark", (-4.42, y, 0.62 + level * 0.26), (0.012, 0.21, 0.20),
                  "white" if level % 2 == 0 else "red", slew)
    for y in (-0.7, 0.7):
        h.rod("Gantry_forward_leg", (1.0, y, 0.45), (-1.7, y, 4.45), 0.09, "dark", slew)
        h.rod("Gantry_rear_leg", (-3.3, y, 0.7), (-1.7, y, 4.45), 0.09, "dark", slew)
    h.rod("Gantry_crossbar", (-1.7, -0.7, 4.45), (-1.7, 0.7, 4.45), 0.11, "metal", slew)
    for y in (-0.5, 0.5):
        h.cylinder("Hoist_winch", (-0.6, y, 0.88), 0.41, 0.60, "metal", slew, (pi / 2, 0, 0))


def boom_section(h: Builder, parent: bpy.types.Object, index: int,
                 start: float, length: float, widths: tuple[float, float]) -> None:
    """Create four tapering chords and triangulated faces per factory-length module."""
    segment = h.empty(f"Boom_section_{index}_{length:g}m", (start, 0, 0), parent)
    segment["length_m"] = length
    count = max(3, round(length / 1.5))
    for sy in (-1, 1):
        for sz in (-1, 1):
            h.rod("Boom_chord", (0, sy * widths[0] / 2, sz * widths[0] / 2),
                  (length, sy * widths[1] / 2, sz * widths[1] / 2), 0.065, "yellow", segment)
    for i in range(count):
        x0, x1 = length * i / count, length * (i + 1) / count
        w0 = (widths[0] + (widths[1] - widths[0]) * i / count) / 2
        w1 = (widths[0] + (widths[1] - widths[0]) * (i + 1) / count) / 2
        for side in (-1, 1):
            h.rod("Boom_side_diagonal", (x0, side * w0, -w0), (x1, side * w1, w1), 0.035, "yellow", segment)
            h.rod("Boom_face_diagonal", (x0, -w0, side * w0), (x1, w1, side * w1), 0.033, "yellow", segment)
        for y0, z0, y1, z1 in ((-w0, -w0, w0, -w0), (w0, -w0, w0, w0),
                                 (w0, w0, -w0, w0), (-w0, w0, -w0, -w0)):
            h.rod("Boom_cross_ring", (x0, y0, z0), (x0, y1, z1), 0.04, "yellow", segment)
    segment["section_widths_m"] = list(widths)


def build_crawler(h: Builder) -> bpy.types.Object:
    """Assemble selected source008 LR1100.1 configuration at metre scale."""
    root = h.empty("ROOT", (0, 0, 0))
    root["model"] = "Liebherr LR 1100.1"
    root["boom_length_m"] = 32.0
    root["selected_boom_angle_deg"] = 60.0
    root["tail_swing_radius_m"] = 4.70
    root["platform_width_m"] = 5.535
    root["track_footprint_m"] = [6.27, 5.0]
    root["fixed_jib"] = False
    build_tracks(h, root)
    h.cylinder("Slew_bearing", (0, 0, 1.55), 1.48, 0.34, "metal", root)
    slew = h.empty("SLEW", (0, 0, 1.70), root)
    build_body(h, slew)
    boom = h.empty("BOOM_PIVOT", (1.2, 0, 0.25), slew)
    boom.rotation_euler.y = radians(-60)
    start = 0.0
    for index, (length, widths) in enumerate(((5.5, (0.75, 1.8)), (6.0, (1.8, 1.8)),
                                              (12.0, (1.8, 1.8)), (8.5, (1.8, 0.48)))):
        boom_section(h, boom, index, start, length, widths)
        start += length
    h.cylinder("Main_head_sheave", (32, 0, 0), 0.3, 0.68, "metal", boom, (pi / 2, 0, 0))
    h.empty("BOOM_TIP", (32, 0, 0), boom)
    tip_x, tip_z = 1.2 + 32 * cos(radians(60)), 0.25 + 32 * sin(radians(60))
    for name, y in PENDANTS:
        suffix = name.removeprefix("BOOM_PENDANT_")
        h.empty("BOOM_PENDANT_ANCHOR_" + suffix, (-1.7, y, 4.45), slew)
        chord_half_width = (1.8 + (0.48 - 1.8) * (31.4 - 23.5) / 8.5) / 2
        attachment = (31.4, chord_half_width * y / 0.48, chord_half_width)
        h.empty("BOOM_PENDANT_ATTACH_" + suffix, attachment, boom)
        h.cylinder(name + "_attachment_pin", attachment, 0.10, 0.18, "metal", boom, (pi / 2, 0, 0))
        pendant = h.empty(name, (0, 0, 0), slew)
        pendant["axis"] = "unit positive line along Blender Z / glTF Y; origin=start"
        h.cylinder(name + "_line", (0, 0, 0.5), 0.026, 1, "dark", pendant)
    for y in (-0.48, 0.48):
        h.rod("Gantry_backstay", (-3.75, y, 0.8), (-1.7, y, 4.45), 0.025, "metal", slew)
    cable = h.empty("HOIST_ROPES", (tip_x, 0, tip_z), slew)
    cable["rest_length_m"] = 1.0
    cable["from_node"] = "BOOM_TIP"
    cable["to_node"] = "HOOK"
    for y in (-0.16, 0.16):
        h.rod("Hoist_line", (0, y, 0), (0, y, 1), 0.018, "dark", cable)
    hook = h.empty("HOOK", (tip_x, 0, tip_z - 12), slew)
    h.box("Hook_block", (0, 0, 0), (0.53, 0.58, 0.82), "yellow", hook, 0.04)
    for y in (-0.31, 0.31):
        h.cylinder("Hook_block_sheave", (0, y, 0.09), 0.23, 0.08, "metal", hook, (pi / 2, 0, 0))
    for i in range(12):
        a, b = radians(70 + i * 23), radians(70 + (i + 1) * 23)
        h.rod("Forged_hook", (0.22 * cos(a), 0, -0.71 + 0.22 * sin(a)),
              (0.22 * cos(b), 0, -0.71 + 0.22 * sin(b)), 0.058, "dark", hook)
    apply_pose(Pose())
    return root
