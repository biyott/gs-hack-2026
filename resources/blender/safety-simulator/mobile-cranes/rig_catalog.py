# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# ─── How to run ───
# Called by build_mobile_cranes.py after the final Blender GLB reimport.
"""Write catalog-ready control fragments and explicit scalar rig baselines."""
from __future__ import annotations

import json
from pathlib import Path

import bpy

from configuration import Crane
from rig_controls import articulation, length_range, section_length


def write(c: Crane, directory: Path) -> None:
    """Keep the public control contract separate from manufacturer maxima."""
    tip = bpy.data.objects["BOOM_TIP"].matrix_world.translation
    low, high = length_range(c)
    physical_section = section_length(c)
    payload = {
        "articulation": articulation(),
        "demoPose": {"boomLengthM": c.boom_length, "boomAngleDeg": 50,
                     "trolleyM": None, "hookHeightM": 4.2, "slewDeg": 0},
        "movementLimits": {"tableSlewDeg": None, "boomLengthM": [low, high],
                           "boomAngleDeg": [35, 65], "trolleyM": None, "hookHeightM": [3, 10]},
        "controlBaselines": {"slewDeg": 0, "trolleyM": None, "hookHeightM": 4.2,
                             "ropeTopM": round(tip.z, 8), "ropeLengthM": round(tip.z - 4.6, 8),
                             "boomAngleDeg": 50, "boomLengthM": c.boom_length},
        "controls": {"translation": True, "slew": True, "boomAngle": True,
                     "boomLength": True, "trolley": False, "hook": True},
        "controlNodes": {"slew": "SLEW", "trolley": None, "hook": "HOOK",
                         "ropes": "HOIST_ROPES", "boomPivot": "BOOM_PIVOT",
                         "boomSegments": [f"TELESCOPIC_{i}" for i in range(1, 4)]},
        "controlNotes": "Bounded demo kinematics; nested stages share extension equally. "
                        "Hook follows BOOM_TIP physical sheave anchor at selected height. "
                        "Anchor-driven unit links keep ropes vertical and hydraulic parts connected. "
                        "These ranges and overlaps are demo geometry choices, not operating limits.",
        "rigMetadata": {
            "coordinateSystem": "gltf-y-up", "lengthUnit": "metres",
            "boomPivotLocalM": [c.pivot[0], c.pivot[2], -c.pivot[1]],
            "sectionLengthM": physical_section,
            "initialSegmentLocalXM": (c.boom_length - physical_section) / 3,
            "minimumSectionOverlapM": physical_section - (high - physical_section) / 3,
            "physicalSheaveOffsetBoomLocalM": [0, -0.05, 0],
            "nominalLengthTipNode": "BOOM_AXIS_TIP",
            "physicalSheaveTipNode": "BOOM_TIP",
            "hookAttachLocalM": [0, 0.4, 0],
            "ropeTopRelativeToPhysicalTipM": [0, 0, 0],
            "ramBaseLocalM": [0.3, 2.02, 0],
            "ramEndBoomLocalM": [4, -0.45, 0],
            "normalizedLinkExtentM": [0, 1],
            "manufacturerBoomLengthRangeM": [9.35, 30.5] if c.rough_terrain else [11.4, 38],
            "riskProjectionNote": "Nominal-axis ground projection differs from physical sheave by at most 0.05m; "
                                  "a 0.36m load polygon is a conservative approximation, not exact hook footprint.",
        },
    }
    (directory / f"{c.slug}-rig.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
