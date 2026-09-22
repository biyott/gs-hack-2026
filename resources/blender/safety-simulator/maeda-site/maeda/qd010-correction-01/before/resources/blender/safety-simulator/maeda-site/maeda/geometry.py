#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.13"
# dependencies = []
# ///
# ─── How to run ───
# Imported by build_maeda.py inside Blender 5.2's bundled Python.
# ──────────────────
"""Small typed Blender primitive helpers for an editable manufacturer study."""
from __future__ import annotations

from dataclasses import dataclass
from math import pi
from typing import Final

import bpy
from mathutils import Vector

Point = tuple[float, float, float]
Color = tuple[float, float, float, float]


@dataclass(frozen=True, slots=True)
class Finish:
    color: Color
    metallic: float = 0.0
    roughness: float = 0.4


@dataclass(frozen=True, slots=True)
class Solid:
    name: str
    center: Point
    size: Point


@dataclass(frozen=True, slots=True)
class Rod:
    name: str
    start: Point
    end: Point
    radius: float


TEAL: Final = Finish((0.025, 0.47, 0.43, 1), 0.32, 0.3)
DARK_TEAL: Final = Finish((0.02, 0.22, 0.20, 1), 0.3, 0.36)
RUBBER: Final = Finish((0.025, 0.032, 0.033, 1), 0.06, 0.78)
STEEL: Final = Finish((0.25, 0.3, 0.32, 1), 0.65, 0.3)
CHROME: Final = Finish((0.65, 0.7, 0.72, 1), 0.9, 0.16)
WHITE: Final = Finish((0.88, 0.92, 0.87, 1), 0.1, 0.45)
YELLOW: Final = Finish((0.97, 0.67, 0.06, 1), 0.25, 0.38)


def material(name: str, finish: Finish) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = finish.color
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = finish.color
    bsdf.inputs["Metallic"].default_value = finish.metallic
    bsdf.inputs["Roughness"].default_value = finish.roughness
    return mat


def finish_mesh(mesh: bpy.types.Object, mat: bpy.types.Material) -> bpy.types.Object:
    mesh.data.materials.append(mat)
    return mesh


def box(spec: Solid, mat: bpy.types.Material, bevel: float = 0.015) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(size=1, location=spec.center)
    mesh = bpy.context.object
    mesh.name = spec.name
    mesh.dimensions = spec.size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel > 0:
        modifier = mesh.modifiers.new("Manufactured edge radius", "BEVEL")
        modifier.width = bevel
        modifier.segments = 2
        mesh.modifiers.new("Weighted corner normals", "WEIGHTED_NORMAL")
    return finish_mesh(mesh, mat)


def rod(spec: Rod, mat: bpy.types.Material) -> bpy.types.Object:
    delta = Vector(spec.end) - Vector(spec.start)
    center = (Vector(spec.start) + Vector(spec.end)) / 2
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=spec.radius, depth=delta.length, location=center)
    mesh = bpy.context.object
    mesh.name = spec.name
    mesh.rotation_mode = "QUATERNION"
    mesh.rotation_quaternion = delta.to_track_quat("Z", "Y")
    for face in mesh.data.polygons:
        face.use_smooth = len(face.vertices) == 4
    return finish_mesh(mesh, mat)


def beam(spec: Rod, size: tuple[float, float], mat: bpy.types.Material) -> bpy.types.Object:
    delta = Vector(spec.end) - Vector(spec.start)
    center = tuple((Vector(spec.start) + Vector(spec.end)) / 2)
    mesh = box(Solid(spec.name, center, (size[0], size[1], delta.length)), mat)
    mesh.rotation_mode = "QUATERNION"
    mesh.rotation_quaternion = delta.to_track_quat("Z", "Y")
    return mesh


def empty(name: str, parent: bpy.types.Object | None = None) -> bpy.types.Object:
    node = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(node)
    node.parent = parent
    node.empty_display_type = "PLAIN_AXES"
    node.empty_display_size = 0.4
    return node


def parent_keep(mesh: bpy.types.Object, parent: bpy.types.Object) -> None:
    bpy.context.view_layer.update()
    transform = mesh.matrix_world.copy()
    mesh.parent = parent
    mesh.matrix_world = transform


def polyline(name: str, points: list[Point], mat: bpy.types.Material) -> bpy.types.Object:
    curve = bpy.data.curves.new(name, type="CURVE")
    curve.dimensions = "3D"
    curve.bevel_depth = 0.025
    curve.bevel_resolution = 3
    spline = curve.splines.new("POLY")
    spline.points.add(len(points) - 1)
    for point, position in zip(spline.points, points, strict=True):
        point.co = (*position, 1)
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    return obj


def label(spec: Solid, mat: bpy.types.Material) -> bpy.types.Object:
    bpy.ops.object.text_add(location=spec.center)
    obj = bpy.context.object
    obj.name = "Decal_" + spec.name
    obj.data.body = spec.name
    obj.data.align_x = "CENTER"
    obj.data.size = spec.size[0]
    obj.data.extrude = 0.0007
    obj.rotation_euler = (pi / 2, 0, 0)
    obj.data.materials.append(mat)
    return obj
