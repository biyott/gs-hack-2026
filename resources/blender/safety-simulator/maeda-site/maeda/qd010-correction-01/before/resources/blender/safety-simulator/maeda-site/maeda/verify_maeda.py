#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.13"
# dependencies = []
# ///
# ─── How to run ───
# blender.exe --background --factory-startup --python <this file>
# Blender supplies bpy. The script reopens source and reimports the exported GLB.
# ──────────────────
"""Reopen source, validate imported geometry and motion, then render evidence."""
from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import TypedDict

import bpy

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from studio import render_view, studio_setup
from verify_rig import verify_all_controls


class Bounds(TypedDict):
    min: list[float]
    max: list[float]
    size: list[float]


def bounds(meshes: list[bpy.types.Object]) -> Bounds:
    points = [obj.matrix_world @ vertex.co for obj in meshes for vertex in obj.data.vertices]
    lower = [min(point[axis] for point in points) for axis in range(3)]
    upper = [max(point[axis] for point in points) for axis in range(3)]
    return {"min": lower, "max": upper, "size": [upper[i] - lower[i] for i in range(3)]}


def close(actual: float, expected: float) -> None:
    assert abs(actual - expected) < 0.001, (actual, expected)


def main() -> None:
    source_path = HERE / "maeda-mc305.blend"
    bpy.ops.wm.open_mainfile(filepath=str(source_path))
    source_count = len(bpy.context.scene.objects)
    assert source_count > 200
    source_root = bpy.data.objects["MAEDA_ROOT"]
    close(source_root.location.length, 0)
    assert tuple(source_root.scale) == (1, 1, 1)
    body_bounds = bounds([obj for obj in bpy.context.scene.objects if obj.type == "MESH" and obj.name.startswith(("Track", "Tread", "Carrier"))])
    close(body_bounds["size"][1], 1.280)
    tail_bounds = bounds([bpy.data.objects["Compact_counterweight"]])
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    glb = HERE.parents[4] / "public" / "assets" / "cranes" / "maeda-mc305.glb"
    bpy.ops.import_scene.gltf(filepath=str(glb))
    bpy.context.view_layer.update()
    root = bpy.data.objects["MAEDA_ROOT"]
    close(root.location.length, 0)
    assert tuple(root.scale) == (1, 1, 1)
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    pads = [obj for obj in meshes if obj.name.startswith("PAD_")]
    assert len(pads) == 4
    all_bounds = bounds(meshes)
    pad_bounds = bounds(pads)
    front_bounds = bounds([obj for obj in pads if "FRONT" in obj.name])
    rear_bounds = bounds([obj for obj in pads if "REAR" in obj.name])
    close(pad_bounds["size"][0], 5.170)
    close(front_bounds["size"][1], 4.808)
    close(rear_bounds["size"][1], 4.704)
    close(pad_bounds["min"][2], 0)
    tip = bpy.data.objects["BOOM_TIP"]
    hook = bpy.data.objects["HOOK"]
    tip_before = tip.matrix_world.translation.copy()
    hook_before = hook.matrix_world.translation.copy()
    motion_report = verify_all_controls()
    report = {
        "assetId": "maeda-mc305", "sourceReopened": True, "sourceObjects": source_count,
        "glbReimported": True, "runtimeObjects": len(bpy.context.scene.objects), "meshCount": len(meshes),
        "coordinateSystemVerified": "Blender XY/Zup; standard glTF Y-up; root ground, unit scale, +X boom",
        "boundsBlenderMeters": all_bounds, "padOuterBoundsMeters": pad_bounds,
        "bodyBoundsMeters": body_bounds, "tailBoundsMeters": tail_bounds,
        "padFrontWidthMeters": front_bounds["size"][1], "padRearWidthMeters": rear_bounds["size"][1],
        "triangleCount": sum(sum(len(face.vertices) - 2 for face in obj.data.polygons) for obj in meshes),
        "sourceFile": str(source_path), "glbFile": str(glb), "glbBytes": glb.stat().st_size,
        "demoPose": {"boomLengthMeters": 10, "boomAngleDegrees": 55, "boomTipMeters": list(tip_before), "hookReferenceMeters": list(hook_before)},
        "motionVerification": motion_report,
        "officialTransportMeters": [4.110, 1.280, 1.695],
        "officialIndependentMaxima": {"radiusMeters": 12.16, "hookHeightMeters": 12.52},
        "approximations": ["not a CAD replica", "10m boom at55deg with hook3m is selected demo pose", "pad centers inferred using assumed0.28m square pads, official OUTER envelope retained", "track/body/detail dimensions are visual approximations", "kinematic limits preserve overlap and clearance; not certified manufacturer working ranges"],
        "nodes": sorted(obj.name for obj in bpy.context.scene.objects),
    }
    (HERE / "verification.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    studio_setup()
    bpy.context.scene.camera.data.ortho_scale = 14.2
    render_view(HERE / "maeda-overview.png", (16, -22, 14), (1.7, 0, 4.5))
    render_view(HERE / "maeda-side.png", (1.7, -24, 6.3), (1.7, 0, 4.5))
    bpy.context.scene.camera.data.ortho_scale = 6.1
    render_view(HERE / "maeda-carrier-detail.png", (9, -11, 6.7), (0, 0, 0.65))
    print("MAEDA_VERIFICATION_PASS " + json.dumps(report))


if __name__ == "__main__":
    main()
