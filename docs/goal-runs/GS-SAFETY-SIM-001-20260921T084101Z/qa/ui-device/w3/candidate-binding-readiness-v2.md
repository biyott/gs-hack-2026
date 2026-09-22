# W3 candidate rebinding and resource readiness v2

Owner `/root/qa_lead/qa_ui_device`; preparation on 2026-09-21. C2 remains held. This addition preserves C1 scripts, cards and evidence. No browser, candidate helper, server, model, device or Blender was started. It is not a live grant or an acceptance verdict.

## Separate candidate binding

`run-surface-v2.mjs` accepts `--binding <absolute-or-relative-json>` rather than embedding C1 identities. `candidate-binding.template.v2.json` intentionally contains nulls until QA Lead supplies the next frozen root/manifest/receipt. `candidate-binding-c1.v2.json` is a historical concrete sample, not authority to execute C1 again. A replacement gets its own binding and `evidence/qa/ui-device/candidate-<digest-first8>` output directory; no old candidate evidence is rewritten.

The binding supplies candidate root/ID, manifest path/hash, source hash, BUILD_ID, APK hash, asset-manifest path/hash and independent QA receipt path. The Node wrapper checks actual selected manifest identities, BUILD_ID and asset-manifest bytes, then records its binding/receipt/scenario/script hashes. These small checks do not replace QA Lead's full source/artifact validation; the APK hash in the browser record is a binding, not an installed-device observation. Candidate input paths resolve within the selected frozen root. Its default `--binding-only` only reads these files and writes a new owned preparation record; no child process runs. `--validate-only` invokes the frozen scenario parser and is separate from the binding-only check. `--surface <grant.json>` still requires an actual candidate-matching W3A grant and truthful safe-frame/runtime conditions.

```bash
node docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/run-surface-v2.mjs --binding /absolute/path/to/selected-candidate.json --binding-only
```

After an explicit W3A grant and runtime setup, append `--surface /absolute/path/to/w3a-grant.json` instead. Do not execute either live command merely because this example exists. The production runner, Playwright module, GLBs and source assets come from the selected stage. Scenario selectors/actions must be checked against any declared C2 frontend/contract changes before captures. Preserve C1's 155 semantic-case matrix as history; changed inventory requires an additive scenario version, not silently relabelled C1 results.

`blender-inspect-export-v2.py` uses the same explicit binding for copied-source open/export/reimport. Its own binding and mapped Windows paths must be checked before launch; see `blender-binding-v2.md`. Independent copied-source evidence and the actual frozen production GLB's browser loader/render evidence are separate observations. Successful QA re-export alone cannot certify the shipped GLB, and source/GLB JSON inspection alone cannot certify a real source reopen/render.

## Remaining launch prerequisites

1. **Candidate:** Root's explicit C2 freeze/GO and QA Lead receipt validation: separate absolute root, manifest path/hash, aggregate candidate/source identity, final web BUILD_ID, final APK bytes/hash, asset manifest, declared change/impact list and final launch guide. Preserve C1 LR finding; bind any correction only to newly supplied bytes. No C2 values are inferred.
2. **Resource assignment:** explicit W3A owner grant after W1/W2 release; actual port4103 availability, process/CPU/memory occupancy, one QA application, sole scheduled8092 inference/embedding window where normal startup or measurement uses it. Do not start another provider or use a development DB.
3. **Runtime isolation:** fresh absolute QA DB/private credential file and stable secret through initialization/restarts; production launch from the selected root with shell `PORT=4103` and `DATABASE_PATH`; bind0.0.0.0 when the phone lane needs LAN. Fresh browser contexts/profiles, exact browser/module paths, synthetic fixture provenance, and confirmed exclusion of real senders/retained real frames. Record actual process identity and private paths without secret values.
4. **Blender:** exclusive background permission and verified Windows/WSL path mapping for binary, selected source, owned fresh source copy/output and binding. Use the provided binary; read actual version at the granted launch. Copy original bytes to QA, verify identity, reopen/export/reimport without saving the original or invoking producer builders. Schedule separately from browser timing/model measurement and stop on actual completion.
5. **Phones:** explicit sole ownership and producer release for PHONE-1/PHONE-2; current authorized USB access, candidate APK install identity, initial app/settings/reverse/volume state and worker roles. Root already permits one meaningful final LAN attempt without network/firewall changes; attempt only when4103 works locally. Preserve failure and label any USB reverse fallback distinctly. UWB is permitted on both; camera is PHONE-1 only. Existing producer reports are preparation provenance until observed independently.
6. **Observation resources:** per-frame timestamp origin/clock/correction/uncertainty and endpoint-stage metadata, raw distribution storage, state/ACK/DB tracing and actual-device UI observation. Actual audibility/cutoff and haptic claims require an external capture or reliable physical witness; callbacks, volume and UI state cannot pass them. Four phones, two simultaneous Controlees, physical table/markers/measured mount/yaw and the810-sample calibration protocol remain separately unavailable/unobserved. Missing physical resources do not prevent assigned feasible software work.

