# C2 W3 binding readiness v1

Owner `/root/qa_lead/qa_ui_device`; preparation recorded2026-09-22 Asia/Seoul. This note binds C2 while preserving C1 cards, failures and preparation. It grants no W3 runtime access.

The selected immutable root is `/home/b/.cache/gs-safety-qd001.7e7jy5oy`, candidate `sha256:0d42bacc04c50cd21c9c133e262838acb6f47e2e8d33d37ea450ce160f46bc3e`. Manifest `runtime-artifacts/candidate-manifest-c2.json` has SHA-256`6f146ee34b7880e3a0c8012ae2a2485ec7d95e0314e183c555eb509060f54ef0`; source is`0f50d5d6cc16ca78718e88adc88669b3420ffef416b58d4c1d20d63ab9a35f77`; BUILD_ID is`QZCOSOj4hgBWlUIGbGUxu`. Mobile4 APK identity remains`1d78f81eaa5d7d85a2f73d3d50b5acbbeeb4a0ea5cbbabcc538087f4fbeb515a`; this is the candidate binding, not a new installed-device observation. Full HEAD remains`9dc020a7c0160af17e2ac9157dcb8c390890309a`.

QA Lead's independent receipt at `../../../evidence/qa/g4/candidate-0d42bacc/receipt-validation.json` records990 source files,475 artifacts and26 sidecars matching at2026-09-21T14:59:11.177Z–14:59:13.285Z. This slice read that receipt and performed only small manifest/BUILD_ID/asset-manifest checks. It did not repeat the full tree/APK/model hash pass or execute any candidate helper.

## Concrete bindings

- Canonical Node/Blender binding: `candidate-binding-c2.v2.json`, SHA-256`d6e063404ff931120633e3cce3a360c5cee2800d68152e90327e5a0c7af72a64`.
- Blender native-path derivative: `candidate-binding-c2.windows.v2.json`, linked to unchanged canonical bytes. Paths were translated with `wslpath -w`; Windows access and Blender API behavior remain NOT_RUN. A lexical path mapping is not an open/export result.
- Asset manifest SHA-256`51c6adfd6e5190a11b8bc04300a45634b2486ebda64f58a7affd444027c321de`. Its seven selected source entries have explicit future QA-copy paths in `../../../evidence/qa/ui-device/candidate-0d42bacc/blender-binding-preparation-v2.json`. No `.blend` was copied, opened or exported in preparation.
- Node file-only check: `../../../evidence/qa/ui-device/candidate-0d42bacc/binding-validation-v2.json`, exit0, `candidateHelperLaunched:false`, `browserLaunched:false`, no grant. Existing harnesses and155-case scenario remain unchanged.

After an actual W3A grant, the browser command uses `run-surface-v2.mjs --binding <this directory>/candidate-binding-c2.v2.json --surface <actual-grant.json>`. The copied-source Blender command uses `blender-inspect-export-v2.py --binding <mapped C2 binding>` and the five explicit flags documented in `blender-binding-v2.md`. Do not execute these from this note. Production GLB loader/render observations remain separate from QA source-copy export/reimport.

## C2 change impact retained for W3

The Lead-provided `c1-c2-file-delta.json` identifies frontend alert/guidance ordering, console/tracking access, server arrival/recovery, LR1100 source/GLB/catalog and packaging/provenance changes. These are affected-test inputs, not evidence that each correction works. C1's LR pivot departure remains preserved; only actual C2 source/GLB/application observations can assess changed geometry. Contract clarification1.0.4 changes tracking authorization/device upload response semantics without changing measurement schemas or G0: worker/device sessions must not poll or retain cached tracking, support may read metadata but not JPEG, and successful bound device uploads return empty204 rather than complete tracking snapshots. Existing source/camera privacy restrictions still apply.

Static selector/role-state impact is tracked separately in `c2-browser-impact-v1.md`. No C1 evidence is relabelled as C2. Existing Android Mobile4 and producer results remain producer evidence until this slice's assigned actual-device work.

## Resource state and order

W1 owns4101 now; W2 precedes W3. W3 still needs an explicit owner grant, fresh4103 DB/private credentials, safe synthetic fixture provenance, actual resource occupancy/model8092 scheduling, native Blender path/window checks and exclusive phone handoff. C2 identity is now resolved; these resource prerequisites remain.

W3A synthetic browser/3D and separately serialized Blender → W3B actual two worker phones → W3C **PHONE-1 only** real camera **last**. Retained real JPEGs remain unsafe after capture ends; full model-facing screenshots require a fresh synthetic-only runtime. Use local-only pixels and sanitized DOM/SSE/metadata on an actual-camera runtime. Four-phone/radio calibration/physical audio and haptic requirements remain unfulfilled; feasible software work can proceed when assigned.

The separately authorized short W1 phase-boundary LAN probe is distinct from W3. Its method is `c2-lan-boundary-probe-plan-v1.md`; it awaits an actually ready, owner-held listener and the narrow grant. The first grant referenced a listener already stopped before any phone request: no phone/HTTP probe was issued against it and no LAN conclusion follows. Only host address/path metadata was read. The subsequent fresh READY relay governs any attempt; record its actual PID/time and release immediately. The final meaningful W3 application/LAN retry remains separate.

## Addendum: narrow W1 probe executed and released

Two earlier listener holds expired without any phone/HTTP attempt. QA Lead then directed a direct READY-TO-PROBE handshake with the server owner. The final listener was PID874416, start15:11:11.822Z, READY15:11:12.252Z, bind0.0.0.0:4101, confirmedLAN10.15.82.5, deadline15:14:12.252Z; the owner held mutations/restarts and model timing work.

The one actual PHONE-1 app-UID request occurred2026-09-21T15:12:24.675Z–15:12:27.077Z: unauthenticated GET`http://10.15.82.5:4101/api/clock`, using existing adb solely for command control and `run-as com.gssafety.mobile`/toybox nc for the LAN socket. Phone wlan0IPv4 was10.15.82.84/17. It exited1 with **No route to host**, zero HTTP bytes, no status and no watchdog trigger. This is a valid single endpoint/UID reachability failure during an owner-held listener window; it neither proves a firewall cause nor tests Dart login/SSE, the second phone, full LAN operation or G0 latency. No ping, fallback comparison or repeat was issued.

The request process exited; RELEASE was sent directly to `/root/qa_lead/qa_server` and `/root/qa_lead` immediately after recording its result. There were no app UI/login/session/role/permission/network/firewall/reverse/camera actions. Device serial and raw outputs remain in a mode0600 local private file under a mode0700 excluded directory; the model-facing result contains only sanitized metadata. Evidence: `../../../evidence/qa/ui-device/candidate-0d42bacc/w1-lan-boundary-01.json`.

This executes only the separately granted W1 diagnostic. **W3 remains HOLD**, including browser/device UI/Blender/camera, while QA Lead/Root classify the bounded CCTV source issue. The final meaningful W3 application/LAN attempt is still separately pending. Binding readiness does not certify or waive that issue.
