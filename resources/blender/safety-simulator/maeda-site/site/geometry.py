# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# ─── How to run ───
# Blender embedded module; imported by build.py using Blender --background.
"""Small editable mesh primitives in metre-based Blender coordinates."""

from __future__ import annotations

from typing import Final, TypeAlias

import bpy
from mathutils import Vector

Point: TypeAlias = tuple[float, float, float]
Bounds: TypeAlias = tuple[Point, Point]
PALETTE: Final = {
    "concrete": (0.58, 0.60, 0.58, 1),
    "earth": (0.19, 0.24, 0.22, 1),
    "asphalt": (0.12, 0.16, 0.17, 1),
    "work": (0.51, 0.54, 0.51, 1),
    "stock": (0.47, 0.48, 0.35, 1),
    "destination": (0.30, 0.44, 0.45, 1),
    "lane": (0.29, 0.37, 0.38, 1),
    "refuge": (0.31, 0.47, 0.42, 1),
    "white": (0.83, 0.83, 0.71, 1),
    "steel": (0.48, 0.59, 0.63, 1),
    "structure": (0.15, 0.25, 0.31, 1),
    "tank": (0.72, 0.77, 0.72, 1),
    "orange": (0.57, 0.28, 0.12, 1),
    "glass": (0.12, 0.26, 0.29, 1),
    "roof": (0.24, 0.33, 0.34, 1),
    "joint": (0.38, 0.42, 0.40, 1),
}


def materials() -> None:
    """Use flat PBR surfaces so exports remain self-contained."""
    for name, color in PALETTE.items():
        material = bpy.data.materials.new(name)
        material.diffuse_color = color
        material.use_nodes = True
        shader = material.node_tree.nodes.get("Principled BSDF")
        shader.inputs["Base Color"].default_value = color
        shader.inputs["Roughness"].default_value = 0.68
        shader.inputs["Metallic"].default_value = (
            0.45 if name in ("steel", "tank") else 0.05
        )


def finish(name: str, material: str) -> bpy.types.Object:
    """Name new geometry and attach its reusable PBR material."""
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(bpy.data.materials[material])
    return obj


def box(name: str, bounds: Bounds, material: str) -> bpy.types.Object:
    """Create a dimensionally explicit cuboid with applied scale."""
    low, high = bounds
    bpy.ops.mesh.primitive_cube_add(
        size=1, location=tuple((a + b) / 2 for a, b in zip(low, high))
    )
    obj = finish(name, material)
    obj.dimensions = tuple(b - a for a, b in zip(low, high))
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return obj


def cylinder(
    name: str, form: tuple[Point, float, float], material: str
) -> bpy.types.Object:
    """Create a vertical cylinder from center, radius and height."""
    center, radius, depth = form
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=32, radius=radius, depth=depth, location=center
    )
    obj = finish(name, material)
    for polygon in obj.data.polygons:
        polygon.use_smooth = len(polygon.vertices) == 4
    return obj


def rod(name: str, form: tuple[Point, Point, float], material: str) -> bpy.types.Object:
    """Join two points with an editable round pipe or structural member."""
    start, end, radius = form
    delta = Vector(end) - Vector(start)
    center = tuple((a + b) / 2 for a, b in zip(start, end))
    obj = cylinder(name, (center, radius, delta.length), material)
    obj.rotation_euler = delta.to_track_quat("Z", "Y").to_euler()
    return obj


def ring(
    name: str, form: tuple[Point, float, float], material: str
) -> bpy.types.Object:
    """Create a vessel belt or continuous guard rail."""
    center, radius, tube = form
    bpy.ops.mesh.primitive_torus_add(
        major_radius=radius,
        minor_radius=tube,
        major_segments=40,
        minor_segments=6,
        location=center,
    )
    return finish(name, material)


def label(name: str, form: tuple[str, Point, float], material: str) -> bpy.types.Object:
    """Use real converted geometry for site signage, without external fonts."""
    body, center, size = form
    bpy.ops.object.text_add(location=center)
    obj = bpy.context.object
    obj.data.body = body
    obj.data.size = size
    obj.data.align_x = "CENTER"
    obj.data.align_y = "CENTER"
    obj.data.extrude = 0.001
    bpy.ops.object.convert(target="MESH")
    return finish(name, material)
