# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# ─── How to run ───
# Blender embedded module; imported by build.py using Blender --background.
"""Illustrative refinery architecture entirely outside the operational rectangle."""

from __future__ import annotations

from math import cos, pi, sin

from geometry import box, cylinder, label, ring, rod


def tank(name: str, form: tuple[float, float, float, float]) -> None:
    """Build a roofed tank with a foundation, shell courses and top handrail."""
    x, y, radius, height = form
    cylinder(name + "_foundation", ((x, y, 0.2), radius + 0.7, 0.4), "concrete")
    cylinder(name + "_shell", ((x, y, height / 2 + 0.4), radius, height), "tank")
    cylinder(name + "_roof", ((x, y, height + 0.45), radius + 0.1, 0.2), "steel")
    for z in (0.8, height / 2, height):
        ring(name + "_shell_course", ((x, y, z), radius + 0.025, 0.045), "steel")
    ring(name + "_top_rail", ((x, y, height + 1.5), radius - 0.25, 0.055), "structure")
    for n in range(16):
        angle = n * pi / 8
        px, py = x + (radius - 0.25) * cos(angle), y + (radius - 0.25) * sin(angle)
        rod(
            name + "_rail_post",
            ((px, py, height + 0.6), (px, py, height + 1.5), 0.04),
            "structure",
        )
    for side in (-0.35, 0.35):
        rod(
            name + "_ladder_side",
            (
                (x + side, y - radius - 0.12, 0.5),
                (x + side, y - radius - 0.12, height + 1.4),
                0.05,
            ),
            "structure",
        )
    for n in range(int(height * 2)):
        rod(
            name + "_ladder_rung",
            (
                (x - 0.35, y - radius - 0.12, n * 0.5 + 0.5),
                (x + 0.35, y - radius - 0.12, n * 0.5 + 0.5),
                0.04,
            ),
            "structure",
        )
    label(
        name + "_roof_id",
        (name.removeprefix("CTX_"), (x, y, height + 0.57), 1.1),
        "structure",
    )


def tower(name: str, form: tuple[float, float, float, float]) -> None:
    """Use stepped vessels, catwalks, side piping and vertical access ladders."""
    x, y, radius, height = form
    cylinder(name + "_plinth", ((x, y, 0.3), radius + 0.7, 0.6), "concrete")
    cylinder(name + "_skirt", ((x, y, 1.8), radius, 3), "structure")
    cylinder(name + "_vessel", ((x, y, height / 2 + 1.5), radius, height - 3), "steel")
    cylinder(name + "_cap", ((x, y, height), radius * 0.75, 0.4), "tank")
    for z in (height * 0.35, height * 0.65, height - 0.5):
        cylinder(name + "_catwalk", ((x, y, z), radius + 0.6, 0.14), "structure")
        ring(name + "_rail", ((x, y, z + 1), radius + 0.5, 0.04), "orange")
        for n in range(8):
            angle = n * pi / 4
            px, py = x + (radius + 0.5) * cos(angle), y + (radius + 0.5) * sin(angle)
            rod(name + "_stanchion", ((px, py, z), (px, py, z + 1), 0.035), "structure")
    rod(
        name + "_riser",
        ((x + radius + 0.8, y, 0.6), (x + radius + 0.8, y, height - 1), 0.18),
        "orange",
    )
    for side in (-0.35, 0.35):
        rod(
            name + "_ladder",
            (
                (x + side, y - radius - 0.8, 0.3),
                (x + side, y - radius - 0.8, height),
                0.04,
            ),
            "structure",
        )
    for n in range(int(height * 1.6)):
        rod(
            name + "_rung",
            (
                (x - 0.35, y - radius - 0.8, n * 0.6 + 0.5),
                (x + 0.35, y - radius - 0.8, n * 0.6 + 0.5),
                0.035,
            ),
            "structure",
        )


