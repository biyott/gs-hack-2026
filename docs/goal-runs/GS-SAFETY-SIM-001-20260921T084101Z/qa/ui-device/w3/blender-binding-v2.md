# W3A binding-driven Blender preparation v2

Status: **PREPARED; EXECUTION NOT_RUN**. This additive note and `blender-inspect-export-v2.py` supersede v1's hardcoded candidate binding only. V1 is preserved. No final candidate, execution permission, or acceptance result is inferred. C2 metadata remains pending; do not fill missing fields from C1. No Blender launch, source copying, candidate-wide hashing, export, import, rendering, browser, device, or model execution occurred during this preparation.

## Required binding

Pass `--binding` an absolute JSON path. The canonical common binding has exactly these required fields:

```json
{
  "candidateId": "sha256:<64 lowercase hex digits from the assigned candidate>",
  "candidateRoot": "<absolute frozen candidate root>",
  "manifest": {"path": "<candidate-relative manifest path>", "sha256": "<64 lowercase hex digits>"},
  "sourceSha256": "<64 lowercase hex digits from the candidate receipt>",
  "buildId": "<assigned build identity>",
  "mobileApkSha256": "<64 lowercase hex digits from the candidate receipt>",
  "assetManifest": {"path": "resources/blender/safety-simulator/artifact-manifest.json", "sha256": "<64 lowercase hex digits>"},
  "evidenceRoot": "<absolute run>/evidence/qa/ui-device/candidate-<first eight candidate digest digits>",
  "authority": {"receiptPath": "<absolute assigned receipt path>", "validatedBy": "/root/qa_lead"}
}
```

This illustrative JSON is deliberately incomplete and rejected by the harness. Missing/extra fields, blank or placeholder build/validator identities, malformed/all-zero hashes, relative execution paths, incorrect evidence root, asset path traversal, and manifest hash mismatches fail before Blender helper loading or output creation. The candidate ID is a full `sha256:` identity; the eight-digit suffix only names the owned evidence directory. The harness does not derive candidate identity from asset bytes, interpret a receipt as GO, or verify the entire source tree, APK, or build. QA Lead's upstream receipt validation supplies those bindings. `sourceSha256` is the candidate-level source identity; the chosen `.blend` has its separate hash/bytes in the asset manifest.

Both `manifest.path` and `assetManifest.path`, plus every `.blend` entry, must be canonical POSIX relative paths and resolve within `candidateRoot`. Both manifest files are hash-checked at execution. The primary manifest's `candidateId` and `sourceSha256` must then equal the binding. `authority.validatedBy` must be exactly `/root/qa_lead`. The authority receipt must exist and its observed hash is recorded; these checks do not grant execution permission.

## Source and output boundaries

Use the checked-in-path harness and its preserved sibling `blender-inspect-export.py`. The owned run is derived from that location. Source copies must already exist at:

`<evidenceRoot>/assets/sources/<asset manifest blend.path>`

Make ordinary independent byte copies only after the assigned window begins. V2 does not copy files. It rejects symbolic/reparse path components, frozen/copy same-file aliases, copy hard links, and hash/size mismatches. It never saves a `.blend`. Frozen and copied source hashes are recorded again after reimport; mutation causes an explicit incomplete observation.

GLB and metadata paths must be absolute, new, correctly suffixed files beneath `evidenceRoot`, outside `assets/sources` and the candidate root. Keep exports/observations/logs in fresh assigned-window subdirectories. Metadata is created exclusively and remains open for checkpoints. The GLB destination is reserved exclusively before export; Blender then writes that reserved file. An isolated assigned window is still required: this is not a concurrent hostile-filesystem sandbox. Preserve partial artifacts and the process exit/log on failure. Logs are governed by the launcher's owned path and `noclobber`, since the harness has no log flag.

V2 loads only v1's `inspect_scene` and `read_node_identities` observation functions and embedded `bpy` module after binding checks. It never calls v1 `main`, reads v1's candidate constants for decisions, or applies v1's hardcoded root checks. Metadata records both script hashes, the complete supplied binding and its hash, chosen asset source, receipt hash, arguments, and Blender runtime. Both scripts must remain together and be included in the execution receipt.

## Windows mapping and deferred exact argv

A Windows Blender process needs native Windows paths in JSON **as well as** CLI arguments. Merely applying `wslpath -w` to `--binding` is insufficient: paths inside the canonical JSON otherwise remain WSL strings.

