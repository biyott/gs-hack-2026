#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.13"
# dependencies = []
# ///
# ─── How to run ───
# blender.exe --background --factory-startup --python-exit-code 1 --python <this file>
# Uses Blender's embedded Python; only evidence files are written.
# ──────────────────
"""Capture all six control endpoints from the immutable current Maeda GLB."""
from __future__ import annotations

import hashlib
import json
import sys
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Final, TypedDict

import bpy

HERE: Final = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from pose import Pose, apply_pose
from studio import render_view, studio_setup


@dataclass(frozen=True, slots=True)
class Capture:
    name: str
    pose: Pose


class PoseRecord(TypedDict):
    boomLengthM: float
    boomAngleDeg: float
    hookHeightM: float
    slewDeg: float


class CaptureRecord(TypedDict):
    image: str
    sha256: str
    pose: PoseRecord
    measuredBoomTipBlenderM: list[float]
    measuredHookBlenderM: list[float]


CAPTURES: Final = (
    Capture("angle-min", Pose(angle=30)),
    Capture("angle-max", Pose(angle=75)),
    Capture("length-min", Pose(length=8)),
    Capture("length-max", Pose(length=10.6)),
    Capture("hoist-min", Pose(hook_height=1)),
    Capture("hoist-max", Pose(hook_height=4.5)),
)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    root = HERE.parents[4]
    glb = root / "public" / "assets" / "cranes" / "maeda-mc305.glb"
    blend = HERE / "maeda-mc305.blend"
    output = HERE / "endpoint-evidence"
    output.mkdir(exist_ok=True)
    glb_hash, blend_hash = sha256(glb), sha256(blend)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=str(glb))
    studio_setup()
    bpy.context.scene.camera.data.ortho_scale = 16.2
    camera_position = (16.0, -24.0, 13.0)
    camera_aim = (2.4, 0.0, 5.1)
    records: list[CaptureRecord] = []
    for capture in CAPTURES:
        apply_pose(capture.pose)
        image = output / f"{capture.name}.png"
        render_view(image, camera_position, camera_aim)
        record: CaptureRecord = {
            "image": image.relative_to(root).as_posix(),
            "sha256": sha256(image),
            "pose": {
                "boomLengthM": capture.pose.length,
                "boomAngleDeg": capture.pose.angle,
                "hookHeightM": capture.pose.hook_height,
                "slewDeg": capture.pose.slew,
            },
            "measuredBoomTipBlenderM": list(bpy.data.objects["BOOM_TIP"].matrix_world.translation),
            "measuredHookBlenderM": list(bpy.data.objects["HOOK"].matrix_world.translation),
        }
        records.append(record)
        print("ENDPOINT_CAPTURE " + json.dumps(record), flush=True)
    assert sha256(glb) == glb_hash
    assert sha256(blend) == blend_hash
    evidence = {
        "assetId": "maeda-mc305",
        "capturedAt": datetime.now(UTC).isoformat(),
        "blenderVersion": bpy.app.version_string,
        "captureMethod": "independent GLB import; existing pose.py driver; Cycles24 samples; fixed camera for all six control endpoints",
        "glbPath": glb.relative_to(root).as_posix(),
        "glbSha256BeforeAndAfter": glb_hash,
        "sourcePath": blend.relative_to(root).as_posix(),
        "sourceSha256BeforeAndAfter": blend_hash,
        "sourceAndGlbUnchanged": True,
        "cameraPositionBlenderM": camera_position,
        "cameraTargetBlenderM": camera_aim,
        "orthographicScale": 16.2,
        "resolution": [1400, 1100],
        "renders": records,
    }
    (output / "evidence.json").write_text(json.dumps(evidence, indent=2) + "\n", encoding="utf-8")
    print("ENDPOINT_RENDER_PASS six captures; source and GLB hashes unchanged", flush=True)


if __name__ == "__main__":
    main()