def pipe_rack(name: str, span: tuple[float, float, float, float]) -> None:
    """Carry parallel process lines on repeated braced steel portals."""
    xmin, xmax, y, height = span
    for x in range(int(xmin), int(xmax) + 1, 10):
        for dy in (-2.4, 2.4):
            box(
                name + "_foot",
                ((x - 0.6, y + dy - 0.6, 0), (x + 0.6, y + dy + 0.6, 0.4)),
                "concrete",
            )
            box(
                name + "_post",
                ((x - 0.12, y + dy - 0.12, 0.4), (x + 0.12, y + dy + 0.12, height)),
                "structure",
            )
        box(
            name + "_crossbeam",
            ((x - 0.18, y - 2.6, height), (x + 0.18, y + 2.6, height + 0.25)),
            "structure",
        )
        rod(
            name + "_brace",
            ((x, y - 2.4, height - 2), (x, y + 2.4, height), 0.07),
            "structure",
        )
    for n in range(6):
        rod(
            name + "_process_pipe",
            (
                (xmin - 1, y - 2 + n * 0.8, height + 0.5),
                (xmax + 1, y - 2 + n * 0.8, height + 0.5),
                0.17,
            ),
            "steel",
        )
    for yside in (y - 2.5, y + 2.5):
        box(
            name + "_longitudinal",
            ((xmin, yside - 0.12, height - 0.35), (xmax, yside + 0.12, height)),
            "structure",
        )


def buildings() -> None:
    """Provide corrugated service halls and a low control building."""
    for name, x, y, w, d, h in (
        ("HALL", 145, 3, 22, 34, 10),
        ("CONTROL", 141, 59, 26, 17, 7),
    ):
        prefix = "CTX_" + name
        box(
            prefix + "_foundation",
            ((x - 0.4, y - 0.4, -0.1), (x + w + 0.4, y + d + 0.4, 0.5)),
            "concrete",
        )
        box(prefix + "_walls", ((x, y, 0.5), (x + w, y + d, h)), "tank")
        box(
            prefix + "_roof",
            ((x - 0.4, y - 0.4, h), (x + w + 0.4, y + d + 0.4, h + 0.35)),
            "roof",
        )
        for py in range(int(y) + 1, int(y + d), 2):
            box(
                prefix + "_wall_rib",
                ((x - 0.12, py, 0.6), (x, py + 0.07, h - 0.1)),
                "steel",
            )
        for py in range(int(y) + 3, int(y + d) - 2, 6):
            box(
                prefix + "_window",
                ((x - 0.15, py, h - 3), (x - 0.12, py + 3, h - 1.4)),
                "glass",
            )
        for px in range(int(x) + 3, int(x + w) - 2, 7):
            box(
                prefix + "_roof_vent",
                ((px, y + 5, h + 0.35), (px + 2, y + 8, h + 1.1)),
                "steel",
            )
        box(
            prefix + "_door",
            ((x - 0.16, y + 2, 0.5), (x - 0.12, y + 7, 4.5)),
            "structure",
        )


def build_context() -> None:
    """Compose a detailed synthetic backdrop, never a surveyed HVO reconstruction."""
    box("CTX_TERRAIN", ((-33, -23, -0.7), (179, 104, -0.32)), "earth")
    box("CTX_SOUTH_APRON", ((-30, -21, -0.3), (174, -3, -0.08)), "asphalt")
    box("CTX_NORTH_PROCESS_PAD", ((8, 56, -0.3), (135, 99, -0.05)), "concrete")
    box("CTX_WEST_TANK_PAD", ((-31, -1, -0.3), (-3, 98, -0.05)), "concrete")
    box("CTX_EAST_SERVICE_PAD", ((143, -1, -0.3), (175, 87, -0.05)), "concrete")
    for x in range(-25, 172, 10):
        box("CTX_ROAD_MARKING", ((x, -17, 0.005), (x + 4, -16.85, 0.02)), "white")
    for n, (x, y, r, h) in enumerate(
        (
            (-17, 14, 8, 9),
            (-17, 39, 8, 12),
            (-17, 67, 9, 10),
            (102, 84, 10, 11),
            (125, 84, 8, 9),
        )
    ):
        tank(f"CTX_TK{n + 1:02d}", (x, y, r, h))
    for n, (x, y, r, h) in enumerate(
        (
            (20, 82, 2.2, 31),
            (34, 78, 2.7, 24),
            (47, 82, 2, 28),
            (63, 83, 3, 20),
            (79, 86, 2.5, 17),
            (56, 64, 1.8, 17),
        )
    ):
        tower(f"CTX_COL{n + 1:02d}", (x, y, r, h))
    pipe_rack("CTX_NORTH_RACK", (10, 130, 59, 5))
    pipe_rack("CTX_SOUTH_RACK", (10, 130, -6, 3.2))
    for x in (24, 43, 69, 84):
        rod("CTX_BRANCH_RISER", ((x, 59, 5.5), (x, 70, 5.5), 0.17), "steel")
        rod("CTX_BRANCH_ELBOW", ((x, 70, 5.5), (x, 70, 2), 0.17), "steel")
    buildings()
