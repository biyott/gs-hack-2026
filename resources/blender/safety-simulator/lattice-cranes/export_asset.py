# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# ─── How to run ───
# Imported inside Blender by build_assets.py after saving the editable source.
"""Merge static material batches within rigid controls for compact web exports."""
from __future__ import annotations

from pathlib import Path
from typing import Final

import bpy

PROTECTED: Final = {"ROOT", "SLEW", "TROLLEY", "HOOK", "HOIST_ROPES", "BOOM_PIVOT",
                   "BOOM_PENDANT_LEFT", "BOOM_PENDANT_RIGHT"}


def export_glb(root: bpy.types.Object, path: Path) -> None:
    """Optimize only in-memory export geometry; source blend is already saved."""
    bpy.context.view_layer.update()
    groups: dict[tuple[str, str], list[bpy.types.Object]] = {}
    for obj in list(root.children_recursive):
        if obj.type != "MESH":
            continue
        ancestor = obj.parent
        while ancestor.name not in PROTECTED:
            ancestor = ancestor.parent
        material = obj.data.materials[0].name
        groups.setdefault((ancestor.name, material), []).append(obj)
    for (parent_name, material_name), objects in groups.items():
        ancestor = bpy.data.objects[parent_name]
        vertices: list[tuple[float, float, float]] = []
        faces: list[tuple[int, ...]] = []
        dependency_graph = bpy.context.evaluated_depsgraph_get()
        for obj in objects:
            evaluated = obj.evaluated_get(dependency_graph)
            mesh = evaluated.to_mesh()
            relative = ancestor.matrix_world.inverted() @ obj.matrix_world
            offset = len(vertices)
            vertices.extend(tuple(relative @ vertex.co) for vertex in mesh.vertices)
            faces.extend(tuple(index + offset for index in polygon.vertices) for polygon in mesh.polygons)
            evaluated.to_mesh_clear()
        name = f"{parent_name}_{material_name}_batch"
        data = bpy.data.meshes.new(name)
        data.from_pydata(vertices, [], faces)
        data.materials.append(bpy.data.materials[material_name])
        data.update()
        combined = bpy.data.objects.new(name, data)
        bpy.context.scene.collection.objects.link(combined)
        combined.parent = ancestor
        for obj in objects:
            bpy.data.objects.remove(obj, do_unlink=True)
    bpy.ops.object.select_all(action="DESELECT")
    root.select_set(True)
    for obj in root.children_recursive:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = root
    bpy.ops.export_scene.gltf(filepath=str(path), export_format="GLB", use_selection=True,
                              export_extras=True, export_yup=True, export_animations=False,
                              export_cameras=False, export_lights=False)
