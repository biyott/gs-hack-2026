# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# Run: blender --background --factory-startup --python verify.py
"""Exercise reopening, optimized GLB geometry, metre scale and articulation anchors."""
from __future__ import annotations
import json
from pathlib import Path
import bpy

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]


def extent(objects: list[bpy.types.Object]) -> list[list[float]]:
    """Compute exact evaluated vertex bounds rather than inflated object AABBs."""
    graph = bpy.context.evaluated_depsgraph_get()
    points = []
    for obj in objects:
        evaluated = obj.evaluated_get(graph)
        mesh = evaluated.to_mesh()
        points.extend(obj.matrix_world @ vertex.co for vertex in mesh.vertices)
        evaluated.to_mesh_clear()
    return [[min(p[axis] for p in points) for axis in range(3)],
            [max(p[axis] for p in points) for axis in range(3)]]


def main() -> None:
    """Keep source open and imported geometry in separate scenes, then compare."""
    bpy.ops.wm.open_mainfile(filepath=str(HERE / 'sk1265-at6.blend'))
    original = [obj for obj in bpy.context.scene.objects if obj.type in ('MESH','CURVE')
                and any(group.name.startswith(tuple(f'{n:02d}_' for n in range(1,9))) for group in obj.users_collection)]
    source_bounds = extent(original)
    new_scene = bpy.data.scenes.new('SK1265_GLTF_REIMPORT')
    bpy.context.window.scene = new_scene
    bpy.ops.import_scene.gltf(filepath=str(ROOT / 'public/assets/cranes/sk1265-at6.glb'))
    meshes = [obj for obj in new_scene.objects if obj.type == 'MESH']
    imported_bounds = extent(meshes)
    error = max(abs(a-b) for rowa,rowb in zip(source_bounds,imported_bounds,strict=True) for a,b in zip(rowa,rowb,strict=True))
    assert error < 0.0001, {'source':source_bounds,'import':imported_bounds,'error':error}
    roots = [obj for obj in new_scene.objects if obj.parent is None]
    assert len(roots) == 1 and all(abs(value-1)<1e-6 for value in roots[0].scale)
    nodes = {obj.name.split('.')[0]:obj for obj in new_scene.objects if obj.type == 'EMPTY'}
    hook = nodes['HOOK']
    trolley = nodes['TROLLEY']
    baseline = hook.matrix_world.translation.copy()
    trolley.location.x += 10
    bpy.context.view_layer.update()
    moved = hook.matrix_world.translation.copy()
    assert abs(moved.x-baseline.x-10)<1e-5 and abs(moved.z-baseline.z)<1e-5
    result = {'blenderVersion':bpy.app.version_string,'sourceOpened':True,'glbImported':True,
              'sourceBounds':source_bounds,'importedBounds':imported_bounds,'maximumVertexBoundsErrorM':error,
              'meshCount':len(meshes),'rootScale':list(roots[0].scale),'hookBaseline':list(baseline),
              'hookAtTrolley40':list(moved),'status':'passed'}
    (HERE/'reimport-verification.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
    print('SK1265_REIMPORT_PASS',json.dumps(result))


if __name__ == '__main__':
    main()
