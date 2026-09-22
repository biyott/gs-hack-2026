# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# ─── How to run ───
# Called automatically by build_assets.py in reopened Blend and reimported GLB.
"""Check actual geometry, hierarchy and paired rig movement at both asset boundaries."""
from __future__ import annotations

import json
from math import radians
from pathlib import Path

import bpy
from mathutils import Vector


def mesh_points(root: bpy.types.Object) -> list[Vector]:
    """Measure transformed mesh vertices rather than loose rotated object boxes."""
    return [obj.matrix_world @ vertex.co for obj in root.children_recursive
            if obj.type == "MESH" for vertex in obj.data.vertices]


def position(node: bpy.types.Object) -> Vector:
    return node.matrix_world.translation.copy()


def check_motions(tower: bool) -> list[str]:
    """Exercise and restore slew, trolley and paired hook/rope movement."""
    slew, hook, ropes = (bpy.data.objects[name] for name in ("SLEW", "HOOK", "HOIST_ROPES"))
    slew.rotation_mode = "XYZ"
    motions = ["slew_z_rotation", "hook_z_translation_with_paired_ropes_z_scale"]
    original = position(hook)
    center = position(slew)
    slew.rotation_euler.z += radians(90)
    bpy.context.view_layer.update()
    changed = position(hook) - center
    offset = original - center
    assert (changed - Vector((-offset.y, offset.x, offset.z))).length < 0.002
    slew.rotation_euler.z -= radians(90)
    bpy.context.view_layer.update()
    if tower:
        trolley = bpy.data.objects["TROLLEY"]
        assert hook.parent == trolley and ropes.parent == trolley
        hook_start, rope_start = position(hook), position(ropes)
        trolley.location.x += 5
        bpy.context.view_layer.update()
        assert (position(hook) - hook_start - Vector((5, 0, 0))).length < 0.002
        assert (position(ropes) - rope_start - Vector((5, 0, 0))).length < 0.002
        trolley.location.x -= 5
        bpy.context.view_layer.update()
        motions.append("trolley_x_translation_including_hook_and_ropes")
    top = position(ropes)
    start = position(hook)
    rest = float(ropes["rest_length_m"])
    hook.location.z += 2
    ropes.scale.z = (rest - 2) / rest
    bpy.context.view_layer.update()
    assert (position(hook) - start - Vector((0, 0, 2))).length < 0.002
    assert (position(ropes) - top).length < 0.002
    rope_bottom = ropes.matrix_world @ Vector((0, 0, -rest))
    attachment = float(ropes.get("hook_attachment_local_z_m", 0))
    assert (rope_bottom - position(hook) - Vector((0, 0, attachment))).length < 0.002
    hook.location.z -= 2
    ropes.scale.z = 1
    bpy.context.view_layer.update()
    return motions


def verify(crane_id: str, stage: str) -> None:
    """Persist assertions plus actual measurable evidence for this boundary."""
    root = bpy.data.objects["ROOT"]
    bpy.context.view_layer.update()
    assert position(root).length < 0.0001
    assert tuple(round(value, 6) for value in root.scale) == (1, 1, 1)
    tower = crane_id == "172ecb"
    assert root["units"] == "metres"
    required = ["ROOT", "SLEW", "HOOK", "HOIST_ROPES"]
    if tower:
        required.append("TROLLEY")
        assert abs(float(root["hook_height_limit_m"]) - 42.3) < 0.001
    else:
        assert abs(float(root["boom_length_m"]) - 32) < 0.001
        assert root["fixed_jib"] == 0
        from verify_lr_rig import verify_luff
        verify_luff(stage)
        required.extend(["BOOM_PIVOT", "BOOM_TIP", "BOOM_PENDANT_LEFT", "BOOM_PENDANT_RIGHT",
                         "BOOM_PENDANT_ANCHOR_LEFT", "BOOM_PENDANT_ANCHOR_RIGHT",
                         "BOOM_PENDANT_ATTACH_LEFT", "BOOM_PENDANT_ATTACH_RIGHT"])
    motions = check_motions(tower) if tower else ["slew_z_rotation", "hook_height_with_endpoint_links"]
    if not tower:
        motions.append("boom_luff_with_reanchored_hoist_and_suspension_lines")
    points = mesh_points(root)
    minimum = [round(min(point[i] for point in points), 5) for i in range(3)]
    maximum = [round(max(point[i] for point in points), 5) for i in range(3)]
    assert minimum[2] > -0.08
    assert maximum[2] > (44 if tower else 29)
    if tower:
        assert abs(maximum[0] - 51.5) < 0.20
        assert abs(minimum[0] + 14.5) < 0.20
    else:
        assert abs(maximum[1] - minimum[1] - 5.535) < 0.02
    meshes = [obj for obj in root.children_recursive if obj.type == "MESH"]
    report = {
        "status": "passed", "boundary": stage, "crane_id": crane_id,
        "blender_version": bpy.app.version_string, "mesh_count": len(meshes),
        "vertex_count": sum(len(obj.data.vertices) for obj in meshes),
        "bounds_min_m": minimum, "bounds_max_m": maximum,
        "verified_motions": motions,
        "nodes": [{"name": name, "parent": bpy.data.objects[name].parent.name
                   if bpy.data.objects[name].parent else None,
                   "local_position": list(bpy.data.objects[name].location),
                   "world_position": list(position(bpy.data.objects[name]))} for name in required],
        "runtime_glTF_axis_mapping": {"blender_Z": "glTF_Y", "blender_X": "glTF_X"},
    }
    out = Path(__file__).resolve().parent / f"liebherr-{crane_id}-{stage}.json"
    out.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report))
