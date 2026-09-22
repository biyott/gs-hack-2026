# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# ─── How to run ───
# Blender: blender --background --python build_scene.py
# Or in Blender's Python console: import build_scene; build_scene.main()
"""Create a separate scene while preserving the user's existing scene."""

from __future__ import annotations

import bpy
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from crane_geometry import Builder


def initialize() -> Builder:
    scene = bpy.data.scenes.new("SK1265_AT6_60m_Study")
    bpy.context.window.scene = scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1800
    scene.render.resolution_y = 1200
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene["reference_model"] = "Spierings SK1265-AT6 (legacy 60m)"
    scene["note"] = "Source-based exterior study. Detailed parts are visual approximations."
    builder = Builder(scene)
    bpy.app.driver_namespace["sk1265_builder"] = builder
    return builder


def main() -> None:
    """Build and save a fresh scene next to these source modules."""
    import chassis
    import jib
    import mast
    import presentation

    builder = initialize()
    chassis.build(builder)
    mast.build(builder)
    jib.build(builder)
    presentation.build(builder)
    out = Path(__file__).resolve().parent
    builder.scene.render.filepath = str(out / "crane-overall.png")
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(out / "spierings_sk1265_at6.blend"))


if __name__ == "__main__":
    main()
