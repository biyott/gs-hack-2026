# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# ─── How to run ───
# Loaded by build_scene.py inside Blender; call build with its scene builder.
# Blender supplies its own Python runtime and bpy.
# ──────────────────
"""Legacy SK1265-AT6 mast, low ballast and intermediate-height crane cabin."""

from __future__ import annotations

from math import cos, sin, tau

from crane_geometry import Builder


def _slewing_frame(h: Builder) -> None:
    """Build the short rotating chassis and rear ballast below the mast."""
    h.collection("03_Slewing_and_Ballast")
    h.cylinder("Carrier slew pedestal", (0, 0, 1.56), (0, 0, 1.75), 1.08, "charcoal", 64)
    h.cylinder("Slew bearing lower race", (0, 0, 1.72), (0, 0, 1.90), 1.12, "charcoal", 64)
    h.cylinder("Slew bearing geared race", (0, 0, 1.90), (0, 0, 2.11), 1.09, "metal", 64)
    h.cylinder("Slew bearing upper flange", (0, 0, 2.11), (0, 0, 2.25), 1.14, "yellow", 64)
    for index in range(24):
        angle = tau * index / 24
        x, y = 1.01 * cos(angle), 1.01 * sin(angle)
        h.cylinder(f"Slew bolt {index:02}", (x, y, 2.24), (x, y, 2.30), 0.045, "metal", 6)
    h.box("Rotating machinery deck", (-0.85, 0, 2.37), (3.25, 2.45, 0.25), "yellow")
    for y in (-0.96, 0.96):
        h.box("Superstructure longitudinal girder", (-1.3, y, 2.69), (4.4, 0.25, 0.56), "yellow")
        h.cylinder("Mast foot diagonal brace", (-1.95, y, 2.75), (-0.50, y * 0.58, 4.10), 0.16, "yellow")
        h.box("Counterweight retaining upright", (-3.52, y, 2.94), (0.16, 0.20, 1.38), "yellow")
    h.box("Ballast support tray", (-2.70, 0, 2.35), (2.16, 2.64, 0.28), "yellow_dark")
    for index in range(3):
        h.box(f"Rear ballast slab {index + 1}", (-2.70, 0, 2.64 + index * 0.29), (1.98, 2.48, 0.26), "charcoal", 0.045)
    h.box("Ballast rear protective plate", (-3.77, 0, 2.95), (0.12, 2.68, 1.08), "yellow")
    h.box("Ballast top cap", (-2.72, 0, 3.43), (2.10, 2.65, 0.11), "yellow")
    h.box("Mast pivot cradle", (0, 0, 2.70), (1.47, 1.43, 0.78), "yellow", 0.08)
    h.cylinder("Mast folding pivot", (0, -0.87, 2.94), (0, 0.87, 2.94), 0.19, "metal", 24)
    for y in (-0.91, 0.91):
        h.cylinder("Pivot end cap", (0, y - 0.03, 2.94), (0, y + 0.03, 2.94), 0.25, "yellow", 24)
    h.box("Hydraulic power housing", (-1.35, 0, 3.01), (0.75, 1.62, 0.92), "yellow")
    for index in range(7):
        h.box("Power housing ventilation slot", (-1.35, -0.817, 2.77 + index * 0.065), (0.49, 0.02, 0.026), "charcoal", 0)
    h.cylinder("Erection ram barrel", (-1.82, 0, 2.87), (-0.89, 0, 6.26), 0.155, "yellow", 24)
    h.cylinder("Erection ram piston", (-0.89, 0, 6.26), (-0.61, 0, 7.29), 0.087, "chrome", 24)
    h.cylinder("Erection ram collar", (-0.95, 0, 6.05), (-0.87, 0, 6.33), 0.185, "metal", 24)
    h.cylinder("Erection ram top pin", (-0.61, -0.22, 7.29), (-0.61, 0.22, 7.29), 0.12, "metal")
    h.line("Base hydraulic hose loop", [(-1.45, -0.85, 3.0), (-1.10, -0.85, 3.7), (-0.88, -0.77, 4.4), (-0.67, -0.67, 4.65), (-0.64, -0.66, 6.0)], 0.025, "rubber")


