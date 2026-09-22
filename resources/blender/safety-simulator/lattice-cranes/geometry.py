# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# ─── How to run ───
# Imported by build_assets.py in Blender's bundled Python.
"""Editable mesh primitives with parent-local coordinates, adapted from the SK builder."""
from __future__ import annotations

from collections.abc import Sequence
from math import cos, sin, tau
from typing import Final

import bpy
from mathutils import Vector

Vec3 = tuple[float, float, float]
PALETTE: Final = {
    "yellow": (0.96, 0.57, 0.018, 1.0),
    "dark": (0.055, 0.068, 0.080, 1.0),
    "metal": (0.31, 0.36, 0.40, 1.0),
    "glass": (0.025, 0.14, 0.20, 1.0),
    "red": (0.70, 0.025, 0.020, 1.0),
    "white": (0.90, 0.94, 0.97, 1.0),
}


class Builder:
    """Mutable accumulator for named meshes and shared unit-cylinder data."""

    def __init__(self, scene: bpy.types.Scene) -> None:
        self.scene = scene
        self.materials: dict[str, bpy.types.Material] = {}
        self.tubes: dict[str, bpy.types.Mesh] = {}
        for key, color in PALETTE.items():
            material = bpy.data.materials.new(key)
            material.diffuse_color = color
            material.use_nodes = True
            shader = material.node_tree.nodes.get("Principled BSDF")
            shader.inputs["Base Color"].default_value = color
            shader.inputs["Metallic"].default_value = 0.3
            shader.inputs["Roughness"].default_value = 0.27
            self.materials[key] = material

    def empty(self, name: str, loc: Vec3, parent: bpy.types.Object | None = None) -> bpy.types.Object:
        node = bpy.data.objects.new(name, None)
        self.scene.collection.objects.link(node)
        node.parent = parent
        node.location = loc
        return node

    def mesh(self, name: str, vertices: Sequence[Vec3], faces: Sequence[tuple[int, ...]],
             mat: str, parent: bpy.types.Object | None = None) -> bpy.types.Object:
        data = bpy.data.meshes.new(name + "_mesh")
        data.from_pydata(vertices, [], faces)
        data.materials.append(self.materials[mat])
        data.update()
        obj = bpy.data.objects.new(name, data)
        self.scene.collection.objects.link(obj)
        obj.parent = parent
        return obj

    def box(self, name: str, loc: Vec3, size: Vec3, mat: str,
            parent: bpy.types.Object | None = None, bevel: float = 0) -> bpy.types.Object:
        x, y, z = (v / 2 for v in size)
        vertices = [(-x, -y, -z), (x, -y, -z), (x, y, -z), (-x, y, -z),
                    (-x, -y, z), (x, -y, z), (x, y, z), (-x, y, z)]
        faces = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4),
                 (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
        obj = self.mesh(name, vertices, faces, mat, parent)
        obj.location = loc
        if bevel > 0:
            modifier = obj.modifiers.new("Edge radius", "BEVEL")
            modifier.width = bevel
            modifier.segments = 2
        return obj

    def cylinder(self, name: str, loc: Vec3, radius: float, depth: float, mat: str,
                 parent: bpy.types.Object | None = None,
                 rotation: Vec3 = (0, 0, 0)) -> bpy.types.Object:
        if mat not in self.tubes:
            count = 12
            vertices = [(cos(tau * i / count), sin(tau * i / count), z)
                        for z in (-0.5, 0.5) for i in range(count)]
            faces = [(i, (i + 1) % count, (i + 1) % count + count, i + count)
                     for i in range(count)]
            faces.extend([tuple(range(count - 1, -1, -1)), tuple(range(count, count * 2))])
            template = self.mesh(name, vertices, faces, mat, parent)
            self.tubes[mat] = template.data
            obj = template
        else:
            obj = bpy.data.objects.new(name, self.tubes[mat])
            self.scene.collection.objects.link(obj)
            obj.parent = parent
        obj.location = loc
        obj.scale = (radius, radius, depth)
        obj.rotation_euler = rotation
        return obj

    def rod(self, name: str, a: Vec3, b: Vec3, radius: float, mat: str,
            parent: bpy.types.Object | None = None) -> bpy.types.Object:
        direction = Vector(b) - Vector(a)
        center = (Vector(a) + Vector(b)) / 2
        obj = self.cylinder(name, tuple(center), radius, direction.length, mat, parent)
        obj.rotation_euler = direction.to_track_quat("Z", "Y").to_euler()
        return obj
