# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# ─── How to run ───
# Imported inside Blender by build_mobile_cranes.py and verify_rig.py.
"""Bounded mobile-crane kinematics and the exact glTF articulation contract."""
from __future__ import annotations

from dataclasses import dataclass
from math import isfinite, radians
from typing import Literal, TypedDict

import bpy
from mathutils import Vector

from configuration import Crane


@dataclass(frozen=True, slots=True)
class Pose:
    length_m: float
    angle_degrees: float
    hook_height_m: float


class InvalidPoseError(ValueError):
    def __init__(self, pose: Pose) -> None:
        super().__init__(f"Pose is outside the bounded demo controls: {pose}")


class SegmentContract(TypedDict):
    node: str
    axis: Literal["x"]
    lengthShare: float


class BoomContract(TypedDict):
    pivotNode: str
    axis: Literal["z"]
    angleSign: int
    tipNode: str
    segments: list[SegmentContract]


class HookContract(TypedDict):
    node: str
    tipNode: str


class LinkContract(TypedDict):
    node: str
    fromNode: str
    toNode: str
    startFraction: float
    endFraction: float
    axis: Literal["y"]
    restLengthM: int
    origin: Literal["start"]


class ArticulationContract(TypedDict):
    boom: BoomContract
    hook: HookContract
    links: list[LinkContract]


def articulation() -> ArticulationContract:
    """Declare renderer-consumed names, axes and normalized link fractions."""
    return {
        "boom": {"pivotNode": "BOOM_PIVOT", "axis": "z", "angleSign": 1,
                 "tipNode": "BOOM_TIP", "segments": [
                     {"node": f"TELESCOPIC_{i}", "axis": "x", "lengthShare": 1 / 3}
                     for i in range(1, 4)]},
        "hook": {"node": "HOOK", "tipNode": "BOOM_TIP"},
        "links": [
            {"node": "HOIST_ROPES", "fromNode": "HOOK_ATTACH", "toNode": "BOOM_ROPE_TOP",
             "startFraction": 0, "endFraction": 1, "axis": "y", "restLengthM": 1, "origin": "start"},
            {"node": "RAM_BARREL", "fromNode": "RAM_BASE", "toNode": "BOOM_RAM_ANCHOR",
             "startFraction": 0, "endFraction": 0.55, "axis": "y", "restLengthM": 1, "origin": "start"},
            {"node": "RAM_ROD", "fromNode": "RAM_BASE", "toNode": "BOOM_RAM_ANCHOR",
             "startFraction": 0.55, "endFraction": 1, "axis": "y", "restLengthM": 1, "origin": "start"},
        ],
    }


def section_length(c: Crane) -> float:
    return 8.95 if c.rough_terrain else 11.0


def length_range(c: Crane) -> tuple[float, float]:
    return (18.0, 24.0) if c.rough_terrain else (24.0, 30.0)


def baseline(c: Crane) -> Pose:
    return Pose(c.boom_length, 50.0, 4.2)


def apply_pose(c: Crane, pose: Pose) -> None:
    """Update all coupled moving parts using actual anchor world transforms."""
    minimum, maximum = length_range(c)
    if not (all(isfinite(v) for v in (pose.length_m, pose.angle_degrees, pose.hook_height_m))
            and minimum <= pose.length_m <= maximum and 35 <= pose.angle_degrees <= 65
            and 3 <= pose.hook_height_m <= 10):
        raise InvalidPoseError(pose)
    pivot = bpy.data.objects["BOOM_PIVOT"]
    pivot.rotation_mode = "XYZ"
    pivot.rotation_euler.y = -radians(pose.angle_degrees)
    step = (pose.length_m - section_length(c)) / 3
    for index in range(1, 4):
        bpy.data.objects[f"TELESCOPIC_{index}"].location.x = step
    bpy.context.view_layer.update()
    slew = bpy.data.objects["SLEW"]
    inverse = slew.matrix_world.inverted()
    tip = inverse @ bpy.data.objects["BOOM_TIP"].matrix_world.translation
    bpy.data.objects["HOOK"].location = (tip.x, tip.y, pose.hook_height_m)
    bpy.context.view_layer.update()
    for link in articulation()["links"]:
        node = bpy.data.objects[link["node"]]
        parent_inverse = node.parent.matrix_world.inverted()
        a = parent_inverse @ bpy.data.objects[link["fromNode"]].matrix_world.translation
        b = parent_inverse @ bpy.data.objects[link["toNode"]].matrix_world.translation
        delta = b - a
        start = a + delta * link["startFraction"]
        end = a + delta * link["endFraction"]
        node.location = start
        node.rotation_mode = "QUATERNION"
        node.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(end - start)
        node.scale = (1, 1, (end - start).length)
    bpy.context.view_layer.update()
