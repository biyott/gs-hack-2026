# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# ─── How to run ───
# Blender supplies bpy; run with its embedded Python, not standalone uv:
# blender --background --factory-startup --python verify.py
"""Verify the saved source and independent GLB import against the site contract."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Final

import bpy

HERE: Final = Path(__file__).resolve().parent
ROOT: Final = HERE.parents[4]
GLB: Final = ROOT / "public/assets/site/hvo-demo.glb"
EXPECTED: Final = {
    "SITE_SLAB": ((0, 0, -0.3), (140, 50, 0)),
    "REGION__WORK-AREA": ((15, 12, 0.012), (100, 38, 0.028)),
    "REGION__STOCK": ((55, 17, 0.03), (75, 29, 0.048)),
    "REGION__DESTINATION": ((80, 17, 0.03), (95, 29, 0.048)),
    "REGION__OBSTACLE-01": ((105, 18, 0), (120, 30, 6)),
    "REGION__PATH-A": ((8, 6, 0.012), (132, 10, 0.028)),
    "REGION__PATH-B": ((8, 40, 0.012), (132, 44, 0.028)),
    "REGION__REFUGE-01": ((123.5, 6.5, 0.03), (126.5, 9.5, 0.05)),
    "REGION__REFUGE-02": ((123.5, 40.5, 0.03), (126.5, 43.5, 0.05)),
}


def bounds(objects: list[bpy.types.Object]) -> list[list[float]]:
    """Measure transformed mesh vertices in Blender XYZ metres."""
    corners = [
        obj.matrix_world @ vertex.co for obj in objects for vertex in obj.data.vertices
    ]
    return [
        [round(fn(v[a] for v in corners), 5) for a in range(3)] for fn in (min, max)
    ]


def check_contract() -> None:
    """Require region dimensions independent of whichever script built the asset."""
    bpy.context.view_layer.update()
    root = bpy.data.objects["SITE_ROOT"]
    assert list(root.scale) == [1, 1, 1], "Root must stay at metre scale"
    assert root["synthetic"] is True, "Synthetic provenance must survive export"
    for name, expected in EXPECTED.items():
        region = bpy.data.objects[name]
        actual = bounds([region])
        for corner in range(2):
            for axis in range(3):
                assert abs(actual[corner][axis] - expected[corner][axis]) < 0.001, (
                    name,
                    actual,
                )
        if name.startswith("REGION__"):
            assert region["regionId"] == name.removeprefix("REGION__"), name
    prohibited = ("EQUIPMENT_ROOT", "WORKER_1", "WORKER_2", "SLEW", "HAZARD", "ROUTE")
    assert all(name not in bpy.data.objects for name in prohibited)


def main() -> None:
    """Given independent expected bounds, reopen both artifacts and compare them."""
    # Given: actual editable source and exported artifact, not a mocked mesh.
    source = HERE / "hvo-demo.blend"
    assert source.is_file(), "Required editable source has not been generated"
    # When: reopen the source as a fresh Blender document.
    bpy.ops.wm.open_mainfile(filepath=str(source))
    check_contract()
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    source_bounds = bounds(meshes)
    source_meshes = len(meshes)
    # Then: an independent GLB import must preserve operational geometry.
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(GLB))
    check_contract()
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    imported_bounds = bounds(meshes)
    assert all(
        abs(a - b) < 0.001
        for ac, bc in zip(source_bounds, imported_bounds, strict=True)
        for a, b in zip(ac, bc, strict=True)
    ), (source_bounds, imported_bounds)
    report = {
        "asset": "hvo-demo",
        "synthetic": True,
        "siteId": "SITE-CONSTRUCTION-01",
        "mapVersion": "1.0.0",
        "floorId": "GROUND",
        "units": "metres",
        "blenderVersion": bpy.app.version_string,
        "sourceReopened": True,
        "glbReimported": True,
        "sourceMeshCount": source_meshes,
        "importedMeshCount": len(meshes),
        "sourceBoundsBlender": source_bounds,
        "importedBoundsBlender": imported_bounds,
        "operationalSlabBoundsBlender": bounds([bpy.data.objects["SITE_SLAB"]]),
        "regionNodes": {name: bounds([bpy.data.objects[name]]) for name in EXPECTED},
        "triangles": sum(len(p.vertices) - 2 for o in meshes for p in o.data.polygons),
        "glbBytes": GLB.stat().st_size,
        "coordinateMapping": "Blender [x,y,z] -> glTF/Three [x,z,-y]",
        "limitations": [
            "Synthetic industrial context, not a measured HVO plant layout",
            "Static illustrative facilities have no process or safety simulation",
            "Refuge regions are candidates, not a claim of safe destinations",
            "Hazards, routes, cranes and workers belong to the runtime",
        ],
    }
    (HERE / "verification.json").write_text(
        json.dumps(report, indent=2), encoding="utf-8"
    )
    print("SITE_SOURCE_AND_GLB_VERIFIED", json.dumps(report))


if __name__ == "__main__":
    main()
