#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.13"
# dependencies = []
# ///
# Imported by rig_builder.py inside Blender's bundled Python.
"""Authored hollow pentagonal profiles; dimensions are not manufacturer CAD."""
from __future__ import annotations

import bpy

from geometry import Solid


def pentagonal_shell(spec: Solid, material: bpy.types.Material, inner_scale: float = 0.88) -> bpy.types.Object:
    """Build five exact outer planes with an open bore and annular end faces."""
    length, width, height = spec.size
    profile = [(-width / 2, height / 2), (-width / 2, -0.18 * height), (0, -height / 2), (width / 2, -0.18 * height), (width / 2, height / 2)]
    vertices = [(x, y * scale, z * scale) for x in (-length / 2, length / 2) for scale in (1.0, inner_scale) for y, z in profile]
    faces: list[tuple[int, int, int, int]] = []
    for index in range(5):
        following = (index + 1) % 5
        faces.extend([
            (index, following, 10 + following, 10 + index),
            (5 + following, 5 + index, 15 + index, 15 + following),
            (following, index, 5 + index, 5 + following),
            (10 + index, 10 + following, 15 + following, 15 + index),
        ])
    data = bpy.data.meshes.new(spec.name + "_mesh")
    data.from_pydata(vertices, [], faces)
    data.update()
    mesh = bpy.data.objects.new(spec.name, data)
    bpy.context.collection.objects.link(mesh)
    mesh.location = spec.center
    data.materials.append(material)
    mesh["profile"] = "authored pentagonal hollow shell; no OEM angle or wall-thickness claim"
    mesh["innerProfileScale"] = inner_scale
    return mesh
