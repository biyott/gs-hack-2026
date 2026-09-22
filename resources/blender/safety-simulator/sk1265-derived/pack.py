# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# Imported by build.py inside Blender; no standalone invocation.
"""Bake material batches to unique meshes without touching shared source datablocks."""
from __future__ import annotations
from collections import defaultdict
import bpy


def pack_meshes(geometry: list[bpy.types.Object]) -> list[bpy.types.Object]:
    """Keep each rig parent intact and bake evaluated vertices into its local frame."""
    bpy.context.view_layer.update()
    groups: defaultdict[tuple[str, str], list[bpy.types.Object]] = defaultdict(list)
    for obj in geometry:
        material = obj.data.materials[0].name
        groups[(obj.parent.name, material)].append(obj)
    packed = []
    graph = bpy.context.evaluated_depsgraph_get()
    for (parent_name, material), objects in groups.items():
        parent = bpy.data.objects[parent_name]
        vertices: list[tuple[float, float, float]] = []
        faces: list[tuple[int, ...]] = []
        smooth: list[bool] = []
        for obj in objects:
            evaluated = obj.evaluated_get(graph)
            mesh = evaluated.to_mesh()
            relative = parent.matrix_world.inverted() @ obj.matrix_world
            offset = len(vertices)
            vertices.extend(tuple(relative @ vertex.co) for vertex in mesh.vertices)
            faces.extend(tuple(index + offset for index in face.vertices) for face in mesh.polygons)
            smooth.extend(face.use_smooth for face in mesh.polygons)
            evaluated.to_mesh_clear()
        data = bpy.data.meshes.new(f"{parent_name}__{material}")
        data.from_pydata(vertices, [], faces)
        data.materials.append(bpy.data.materials[material])
        for face, use_smooth in zip(data.polygons, smooth, strict=True):
            face.use_smooth = use_smooth
        data.update()
        result = bpy.data.objects.new(data.name, data)
        bpy.context.scene.collection.objects.link(result)
        result.parent = parent
        packed.append(result)
    for obj in geometry:
        bpy.data.objects.remove(obj, do_unlink=True)
    bpy.context.view_layer.update()
    return packed
