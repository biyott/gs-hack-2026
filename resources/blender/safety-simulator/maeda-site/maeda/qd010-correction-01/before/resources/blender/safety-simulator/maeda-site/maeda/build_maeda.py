#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.13"
# dependencies = []
# ///
# ─── How to run ───
# Windows Blender 5.2: blender.exe --background --factory-startup --python <this file>
# bpy is provided by Blender's bundled Python runtime; do not install a second bpy.
# ──────────────────
"""Build and save the editable 1:1 MC305C-5 study, then export its runtime GLB."""
from __future__ import annotations

import sys
from pathlib import Path

import bpy

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from geometry import CHROME, DARK_TEAL, RUBBER, STEEL, TEAL, WHITE, YELLOW, empty, material
from superstructure import make_upper
from undercarriage import make_outriggers, make_tracks


def optimize_export() -> None:
    """Keep editable geometry in the .blend and batch GLB meshes by material/rig parent."""
    bpy.ops.object.select_all(action="DESELECT")
    for obj in list(bpy.context.scene.objects):
        if obj.type in {"FONT", "CURVE"}:
            obj.select_set(True)
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.convert(target="MESH")
            obj.select_set(False)
    for parent in [obj for obj in bpy.context.scene.objects if obj.type == "EMPTY"]:
        for mat in bpy.data.materials:
            members = [obj for obj in parent.children if obj.type == "MESH" and not obj.name.startswith("PAD_") and obj.active_material == mat]
            if members:
                bpy.ops.object.select_all(action="DESELECT")
                for obj in members:
                    obj.select_set(True)
                bpy.context.view_layer.objects.active = members[0]
                for obj in members:
                    bpy.context.view_layer.objects.active = obj
                    bpy.ops.object.convert(target="MESH")
                bpy.context.view_layer.objects.active = members[0]
                bpy.ops.object.join()
                members[0].name = f"{parent.name}_{mat.name.replace(' ', '_')}_BATCH"


def main() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1
    for name, finish in (("Maeda Teal", TEAL), ("Dark Teal", DARK_TEAL), ("Rubber", RUBBER), ("Steel", STEEL), ("Chrome", CHROME), ("Lettering", WHITE), ("Warning Yellow", YELLOW)):
        material(name, finish)
    root = empty("MAEDA_ROOT")
    root["assetId"] = "maeda-mc305"
    root["manufacturerModel"] = "Maeda MC305C-5"
    root["unit"] = "meter"
    root["origin"] = "ground projection of slew axis"
    root["zeroHeading"] = "+X"
    root["pose"] = "demo boom10.0m angle55deg; independent of published maxima"
    root["rigVersion"] = "2.0.0"
    root["supportedControls"] = ["slew", "boomAngle", "boomLength", "hookHeight"]
    root["transportEnvelopeMeters"] = [4.110, 1.280, 1.695]
    root["officialPadOuterMeters"] = [5.170, 4.808, 4.704]
    make_tracks(root)
    make_outriggers(root)
    make_upper(root)
    for obj in bpy.context.scene.objects:
        obj.select_set(False)
    root.select_set(True)
    bpy.context.view_layer.objects.active = root
    bpy.ops.wm.save_as_mainfile(filepath=str(HERE / "maeda-mc305.blend"))
    source_objects = len(scene.objects)
    optimize_export()
    bpy.ops.object.select_all(action="SELECT")
    destination = HERE.parents[4] / "public" / "assets" / "cranes" / "maeda-mc305.glb"
    destination.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=str(destination), export_format="GLB", export_yup=True, use_selection=True, export_extras=True, export_animations=False)
    print(f"ASSET_BUILT path={destination} source_objects={source_objects} export_objects={len(scene.objects)}")


if __name__ == "__main__":
    main()
