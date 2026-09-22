# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# ─── How to run ───
# blender --background --factory-startup --python build_mobile_cranes.py
# Blender owns bpy; uv is used only for external syntax/lint checks.
"""Reproducibly produce two editable mobile cranes and measured GLB evidence."""
from __future__ import annotations

import hashlib
import json
import sys
from math import radians
from pathlib import Path
from typing import Final

import bpy

HERE: Final = Path(__file__).resolve().parent
REPO: Final = HERE.parents[3]
sys.path.insert(0, str(REPO / "resources/blender/spierings-sk1265-at6"))
sys.path.insert(0, str(HERE))

import carrier
import export_asset
import studio
import upper
import rig_catalog
import verify_rig
from configuration import CRANES, Crane, SlewEvidence
from crane_geometry import Builder


def validate_source(c: Crane, root: bpy.types.Object) -> None:
    """Check independent reference constraints in the editable source scene."""
    objects = [o for o in bpy.context.scene.objects if export_asset.belongs_to(o, root)]
    wheels = [o for o in objects if o.name.endswith("_Tire")]
    pads = [o for o in objects if o.name.endswith("_GroundPad")]
    assert len(wheels) == (4 if c.rough_terrain else 6), "Reference axle count"
    assert len(pads) == 4, "Four ground contacts"
    assert abs(max(o.location.y for o in pads) - min(o.location.y for o in pads) - (6.6 if c.rough_terrain else 6.4)) < 0.0001
    assert all(abs(o.location.z - o.dimensions.z / 2) < 0.0001 for o in pads), "Pads contact Z=0"
    pivot = bpy.data.objects["BOOM_PIVOT"]
    assert abs(pivot.rotation_euler.y + radians(50)) < 0.0001
    assert pivot.parent == bpy.data.objects["SLEW"]
    assert bpy.data.objects["HOOK"].parent == bpy.data.objects["SLEW"]
    assert all(export_asset.belongs_to(o, root) for o in pads)
    carrier_bounds = export_asset.bounds(list(bpy.data.collections["01_CARRIER"].objects))
    assert abs(carrier_bounds[0][1] + c.transport[1] / 2) < 0.0001, "Carrier left side matches selected source width"
    assert abs(carrier_bounds[1][1] - c.transport[1] / 2) < 0.0001, "Carrier right side matches selected source width"


def verify_slew() -> SlewEvidence:
    """Exercise a real 15-degree rig rotation while support pads stay fixed."""
    slew, hook = bpy.data.objects["SLEW"], bpy.data.objects["HOOK"]
    slew.rotation_mode = "XYZ"
    bpy.context.view_layer.update()
    original = hook.matrix_world.translation.copy()
    slew.rotation_euler.z = radians(15)
    bpy.context.view_layer.update()
    rotated = hook.matrix_world.translation.copy()
    expected = original.copy()
    expected.rotate(slew.rotation_euler.to_quaternion())
    assert (rotated - expected).length < 0.0001, "Hook follows actual slew axis"
    assert abs(original.z - rotated.z) < 0.0001
    slew.rotation_euler.z = 0
    bpy.context.view_layer.update()
    return {"angle_degrees": 15, "hook_displacement_m": round((rotated - original).length, 5)}


