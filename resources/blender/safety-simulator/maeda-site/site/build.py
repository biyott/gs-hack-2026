# /// script
# requires-python = ">=3.13"
# dependencies = []
# ///
# ─── How to run ───
# Blender supplies bpy; run with its embedded Python, not standalone uv:
# blender --background --factory-startup --python-exit-code 1 --python build.py
"""Build the synthetic HVO context and a separately addressable exact 140x50m site."""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Final

import bpy
from mathutils import Vector

HERE: Final = Path(__file__).resolve().parent
ROOT: Final = HERE.parents[4]
sys.path.insert(0, str(HERE))
from context import build_context
from export import export_runtime
from geometry import Bounds, box, cylinder, label, materials


def region(name: str, bounds: Bounds, material: str) -> bpy.types.Object:
    """Preserve an operational region ID on a distinct GLB node."""
    obj = box("REGION__" + name, bounds, material)
    obj["regionId"] = name
    obj["siteId"] = "SITE-CONSTRUCTION-01"
    obj["synthetic"] = True
    obj["safetyAuthority"] = "Runtime geometry and route engine, not this mesh"
    return obj


def operational_site() -> None:
    """Construct only static floor regions and the documented obstacle envelope."""
    slab = box("SITE_SLAB", ((0, 0, -0.3), (140, 50, 0)), "concrete")
    slab["regionId"] = "SITE-BOUNDARY"
    slab["sizeMeters"] = [140, 50]
    for x in range(10, 140, 10):
        box("PAVING_JOINT_X", ((x - 0.025, 0, 0.001), (x + 0.025, 50, 0.006)), "joint")
    for y in range(10, 50, 10):
        box("PAVING_JOINT_Y", ((0, y - 0.025, 0.001), (140, y + 0.025, 0.006)), "joint")
    region("WORK-AREA", ((15, 12, 0.012), (100, 38, 0.028)), "work")
    region("STOCK", ((55, 17, 0.03), (75, 29, 0.048)), "stock")
    region("DESTINATION", ((80, 17, 0.03), (95, 29, 0.048)), "destination")
    region("PATH-A", ((8, 6, 0.012), (132, 10, 0.028)), "lane")
    region("PATH-B", ((8, 40, 0.012), (132, 44, 0.028)), "lane")
    obstacle = region("OBSTACLE-01", ((105, 18, 0), (120, 30, 6)), "tank")
    obstacle["heightMeters"] = 6
    for x in range(106, 120, 2):
        box("OBSTACLE_ROOF_RIB", ((x, 18.2, 5.95), (x + 0.1, 29.8, 6)), "roof")
    for x in range(106, 120, 3):
        box("OBSTACLE_SOUTH_PANEL", ((x, 17.99, 1), (x + 1.4, 18.01, 4.8)), "roof")
    for index, y in enumerate((8, 42), start=1):
        name = f"REFUGE-{index:02d}"
        obj = cylinder("REGION__" + name, ((125, y, 0.04), 1.5, 0.02), "refuge")
        obj["regionId"] = name
        obj["synthetic"] = True
        obj["candidateOnly"] = True
        label("REFUGE_LABEL", (f"R{index}", (125, y, 0.06), 0.9), "white")
    for low, high in (
        ((0, 0, 0.012), (140, 0.16, 0.03)),
        ((0, 49.84, 0.012), (140, 50, 0.03)),
        ((0, 0, 0.012), (0.16, 50, 0.03)),
        ((139.84, 0, 0.012), (140, 50, 0.03)),
    ):
        box("SITE_BOUNDARY_LINE", (low, high), "white")
    for x in range(16, 100, 5):
        for y in (12.1, 37.8):
            box(
                "WORK_BOUNDARY_DASH", ((x, y, 0.032), (x + 2, y + 0.12, 0.045)), "white"
            )
    for text, position, size in (
        ("STOCK", (65, 23, 0.055), 1.6),
        ("LIFT BAY", (87.5, 23, 0.055), 1.4),
        ("WORK AREA", (32, 35, 0.04), 1.3),
        ("PATH A", (22, 8, 0.04), 1.1),
        ("PATH B", (22, 42, 0.04), 1.1),
        ("140 m  /  SYNTHETIC DEMO SITE", (70, 47, 0.04), 1.2),
        ("OBSTACLE 01", (112.5, 24, 6.02), 1),
        ("0,0", (3, 2, 0.04), 0.9),
    ):
        label("SITE_LABEL_" + text.replace(" ", "_"), (text, position, size), "white")


