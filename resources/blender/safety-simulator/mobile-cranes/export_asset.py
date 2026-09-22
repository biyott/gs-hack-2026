# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# ─── How to run ───
# Imported by build_mobile_cranes.py in Blender's bundled Python.
"""Merge evaluated geometry per material/rig parent for compact GLB exports."""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

import bpy
from mathutils import Vector


@dataclass(frozen=True, slots=True)
class MeshGroup:
    """Mutable accumulator used only while building one material mesh."""
    parent: bpy.types.Object
    material: bpy.types.Material
    vertices: list[tuple[float, float, float]] = field(default_factory=list)
    faces: list[tuple[int, ...]] = field(default_factory=list)


def belongs_to(obj: bpy.types.Object, root: bpy.types.Object) -> bool:
    current = obj
    while current.parent is not None:
        current = current.parent
    return current == root


def bounds(objects: list[bpy.types.Object]) -> tuple[list[float], list[float]]:
    bpy.context.view_layer.update()
    graph = bpy.context.evaluated_depsgraph_get()
    points: list[Vector] = []
    for obj in objects:
        evaluated = obj.evaluated_get(graph)
        mesh = evaluated.to_mesh()
        points.extend(obj.matrix_world @ vertex.co for vertex in mesh.vertices)
        evaluated.to_mesh_clear()
    return ([round(min(p[i] for p in points), 5) for i in range(3)],
            [round(max(p[i] for p in points), 5) for i in range(3)])


def export(path: Path, root_name: str) -> int:
    """Evaluate bevels/text/curves without destructively changing editable source."""
    root = bpy.data.objects[root_name]
    bpy.context.view_layer.update()
    depsgraph = bpy.context.evaluated_depsgraph_get()
    groups: dict[tuple[str, str], MeshGroup] = {}
    originals = [o for o in bpy.context.scene.objects if belongs_to(o, root)]
    for obj in originals:
        if obj.type not in {"MESH", "CURVE", "FONT"}:
            continue
        evaluated = obj.evaluated_get(depsgraph)
        mesh = evaluated.to_mesh()
        material = mesh.materials[0]
        parent = obj.parent
        key = (parent.name, material.name)
        if key not in groups:
            groups[key] = MeshGroup(parent, material)
        group = groups[key]
        offset = len(group.vertices)
        matrix = parent.matrix_world.inverted() @ obj.matrix_world
        for vertex in mesh.vertices:
            point = matrix @ vertex.co
            group.vertices.append((point.x, point.y, point.z))
        group.faces.extend(tuple(offset + index for index in face.vertices) for face in mesh.polygons)
        evaluated.to_mesh_clear()
    bpy.ops.object.select_all(action="DESELECT")
    for obj in originals:
        if obj.type == "EMPTY":
            obj.select_set(True)
    for (parent_name, material_name), group in groups.items():
        name = f"{parent_name}_{material_name}_BATCH"
        mesh = bpy.data.meshes.new(name)
        mesh.from_pydata(group.vertices, [], group.faces)
        mesh.materials.append(group.material)
        mesh.update()
        obj = bpy.data.objects.new(name, mesh)
        bpy.context.scene.collection.objects.link(obj)
        obj.parent = group.parent
        obj.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(path), export_format="GLB", use_selection=True,
                              export_extras=True, export_animations=False, export_yup=True)
    return len(groups)