def build_one(c: Crane) -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.name = c.title
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1
    h = Builder(scene)
    h.root.name = c.slug.upper().replace("-", "_") + "_MODEL"
    for key in list(h.root.keys()):
        del h.root[key]
    h.root["model"] = c.title
    h.root["units"] = "metres; Blender Z up; local +X is boom direction"
    h.root["source"] = c.source_url
    h.root["source008_transport_dimensions_m"] = list(c.transport)
    h.root["demo_boom_length_m"] = c.boom_length
    h.root["demo_boom_elevation_degrees"] = 50.0
    h.root["support_note"] = c.support_note
    h.root["geometry_status"] = "Dimension-guided visualization; exterior profiles and small mechanisms approximate"
    h.root["runtime_controls"] = "Slew, bounded boom angle/extension and hoist; synchronized anchor-driven links"
    blue = h.materials["white"].copy()
    blue.name = "MobileCrane_Blue"
    blue.diffuse_color = (0.015, 0.16, 0.43, 1)
    next(n for n in blue.node_tree.nodes if n.type == "BSDF_PRINCIPLED").inputs[0].default_value = blue.diffuse_color
    h.materials["blue"] = blue
    carrier.build(h, c)
    upper.build(h, c)
    bpy.context.view_layer.update()
    validate_source(c, h.root)
    source_rig = verify_rig.verify(c)
    source_slew = verify_slew()
    geometry = [o for o in scene.objects if export_asset.belongs_to(o, h.root) and o.type in {"MESH", "CURVE", "FONT"}]
    source_count = len(geometry)
    source_bounds = export_asset.bounds(geometry)
    body_bounds = export_asset.bounds(list(bpy.data.collections["01_CARRIER"].objects))
    tail_bounds = export_asset.bounds([o for o in geometry if o.name.startswith("Counterweight_")])
    root_name = h.root.name
    studio.build(h, c)
    blend = HERE / f"{c.slug}.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend))
    studio.render_views(HERE / "evidence", c.slug)
    studio.render_controls(HERE / "evidence", c)
    bpy.ops.wm.open_mainfile(filepath=str(blend))
    validate_source(c, bpy.data.objects[root_name])
    glb = REPO / "public/assets/cranes" / f"{c.slug}.glb"
    glb.parent.mkdir(parents=True, exist_ok=True)
    batches = export_asset.export(glb, root_name)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(glb))
    bpy.context.view_layer.update()
    imported = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    imported_bounds = export_asset.bounds(imported)
    assert all(abs(source_bounds[end][axis] - imported_bounds[end][axis]) < 0.001
               for end in range(2) for axis in range(3)), "GLB roundtrip preserves measured geometry"
    for name in (root_name, "SLEW", "BOOM_PIVOT", "HOOK"):
        assert name in bpy.data.objects, f"Missing exported node {name}"
    assert bpy.data.objects["SLEW"].parent.name == root_name
    assert len(imported) == batches
    imported_slew = verify_slew()
    imported_rig = verify_rig.verify(c)
    rig_catalog.write(c, HERE)
    root_position = bpy.data.objects[root_name].matrix_world.translation
    assert root_position.length < 0.0001, "Model root must be ground slew origin"
    report = {
        "status": "passed", "blender_version": bpy.app.version_string,
        "model": c.title, "source008_configuration": True,
        "source_url": c.source_url, "transport_dimensions_m": c.transport,
        "demo_pose": {"boom_length_m": c.boom_length, "elevation_degrees": 50},
        "root_origin": "slew axis projected to ground, Blender +X boom/+Z up, metres",
        "blend": blend.relative_to(REPO).as_posix(), "glb": glb.relative_to(REPO).as_posix(),
        "editable_geometry_count": source_count, "exported_mesh_batches": batches,
        "source_bounds_min_max_m": source_bounds,
        "carrier_bounds_min_max_m": body_bounds,
        "counterweight_bounds_min_max_m": tail_bounds,
        "reimported_bounds_min_max_m": imported_bounds,
        "rig_nodes": [o.name for o in bpy.data.objects if o.type == "EMPTY"],
        "source_slew_test": source_slew, "reimported_slew_test": imported_slew,
        "source_articulation_test": source_rig, "reimported_articulation_test": imported_rig,
        "support_pad_centers_demo_m": c.pad_centers, "pad_square_side_m": c.pad_size,
        "support_note": c.support_note,
        "glb_bytes": glb.stat().st_size,
        "sha256": hashlib.sha256(glb.read_bytes()).hexdigest(),
        "limitations": ["Exterior visualization, no operating or load-chart claim",
                        "Source transport envelope is metadata; asset is deployed demo pose",
                        "Boom and hoist controls are bounded demo kinematics, not a load or stability model",
                        "Wheel radius, cabin profiles, section overlap, slew datum/heel XYZ are visual estimates"],
    }
    (HERE / "evidence" / f"{c.slug}-verification.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps({"model": c.slug, "status": "passed", "batches": batches, "glb_bytes": glb.stat().st_size}))


def main() -> None:
    (HERE / "evidence").mkdir(exist_ok=True)
    for crane in CRANES:
        build_one(crane)


if __name__ == "__main__":
    main()
