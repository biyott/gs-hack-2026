# C3 independent copied-source Blender execution v1

Seven independent copied-source reopen/export/reimport transactions completed in assigned **W3A-C3-01**. Actual execution ran **2026-09-21T16:25:55.659471Z–16:26:33.871368Z** (38.212 seconds total), using Windows **Blender 5.2.2 LTS**. Every process returned exit 0, reached `reimport-recorded`, and recorded both frozen and copied source hashes unchanged. No retries, timeouts, product edits, source saves, GUI/MCP access, rendering, browser, phone, camera, or model calls occurred in this slice. The Blender subwindow was released immediately after completion; the later work here reads stored evidence only.

This is **completed collection**, with `acceptance: NOT_ASSESSED` retained in every observation. It is not whole-AC acceptance and does not replace the distinct shipped-production-GLB browser loader/render comparison or endpoint/visual review.

## Candidate and input identity

Candidate: `sha256:1a7c95cd1a15df738492a368d36cc6cb98985ec1c2618b10e807c82076b247c4`.

Frozen root: `/home/b/.cache/gs-safety-c3.eulo4t9w`. Canonical binding: `candidate-binding-c3.v2.json`, SHA-256 `e54c83496db8fa290a0d5229d339b139b13ae6ab1e6cd3228f3cf397dbd60740`. The native Windows derivative preserves the canonical binding linkage and relative manifest references. The candidate manifest hash was `8d9b031f68374ea939dcdebb570e76aeba4b09d1154165cab53d186e7d27c4bc`; the asset manifest hash was `51c6adfd6e5190a11b8bc04300a45634b2486ebda64f58a7affd444027c321de`.

Seven ordinary QA copies were created with exclusive new-file writes beneath `evidence/qa/ui-device/candidate-1a7c95cd/assets/sources/<canonical blend path>`. Each original/copy matched its manifest's byte count and SHA-256. The copies had separate device/inode identity and link count 1; no source or copy path component was a symlink. Windows-native PowerShell then read and hashed all fourteen source/copy paths plus both harnesses over the `wslpath -w` UNC mappings: 16/16 matched. Binary metadata reported version 5.2 and AMD64 PE before launch; actual Blender execution reported 5.2.2 LTS. PowerShell's first-use module progress appeared on stderr as CLIXML, with exit 0; it was preserved and was not a Blender error.

## Executed collection

| Asset | Process seconds | Source objects | Export nodes / reimport objects | New QA GLB bytes |
| --- | ---: | ---: | ---: | ---: |
| sk1265-at6 | 6.279 | 1088 | 1081 / 1081 | 2233720 |
| tadano-gr250n4 | 4.441 | 277 | 270 / 270 | 310724 |
| liebherr-ltm1050 | 4.643 | 363 | 356 / 356 | 416080 |
| maeda-mc305 | 4.539 | 241 | 241 / 241 | 582804 |
| liebherr-lr1100 | 4.646 | 467 | 461 / 461 | 309636 |
| liebherr-172ecb | 5.173 | 956 | 950 / 950 | 420300 |
| hvo-demo | 8.490 | 1011 | 1009 / 1009 | 5455600 |

The exact argv for each process is recorded in the preparation JSON and `started` rows of the execution JSONL, including `--background --factory-startup --disable-autoexec --python-exit-code 1`, v2 harness path, mapped C3 binding, asset ID, copied source, new GLB, and new metadata. Each matching `finished` row records start/end UTC, elapsed monotonic duration, exit code, phase, hash-preservation result and evidence paths. Individual stdout/stderr logs are retained. No exporter/importer `WARNING` or `ERROR` lines or traceback were found; SK object names containing `JackWarning`/`RearWarningStripe` occur only as normal INFO object output.

All source and reimport scenes report `METRIC`, `scale_length: 1.0`, `METERS`. No nonempty missing external image/library path was recorded. SK and Maeda source scenes contain two transient `IMAGE:VIEWER` records (`Render Result`, `Viewer Node`) with blank paths and `exists: false`; those are not missing external files. Reimport dependency lists are empty.

Camera/light exclusion explains the object-count reductions: SK/Tadano/LTM each omit seven camera/light objects, LR/172 each omit six, site omits two, Maeda omits none. Curves/fonts can become meshes in glTF; this observation does not claim object-kind preservation. The harness exports the active view layer rather than reproducing the producer's grouping/selection. QA GLB hashes/bytes therefore differ from published production GLBs by design of this observation, not as a standalone regression finding.

## Bounded geometry observations

The copied LR source and its independent GLB reimport both record `BOOM_PIVOT` parent `SLEW`, with local x translation **1.2000000476837158** Blender units. `ROOT` is identity; `SLEW` has local translation `[0, 0, 1.7000000476837158]`. This is fresh C3 source/reimport evidence of the corrected horizontal pivot value. It does not by itself validate the shipped GLB, all manufacturer geometry, movement endpoints or the complete QD005/AC12 acceptance.

Aggregate mesh bounds include surrounding scene context. SK's 2000×2000 ground extent comes from `Studio_Ground`; Tadano/LTM contain 200×200 studio ground; LR/172 contain 300×300 studio ground. Site bounds include `CTX_TERRAIN` at 212×127, beyond its separate 140×50 operational region. These whole-scene bounds are not crane footprints or operational-map dimensions. Source/reimport maximum bound-component difference was 0 for SK/Maeda/172/site and about `1.9073486328125e-6` Blender units for Tadano/LTM/LR. These are recorded float observations, not a newly invented tolerance or a coordinate-contract verdict. Imported Blender values have already passed through glTF-to-Blender axis conversion; do not apply it a second time.

## Evidence locations

All following paths are under this run's `evidence/qa/ui-device/candidate-1a7c95cd/assets/`:

- `c3-blender-preparation-v1.json`: canonical/mapped binding hashes, both harness hashes, binary metadata, original/copy file identities/hashes, seven exact planned argv.
- `c3-windows-native-preflight-v1.json`: actual Windows file-access/hash observations, command/script, exit and preserved stdout/stderr.
- `c3-blender-execution-v1.jsonl`: append-only per-process start/finish receipts.
- `c3-blender-summary-v1.json`: collection summary, source/reimport units/bounds/dependencies, per-asset export nodes/hashes, and LR pivot matrices.
- `observations/W3A-C3-01/<asset-id>.json`: complete source and reimport object observations and hash preservation.
- `logs/W3A-C3-01/<asset-id>.log`: complete process output.
- `exports/W3A-C3-01/<asset-id>.glb`: independent QA exports, never substituted for the production GLBs.
- `sources/<canonical source path>`: preserved ordinary source copies.

C1/C2 evidence remains unchanged and was not reused as C3 behavior. Frozen source hashes were checked by the harness after each round trip, not by a new full-tree aggregate scan. No receipt or summary claims physical calibration, safety, camera/device performance, visual fidelity, or overall PASS.