def _telescopic_mast(h: Builder) -> None:
    """Make three overlapping box sections, guide shoes and a climbing ladder."""
    h.collection("04_Telescopic_Mast")
    sections = (
        (1, 2.91, 18.55, 1.22, 1.10),
        (2, 17.75, 28.08, 0.97, 0.89),
        (3, 27.32, 37.20, 0.72, 0.68),
    )
    for index, bottom, top, width, depth in sections:
        center = (bottom + top) / 2
        h.box(f"Telescopic mast section {index}", (0, 0, center), (width, depth, top - bottom), "yellow", 0.035)
        for y in (-1, 1):
            h.box(f"Section {index} edge reinforcement", (width * 0.46, y * (depth / 2 + 0.012), center), (0.055, 0.028, top - bottom - 0.2), "yellow_dark", 0.009)
            h.box(f"Section {index} guide rail", (-width * 0.46, y * (depth / 2 + 0.026), center), (0.058, 0.048, top - bottom - 0.26), "yellow_dark", 0.008)
        h.box(f"Section {index} upper sleeve", (0, 0, top - 0.15), (width + 0.13, depth + 0.14, 0.30), "yellow_dark")
        h.box(f"Section {index} sleeve flange", (0, 0, top + 0.012), (width + 0.18, depth + 0.18, 0.065), "yellow")
        for x in (-width * 0.36, width * 0.36):
            h.box(f"Section {index} guide shoe", (x, -depth / 2 - 0.095, top - 0.16), (0.18, 0.15, 0.23), "metal")
            h.cylinder(f"Section {index} sleeve fastener", (x, -depth / 2 - 0.18, top - 0.16), (x, -depth / 2 - 0.11, top - 0.16), 0.055, "chrome", 6)
        ladder_y = depth / 2 + 0.16
        start = bottom + 0.33
        for x in (-0.23, 0.23):
            h.cylinder(f"Section {index} ladder stringer", (x, ladder_y, start), (x, ladder_y, top - 0.2), 0.025, "metal", 10)
        for rung in range(int((top - start - 0.2) / 0.30) + 1):
            z = start + rung * 0.30
            h.cylinder(f"Section {index} ladder rung {rung:02}", (-0.23, ladder_y, z), (0.23, ladder_y, z), 0.020, "metal", 8)
        for z in (bottom + 0.6, top - 0.55):
            for x in (-0.23, 0.23):
                h.cylinder(f"Section {index} ladder bracket", (x, depth / 2, z), (x, ladder_y, z), 0.033, "yellow", 10)
    for z in (4.25, 10.5, 16.9):
        h.box("Mast inspection cover", (0.10, -0.571, z), (0.56, 0.045, 0.54), "yellow_dark", 0.03)
        for x in (-0.1, 0.3):
            h.cylinder("Inspection cover fastener", (x, -0.613, z), (x, -0.587, z), 0.033, "metal", 6)
    h.line("Mast service hose", [(0.52, -0.59, 3.5), (0.53, -0.59, 10.0), (0.53, -0.59, 17.4), (0.52, -0.60, 18.1), (0.40, -0.64, 18.4), (0.31, -0.64, 18.1), (0.32, -0.57, 17.9)], 0.022, "rubber")


