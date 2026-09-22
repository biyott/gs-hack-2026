# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# ─── How to run ───
# Imported by build_scene.py inside Blender's bundled Python.
"""Reusable geometry for a dimensioned, editable mobile crane study."""

from __future__ import annotations

from collections.abc import Sequence
from math import cos, sin, tau
from typing import Final

import bpy
from mathutils import Vector

Vec3 = tuple[float, float, float]
PALETTE: Final = {
    "yellow": ((0.82, 0.37, 0.008, 1.0), 0.18, 0.3),
    "yellow_dark": ((0.52, 0.245, 0.012, 1.0), 0.25, 0.4),
    "charcoal": ((0.027, 0.038, 0.049, 1.0), 0.45, 0.34),
    "rubber": ((0.016, 0.021, 0.027, 1.0), 0.0, 0.83),
    "metal": ((0.26, 0.31, 0.35, 1.0), 0.75, 0.36),
    "chrome": ((0.66, 0.73, 0.78, 1.0), 0.9, 0.2),
    "glass": ((0.022, 0.09, 0.125, 1.0), 0.4, 0.17),
    "white": ((0.85, 0.9, 0.94, 1.0), 0.12, 0.34),
    "red": ((0.6, 0.014, 0.014, 1.0), 0.1, 0.27),
    "amber": ((1.0, 0.24, 0.006, 1.0), 0.1, 0.24),
    "ground": ((0.17, 0.205, 0.24, 1.0), 0.04, 0.74),
}


class Builder:
    """Accumulate named, editable Blender objects in owned collections."""

    def __init__(self, scene: bpy.types.Scene) -> None:
        self.scene = scene
        self.materials: dict[str, bpy.types.Material] = {}
        self.groups: dict[str, bpy.types.Collection] = {}
        self.tubes: dict[tuple[int, str], bpy.types.Mesh] = {}
        self.active = scene.collection
        self.root = bpy.data.objects.new("SK1265_AT6_MODEL", None)
        scene.collection.objects.link(self.root)
        self.root["reference"] = "Spierings Specs-SK1265_EN.pdf; legacy 60m configuration"
        self.root["units"] = "metres"
        self.root["jib_radius_m"] = 60.0
        self.root["height_under_jib_m"] = 37.2
        self.root["detail_status"] = "External visual reconstruction; small sections estimated from photographs"
        for key, (color, metallic, roughness) in PALETTE.items():
            mat = bpy.data.materials.new("SK1265_" + key)
            mat.use_nodes = True
            mat.diffuse_color = color
            shader = next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
            shader.inputs[0].default_value = color
            shader.inputs[1].default_value = metallic
            shader.inputs[2].default_value = roughness
            shader.inputs[20].default_value = 0.2
            self.materials[key] = mat

    def collection(self, name: str) -> None:
        """Select or create a named component collection in this scene."""
        if name not in self.groups:
            group = bpy.data.collections.new(name)
            self.scene.collection.children.link(group)
            self.groups[name] = group
        self.active = self.groups[name]

    def link(self, obj: bpy.types.Object) -> bpy.types.Object:
        self.active.objects.link(obj)
        obj.parent = self.root
        return obj

    def mesh(self, name: str, vertices: Sequence[Vec3], faces: Sequence[tuple[int, ...]],
             material: str) -> bpy.types.Object:
        data = bpy.data.meshes.new(name + "_mesh")
        data.from_pydata(vertices, [], faces)
        data.materials.append(self.materials[material])
        data.update()
        return self.link(bpy.data.objects.new(name, data))

    def box(self, name: str, center: Vec3, size: Vec3, material: str,
            bevel: float = 0.02) -> bpy.types.Object:
        x, y, z = (v / 2 for v in size)
        vertices = [(-x, -y, -z), (x, -y, -z), (x, y, -z), (-x, y, -z),
                    (-x, -y, z), (x, -y, z), (x, y, z), (-x, y, z)]
        faces = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4),
                 (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
        obj = self.mesh(name, vertices, faces, material)
        obj.location = center
        if bevel > 0:
            mod = obj.modifiers.new("Manufactured edge radii", "BEVEL")
            mod.width = min(bevel, min(size) * 0.25)
            mod.segments = 2
        return obj

    def cylinder(self, name: str, a: Vec3, b: Vec3, radius: float,
                 material: str, vertices: int = 16) -> bpy.types.Object:
        key = (vertices, material)
        if key not in self.tubes:
            points = [(cos(tau * i / vertices), sin(tau * i / vertices), z)
                      for z in (-0.5, 0.5) for i in range(vertices)]
            faces = [(i, (i + 1) % vertices, (i + 1) % vertices + vertices,
                      i + vertices) for i in range(vertices)]
            faces += [tuple(reversed(range(vertices))), tuple(range(vertices, 2 * vertices))]
            data = bpy.data.meshes.new(f"Tube_{vertices}_{material}")
            data.from_pydata(points, [], faces)
            data.materials.append(self.materials[material])
            for face in data.polygons[:vertices]:
                face.use_smooth = True
            data.update()
            self.tubes[key] = data
        obj = self.link(bpy.data.objects.new(name, self.tubes[key]))
        start, end = Vector(a), Vector(b)
        delta = end - start
        obj.location = (start + end) / 2
        obj.rotation_euler = Vector((0, 0, 1)).rotation_difference(delta).to_euler()
        obj.scale = (radius, radius, delta.length)
        return obj

    def line(self, name: str, points: Sequence[Vec3], radius: float,
             material: str) -> bpy.types.Object:
        data = bpy.data.curves.new(name + "_curve", "CURVE")
        data.dimensions = "3D"
        data.bevel_depth = radius
        data.bevel_resolution = 2
        spline = data.splines.new("POLY")
        spline.points.add(len(points) - 1)
        for point, xyz in zip(spline.points, points, strict=True):
            point.co = (*xyz, 1.0)
        data.materials.append(self.materials[material])
        return self.link(bpy.data.objects.new(name, data))

    def label(self, name: str, text: str, location: Vec3, size: float,
              material: str, rotation: Vec3 = (0, 0, 0)) -> bpy.types.Object:
        data = bpy.data.curves.new(name + "_font", "FONT")
        data.body = text
        data.size = size
        data.align_x = "CENTER"
        data.extrude = 0.0005
        data.materials.append(self.materials[material])
        obj = self.link(bpy.data.objects.new(name, data))
        obj.location = location
        obj.rotation_euler = rotation
        return obj
