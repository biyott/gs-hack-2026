#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.13"
# dependencies = []
# ///
# Imported by run_qd010.py inside Blender's bundled Python.
"""Compare preserved source body/support/tail geometry across the correction."""
from __future__ import annotations

from typing import Final, TypedDict

import bpy

EXCLUDED_ANCESTORS: Final = {"BOOM_PIVOT", "HOOK", "HOIST_ROPE_1", "HOIST_ROPE_2", "LIFT_BARREL", "LIFT_PISTON"}


class StaticMesh(TypedDict):
    vertices: list[list[float]]
    faces: list[list[int]]
    matrixWorld: list[list[float]]


class StaticSnapshot(TypedDict):
    meshes: dict[str, StaticMesh]


def snapshot_static_geometry() -> StaticSnapshot:
    """Capture all source meshes outside the boom, hook and moving links."""
    bpy.context.view_layer.update()
    meshes: dict[str, StaticMesh] = {}
    for mesh in bpy.context.scene.objects:
        if mesh.type != "MESH":
            continue
        ancestor = mesh
        ancestors: set[str] = set()
        while ancestor is not None:
            ancestors.add(ancestor.name)
            ancestor = ancestor.parent
        if ancestors & EXCLUDED_ANCESTORS:
            continue
        meshes[mesh.name] = {
            "vertices": [list(vertex.co) for vertex in mesh.data.vertices],
            "faces": [list(face.vertices) for face in mesh.data.polygons],
            "matrixWorld": [list(row) for row in mesh.matrix_world],
        }
    assert "Compact_counterweight" in meshes and len([name for name in meshes if name.startswith("PAD_")]) == 4
    return {"meshes": meshes}


def verify_static_geometry(before: StaticSnapshot, after: StaticSnapshot) -> None:
    """Require exact local vertices/topology and unchanged world transforms."""
    assert before["meshes"].keys() == after["meshes"].keys()
    for name, expected in before["meshes"].items():
        actual = after["meshes"][name]
        assert actual["vertices"] == expected["vertices"], (name, "local vertices changed")
        assert actual["faces"] == expected["faces"], (name, "topology changed")
        for old_row, new_row in zip(expected["matrixWorld"], actual["matrixWorld"], strict=True):
            assert all(abs(old - new) < 0.000001 for old, new in zip(old_row, new_row, strict=True)), (name, "world transform changed")