def _operator_cabin(h: Builder) -> None:
    """Place the photo-based cabin alongside the mast at intermediate height."""
    h.collection("05_Operator_Cabin")
    h.box("Cabin mast carriage", (0, -0.66, 17.60), (1.02, 0.27, 1.35), "yellow_dark")
    h.box("Operator cabin lower shell", (0.025, -1.38, 17.25), (1.65, 1.49, 0.51), "yellow", 0.055)
    h.box("Operator cabin floor", (0.025, -1.39, 16.96), (1.78, 1.60, 0.13), "yellow_dark")
    h.box("Operator cabin roof", (-0.035, -1.39, 19.01), (1.84, 1.67, 0.13), "yellow", 0.055)
    h.box("Cabin roof dark gasket", (-0.035, -1.39, 18.915), (1.69, 1.50, 0.047), "rubber", 0.015)
    for y in (-2.115, -0.65):
        h.mesh("Cabin side glazing", [(-0.76, y, 17.54), (0.86, y, 17.54), (0.69, y, 18.89), (-0.76, y, 18.89)], [(0, 1, 2, 3)], "glass")
        for x in (-0.78, -0.27):
            h.box("Cabin vertical window mullion", (x, y, 18.23), (0.065, 0.065, 1.42), "yellow", 0.01)
        h.box("Cabin window sill", (0.025, y, 17.54), (1.74, 0.075, 0.075), "yellow", 0.01)
        h.box("Cabin upper window rail", (-0.04, y, 18.89), (1.61, 0.07, 0.07), "yellow", 0.01)
        h.cylinder("Cabin angled front pillar", (0.88, y, 17.54), (0.71, y, 18.93), 0.045, "yellow", 10)
    h.mesh("Cabin angled front windshield", [(0.87, -2.09, 17.57), (0.87, -0.68, 17.57), (0.70, -0.68, 18.88), (0.70, -2.09, 18.88)], [(0, 1, 2, 3)], "glass")
    h.box("Cabin rear glazing", (-0.787, -1.38, 18.22), (0.018, 1.40, 1.31), "glass", 0)
    h.box("Cabin rear crossbar", (-0.81, -1.38, 17.86), (0.055, 1.46, 0.045), "yellow", 0.01)
    h.line("Windshield wiper", [(0.892, -1.85, 17.63), (0.797, -1.45, 18.32), (0.763, -1.07, 18.52)], 0.016, "rubber")
    h.box("Cabin door handle", (-0.56, -2.16, 17.71), (0.18, 0.06, 0.045), "charcoal", 0.015)
    h.box("Operator seat base", (-0.31, -1.39, 17.63), (0.53, 0.57, 0.18), "charcoal", 0.06)
    h.box("Operator seat back", (-0.55, -1.39, 17.99), (0.17, 0.53, 0.63), "charcoal", 0.06)
    h.box("Control console", (0.48, -1.39, 17.70), (0.34, 1.07, 0.22), "charcoal", 0.04)
    h.box("Cabin rear access landing", (-1.05, -0.54, 16.97), (0.52, 3.26, 0.10), "metal")
    h.box("Ladder to cabin bridge", (-0.48, 0.86, 16.97), (1.66, 0.46, 0.10), "metal")
    for z in (17.49, 18.03):
        h.line("Cabin landing safety rail", [(0.35, 1.09, z), (-1.32, 1.09, z), (-1.32, -2.18, z), (-0.85, -2.18, z)], 0.024, "yellow")
    for y in (1.07, -0.75, -2.18):
        h.cylinder("Cabin landing stanchion", (-1.32, y, 16.99), (-1.32, y, 18.03), 0.027, "yellow", 10)
    for y in (-0.8, -1.93):
        h.cylinder("Cabin support knee", (-0.41, -0.59, 16.21), (-0.97, y, 16.88), 0.063, "yellow", 12)
    h.cylinder("Cabin worklight mount", (0.63, -2.07, 19.09), (0.63, -2.07, 19.22), 0.03, "metal")
    h.box("Cabin worklight", (0.68, -2.07, 19.23), (0.14, 0.17, 0.14), "charcoal", 0.025)
    h.box("Cabin worklight lens", (0.755, -2.07, 19.23), (0.012, 0.13, 0.1), "white", 0.01)


def build(h: Builder) -> None:
    """Build the visually interpreted lower superstructure, mast and crane cab."""
    _slewing_frame(h)
    _telescopic_mast(h)
    _operator_cabin(h)
