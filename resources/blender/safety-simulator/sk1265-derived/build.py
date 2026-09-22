# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# Run with Blender: blender --background --factory-startup --python build.py
"""Derive a web motion hierarchy without modifying the original SK1265 study."""
from __future__ import annotations

import json
import sys
from math import radians
from pathlib import Path

import bpy
from mathutils import Vector

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
SOURCE = ROOT / "resources/blender/spierings-sk1265-at6/spierings_sk1265_at6.blend"
OUTPUT = ROOT / "public/assets/cranes/sk1265-at6.glb"
sys.path.insert(0, str(HERE))
from pack import pack_meshes


def attach(child: bpy.types.Object, parent: bpy.types.Object) -> None:
    """Preserve geometry coordinates when inserting an articulation parent."""
    world = child.matrix_world.copy()
    child.parent = parent
    child.matrix_world = world


def empty(name: str, position: tuple[float, float, float], parent: bpy.types.Object) -> bpy.types.Object:
    """Create a meaningful independently controllable articulation node."""
    node = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(node)
    node.location = position
    bpy.context.view_layer.update()
    attach(node, parent)
    return node


def bounds(objects: list[bpy.types.Object]) -> list[list[float]]:
    """Read actual world-space geometric bounds after dependency graph updates."""
    points = [obj.matrix_world @ Vector(corner) for obj in objects for corner in obj.bound_box]
    return [[min(p[axis] for p in points) for axis in range(3)],
            [max(p[axis] for p in points) for axis in range(3)]]


def main() -> None:
    """Save and export the new file, then test the named motion hierarchy."""
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
    scene = bpy.context.scene
    scene.name = "SK1265_LEGACY_DEMO_DERIVED"
    root = bpy.data.objects["SK1265_AT6_MODEL"]
    root.name = "EQUIPMENT_ROOT"
    slew = empty("SLEW", (0.0, 0.0, 0.0), root)
    trolley = empty("TROLLEY", (30.0, 0.0, 0.0), slew)
    hook = empty("HOOK", (30.0, 0.0, 16.24), trolley)
    ropes = empty("HOIST_ROPES", (30.0, 0.0, 36.62), trolley)
    geometry = []
    for obj in list(scene.objects):
        collections = [group.name for group in obj.users_collection]
        if not any(name.startswith(tuple(f"{n:02d}_" for n in range(1, 9))) for name in collections):
            continue
        geometry.append(obj)
        if any(name.startswith("02_") for name in collections) and "_1.0" in obj.name:
            obj.location.x -= 0.27
        if any(name.startswith("03_") for name in collections):
            if obj.name not in ("Carrier slew pedestal", "Slew bearing lower race", "Slew bearing geared race"):
                attach(obj, slew)
        if any(name.startswith(("04_", "05_", "06_", "07_")) for name in collections):
            attach(obj, slew)
        if any(name.startswith("08_") for name in collections):
            parent = trolley
            if obj.name.startswith(("Hook", "HookBlock")):
                parent = hook
            if obj.name.startswith("Hoist_Rope"):
                parent = ropes
            attach(obj, parent)
    scene.unit_settings.scale_length = 1.0
    root["units"] = "metres"
    root["source_edition"] = "Specs-SK1265_EN.pdf legacy 60m"
    root["source_preserved"] = True
    root["support_correction"] = "Wide +Y row x=-4.885,+3.065; -Y row x=-4.615,+3.335; front cab -X"
    root["hook_pose_note"] = "Hook below maximum rated 35m: demonstration suspended position 16.24m"
    bpy.context.view_layer.update()
    original_bounds = bounds(geometry)
    tip = bpy.data.objects["Jib_TipEndPlate"]
    initial_tip = tuple(tip.matrix_world.translation)
    slew.rotation_euler.z = radians(15)
    bpy.context.view_layer.update()
    rotated_tip = tuple(tip.matrix_world.translation)
    slew.rotation_euler.z = 0
    trolley.location.x = 40.0
    bpy.context.view_layer.update()
    moved_hook = tuple(hook.matrix_world.translation)
    trolley.location.x = 30.0
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(HERE / "sk1265-at6.blend"))
    detailed_count = len(geometry)
    geometry = pack_meshes(geometry)
    for obj in scene.objects:
        obj.select_set(False)
    for obj in [root, slew, trolley, hook, ropes, *geometry]:
        obj.select_set(True)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=str(OUTPUT), export_format="GLB", use_selection=True,
                              export_yup=True, export_apply=True, export_extras=True)
    verification = {
        "asset": "sk1265-at6", "blenderVersion": bpy.app.version_string,
        "scene": scene.name, "sourceGeometryObjects": detailed_count, "exportMeshObjects": len(geometry), "meterScale": scene.unit_settings.scale_length,
        "boundsBlender": original_bounds, "tipAtZero": initial_tip, "tipAt15Degrees": rotated_tip,
        "hookAtTrolley40": moved_hook, "sourceBlend": str(SOURCE), "outputGlb": str(OUTPUT),
        "controlNodes": {"slew": "SLEW", "trolley": "TROLLEY", "hook": "HOOK", "ropes": "HOIST_ROPES"},
        "controlBaselines": {"slewDeg": 0, "trolleyM": 30, "hookHeightM": 16.24, "ropeTopM": 36.62},
        "limitations": ["Exterior visualization, not engineering assembly", "Hook maximum35m differs from chosen display pose", "No mast unfolding or jib luffing control"]}
    (HERE / "verification.json").write_text(json.dumps(verification, indent=2), encoding="utf-8")
    scene.render.resolution_x = 1440
    scene.render.resolution_y = 960
    scene.render.resolution_percentage = 100
    scene.render.filepath = str(HERE / "overview.png")
    bpy.ops.render.render(write_still=True)
    print("SK1265_DERIVED_EXPORT_SUCCESS", json.dumps(verification))


if __name__ == "__main__":
    main()
