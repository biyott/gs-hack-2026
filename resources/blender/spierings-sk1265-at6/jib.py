#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# ─── How to run ───
# Import this module from the main crane script inside Blender; call build(builder).
# Syntax check without Blender: uv run --no-project python -m py_compile jib.py
# ──────────────────
"""Deployed 60 m jib assembly; section lengths and small fittings are visual estimates."""

from __future__ import annotations

from math import ceil
from typing import Final

from crane_geometry import Builder

SEGMENTS: Final = ((0.0, 14.0), (14.0, 28.0), (28.0, 40.0), (40.0, 52.0), (52.0, 60.0))


def _half_width(x: float) -> float:
    return 0.6 - 0.375 * x / 60.0


def _top(x: float) -> tuple[float, float, float]:
    return x, 0.0, 38.55 - 0.9 * x / 60.0


def build(h: Builder) -> None:
    """Create the jib, masthead stays, and suspended trolley rig in named collections."""
    for section, (start, end) in enumerate(SEGMENTS, start=1):
        h.collection(f"06_Jib_{section:02d}_{int(end - start)}m")
        tag = f"Jib{section:02d}"
        h.cylinder(f"{tag}_UpperChord", _top(start), _top(end), 0.05, "yellow")
        for side in (-1.0, 1.0):
            a = (start, side * _half_width(start), 37.2)
            b = (end, side * _half_width(end), 37.2)
            h.cylinder(f"{tag}_LowerChord_{side}", a, b, 0.05, "yellow")
            h.cylinder(
                f"{tag}_TrolleyRail_{side}",
                (start, a[1], 37.09), (end, b[1], 37.09), 0.035, "metal",
            )
        panels = ceil((end - start) / 1.5)
        for panel in range(panels):
            x0 = start + (end - start) * panel / panels
            x1 = start + (end - start) * (panel + 1) / panels
            mid = (x0 + x1) / 2.0
            for side in (-1.0, 1.0):
                lower0 = (x0, side * _half_width(x0), 37.2)
                lower1 = (x1, side * _half_width(x1), 37.2)
                h.cylinder(f"{tag}_WarrenA_{panel}_{side}", lower0, _top(mid), 0.027, "yellow")
                h.cylinder(f"{tag}_WarrenB_{panel}_{side}", _top(mid), lower1, 0.027, "yellow")
            h.cylinder(
                f"{tag}_FloorDiagonal_{panel}",
                (x0, -_half_width(x0), 37.2), (x1, _half_width(x1), 37.2),
                0.024, "yellow_dark",
            )
        for node in range(panels + 1):
            x = start + (end - start) * node / panels
            h.cylinder(
                f"{tag}_CrossTie_{node}",
                (x, -_half_width(x), 37.2), (x, _half_width(x), 37.2),
                0.027, "yellow",
            )
        for x in (start, end):
            for side in (-1.0, 1.0):
                h.cylinder(
                    f"{tag}_EndFrame_{x}_{side}",
                    (x, side * _half_width(x), 37.2), _top(x), 0.033, "yellow",
                )
        if end < 60.0:
            for side in (-1.0, 1.0):
                y = side * _half_width(end)
                h.box(f"{tag}_FoldingEar_{side}", (end, y, 37.22), (0.45, 0.13, 0.40), "yellow")
                h.cylinder(
                    f"{tag}_HingePin_{side}",
                    (end, y - 0.12, 37.22), (end, y + 0.12, 37.22),
                    0.095, "metal", vertices=24,
                )
            h.box(f"{tag}_TopLatch", _top(end), (0.33, 0.20, 0.22), "yellow_dark")
            h.cylinder(
                f"{tag}_LatchPin", (end, -0.15, _top(end)[2]),
                (end, 0.15, _top(end)[2]), 0.065, "chrome",
            )

    h.collection("07_Guys_and_Head")
    for side in (-1.0, 1.0):
        root = (0.0, side * 0.62, 37.2)
        apex = (2.0, side * 0.30, 42.0)
        rear_peak = (-2.5, side * 0.43, 40.35)
        rear = (-4.1, side * 0.65, 36.5)
        h.cylinder(f"Head_ForwardLeg_{side}", root, apex, 0.115, "yellow")
        h.cylinder(f"Head_RearLeg_{side}", rear, rear_peak, 0.10, "yellow")
        h.cylinder(f"Head_Crown_{side}", rear_peak, apex, 0.095, "yellow")
        h.cylinder(f"Head_RearBrace_{side}", rear_peak, root, 0.075, "yellow")
        h.cylinder(f"Head_LowerBrace_{side}", rear, root, 0.095, "yellow")
        h.cylinder(f"Head_DiagonalTie_{side}", rear, apex, 0.041, "metal")
        h.cylinder(
            f"Backstay_RigidTie_{side}", rear,
            (-3.0, side * 0.65, 3.4), 0.044, "yellow_dark",
        )
        for z in (12.0, 23.0, 32.0):
            x = -3.0 - 1.1 * (z - 3.4) / 33.1
            h.cylinder(
                f"Backstay_Coupler_{side}_{z}",
                (x + 0.005, side * 0.65, z - 0.16),
                (x - 0.005, side * 0.65, z + 0.16), 0.072, "metal",
            )
        h.line(
            f"Jib_MainStay_{side}",
            (apex, (20.0, side * 0.16, 41.0), (38.0, side * 0.13, 39.55),
             (52.0, side * 0.15, 37.78)), 0.025, "metal",
        )
        h.cylinder(
            f"Jib_RootStay_{side}", apex,
            (14.0, side * _half_width(14.0), 37.2), 0.029, "metal",
        )
    for x, z, width in ((2.0, 42.0, 0.3), (-2.5, 40.35, 0.43), (-4.1, 36.5, 0.65)):
        h.cylinder(f"Head_CrossPin_{x}", (x, -width - 0.12, z), (x, width + 0.12, z), 0.11, "metal")
    for x, height in ((20.0, 41.0), (38.0, 39.55)):
        for side in (-1.0, 1.0):
            h.cylinder(
                f"StayPylon_{x}_{side}", (x, side * _half_width(x), 37.2),
                (x, side * 0.13, height), 0.055, "yellow",
            )
            h.cylinder(
                f"StayPylon_FootBrace_{x}_{side}",
                (x - 1.1, side * _half_width(x - 1.1), 37.2),
                (x, side * 0.13, height), 0.032, "yellow_dark",
            )
        h.cylinder(f"StayPylon_Pin_{x}", (x, -0.25, height), (x, 0.25, height), 0.09, "metal")
    h.box("Jib_TipEndPlate", (60.0, 0.0, 37.25), (0.14, 0.55, 0.34), "yellow_dark")
    h.cylinder("Jib_TipRopeSheave", (59.85, -0.10, 37.38), (59.85, 0.10, 37.38), 0.19, "metal", vertices=32)
    h.line("TrolleyHaulRope", ((0.2, 0.0, 37.1), (59.85, 0.0, 37.1)), 0.012, "charcoal")

    h.collection("08_Trolley_and_Hook")
    for side in (-1.0, 1.0):
        y = side * _half_width(30.0)
        h.box(f"Trolley_SideFrame_{side}", (30.0, y, 36.8), (1.25, 0.13, 0.30), "yellow_dark")
        h.cylinder(
            f"Trolley_RailWheel_{side}", (30.0, y - 0.11, 37.05),
            (30.0, y + 0.11, 37.05), 0.19, "metal", vertices=24,
        )
        h.cylinder(
            f"Trolley_AxleCap_{side}", (30.0, y + side * 0.1, 37.05),
            (30.0, y + side * 0.15, 37.05), 0.075, "yellow", vertices=24,
        )
    for x in (29.45, 30.55):
        h.box(f"Trolley_CrossFrame_{x}", (x, 0.0, 36.75), (0.14, 1.0, 0.20), "yellow")
    h.box("Trolley_HoistCrosshead", (30.0, 0.0, 36.67), (0.65, 0.60, 0.13), "charcoal")
    for x in (29.77, 30.23):
        h.line(f"Hoist_Rope_{x}", ((x, 0.0, 36.62), (x, 0.0, 18.1)), 0.018, "metal")
    h.cylinder("HookBlock_Sheave", (30.0, -0.2, 18.05), (30.0, 0.2, 18.05), 0.30, "charcoal", vertices=32)
    for side in (-1.0, 1.0):
        y = side * 0.25
        h.box(f"HookBlock_Cheek_{side}", (30.0, y, 17.95), (0.72, 0.085, 0.88), "yellow", bevel=0.06)
        for stripe in (-1, 0, 1):
            x = 30.0 + stripe * 0.23
            h.mesh(
                f"HookBlock_Stripe_{side}_{stripe}",
                ((max(x - 0.08, 29.66), y + side * 0.044, 17.58),
                 (min(x + 0.06, 30.34), y + side * 0.044, 17.58),
                 (min(x + 0.22, 30.34), y + side * 0.044, 18.31),
                 (max(x + 0.08, 29.66), y + side * 0.044, 18.31)),
                ((0, 1, 2, 3),), "charcoal",
            )
    h.cylinder("HookBlock_Axle", (30.0, -0.34, 18.05), (30.0, 0.34, 18.05), 0.085, "chrome", vertices=24)
    h.cylinder("Hook_Swivel", (30.0, 0.0, 17.55), (30.0, 0.0, 17.16), 0.12, "metal", vertices=24)
    h.line(
        "Hook_OpenForgedSteel",
        ((30.0, 0.0, 17.25), (29.91, 0.0, 17.08), (29.74, 0.0, 16.87),
         (29.70, 0.0, 16.64), (29.81, 0.0, 16.43), (30.03, 0.0, 16.34),
         (30.25, 0.0, 16.38), (30.42, 0.0, 16.56), (30.44, 0.0, 16.79),
         (30.36, 0.0, 16.94)), 0.10, "metal",
    )
    h.cylinder("Hook_SafetyLatch", (29.95, 0.0, 17.1), (30.37, 0.0, 16.87), 0.018, "chrome")
