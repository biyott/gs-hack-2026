#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.13"
# dependencies = []
# ///
# Imported by verify_shapes.py inside Blender's bundled Python.
"""Independent geometric topology checks, accepting quads or GLB triangles."""
from __future__ import annotations

from typing import Final

import bpy
from mathutils import Vector

Point = tuple[float, float, float]
ProfilePoint = tuple[float, float]
TOLERANCE: Final = 0.00001


def key(point: Vector) -> Point:
    return tuple(round(value, 5) for value in point)


def cross(a: ProfilePoint, b: ProfilePoint, c: ProfilePoint) -> float:
    return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])


def hull(points: list[ProfilePoint]) -> list[ProfilePoint]:
    """Recover the exterior profile without using generator dimensions."""
    ordered = sorted(set(points))
    lower: list[ProfilePoint] = []
    upper: list[ProfilePoint] = []
    for target, sequence in ((lower, ordered), (upper, list(reversed(ordered)))):
        for point in sequence:
            while len(target) >= 2 and cross(target[-2], target[-1], point) <= 1e-10:
                target.pop()
            target.append(point)
    return lower[:-1] + upper[:-1]


def stage_vertices(mesh: bpy.types.Object) -> list[Vector]:
    """Resolve mesh coordinates into its immediate stage's axial frame."""
    transform = mesh.parent.matrix_world.inverted() @ mesh.matrix_world
    return [transform @ vertex.co for vertex in mesh.data.vertices]


def verify_quad_coverage(quad: tuple[Point, ...], faces: list[frozenset[Point]]) -> None:
    """A whole quad or its two diagonal triangles must cover each target face."""
    corners = frozenset(quad)
    members = [face for face in faces if face <= corners]
    if members == [corners]:
        return
    assert len(members) == 2 and all(len(face) == 3 for face in members), members
    assert members[0] | members[1] == corners
    diagonal = members[0] & members[1]
    assert diagonal in (frozenset((quad[0], quad[2])), frozenset((quad[1], quad[3])))


def verify_hollow_shell(mesh: bpy.types.Object) -> tuple[list[ProfilePoint], list[ProfilePoint]]:
    """Require five real exterior planes, five bore planes and annular ends."""
    points = stage_vertices(mesh)
    coordinates = [key(point) for point in points]
    unique = set(coordinates)
    axial = sorted({point[0] for point in unique})
    assert len(axial) == 2 and axial[1] - axial[0] > 1.0, (mesh.name, axial)
    profile = {(point[1], point[2]) for point in unique}
    outer = hull(list(profile))
    inner = hull(list(profile - set(outer)))
    assert len(outer) == 5 and len(inner) == 5, (mesh.name, outer, inner)
    assert len(unique) == 20 and len(profile) == 10, mesh.name
    for point in inner:
        assert all(cross(a, b, point) > 0 for a, b in zip(outer, outer[1:] + outer[:1], strict=True))
    faces = [frozenset(coordinates[index] for index in face.vertices) for face in mesh.data.polygons]
    assert len(faces) == len(set(faces)), (mesh.name, "duplicate faces")
    quads: list[tuple[Point, ...]] = []
    start, end = axial
    for profile_ring in (outer, inner):
        for a, b in zip(profile_ring, profile_ring[1:] + profile_ring[:1], strict=True):
            quads.append(((start, *a), (start, *b), (end, *b), (end, *a)))
    for x in axial:
        for index in range(5):
            following = (index + 1) % 5
            quads.append(((x, *outer[index]), (x, *outer[following]), (x, *inner[following]), (x, *inner[index])))
    for quad in quads:
        verify_quad_coverage(quad, faces)
    assert all(any(face <= frozenset(quad) for quad in quads) for face in faces)
    return outer, inner
