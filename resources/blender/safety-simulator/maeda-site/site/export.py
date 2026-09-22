# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# ─── How to run ───
# blender --background --factory-startup --python-exit-code 1 --python export.py
"""Combine decorative draw calls while preserving the detailed editable source."""

from __future__ import annotations

from pathlib import Path
from typing import Final

import bpy

HERE: Final = Path(__file__).resolve().parent
ROOT: Final = HERE.parents[4]


def export_runtime() -> None:
    """Merge context and floor detail by material without changing region nodes."""
    groups: dict[tuple[str, str], list[bpy.types.Object]] = {}
    for obj in bpy.context.scene.objects:
        if (
            obj.type != "MESH"
            or obj.name.startswith("REGION__")
            or obj.name == "SITE_SLAB"
        ):
            continue
        category = "CTX_MERGED" if obj.name.startswith("CTX_") else "SITE_DETAILS"
        key = (category, obj.data.materials[0].name)
        groups.setdefault(key, []).append(obj)
    for (category, material), objects in groups.items():
        bpy.ops.object.select_all(action="DESELECT")
        for obj in objects:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = objects[0]
        bpy.ops.object.join()
        merged = bpy.context.object
        merged.name = category + "__" + material
        merged["synthetic"] = True
        merged["sourceObjectCount"] = len(objects)
    bpy.ops.object.select_all(action="DESELECT")
    for obj in bpy.context.scene.objects:
        if obj.type == "MESH" or obj.name == "SITE_ROOT":
            obj.select_set(True)
    output = ROOT / "public/assets/site/hvo-demo.glb"
    output.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(output),
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_apply=True,
        export_extras=True,
    )
    print(
        "SITE_RUNTIME_EXPORT",
        output,
        "meshNodes",
        sum(o.type == "MESH" for o in bpy.context.scene.objects),
    )


def main() -> None:
    """Open a saved detailed document; export changes remain unsaved in memory."""
    bpy.ops.wm.open_mainfile(filepath=str(HERE / "hvo-demo.blend"))
    export_runtime()


if __name__ == "__main__":
    main()