## Fixed order and privacy

W3A is synthetic-only browser/3D plus separately scheduled copied-source Blender. W3B uses the two actual worker phones for readability, same-node Details activation, footer controls, locales, lineage, cancellation/replacement/replay/reconnect and truthful current versus historical status. Verified camera-free W3B screenshots may be reviewed after provenance/secret checks. W3C uses **only PHONE-1** real camera **last**. Retained last JPEG remains real after capture stops: subsequent model-facing evidence on that runtime is sanitized DOM/SSE/metadata or a verified tight non-camera crop; never a full admin viewport or `view_image` of real feed pixels. Later full visual checks require a fresh isolated synthetic-only runtime, not merely stopping the camera. All original timing and physical requirements remain unchanged.

## Resource occupancy estimate, not a wait instruction

| Window | Active resource planning range | Work and release |
| --- | --- | --- |
| W3A | approximately30–50min | Synthetic surfaces, real interaction/3D/loaded-GLB observations, and serialized two-mode measurement. Two30s warmups plus two180s runs alone require at least7min; joins/actions add work. Blender is released as soon as copied-source commands finish: likely seconds/minutes, with5–10min setup allowance included, not a15–25min artificial wait. |
| W3B | approximately30–45min | Exclusive two-phone active observations; one LAN attempt budget up to5–8min, then documented outcome/fallback. No duplicate software install/runbook witness (W4 owns that portion). |
| W3C | approximately12–20min | PHONE-1 camera setup, exact metadata/frame joins, two-mode collection with the same at-least7min raw timing requirement, cleanup and resource release. Capture-to-render remains unproved if its endpoint/clock evidence is unavailable. |

Plan approximately75–115min total live occupancy after prerequisites. These are scheduling estimates, not minimum waits, maximum acceptance budgets or promises of completion. Actual command durations and blocking observations are recorded. Stored synthetic-image review and evidence synthesis may need another20–40min; do it alongside safe noncompeting processing or after release rather than retaining idle model/Blender/app resources. Stop/release immediately when the assigned work ends; product rework, unavailable physical witnesses and new failures require a separate disposition, never deadline-driven PASS.

## SK original source correction

The earlier preparation assertion that the original SK `.blend` was absent from C1 was **incorrect**. Its location is outside the `safety-simulator` subtree, but inside the frozen stage: `resources/blender/spierings-sk1265-at6/spierings_sk1265_at6.blend`. Independent read-only observation found384241bytes, SHA-256`58014b5964f8cd5e2ec8148413ea2cabf531664cc02789f20e40e9350838ffd2`, exactly matching `sourceFiles` membership. `resources/blender/safety-simulator/sk1265-derived/build.py:19` resolves that location through `ROOT`. **No SK packaging defect is supported by the earlier claim.** This correction does not assert an actual reopen/export or regeneration result.

Evidence: `../../../evidence/qa/ui-device/candidate-70da1337/sk-original-correction-v1.json`; new wrapper binding-only observation: `../../../evidence/qa/ui-device/candidate-70da1337/binding-validation-v2.json`. Existing C1 findings and source inputs are preserved.

## Preparation checks and limits

Node syntax checking passed. The C1 binding-only check exited0 with `candidateHelperLaunched:false`, `browserLaunched:false`, no grant and no runtime output directory; the frozen manifest file remained unchanged. The unassigned template exited1 with the expected missing-candidate-identity rejection before launching a helper; record `../../../evidence/qa/ui-device/candidate-70da1337/binding-template-rejection-v2.json`. These are harness preparation checks, not a rerun of C1 or any C2 test. Blender v2 received AST parsing only; mapped-path, Blender API and export behavior await the actual grant.

Each successor owns one bounded execution envelope and keeps input parsing/checking at entry. No product source, dependency, Next API, acceptance criterion or fixture threshold was changed. The Node wrapper is within250 nonblank/comment lines; Blender's213-line preparation is in the warning band and should not grow into a general framework. No full type-check, browser/device behavior or acceptance pass is claimed.
