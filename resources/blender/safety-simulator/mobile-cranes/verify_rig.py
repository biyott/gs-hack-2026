# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# ─── How to run ───
# Called for both the original Blender source and its actual GLB reimport.
"""Analytical endpoint checks across all min/mid/max demo control combinations."""
from __future__ import annotations

from itertools import product
from math import cos, isfinite, radians, sin
from typing import TypedDict

import bpy
from mathutils import Vector

from configuration import Crane
from export_asset import bounds
from rig_controls import InvalidPoseError, Pose, apply_pose, articulation, baseline, length_range, section_length


class RigEvidence(TypedDict):
    tested_pose_count: int
    invalid_pose_rejections: int
    minimum_rope_length_m: float
    minimum_section_overlap_m: float
    maximum_tip_error_m: float
    maximum_link_endpoint_error_m: float
    static_chassis_bounds_preserved: bool
    cases: list[list[float]]


def verify(c: Crane) -> RigEvidence:
    """Use measured world matrices, including exported link scale/orientation."""
    required = {"SLEW", "BOOM_PIVOT", "BOOM_TIP", "BOOM_AXIS_TIP", "BOOM_ROPE_TOP",
                "HOOK", "HOOK_ATTACH", "HOIST_ROPES", "RAM_BASE", "BOOM_RAM_ANCHOR",
                "RAM_BARREL", "RAM_ROD", "TELESCOPIC_1", "TELESCOPIC_2", "TELESCOPIC_3"}
    assert required <= set(bpy.data.objects.keys()), "Articulation nodes must survive export"
    graph = bpy.context.evaluated_depsgraph_get()
    for link in articulation()["links"]:
        node = bpy.data.objects[link["node"]]
        local_z: list[float] = []
        for child in node.children:
            evaluated = child.evaluated_get(graph)
            mesh = evaluated.to_mesh()
            matrix = node.matrix_world.inverted() @ child.matrix_world
            local_z.extend((matrix @ vertex.co).z for vertex in mesh.vertices)
            evaluated.to_mesh_clear()
        assert abs(min(local_z)) < 0.0001 and abs(max(local_z) - 1) < 0.0001, "Link geometry must remain normalized 0..1"
    slew = bpy.data.objects["SLEW"]
    carrier = [o for o in bpy.context.scene.objects if o.parent == slew.parent and o.type in {"MESH", "CURVE", "FONT"}]
    fixed_bounds = bounds(carrier)
    low, high = length_range(c)
    poses = [Pose(length, angle, height) for length, angle, height in
             product((low, (low + high) / 2, high), (35.0, 50.0, 65.0), (3.0, 6.5, 10.0))]
    minimum_rope, minimum_overlap, tip_error, link_error = float("inf"), float("inf"), 0.0, 0.0
    for pose in poses:
        apply_pose(c, pose)
        inverse = slew.matrix_world.inverted()
        nominal = Vector(c.pivot) + Vector((pose.length_m * cos(radians(pose.angle_degrees)), 0,
                                           pose.length_m * sin(radians(pose.angle_degrees))))
        axis_tip = inverse @ bpy.data.objects["BOOM_AXIS_TIP"].matrix_world.translation
        tip_error = max(tip_error, (axis_tip - nominal).length)
        assert tip_error < 0.0001, "Nominal boom length and elevation match measured tip"
        expected_tip = nominal + Vector((0.05 * sin(radians(pose.angle_degrees)), 0,
                                        -0.05 * cos(radians(pose.angle_degrees))))
        tip = inverse @ bpy.data.objects["BOOM_TIP"].matrix_world.translation
        assert (tip - expected_tip).length < 0.0001, "Physical sheave offset follows boom"
        hook = inverse @ bpy.data.objects["HOOK"].matrix_world.translation
        assert abs(hook.x - tip.x) < 0.0001 and abs(hook.y - tip.y) < 0.0001
        assert abs(hook.z - pose.hook_height_m) < 0.0001
        assert hook.z - 1.095 > 0, "Complete curved hook stays above ground"
        rope_length = tip.z - hook.z - 0.4
        assert rope_length > 0, "Vertical rope always has positive length"
        minimum_rope = min(minimum_rope, rope_length)
        step = (pose.length_m - section_length(c)) / 3
        overlap = section_length(c) - step
        assert 0 < step < section_length(c), "All telescopic sections retain overlap"
        minimum_overlap = min(minimum_overlap, overlap)
        for index in range(1, 4):
            segment = bpy.data.objects[f"TELESCOPIC_{index}"]
            expected_parent = "BOOM_PIVOT" if index == 1 else f"TELESCOPIC_{index - 1}"
            assert segment.parent.name == expected_parent and abs(segment.location.x - step) < 0.0001
        for link in articulation()["links"]:
            a = bpy.data.objects[link["fromNode"]].matrix_world.translation
            delta = bpy.data.objects[link["toNode"]].matrix_world.translation - a
            node = bpy.data.objects[link["node"]]
            for fraction, unit_z in ((link["startFraction"], 0), (link["endFraction"], 1)):
                measured = node.matrix_world @ Vector((0, 0, unit_z))
                error = (measured - (a + delta * fraction)).length
                link_error = max(link_error, error)
                assert error < 0.0001, "Normalized link endpoint matches actual anchor"
            assert all(isfinite(v) for row in node.matrix_world for v in row)
        assert bounds(carrier) == fixed_bounds, "Controls must not move carrier or supports"
    rejected = 0
    for pose in (Pose(low - 0.01, 50, 4.2), Pose(high + 0.01, 50, 4.2),
                 Pose(c.boom_length, 34.99, 4.2), Pose(c.boom_length, 65.01, 4.2),
                 Pose(c.boom_length, 50, 2.99), Pose(c.boom_length, 50, 10.01),
                 Pose(float("nan"), 50, 4.2), Pose(float("inf"), 50, 4.2)):
        try:
            apply_pose(c, pose)
        except InvalidPoseError:
            rejected += 1
    assert rejected == 8, "Invalid controls must be rejected before scene mutation"
    apply_pose(c, baseline(c))
    return {"tested_pose_count": len(poses), "invalid_pose_rejections": rejected,
            "minimum_rope_length_m": round(minimum_rope, 6),
            "minimum_section_overlap_m": round(minimum_overlap, 6),
            "maximum_tip_error_m": round(tip_error, 8),
            "maximum_link_endpoint_error_m": round(link_error, 8),
            "static_chassis_bounds_preserved": True,
            "cases": [[p.length_m, p.angle_degrees, p.hook_height_m] for p in poses]}
