# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# ─── How to run ───
# Imported by the lattice-crane build script inside Blender's bundled Python.
"""Liebherr 172 EC-B 8, 16 HC 175 / UC-0460m, selected 50 m jib."""

from __future__ import annotations

from math import ceil, cos, pi, sin
from typing import Final

import bpy

from geometry import Builder

SLEW_HEIGHT: Final = 44.5
JIB_NODES: Final = ((1.1, 2.4), (12.8, 2.4), (18.4, 2.28),
                    (30.1, 1.69), (40.1, 1.69), (50.1, 1.69), (51.5, 0.24))
SECTION_IDS: Final = (1, 2, 3, 6, 7, 9)


def build_tower(h: Builder) -> bpy.types.Object:
    """Build editable local-axis rig; secondary member sizes are visual estimates."""
    root = h.empty("ROOT", (0, 0, 0))
    root["model"] = "Liebherr 172 EC-B 8 Litronic"
    root["source"] = "emul-008; 2025-02 manufacturer PDF, pages 4, 6, 8, 11, 13–15"
    root["configuration"] = "16 HC 175 / UC-0460m; 11 regular TS-0250 sections"
    root["units"] = "metres"
    root["hook_height_limit_m"] = 42.3
    root["hook_height_condition"] = "Page 8 row 11 first column; manufacturer starred condition retained"
    root["jib_outreach_m"] = 50.0
    root["jib_physical_radius_m"] = 51.5
    root["counterjib_length_m"] = 14.5
    root["tower_width_m"] = 1.8
    root["base_dimension_m"] = 4.6
    root["base_dimension_status"] = "Nominal UC reference; not a surveyed outer polygon"
    root["slew_height_derived_m"] = SLEW_HEIGHT
    root["height_derivation"] = "4.5 base + 10 TSB + 11*2.5 TS + 2.5 upper section"
    root["origin_policy"] = "Fixed simulation origin; physical undercarriage has rail bogies"

    base = h.empty("UC0460m_RAIL_UNDERCARRIAGE", (0, 0, 0), root)
    for side in (-1, 1):
        y = side * 2.3
        h.box(f"Rail_{side}", (0, y, 0.08), (6.4, 0.16, 0.16), "metal", base)
        h.box(f"RailHead_{side}", (0, y, 0.18), (6.4, 0.25, 0.08), "metal", base)
        h.box(f"BaseLongitudinal_{side}", (0, y, 1.04), (4.95, 0.35, 0.42), "yellow", base)
        h.box(f"BaseCrossbeam_{side}", (side * 2.3, 0, 1.12), (0.46, 4.95, 0.58), "yellow", base)
        for end in (-1, 1):
            x = end * 2.3
            h.box(f"RailBogie_{side}_{end}", (x, y, 0.7), (1.38, 0.66, 0.38), "yellow", base)
            for offset in (-0.4, 0.4):
                h.cylinder(f"RailWheel_{side}_{end}_{offset}", (x + offset, y, 0.48),
                           0.27, 0.26, "dark", base, rotation=(pi / 2, 0, 0))
                h.cylinder(f"BogieAxle_{side}_{end}_{offset}", (x + offset, y, 0.48),
                           0.11, 0.78, "metal", base, rotation=(pi / 2, 0, 0))
            h.rod(f"UC_InclinedStrut_{side}_{end}", (x, y, 1.4),
                  (end * 0.83, side * 0.83, 4.5), 0.13, "yellow", base)
        for level in range(5):
            h.box(f"CentralBallast_Visual_{side}_{level}", (0, side * 1.53, 1.5 + level * 0.35),
                  (3.5, 1.15, 0.32), "metal", base, bevel=0.04)
    for x in (-0.83, 0.83):
        for y in (-0.83, 0.83):
            h.box(f"UC_TowerLeg_{x}_{y}", (x, y, 2.93), (0.2, 0.2, 3.14), "yellow", base)
    h.box("UC_TowerSeat", (0, 0, 4.38), (2.06, 2.06, 0.24), "yellow", base)

    corners = ((-0.83, -0.83), (0.83, -0.83), (0.83, 0.83), (-0.83, 0.83))
    for section in range(16):
        tag = f"TSB10_Bay{section + 1}" if section < 4 else f"TS0250_{section - 3:02d}"
        if section == 15:
            tag = "TOP_TS0250"
        mast = h.empty(tag, (0, 0, 4.5 + section * 2.5), root)
        mast["structural_role"] = "10m TSB bay" if section < 4 else "2.5m tower section"
        for index, (x, y) in enumerate(corners):
            next_x, next_y = corners[(index + 1) % 4]
            h.box(f"{tag}_Chord{index}", (x, y, 1.25), (0.14, 0.14, 2.5), "yellow", mast)
            for z in (0.08, 2.42):
                h.rod(f"{tag}_Frame{index}_{z}", (x, y, z), (next_x, next_y, z), 0.055, "yellow", mast)
            h.rod(f"{tag}_DiagonalA{index}", (x, y, 0.12), (next_x, next_y, 1.25), 0.048, "yellow", mast)
            h.rod(f"{tag}_DiagonalB{index}", (next_x, next_y, 1.25), (x, y, 2.38), 0.048, "yellow", mast)
            h.box(f"{tag}_Splice{index}", (x, y, 0.13), (0.24, 0.24, 0.22), "yellow", mast)
        for x in (-0.24, 0.24):
            h.rod(f"{tag}_LadderRail{x}", (x, 0.52, 0), (x, 0.52, 2.5), 0.018, "metal", mast)
        for step in range(8):
            z = 0.12 + step * 0.31
            h.rod(f"{tag}_LadderRung{step}", (-0.24, 0.52, z), (0.24, 0.52, z), 0.015, "metal", mast)
        if section % 4 == 3:
            h.box(f"{tag}_RestLanding", (0, 0, 2.4), (1.45, 0.8, 0.05), "metal", mast)

    slew = h.empty("SLEW", (0, 0, SLEW_HEIGHT), root)
    slew["axis"] = "local Z rotation"
    h.cylinder("SlewBearingLower", (0, 0, SLEW_HEIGHT - 0.1), 1.1, 0.22, "dark", root)
    h.cylinder("SlewBearingUpper", (0, 0, 0.12), 1.16, 0.24, "yellow", slew)
    h.box("SlewServiceDeck", (0, 0, 0.35), (3.1, 3.0, 0.16), "yellow", slew)
    h.box("HeadSupport", (0, 0, 1.4), (1.55, 1.6, 2.0), "yellow", slew)
    h.box("CabLower", (1.05, -1.2, 0.97), (1.85, 1.28, 0.7), "yellow", slew, bevel=0.09)
    h.box("CabGlass", (1.12, -1.2, 1.92), (1.7, 1.23, 1.32), "glass", slew, bevel=0.09)
    h.box("CabRoof", (1.05, -1.2, 2.64), (2.0, 1.38, 0.13), "white", slew, bevel=0.04)
    for x in (0.25, 1.95):
        for y in (-1.84, -0.56):
            h.rod(f"CabPillar_{x}_{y}", (x, y, 1.24), (x, y, 2.59), 0.046, "yellow", slew)
    h.rod("CabWindowDivider", (1.1, -1.84, 1.23), (1.1, -1.84, 2.61), 0.035, "dark", slew)
    h.box("CabDoorStep", (0.06, -1.42, 0.46), (0.48, 0.8, 0.13), "metal", slew)

    for side in (-1, 1):
        y = side * 0.83
        h.rod(f"CounterjibLower_{side}", (-14.5, y, 0.72), (-0.9, y, 0.72), 0.1, "yellow", slew)
        h.rod(f"CounterjibUpper_{side}", (-14.5, y, 1.92), (-0.9, y, 2.7), 0.08, "yellow", slew)
        h.rod(f"CounterjibHandrail_{side}", (-14.4, side * 1.05, 1.95), (-1.7, side * 1.05, 1.95), 0.025, "metal", slew)
        for panel in range(9):
            x0, x1 = -14.5 + panel * 1.5, -13.0 + panel * 1.5
            top = 1.92 + (x1 + 14.5) * 0.78 / 13.6
            h.rod(f"CounterjibWeb_{side}_{panel}", (x0, y, 0.72), (x1, y, top), 0.047, "yellow", slew)
            h.rod(f"CounterjibPost_{side}_{panel}", (x0, side * 1.05, 0.75), (x0, side * 1.05, 1.95), 0.023, "metal", slew)
    h.box("CounterjibWalkway", (-7.45, 0, 0.71), (14.1, 2.15, 0.09), "metal", slew)
    h.box("HoistWinchHousing", (-6.5, 0, 1.37), (2.6, 1.45, 1.12), "yellow", slew, bevel=0.06)
    h.cylinder("HoistRopeDrum", (-8.3, 0, 1.3), 0.5, 1.25, "dark", slew, rotation=(pi / 2, 0, 0))
    for block in range(7):
        ballast = h.box(f"Counterweight_24kWFU_{block + 1}", (-14.13 + block * 0.35, 0, 0.72),
                        (0.32, 1.9, 2.08), "metal", slew, bevel=0.035)
        ballast["configuration"] = "Visual 4A+2B+1E grouping; 13.75t applies only to 24kW FU / 50m"
    h.box("CounterjibBrandPanel", (-5.6, -1.095, 1.1), (4.5, 0.03, 0.65), "white", slew)

    for section, ((x0, height0), (x1, height1)) in enumerate(zip(JIB_NODES, JIB_NODES[1:])):
        tag = f"JibSection_{SECTION_IDS[section]}"
        h.rod(f"{tag}_Crown", (x0, 0, 0.7 + height0), (x1, 0, 0.7 + height1), 0.065, "yellow", slew)
        panels = ceil((x1 - x0) / 1.8)
        for side in (-1, 1):
            y = side * 0.56
            h.rod(f"{tag}_Chord_{side}", (x0, y, 0.7), (x1, y, 0.7), 0.065, "yellow", slew)
            h.rod(f"{tag}_TrolleyRail_{side}", (x0, y, 0.59), (x1, y, 0.59), 0.036, "metal", slew)
            for panel in range(panels):
                a, b = x0 + (x1 - x0) * panel / panels, x0 + (x1 - x0) * (panel + 1) / panels
                mid = (a + b) / 2
                z = 0.7 + height0 + (height1 - height0) * (mid - x0) / (x1 - x0)
                h.rod(f"{tag}_WebA_{side}_{panel}", (a, y, 0.7), (mid, 0, z), 0.035, "yellow", slew)
                h.rod(f"{tag}_WebB_{side}_{panel}", (mid, 0, z), (b, y, 0.7), 0.035, "yellow", slew)
                h.rod(f"{tag}_Floor_{side}_{panel}", (a, y, 0.7), (b, -y, 0.7), 0.025, "yellow", slew)
            h.box(f"{tag}_Connector_{side}", (x0, y, 0.7), (0.2, 0.22, 0.22), "yellow", slew)
        h.rod(f"{tag}_EndCrossTie", (x1, -0.56, 0.7), (x1, 0.56, 0.7), 0.042, "yellow", slew)
    h.cylinder("JibTipSheave", (51.24, 0, 0.67), 0.22, 0.22, "metal", slew, rotation=(pi / 2, 0, 0))
    h.rod("TrolleyHaulRope", (1.3, 0, 0.48), (51.3, 0, 0.48), 0.013, "dark", slew)

    trolley = h.empty("TROLLEY", (30, 0, 0.5), slew)
    trolley["axis"] = "local X translation; 2.6m to 50m working radius"
    trolley["minimum_x_m"], trolley["maximum_x_m"] = 2.6, 50.0
    h.box("TrolleyCrosshead", (0, 0, -0.22), (1.36, 1.4, 0.25), "yellow", trolley)
    for x in (-0.52, 0.52):
        for y in (-0.58, 0.58):
            h.cylinder(f"TrolleyWheel_{x}_{y}", (x, y, 0.08), 0.19, 0.16, "dark", trolley, rotation=(pi / 2, 0, 0))
    hook = h.empty("HOOK", (0, 0, -26.2), trolley)
    hook["axis"] = "local Z translation; origin at hook bearing low point"
    hook["maximum_local_z_m"] = -2.7
    h.cylinder("HookBlockSheave", (0, 0, 1.15), 0.34, 0.42, "dark", hook, rotation=(pi / 2, 0, 0))
    for side in (-1, 1):
        h.box(f"HookBlockCheek_{side}", (0, side * 0.26, 1.06), (0.78, 0.09, 0.88), "yellow", hook, bevel=0.045)
        for stripe in (-1, 0, 1):
            h.box(f"HookStripe_{side}_{stripe}", (stripe * 0.24, side * 0.31, 1.06), (0.1, 0.025, 0.8), "dark", hook)
    h.rod("HookSwivel", (0, 0, 0.77), (0, 0, 0.49), 0.12, "metal", hook)
    points = tuple((0.04 + 0.27 * cos(pi / 2 + step * 1.65 * pi / 12), 0,
                    0.3 + 0.24 * sin(pi / 2 + step * 1.65 * pi / 12)) for step in range(13))
    for index, (a, b) in enumerate(zip(points, points[1:])):
        h.rod(f"ForgedHook_{index}", a, b, 0.07, "metal", hook)
    h.rod("HookSafetyLatch", (0.04, 0, 0.55), (0.28, 0, 0.4), 0.02, "metal", hook)
    ropes = h.empty("HOIST_ROPES", (0, 0, -0.32), trolley)
    ropes["rest_length_m"] = 24.73
    ropes["top_z_local_m"] = -0.32
    ropes["hook_attachment_local_z_m"] = 1.15
    ropes["scale_rule"] = "scale.z = (top_z_local_m - HOOK.location.z - 1.15) / rest_length_m"
    for side in (-1, 1):
        h.rod(f"HoistCable_{side}", (side * 0.21, 0, 0),
              (side * 0.21, 0, -24.73), 0.019, "dark", ropes)
    return root
