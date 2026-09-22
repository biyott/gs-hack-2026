# W3A Blender reopen/export harness preparation v1

Status: **PREPARED; EXECUTION NOT_RUN**. This file and `blender-inspect-export.py` are QA preparation only. No Blender launch, version probe, source copy, export, import, render, or product acceptance test was performed in this preparation. A separately assigned W3A process/resource window and verified Windows path mapping are required before the commands below become executable work.

## Frozen inputs and ownership

The only source stage is `/home/b/.cache/gs-safety-ci.u7pR52`. Its `resources/blender/safety-simulator/artifact-manifest.json` has SHA-256 `2dc3813f65f1d03e5c694ef3c8453297f6be0cd401c57212b122d45d6eafd3ce`; the harness rejects a different manifest. Paths below are relative to that stage. These are the seven canonical manifest entries, excluding prior runtime snapshots.

| Asset ID | Canonical `.blend` source | Published GLB reference |
| --- | --- | --- |
| sk1265-at6 | resources/blender/safety-simulator/sk1265-derived/sk1265-at6.blend | public/assets/cranes/sk1265-at6.glb |
| tadano-gr250n4 | resources/blender/safety-simulator/mobile-cranes/tadano-gr250n4.blend | public/assets/cranes/tadano-gr250n4.glb |
| liebherr-ltm1050 | resources/blender/safety-simulator/mobile-cranes/liebherr-ltm1050.blend | public/assets/cranes/liebherr-ltm1050.glb |
| maeda-mc305 | resources/blender/safety-simulator/maeda-site/maeda/maeda-mc305.blend | public/assets/cranes/maeda-mc305.glb |
| liebherr-lr1100 | resources/blender/safety-simulator/lattice-cranes/liebherr-lr1100.blend | public/assets/cranes/liebherr-lr1100.glb |
| liebherr-172ecb | resources/blender/safety-simulator/lattice-cranes/liebherr-172ecb.blend | public/assets/cranes/liebherr-172ecb.glb |
| hvo-demo | resources/blender/safety-simulator/maeda-site/site/hvo-demo.blend | public/assets/site/hvo-demo.glb |

The original SK study also exists at `/home/b/.cache/gs-safety-ci.u7pR52/resources/blender/spierings-sk1265-at6/spierings_sk1265_at6.blend` (384,241 bytes, filesystem observation only). It is distinct from the manifest's derived SK source. Nothing needs rebuilding to recover either file. This harness deliberately accepts only the seven canonical manifest IDs; original-study inspection would need a separately bound observation.

All QA copies and outputs belong under `/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/ui-device/candidate-70da1337/assets`. Source copies must retain `sources/<canonical relative path>`. Exports, JSON observations, and process logs use a fresh assigned-window subdirectory outside `sources`. Never replace earlier evidence. The harness derives this owned root from its repository location, so run the checked-in-path script rather than moving it to a temporary folder.

## What the harness records

- Frozen manifest identity, chosen source path/byte count/hash, source-copy identity, harness hash, arguments, runtime Blender version/binary, and start/finish UTC.
- Active scene and all scene names, current frame, Blender unit settings, every active-scene object's name/type/data/parent/collections, local/world matrices, scale, visibility, and world-space `Object.bound_box` corners for meshes. The aggregate mesh bounding box is explicitly in Blender units. This is not a separate evaluated-modifier or deforming-geometry measurement.
- Every loaded image/library dependency's stored path, path resolved from the QA copy, existence, and packed status. Relative dependencies may be absent after copying only the `.blend`. Do not silently relink, fetch, regenerate, or alter the source to conceal that observation; record exporter warnings and request a bounded dependency disposition if required. Generated/packed images can legitimately have no external file.
- A newly exported GLB's bytes/hash and actual GLB JSON node indexes/names/children/mesh indexes; a fresh empty-scene reimport's objects, transforms, units, dependencies, and mesh bounds; and both frozen/copy hashes after the round trip.

`acceptance` remains `NOT_ASSESSED`. `phase` progresses from `inputs-bound` to `source-recorded`, `export-recorded`, and `reimport-recorded`. A process failure, operator cancellation, missing final phase, invalid JSON, or `source_bytes_unchanged: false` is incomplete evidence. Preserve the partial JSON, process exit status, stderr/stdout, and any partial output; do not silently rerun over them. JSON disallows NaN/Infinity, so non-finite observed data causes a visible failed collection rather than a misleading numeric receipt.

## Export scope and interpretation

One asset gets one isolated `--background --factory-startup --disable-autoexec` process. The script opens only the byte-identical QA source copy with `load_ui=False, use_scripts=False`; it never saves a `.blend`, invokes producer modules, packs meshes, changes source transforms, renders, accesses the existing interactive Blender session, or controls phones/cameras. It changes selection in memory, selects active-view-layer objects, and exports with `use_selection=True`, GLB/Y-up, custom extras enabled, modifier application disabled, animations disabled, and cameras/lights excluded. The actual selected object names are recorded. Excluded view-layer objects and objects in other scenes are not silently claimed as exported.

