#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.13"
# dependencies = []
# ///
# ─── How to run ───
# Imported by verify_maeda.py inside Blender 5.2.
# ──────────────────
"""Neutral studio scene for an honest imported-GLB scale review."""
from __future__ import annotations

from pathlib import Path

import bpy
from mathutils import Vector


def studio_setup() -> None:
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 24
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 1400
    scene.render.resolution_y = 1100
    scene.render.resolution_percentage = 100
    scene.world.color = (0.22, 0.22, 0.22)
    scene.view_settings.view_transform = "AgX"
    bpy.ops.mesh.primitive_plane_add(size=200)
    floor = bpy.context.object
    floor.name = "STUDIO_GROUND_NOT_ASSET"
    floor.location.z = -0.015
    mat = bpy.data.materials.new("Studio offwhite")
    mat.diffuse_color = (0.72, 0.76, 0.76, 1)
    floor.data.materials.append(mat)
    for name, position, energy, size in (("Key", (1, -7, 15), 2200, 8), ("Rim", (4, 6, 12), 1900, 6), ("Fill", (-7, -1, 7), 1100, 6)):
        data = bpy.data.lights.new(name, type="AREA")
        data.energy = energy
        data.shape = "DISK"
        data.size = size
        obj = bpy.data.objects.new(name, data)
        scene.collection.objects.link(obj)
        obj.location = position
        obj.rotation_euler = (Vector((1.5, 0, 4.0)) - obj.location).to_track_quat("-Z", "Y").to_euler()
    data = bpy.data.cameras.new("Review camera")
    camera = bpy.data.objects.new("Review camera", data)
    scene.collection.objects.link(camera)
    scene.camera = camera
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = 12.7


def render_view(path: Path, camera_position: tuple[float, float, float], aim: tuple[float, float, float]) -> None:
    scene = bpy.context.scene
    camera = scene.camera
    camera.location = camera_position
    camera.rotation_euler = (Vector(aim) - camera.location).to_track_quat("-Z", "Y").to_euler()
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)
