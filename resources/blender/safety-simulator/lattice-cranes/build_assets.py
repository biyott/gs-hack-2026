# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# ─── How to run ───
# blender --background --factory-startup --python build_assets.py -- lr1100
# blender --background --factory-startup --python build_assets.py -- 172ecb
"""Build, save, export, reopen, render and reimport each lattice-crane asset."""
from __future__ import annotations

import json
import sys
from pathlib import Path

import bpy

BASE = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE))
from crawler_geometry import build_crawler
from export_asset import export_glb
from geometry import Builder
from studio import stage
from verify_assets import verify


def main() -> None:
    """Use one isolated Blender process per crane and retain reproducible evidence."""
    crane_id = sys.argv[sys.argv.index("--") + 1]
    tower = crane_id == "172ecb"
    if tower:
        from tower_geometry import build_tower
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.name = "Liebherr_" + crane_id
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    builder = Builder(scene)
    root = build_tower(builder) if tower else build_crawler(builder)
    root["source_document"] = "Archived emul008 selected configuration"
    root["units"] = "metres"
    root["local_axes"] = "+X boom; +Z up; ground slew origin"
    root["appearance_status"] = "Source-dimensioned visual reconstruction; not manufacturer CAD"
    root["rig_motion_contract"] = "SLEW Z; HOOK Z with paired HOIST_ROPES Z scale; TROLLEY X on tower"
    if not tower:
        root["rig_motion_contract"] = "liebherr-lr1100-rig.json: fixed-length luffing and endpoint links"
        root["articulation_json"] = json.dumps(json.loads((BASE / "liebherr-lr1100-rig.json").read_text())["articulation"])
    stage(builder, tower)
    bpy.context.view_layer.update()
    blend = BASE / f"liebherr-{crane_id}.blend"
    glb = BASE.parents[3] / "public" / "assets" / "cranes" / f"liebherr-{crane_id}.glb"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend))
    export_glb(root, glb)
    bpy.ops.wm.open_mainfile(filepath=str(blend))
    verify(crane_id, "blend-reopen")
    if "--skip-source-renders" not in sys.argv:
        for view in ("overview", "side", "detail"):
            bpy.context.scene.camera = bpy.data.objects["Camera_" + view]
            bpy.context.scene.render.filepath = str(BASE / f"liebherr-{crane_id}-{view}.png")
            bpy.ops.render.render(write_still=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(glb))
    verify(crane_id, "glb-reimport")
    stage(Builder(bpy.context.scene), tower)
    bpy.context.scene.render.filepath = str(BASE / f"liebherr-{crane_id}-glb-overview.png")
    bpy.ops.render.render(write_still=True)
    if not tower:
        from lr_rig import Pose, apply_pose
        for label, angle, height in (("min", 45.0, 22.0), ("max", 70.0, 2.0)):
            apply_pose(Pose(angle, height, 0))
            bpy.context.scene.render.filepath = str(BASE / f"liebherr-lr1100-glb-luff-{label}.png")
            bpy.ops.render.render(write_still=True)
        apply_pose(Pose())
    print(f"LATTICE_ASSET_PASSED {crane_id}: {blend} | {glb}")


if __name__ == "__main__":
    main()
