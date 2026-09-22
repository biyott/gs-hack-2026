#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.13"
# dependencies = []
# ///
# Run ONLY with a QA serial grant: qd010-correction-01/run-producer.sh
"""One isolated Blender process: old RED, corrected build, checks and 3 views."""
from __future__ import annotations

import hashlib
import json
import os
import shutil
import sys
from datetime import UTC, datetime
from pathlib import Path
from typing import Final, TypedDict

import bpy

HERE: Final = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from verify_shapes import inspect_source_shapes, verify_source_shapes
from verify_static_geometry import snapshot_static_geometry, verify_static_geometry

EVIDENCE: Final = HERE / "qd010-correction-01"
ROOT: Final = HERE.parents[4]
SOURCE: Final = HERE / "maeda-mc305.blend"
GLB: Final = ROOT / "public/assets/cranes/maeda-mc305.glb"


class Artifact(TypedDict):
    path: str
    bytes: int
    sha256: str


class Receipt(TypedDict):
    nativeWindowsPid: int
    startedUtc: str
    endedUtc: str | None
    status: str
    completedPhases: list[str]
    error: str | None
    artifacts: list[Artifact]


def utc_now() -> str:
    return datetime.now(UTC).isoformat()


def write_receipt(receipt: Receipt) -> None:
    (EVIDENCE / "execution-receipt.json").write_text(json.dumps(receipt, indent=2), encoding="utf-8")


def record_phase(receipt: Receipt, phase: str) -> None:
    receipt["completedPhases"].append(phase)
    write_receipt(receipt)
    print("QD010_PHASE " + phase, flush=True)


def execute(receipt: Receipt) -> None:
    """Stop on an unexpected old result or any corrected conformance failure."""
    import build_maeda
    import verify_maeda

    old_source = EVIDENCE / "before" / SOURCE.relative_to(ROOT)
    bpy.ops.wm.open_mainfile(filepath=str(old_source))
    bpy.context.view_layer.update()
    measured = inspect_source_shapes()
    try:
        verify_source_shapes()
    except AssertionError as error:
        assert measured["principalShellCount"] == 4 and measured["movingStageCount"] == 3, measured
        measured["status"] = "expected-red"
        measured["assertions"] = ["actual four physical sections fail independent required five", "actual three moving stages fail independent required four", str(error)]
    else:
        raise AssertionError("Preserved C4 unexpectedly passed the independent five-shell oracle")
    (EVIDENCE / "old-source-red.json").write_text(json.dumps(measured, indent=2), encoding="utf-8")
    before = snapshot_static_geometry()
    (EVIDENCE / "old-static-geometry.json").write_text(json.dumps(before), encoding="utf-8")
    record_phase(receipt, "preserved-source-expected-red")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.preferences.filepaths.save_version = 0
    bpy.context.scene.world = bpy.data.worlds.new("World")
    build_maeda.main()
    record_phase(receipt, "corrected-source-conformance-and-export")
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
    after = snapshot_static_geometry()
    verify_static_geometry(before, after)
    (EVIDENCE / "corrected-static-geometry.json").write_text(json.dumps(after), encoding="utf-8")
    (EVIDENCE / "static-preservation.json").write_text(json.dumps({"status": "passed", "sourceMeshCount": len(before["meshes"]), "localVertices": "exactly equal", "polygonTopology": "exactly equal", "worldTransformTolerance": 0.000001, "excludedArticulatedAncestors": ["BOOM_PIVOT", "HOOK", "HOIST_ROPE_1", "HOIST_ROPE_2", "LIFT_BARREL", "LIFT_PISTON"]}, indent=2), encoding="utf-8")
    record_phase(receipt, "unchanged-source-body-support-tail-geometry")
    verify_maeda.main()
    shutil.copyfile(HERE / "verification.json", EVIDENCE / "verification.json")
    record_phase(receipt, "source-and-import-shapes-48-poses-three-renders")


def main() -> None:
    EVIDENCE.mkdir(exist_ok=True)
    receipt: Receipt = {"nativeWindowsPid": os.getpid(), "startedUtc": utc_now(), "endedUtc": None, "status": "running", "completedPhases": [], "error": None, "artifacts": []}
    write_receipt(receipt)
    try:
        execute(receipt)
        receipt["status"] = "passed"
    finally:
        receipt["endedUtc"] = utc_now()
        if receipt["status"] != "passed":
            receipt["status"] = "failed"
            receipt["error"] = str(sys.exception())
        paths = [SOURCE, GLB, HERE / "verification.json", HERE / "maeda-overview.png", HERE / "maeda-side.png", HERE / "maeda-carrier-detail.png", EVIDENCE / "old-source-red.json", EVIDENCE / "source-conformance.json", EVIDENCE / "imported-conformance.json", EVIDENCE / "static-preservation.json"]
        receipt["artifacts"] = [{"path": str(path), "bytes": path.stat().st_size, "sha256": hashlib.sha256(path.read_bytes()).hexdigest()} for path in paths if path.exists()]
        write_receipt(receipt)
    print("QD010_CORRECTION_PASS " + json.dumps(receipt), flush=True)


if __name__ == "__main__":
    main()