def presentation() -> None:
    """Light the editable scene and save two reviewable camera compositions."""
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 24
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 1000
    scene.render.resolution_percentage = 100
    scene.world = bpy.data.worlds.new("PRESENTATION_WORLD")
    scene.world.use_nodes = True
    background = scene.world.node_tree.nodes.get("Background")
    background.inputs["Color"].default_value = (0.58, 0.68, 0.78, 1)
    background.inputs["Strength"].default_value = 0.6
    bpy.ops.object.light_add(type="SUN", location=(40, -40, 95))
    sun = bpy.context.object
    sun.name = "PRESENTATION_SUN"
    sun.rotation_euler = (0.38, -0.45, -0.35)
    sun.data.energy = 3
    sun.data.angle = 0.2
    bpy.ops.object.camera_add(location=(178, -165, 155))
    camera = bpy.context.object
    camera.name = "PRESENTATION_OVERVIEW"
    camera.rotation_euler = (
        (Vector((71, 33, 5)) - camera.location).to_track_quat("-Z", "Y").to_euler()
    )
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = 226
    camera.data.clip_end = 1000
    scene.camera = camera
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = str(HERE / "overview.png")
    scene.view_settings.view_transform = "AgX"


def main() -> None:
    """Create isolated source, portable GLB and review renders."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.name = "HVO_SYNTHETIC_DEMO_SITE"
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1
    materials()
    operational_site()
    build_context()
    root = bpy.data.objects.new("SITE_ROOT", None)
    scene.collection.objects.link(root)
    root["siteId"] = "SITE-CONSTRUCTION-01"
    root["mapVersion"] = "1.0.0"
    root["floorId"] = "GROUND"
    root["synthetic"] = True
    root["units"] = "metres"
    root["operationalRectangle"] = [0, 0, 140, 50]
    root["provenance"] = "Synthetic HVO-inspired setting; no measured facility layout"
    root["displayName"] = "서산 HVO 현장 참고 / 상세 배치 재구성"
    root["coordinateMapping"] = "Blender [x,y,z] -> glTF [x,z,-y]"
    groups = {
        name: bpy.data.collections.new(name)
        for name in ("OPERATIONAL_SITE", "INDUSTRIAL_CONTEXT")
    }
    for group in groups.values():
        scene.collection.children.link(group)
    meshes = [obj for obj in scene.objects if obj.type == "MESH"]
    for obj in meshes:
        obj.parent = root
        group = groups[
            "INDUSTRIAL_CONTEXT" if obj.name.startswith("CTX_") else "OPERATIONAL_SITE"
        ]
        for current in list(obj.users_collection):
            current.objects.unlink(obj)
        group.objects.link(obj)
        obj["synthetic"] = True
        obj["role"] = "context" if obj.name.startswith("CTX_") else "site"
    presentation()
    bpy.ops.object.select_all(action="DESELECT")
    for obj in (root, *meshes):
        obj.select_set(True)
    output = ROOT / "public/assets/site/hvo-demo.glb"
    output.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(HERE / "hvo-demo.blend"))
    export_runtime()
    bpy.ops.wm.open_mainfile(filepath=str(HERE / "hvo-demo.blend"))
    scene = bpy.context.scene
    bpy.ops.render.render(write_still=True)
    scene.camera.location = (158, -133, 143)
    scene.camera.rotation_euler = (
        (Vector((72, 26, 2)) - scene.camera.location)
        .to_track_quat("-Z", "Y")
        .to_euler()
    )
    scene.camera.data.ortho_scale = 171
    scene.render.filepath = str(HERE / "operational-detail.png")
    bpy.ops.render.render(write_still=True)
    print("SITE_BUILD_EXPORTED", output)


if __name__ == "__main__":
    main()
