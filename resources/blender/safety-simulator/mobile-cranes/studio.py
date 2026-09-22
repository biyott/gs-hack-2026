# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# ─── How to run ───
# Imported by build_mobile_cranes.py in Blender's bundled Python.
"""Consistent three-view lighting for mobile-crane inspection."""
from __future__ import annotations

from math import radians
from pathlib import Path

import bpy
from mathutils import Vector

from crane_geometry import Builder
from configuration import Crane
from rig_controls import Pose, apply_pose, baseline, length_range


def build(h: Builder, c: Crane) -> None:
    """Stage geometry outside model hierarchy so it never enters asset export."""
    h.collection("90_INSPECTION_STUDIO")
    previous = h.root
    h.root = bpy.data.objects.new("STUDIO", None)
    h.scene.collection.objects.link(h.root)
    h.box("Studio_Ground", (5, 0, -0.11), (200, 200, 0.20), "ground", 0)
    world = bpy.data.worlds.new("Mobile_Crane_Studio")
    world.use_nodes = True
    shader = world.node_tree.nodes.get("Background")
    shader.inputs[0].default_value = (0.30, 0.37, 0.45, 1)
    shader.inputs[1].default_value = 0.5
    h.scene.world = world
    for name, location, energy, size in (
        ("Key", (10, -22, 31), 13000, 15),
        ("Rim", (4, 17, 26), 17000, 12),
        ("Fill", (-12, -7, 12), 4500, 9),
    ):
        data = bpy.data.lights.new(name, "AREA")
        data.energy, data.size = energy, size
        light = h.link(bpy.data.objects.new(name, data))
        light.location = location
        light.rotation_euler = (Vector((3, 0, 6)) - light.location).to_track_quat("-Z", "Y").to_euler()
    sun_data = bpy.data.lights.new("Sun", "SUN")
    sun_data.energy = 1.4
    sun_data.angle = radians(14)
    sun = h.link(bpy.data.objects.new("Sun", sun_data))
    sun.rotation_euler = (radians(18), radians(-24), radians(-22))
    target_z = 9 if c.rough_terrain else 11.2
    scale = 29 if c.rough_terrain else 35
    for name, location, target, ortho in (
        ("overview", (30, -46, 28), (4.0, 0, target_z), scale),
        ("side", (5, -70, target_z), (5, 0, target_z), scale),
        ("contact", (13, -20, 13), (0.7, 0, 1.8), 15.5),
    ):
        data = bpy.data.cameras.new(name)
        data.type, data.ortho_scale = "ORTHO", ortho
        data.clip_end = 1000
        camera = h.link(bpy.data.objects.new(name, data))
        camera.location = location
        camera.rotation_euler = (Vector(target) - camera.location).to_track_quat("-Z", "Y").to_euler()
    h.root = previous
    h.scene.camera = bpy.data.objects["overview"]
    h.scene.render.engine = "CYCLES"
    h.scene.cycles.samples = 24
    h.scene.cycles.use_denoising = True
    h.scene.render.resolution_x, h.scene.render.resolution_y = 1280, 960
    h.scene.render.resolution_percentage = 100
    h.scene.render.image_settings.file_format = "PNG"
    h.scene.view_settings.view_transform = "AgX"


def render_views(directory: Path, slug: str) -> None:
    for name in ("overview", "side", "contact"):
        bpy.context.scene.camera = bpy.data.objects[name]
        bpy.context.scene.render.filepath = str(directory / f"{slug}-{name}.png")
        bpy.ops.render.render(write_still=True)


def render_controls(directory: Path, c: Crane) -> None:
    """Show both control corners in an automatically fitted inspection view."""
    camera = bpy.data.objects["overview"]
    saved_matrix, saved_scale = camera.matrix_world.copy(), camera.data.ortho_scale
    low, high = length_range(c)
    for name, pose in (("controls-min", Pose(low, 35, 3)), ("controls-max", Pose(high, 65, 10))):
        apply_pose(c, pose)
        tip = bpy.data.objects["BOOM_TIP"].matrix_world.translation
        target = Vector((max(4, tip.x / 2), 0, tip.z / 2))
        camera.location = target + Vector((25, -46, 15))
        camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()
        camera.data.ortho_scale = max(27, tip.z * 1.45, tip.x * 1.55)
        bpy.context.scene.camera = camera
        bpy.context.scene.render.filepath = str(directory / f"{c.slug}-{name}.png")
        bpy.ops.render.render(write_still=True)
    camera.matrix_world, camera.data.ortho_scale = saved_matrix, saved_scale
    apply_pose(c, baseline(c))
