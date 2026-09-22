# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# ─── How to run ───
# Inside Blender after geometry: presentation.build(builder).
"""Studio lighting and three useful inspection cameras."""

from __future__ import annotations

from math import radians

import bpy
from mathutils import Vector

from crane_geometry import Builder, Vec3


def camera(h: Builder, name: str, location: Vec3, target: Vec3,
           scale: float) -> bpy.types.Object:
    data = bpy.data.cameras.new(name)
    data.type = "ORTHO"
    data.ortho_scale = scale
    data.clip_end = 1000
    obj = h.link(bpy.data.objects.new(name, data))
    obj.location = location
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()
    return obj


def area(h: Builder, name: str, location: Vec3, target: Vec3,
         power: float, size: float) -> None:
    data = bpy.data.lights.new(name, "AREA")
    data.energy = power
    data.shape = "DISK"
    data.size = size
    obj = h.link(bpy.data.objects.new(name, data))
    obj.location = location
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def build(h: Builder) -> None:
    """Stage a full crane view plus a carrier and a side inspection view."""
    h.collection("90_Studio")
    ground = h.box("Studio_Ground", (15, 0, -0.16), (2000, 2000, 0.3), "ground", 0)
    ground.parent = None
    world = bpy.data.worlds.new("SK1265_Studio_World")
    world.use_nodes = True
    background = next(n for n in world.node_tree.nodes if n.type == "BACKGROUND")
    background.inputs[0].default_value = (0.36, 0.43, 0.52, 1)
    background.inputs[1].default_value = 0.45
    h.scene.world = world
    area(h, "Key_softbox", (10, -32, 62), (15, 0, 20), 35000, 38)
    area(h, "Rim_softbox", (25, 30, 52), (15, 0, 22), 45000, 30)
    area(h, "Carrier_fill", (-13, -12, 13), (-2, 0, 2), 4000, 12)
    sun_data = bpy.data.lights.new("Sun_long_edges", "SUN")
    sun_data.energy = 1.5
    sun_data.angle = radians(12)
    sun = h.link(bpy.data.objects.new("Sun_long_edges", sun_data))
    sun.rotation_euler = (radians(22), radians(-28), radians(-25))
    h.collection("91_Cameras")
    hero = camera(h, "Camera_Hero_Overall", (63, -110, 52), (24, 0, 21), 81)
    camera(h, "Camera_Carrier_Detail", (-18, -24, 13), (-1.5, 0, 3), 22)
    camera(h, "Camera_Side_Orthographic", (26, -120, 22), (26, 0, 22), 79)
    h.scene.camera = hero
    h.scene.render.resolution_x = 1800
    h.scene.render.resolution_y = 1200
    h.scene.render.resolution_percentage = 100
    for window in bpy.context.window_manager.windows:
        for screen_area in window.screen.areas:
            if screen_area.type == "VIEW_3D":
                space = screen_area.spaces.active
                space.clip_end = 1000
                space.overlay.show_overlays = False
                space.shading.type = "MATERIAL"
                space.region_3d.view_perspective = "CAMERA"
