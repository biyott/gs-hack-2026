# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# ─── How to run ───
# Imported by build_mobile_cranes.py in Blender's bundled Python.
"""Fixed source-008 configurations, with demo geometry explicitly separated."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Final, TypedDict

Vec3 = tuple[float, float, float]


class SlewEvidence(TypedDict):
    angle_degrees: float
    hook_displacement_m: float


@dataclass(frozen=True, slots=True)
class Crane:
    slug: str
    title: str
    rough_terrain: bool
    transport: Vec3
    boom_length: float
    pivot: Vec3
    body_center: float
    body_length: float
    wheel_x: tuple[float, ...]
    pad_centers: tuple[Vec3, ...]
    pad_size: float
    body_color: str
    boom_color: str
    source_url: str
    support_note: str


CRANES: Final = (
    Crane(
        "tadano-gr250n4", "TADANO GR-250N-4", True,
        (11.53, 2.62, 3.475), 20.0, (-1.1, 0.0, 2.75),
        0.25, 6.85, (-1.74, 2.14),
        ((3.45, -3.3, 0.0), (-3.23, -3.3, 0.0),
         (3.23, 3.3, 0.0), (-3.45, 3.3, 0.0)),
        0.58, "blue", "white",
        "https://mediahub.tadano.com/m/20be7de269e4d894/original/doc_Tadano_GR250N-4_specsheet_korean-pdf-pdf.pdf",
        "X supports: 6.6m nominal transverse centres, 7.18m pad outer width; "
        "6.68m fore-aft span per manufacturer p6; 0.22m row stagger and datum "
        "are visual demo approximations, not certified point coordinates.",
    ),
    Crane(
        "liebherr-ltm1050", "LIEBHERR LTM 1050-3.1", False,
        (11.83, 2.55, 3.785), 26.0, (-1.8, 0.0, 3.0),
        1.28, 9.255, (3.08, 0.33, -1.32),
        ((4.526, 3.2, 0.0), (-2.625, 3.2, 0.0),
         (4.274, -3.2, 0.0), (-2.895, -3.2, 0.0)),
        0.5, "yellow", "yellow",
        "https://assets-cdn.liebherr.com/versions/e57b2c0c-a794-4463-bfdc-40af69903c8d/original/",
        "p3 fore-aft row spans 7.151m/7.169m; nominal transverse centres 6.4m. "
        "Front is +X here. Transverse symmetry around slew and heel XYZ are "
        "demo interpretations. Selected tyres 385/95R25, no folding jib.",
    ),
)
