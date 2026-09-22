# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# ─── How to run ───
# Imported inside Blender by build_assets.py.
"""Consistent inspection cameras and neutral studio illumination."""
from __future__ import annotations

from math import radians

import bpy
from mathutils import Vector

from geometry import Builder, Vec3


def camera(h: Builder, name: str, location: Vec3, target: Vec3, scale: float) -> bpy.types.Object:
    data = bpy.data.cameras.new(name)
    data.type = "ORTHO"
    data.ortho_scale = scale
    data.clip_end = 1000
    node = bpy.data.objects.new(name, data)
    h.scene.collection.objects.link(node)
    node.location = location
    node.rotation_euler = (Vector(target) - node.location).to_track_quat("-Z", "Y").to_euler()
    return node


def stage(h: Builder, tower: bool) -> None:
    """Keep studio objects outside ROOT so exports contain only the crane."""
    h.box("Studio_ground", (15, 0, -0.10), (300, 300, 0.18), "white")
    world = bpy.data.worlds.new("Neutral_studio")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0.60, 0.67, 0.77, 1)
    world.node_tree.nodes["Background"].inputs[1].default_value = 0.65
    h.scene.world = world
    for name, loc, energy, size in (("Key", (12, -30, 70), 100000, 40),
                                     ("Rim", (5, 35, 65), 120000, 45)):
        data = bpy.data.lights.new(name, "AREA")
        data.energy = energy
        data.shape = "DISK"
        data.size = size
        node = bpy.data.objects.new(name, data)
        h.scene.collection.objects.link(node)
        node.location = loc
        node.rotation_euler = (Vector((10, 0, 15)) - node.location).to_track_quat("-Z", "Y").to_euler()
    sun_data = bpy.data.lights.new("Sun", "SUN")
    sun_data.energy = 1.8
    sun_data.angle = radians(15)
    sun = bpy.data.objects.new("Sun", sun_data)
    h.scene.collection.objects.link(sun)
    sun.rotation_euler = (radians(20), radians(-25), radians(-30))
    center = (15, 0, 24) if tower else (8, 0, 16)
    scale = 83 if tower else 47
    hero = camera(h, "Camera_overview", (62, -110, 66) if tower else (44, -70, 39), center, scale)
    camera(h, "Camera_side", (center[0], -120, center[2]), center, scale)
    camera(h, "Camera_detail", (13, -19, 13), (-0.5, 0, 2.8), 16 if tower else 13)
    h.scene.camera = hero
    h.scene.render.engine = "BLENDER_EEVEE"
    h.scene.render.resolution_x = 1600
    h.scene.render.resolution_y = 1200
    h.scene.render.resolution_percentage = 100
    h.scene.render.image_settings.file_format = "PNG"
    h.scene.render.image_settings.color_mode = "RGB"
    h.scene.view_settings.view_transform = "AgX"