Reimport happens after `read_factory_settings(use_empty=True)` in the same isolated process. Source snapshots are already serialized before that reset. This proves only that this source copy can be observed and this independent export can be reimported under the recorded runtime/settings. The producer's SK and site exporters perform mesh grouping/selection; this harness intentionally does not reproduce those transformations. Therefore differing node counts, output bytes, or GLB hashes do not alone show a product regression. It does not compare the frozen published GLB, exercise motion endpoints, measure visual fidelity, certify manufacturer geometry, or satisfy the complete AC12/AC15 acceptance by itself.

Interpret coordinates using the frozen contract: Blender XY ground/Z-up, glTF `[mapX,height,-mapY]`. Imported Blender observations have already passed through the importer's axis conversion; do not transform them a second time. Record unit settings instead of assuming `METRIC` after factory reset. No table 1:100 rescaling is applied. Do not derive physical calibration, safety, camera, device, performance, or overall PASS from these observations.

## Deferred command plan — only in the assigned W3A window

1. Obtain the assigned window ID, exclusive Blender process permission, resource limit, and timeout from QA Lead. Use the frozen candidate above. Keep producer processes and the interactive scene untouched. Run the seven canonical IDs serially unless the resource assignment explicitly permits parallel processes.
2. Verify the supplied executable `/mnt/c/Program Files/Blender Foundation/Blender 5.2/blender.exe` and Windows-readable mappings for the frozen manifest, script, owned source copy, GLB, and JSON paths. Do not guess a WSL distribution name. `wslpath -w` output must be checked for actual Windows accessibility in the assigned window; UNC accessibility and Blender Python path handling remain untested here. If unavailable, stop this observation and report the environment limitation; do not relocate frozen sources or invoke a rebuild.
3. Make ordinary independent byte copies under `assets/sources/<relative path>`; preserve the directory hierarchy, never use symlinks or hard links. Compare both files against the frozen manifest's exact hash and byte count. The harness repeats those input checks and rejects aliases to the frozen source. Existing copies may be reused only after that identity check; do not overwrite them.
4. Give each asset new GLB/JSON/log output paths under the assigned window. The example below is a command template, not a run receipt. Set all variables to verified paths first. Parent directories for the process log must already exist. Use shell `noclobber` so a reused log name fails instead of erasing evidence.

```bash
# Assigned-window example for sk1265-at6; substitute the other six table entries separately.
# All *_win paths below must come from the verified Windows path mapping.
set -o noclobber
"/mnt/c/Program Files/Blender Foundation/Blender 5.2/blender.exe" \
  --background --factory-startup --disable-autoexec --python-exit-code 1 \
  --python "$w3_harness_win" -- \
  --manifest "$w3_manifest_win" \
  --asset-id sk1265-at6 \
  --source-copy "$w3_source_copy_win" \
  --output-glb "$w3_output_glb_win" \
  --metadata "$w3_metadata_win" \
  > "$w3_process_log" 2>&1
w3_process_exit=$?
```

Expected variable bindings for this example:

| Variable | WSL-side path before verified mapping |
| --- | --- |
| w3_harness_win | /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/blender-inspect-export.py |
| w3_manifest_win | /home/b/.cache/gs-safety-ci.u7pR52/resources/blender/safety-simulator/artifact-manifest.json |
| w3_source_copy_win | `<owned assets>/sources/resources/blender/safety-simulator/sk1265-derived/sk1265-at6.blend` |
| w3_output_glb_win | `<owned assets>/exports/<assigned-window>/sk1265-at6.glb` |
| w3_metadata_win | `<owned assets>/observations/<assigned-window>/sk1265-at6.json` |
| w3_process_log | `<owned assets>/logs/<assigned-window>/sk1265-at6.log` (WSL path, not mapped) |

5. Preserve `w3_process_exit` in the window receipt. Independently review the final JSON and process log, verify source hashes against the frozen manifest, and report observed differences with object/node names and units. No bounds tolerance or acceptance threshold is invented by this helper. If a process times out, stop only the PID/process tree assigned to this harness and preserve partial artifacts. QA Lead decides whether an authorized environment retry is available under the frozen protocol.

## Preparation verification and limitations

Only stdlib `ast.parse` was used to parse the script source; `bpy` was not imported and the harness body was not executed. The script contains 202 nonblank, noncomment lines, within the 250-line ceiling; the warning band is recorded, and further growth should split the observation schema from execution after separately authorizing another file. A read-only helper also checked the manifest mapping and path guards. This is syntax/static review, not Blender/API, Windows path, export, or reimport validation.

The script owns one asset-observation transaction. CLI options are checked once, the frozen manifest is authenticated before its entries become typed `SourceBinding` values, and Blender output uses typed observation records. No `Any`, casts, suppression directives, broad exception handler, new dependencies, or product mutations were added. Standard-library CLI/JSON plus Blender's embedded Python follow the staged Blender-script environment; ordinary `uv`, Typer, or Pydantic execution would not provide `bpy`. Runtime checks remain NOT_RUN under the explicit no-execution preparation scope.
