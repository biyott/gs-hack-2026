#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.13"
# dependencies = []
# ///
# Imported by run_qd010.py, build_maeda.py and verify_maeda.py in Blender.
"""Manufacturer-backed section/profile oracle independent of the generator."""
from __future__ import annotations

import hashlib
import re
from pathlib import Path
from typing import Final, TypedDict

import bpy

from shell_topology import cross, hull, stage_vertices, verify_hollow_shell

HERE: Final = Path(__file__).resolve().parent
EVIDENCE: Final = HERE.parents[4] / "docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/research/manufacturer/compact/maeda"
SOURCE_SHA256: Final = "10ea95a9f92dc35f864b16138bfb723f6ec5a568abbac6c7cea608ecbfaa1a55"
EXPECTED_SECTIONS: Final = 5
EXPECTED_MOVING_STAGES: Final = 4
EXPECTED_OUTER_FACETS: Final = 5


class ShapeReport(TypedDict):
    status: str
    manufacturerSource: str
    manufacturerPdfSha256: str
    manufacturerPdfPage: int
    expectedPrincipalShells: int
    expectedMovingStages: int
    expectedOuterLongitudinalFacets: int
    principalShellCount: int
    movingStageCount: int
    principalMeshNames: list[str]
    outerProfileVertexCounts: list[int]
    assertions: list[str]


def principal_meshes() -> list[bpy.types.Object]:
    """Find physical tubes by parent and axial geometry, including old names."""
    candidates: list[bpy.types.Object] = []
    for mesh in bpy.context.scene.objects:
        if mesh.type != "MESH" or mesh.parent is None:
            continue
        if mesh.parent.name != "BOOM_PIVOT" and re.fullmatch(r"TELESCOPIC_\d+", mesh.parent.name) is None:
            continue
        points = stage_vertices(mesh)
        extents = [max(point[axis] for point in points) - min(point[axis] for point in points) for axis in range(3)]
        if extents[0] > 1 and extents[1] > 0.1 and extents[2] > 0.1:
            candidates.append(mesh)
    return sorted(candidates, key=lambda mesh: mesh.name)


def inspect_source_shapes() -> ShapeReport:
    """Measure actual geometry before asserting the independently pinned counts."""
    pdf = EVIDENCE / "originals/MC305C-5.pdf"
    assert hashlib.sha256(pdf.read_bytes()).hexdigest() == SOURCE_SHA256
    meshes = principal_meshes()
    stages = [obj for obj in bpy.context.scene.objects if re.fullmatch(r"TELESCOPIC_\d+", obj.name)]
    return {
        "status": "measured",
        "manufacturerSource": "https://www.maeda-minicranes.com/download/files/MC305C-5.pdf",
        "manufacturerPdfSha256": SOURCE_SHA256, "manufacturerPdfPage": 2,
        "expectedPrincipalShells": EXPECTED_SECTIONS,
        "expectedMovingStages": EXPECTED_MOVING_STAGES,
        "expectedOuterLongitudinalFacets": EXPECTED_OUTER_FACETS,
        "principalShellCount": len(meshes), "movingStageCount": len(stages),
        "principalMeshNames": [mesh.name for mesh in meshes],
        "outerProfileVertexCounts": [len(hull([(round(point.y, 5), round(point.z, 5)) for point in stage_vertices(mesh)])) for mesh in meshes],
        "assertions": [],
    }


def verify_source_shapes() -> ShapeReport:
    """Given the current scene, require actual five-shell, four-stage geometry."""
    report = inspect_source_shapes()
    assert report["principalShellCount"] == EXPECTED_SECTIONS, report
    assert report["movingStageCount"] == EXPECTED_MOVING_STAGES, report
    assert report["outerProfileVertexCounts"] == [EXPECTED_OUTER_FACETS] * EXPECTED_SECTIONS, report
    parents = ["BOOM_PIVOT", "TELESCOPIC_1", "TELESCOPIC_2", "TELESCOPIC_3", "TELESCOPIC_4"]
    names = [f"Telescopic_section_{index}" for index in range(1, 6)]
    assert report["principalMeshNames"] == names
    rings = []
    for name, parent_name in zip(names, parents, strict=True):
        mesh = bpy.data.objects[name]
        assert mesh.parent.name == parent_name and len(mesh.data.materials) == 1
        assert not mesh.modifiers, (name, "principal facets must not be beveled")
        local = mesh.parent.matrix_world.inverted() @ mesh.matrix_world
        assert max(abs(value - 1) for value in local.to_scale()) < 0.00001
        rings.append(verify_hollow_shell(mesh))
    for index, parent_name in enumerate(parents[:-1], start=1):
        stage = bpy.data.objects[f"TELESCOPIC_{index}"]
        assert stage.parent.name == parent_name
        assert stage.rotation_euler.to_quaternion().angle < 0.00001
        assert max(abs(value - 1) for value in stage.scale) < 0.00001
        outer, parent_bore = rings[index][0], rings[index - 1][1]
        assert all(cross(a, b, point) > 0 for point in outer for a, b in zip(parent_bore, parent_bore[1:] + parent_bore[:1], strict=True))
    assert bpy.data.objects["BOOM_TIP"].parent.name == "TELESCOPIC_4"
    report["status"] = "passed"
    report["assertions"] = ["five real separately named principal meshes", "four consecutive moving-stage parents", "five planar outer longitudinal faces per shell", "five inner faces and annular open-bore ends", "complete quad or diagonal-triangle coverage without duplicate faces", "child principal profiles strictly inside parent bores", "unit local mesh/stage scale; no principal bevels"]
    return report