Within the assigned window, retain the canonical JSON bytes unchanged. Create a separate owned mapped binding JSON using verified `wslpath -w` outputs for `candidateRoot`, `evidenceRoot`, and `authority.receiptPath`. Preserve relative `manifest.path`, `assetManifest.path`, all hashes, candidate/build identity, and validator identity verbatim. Add this Blender-only field:

```json
"canonicalBinding": {
  "path": "<verified Windows absolute path to the unchanged canonical binding JSON>",
  "sha256": "<SHA-256 of the unchanged canonical binding bytes>"
}
```

V2 requires that linkage on Windows, verifies the original binding hash, and compares candidate/source/build/APK identity, both manifest references, and validator identity. It records the mapped binding and its own hash separately. The operator's mapping receipt must pair canonical and Windows candidate/evidence/receipt paths and establish they access the same files; the harness does not guess a WSL distribution name or infer that a different Windows root is equivalent. Do not convert relative manifest paths to Windows separator strings. If UNC access, filesystem identity, or embedded Python handling fails, preserve the failure and report an environment limitation; do not relocate/rebuild the frozen candidate.

The following is the deferred complete argv, not evidence of a run. All variables must be populated from the assigned, validated candidate and verified mapping. `w3_process_log` is an absolute WSL path beneath that binding's owned evidence root; its parent must already exist. The exact asset ID and canonical source-copy path come from the bound asset manifest.

```bash
set -o noclobber
"/mnt/c/Program Files/Blender Foundation/Blender 5.2/blender.exe" \
  --background --factory-startup --disable-autoexec --python-exit-code 1 \
  --python "$w3_harness_win" -- \
  --binding "$w3_mapped_binding_win" \
  --asset-id "$w3_asset_id" \
  --source-copy "$w3_source_copy_win" \
  --output-glb "$w3_output_glb_win" \
  --metadata "$w3_metadata_win" \
  > "$w3_process_log" 2>&1
w3_process_exit=$?
```

`w3_harness_win` maps this run's `qa/ui-device/w3/blender-inspect-export-v2.py`; the sibling v1 remains beside it. `w3_mapped_binding_win` maps the separate mapped JSON. `w3_source_copy_win` maps `assets/sources/<canonical relative source>` beneath the evidence root. `w3_output_glb_win` and `w3_metadata_win` map fresh export/observation names beneath that same root. The launch receipt records the window ID, authority, canonical and mapped binding paths/hashes, both script hashes, all resolved argv, process log and exit status. No such receipt was fabricated here.

## Evidence scope and preparation validation

Scene inspection and export settings remain those documented in `blender-plan-v1.md`: active scene/view layer, source object transforms and dependencies, GLB Y-up, no modifier application or animations, no render, and empty-scene reimport. `acceptance` remains `NOT_ASSESSED`. A successful source-copy reopen/export/reimport is distinct from loading and rendering the actual frozen production GLB in the browser; it cannot replace that comparison, manufacturer-dimension review, motion endpoints, visual QA, or other AC12/AC15 observations.

Only stdlib AST parsing through `uv run --no-project python` validates the successor's syntax. The module was not imported, so neither `bpy` nor the sibling module executed. A direct `python` syntax-check attempt initially found no binary and performed no parsing; the subsequent uv invocation succeeded. No runtime, Blender API, Windows mapping, candidate hash, rejection-case, or transaction behavior has been tested. Required runtime checks remain NOT_RUN under the bounded preparation instruction.

The script owns one binding-scoped asset-observation transaction. Frozen dataclasses define parsed binding and source records; JSON/CLI parsing remains stdlib-compatible with Blender's embedded environment, as in v1. There are no added dependencies, casts, `Any` annotations, broad exception catches, or product edits. AST parsing succeeded at **213 nonblank, noncomment lines**, within the 250-line limit but in its warning band; split binding parsing into a separately owned file before substantial further growth. A text scan found no C1 candidate/stage/hash constants or `.blend` save calls in v2. No behavior test or type-check pass is claimed.

A read-only guard review raised three limits, retained explicitly: candidate-level `sourceSha256` is matched to the hashed primary manifest but requires upstream full-source validation and is not the selected asset digest; authority receipt contents are not a substitute for the assigned GO/window; and filesystem replacement races require the isolated resource window. These are documented boundaries, not reasons to introduce a new receipt schema or general filesystem framework in this bounded preparation.
