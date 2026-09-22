# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# Run: blender --background --factory-startup --python test_parenting.py
"""Regression: new articulation empties retain their declared anchor positions."""
from pathlib import Path
import sys
import bpy
sys.path.insert(0, str(Path(__file__).resolve().parent))
from build import empty
root = bpy.data.objects.new("TEST_ROOT", None)
bpy.context.scene.collection.objects.link(root)
node = empty("TEST_TROLLEY", (30.0, 0.0, 16.24), root)
bpy.context.view_layer.update()
assert abs(node.matrix_world.translation.x - 30.0) < 1e-5, tuple(node.matrix_world.translation)
assert abs(node.matrix_world.translation.z - 16.24) < 1e-5, tuple(node.matrix_world.translation)
print("ARTICULATION_ANCHOR_PASS")
