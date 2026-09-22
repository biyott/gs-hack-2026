# C4 Android and camera binding v1

Owner: /root/qa_lead/qa_ui_device. Run GS-SAFETY-SIM-001-20260921T084101Z. Prepared 2026-09-22 Asia/Seoul. **Source-only preparation; all C4 W3B/W3C execution described here is NOT_RUN.** No adb, phone, browser, network/LAN, app/model/runtime, camera, Blender or test command was run. This note changes only its own additive file.

Apply the [original device/camera cases](device-camera-plan-v1.md), [C3 camera limits](c3-camera-static-preflight-v1.md), [human observation boundary](human-observation-boundary-v1.md) and frozen G0. This C4 binding replaces their old candidate selection for future assigned execution, not their historical results. No new phone, permission, fixture adapter, witness or phase grant is assumed.

## Exact C4 and Mobile4 identity

Root receipt: /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/g3-freeze-c4.json, issued2026-09-21T17:12:03.258Z.

| Item | Binding |
| --- | --- |
| Candidate | sha256:cd8a2428d3d9e44703c25b4ae135f0ed5821b6b3b3794bbca6abc1ec37197eba |
| Frozen root | /home/b/.cache/gs-safety-c4.q2FD40 |
| Source aggregate / build | e17322b2faf5b5181f6a50bcd5cd4baeae2ca31f57f7bfd1653399b4e9e28efa / czkc6DgDv3UUlTrSfDMqX |
| Staged manifest | /home/b/.cache/gs-safety-c4.q2FD40/runtime-artifacts/candidate-manifest-c4.json; direct SHA-256 a4ae231987936e6a91cc05ff380eb71a69597c7e689e315dd6e21e7222d0b53d |
| Mobile selection | /home/b/.cache/gs-safety-c4.q2FD40/runtime-artifacts/mobile-build-binding.json; direct SHA-256432d42b846b4c40bd1353ce83cf0fbdc52d0ea15268fbfd5a3d716d1115ae72b |
| APK | /home/b/.cache/gs-safety-c4.q2FD40/build/mobile-candidate/gs-safety-1.0.0-candidate-4-debug.apk; direct SHA-2561d78f81eaa5d7d85a2f73d3d50b5acbbeeb4a0ea5cbbabcc538087f4fbeb515a |
| Mobile source manifest | /home/b/.cache/gs-safety-c4.q2FD40/runtime-artifacts/mobile-candidate-4/candidate-4-source-sha256.txt; direct SHA-256bf5c0632ee554ea0b8fa671e7c5e9e29696e823ea54bd431e72452448f92151a |
| Contract binding | Existing1.0.4 with implementation r3 for QD008; retain r2 camera-source correction,1.0.3 stop intent,1.0.2 angular semantics; no new public wire/schema/goal/G0 meaning |

The direct file hashes above agree with the receipt/selector. This is not an installed-phone check or whole-manifest audit. Root explicitly declares Mobile4 unchanged and requires fresh C4 physical integration. C4's deferred optional enrichment/applicability correction does not prove Android latency or supplement behavior: the primary must still appear independently and a same-primary supplement must not repeat the primary alert/speech.

Read source under the C4 root only. Direct supporting hashes: app/api/tracking/frame/route.ts =2b504f8e5e36cf668bd66957205da0b1c88b8d208cbc19d63f8dacf907b858ab; apps/mobile/lib/services/speech_service.dart =87fb4193fa02538f1e4f57a15f4f7872992360ec537f047e956ee70592a4d174; apps/mobile/lib/services/guidance_ack_service.dart =1e0879cae92dcb3363166c5c4f8518fce3711965f37385fa4fb28c5852c8850e; apps/mobile/android/app/src/main/kotlin/com/gssafety/mobile/NativeCctv.kt =58368ca66e21b29fc1ebf34fe3b3db42e9002904b3dd552f2bf8413de2cd76bb. They support the extraction/adapter limits below; no source was executed.

## Executable path after a separate W3B grant

Use the already evidenced adb /home/b/.local/share/gs-safety-sdk/android/platform-tools/adb only after exclusive PHONE-1/PHONE-2 handoff, private alias mapping and actual transport availability. Do not enumerate unrelated devices or start/reconfigure an adb server. Prior models PHONE-1 SM-N986N/API33 and PHONE-2 SM-S926N/API36 are historical until reobserved. Parent owns the assigned4103 C4 process/DB and any8092 use; no parallel phone controls, broad tests, builds or model timing workloads.

1. Record actual phase grant, process/BUILD_ID/DB identity, browser contexts, phone aliases, observed initial role/app/settings/output state, existing reverse rules and capture privacy. Obtain private credentials through the assigned local path, never logs/screenshots. Do not change Wi-Fi, OS voices, permission state or media volume as an implicit preflight action.
2. On each available phone, inspect package paths and installed content hash. Single-base APK bytes must match Mobile4; record split APKs explicitly if present. Existing install success/version labels are insufficient. Reinstall only if assigned and necessary, then rehash. Preserve settings and prior evidence.
3. Use actual current UI node bounds for actions and fresh XML for results. Require the app foreground before extraction; never read a stale dump after failure. No screen/XML capture while a credential is present. Record Details/상세 정보 label and click action on the same node, then actual sheet opening, closing and return.
4. Run the normal connection form against the assigned QA endpoint using local credential entry. Bind worker A/B from the server-confirmed session, not phone model assumptions. Default working mapping is PHONE-1→WORKER_1/WORKER-A ko and PHONE-2→WORKER_2/WORKER-B en, but record actual assignment.
5. Read scoped simulation/SSE and per-worker response histories through the assigned QA readers; use separate admin/admin-2 contexts against the same application for current/history joins. Do not create a new occupant of a worker role just to inspect it: login replaces that role's old session.

The command patterns below are documentation, not executed commands. Variables are filled privately after grant; stdout/stderr go to QA-owned local paths first.

```bash
GS_C4_ADB=/home/b/.local/share/gs-safety-sdk/android/platform-tools/adb
"$GS_C4_ADB" -s "$GS_C4_SERIAL" shell pm path com.gssafety.mobile
"$GS_C4_ADB" -s "$GS_C4_SERIAL" shell sha256sum "$GS_C4_OBSERVED_BASE_APK"
"$GS_C4_ADB" -s "$GS_C4_SERIAL" shell dumpsys window > "$GS_C4_PRIVATE/focus.txt"
"$GS_C4_ADB" -s "$GS_C4_SERIAL" shell uiautomator dump /sdcard/gs-c4-ui.xml
"$GS_C4_ADB" -s "$GS_C4_SERIAL" pull /sdcard/gs-c4-ui.xml "$GS_C4_PRIVATE/ui.xml"
"$GS_C4_ADB" -s "$GS_C4_SERIAL" shell input tap "$GS_C4_NODE_X" "$GS_C4_NODE_Y"
```

Select observed bounds after checking enabled/clickable, not stale coordinates; use the current scroll container for bounded swipes and re-dump before tapping footer controls. A coordinate tap proves the resulting interaction, not a hidden accessibility action list. If XML cannot establish the required same-node action, keep that aspect unresolved for an assigned accessibility inspector. Camera-free worker/setup/Details screenshots can support visual review only after exact-target provenance/secret checks; no screenshot of real camera content.

The producer helper evidence/mobile/final-device/adb-evidence-helper.cjs demonstrates fresh XML extraction and bounds-based actions, but enumerates devices and appends producer actions.jsonl. Do not invoke it unchanged for C4. Direct assigned commands above remain usable; a reusable QA-owned alias/action/redaction wrapper is not supplied by this note.

### Final LAN retry handshake

Use **READY → listenerSTART → probeACK** explicitly:
- READY: UI/device owner confirms the named phone participant(s), installed identity, usable private control/credentials and ability to execute now. Report readiness to QA Lead/runtime owner; do not request an idle listener hold before phones are ready.
- listenerSTART: runtime owner acknowledges the actual C4 listener is serving at the precise granted LAN address/port, with PID/build/start/expiry and local readiness already established. This is a serving-state receipt, not a demand to restart an already valid4103 process.
- probeACK: execute the **one coordinated meaningful final application/LAN retry**, only on the participant list in the grant, and immediately return each actual phone result with UTC, endpoint, timeout/HTTP/application disposition and whether any session formed. Do not add a preliminary shell HTTP/ping probe or repeat rounds. A missed/expired hold is NOT_RUN, not a failed phone request; arrange a valid owner window rather than sending into an absent listener.

No Wi-Fi/network/router/firewall/hotspot/saved-network changes. The earlier C2 app-UID No route to host result stays preserved; it is neither this final retry nor evidence of C4 reachability. A host response or ping does not prove phone HTTP/app success. If the final LAN attempt fails, record it and continue feasible software/phone work through assigned USB4103 with explicit transport labels; no further LAN retry.

Only within the later phone grant, add/remove the QA-owned reverse rule as needed:
```bash
"$GS_C4_ADB" -s "$GS_C4_SERIAL" reverse tcp:4103 tcp:4103
# Explicitly enter http://127.0.0.1:4103 in the app for USB work.
# Remove only this window's added rule at release:
"$GS_C4_ADB" -s "$GS_C4_SERIAL" reverse --remove tcp:4103
```

## W3B two-mode actions and extraction

All rows are NOT_RUN. Execute equipment and fire-gas with the actual two-phone role mapping; do not replace Android observations with browser/test results.

| Sequence | Actions and records |
| --- | --- |
| Mapping/current primary | Confirm server worker/run/mode/profile locale and app identity; record streamId/sequence, guidanceId/guidanceVersion/primaryGuidanceVersion/updateKind, current action, route or valid no-route state. Observe both phones in both modes. Separate scenario10Hz positions from physical source. |
| Details/footer/action responses | Open same-node localized Details, close and return; activate role/device/language controls after sheet dismissal. Scroll and exercise eligible understanding, help, replay and arrival separately; record enabled/disabled state and corresponding server actor/time/primary response. Receipt, understanding, accepted support and arrival remain distinct. |
| Ordering/primary versus supplement | Record duplicates/rebuild/high-rate position updates and eligible delayed supplement: current primary stays authoritative, immutable first guidance remains, no unrequested replay. Reset/new run and reconnect cannot adopt old streams/versions. Explicit stale/foreign/expired/map-mismatch injection requires its assigned adapter; normal reconnect alone does not cover the complete fault matrix. |
| Pause/replacement/replay | Pause active and preparing/queued phases separately; replace primary/route separately; resume, reconnect and explicit eligible replay. Record local visible state, server stop intent/history, observed native events and current primary. Preserve the expected old completion interval. Do not infer actual silence or a delivered obsolete callback from missing logs. |
| Foreground/lifecycle | Home/background then deliberate return to this app, Details role exit and logout/reauth through the assigned path. Observe cleanup/current recovery and expired/ineligible controls. Changing modes/roles resets endpoint/setup defaults: reenter the actual QA endpoint and bind the new session. Do not attribute lost focus or an unrelated system screen to app behavior. |
| Locale/preferences/fallback | Change server-confirmed ko/en profile and observe current text, requested speech language and stale-locale invalidation. Setup language toggle is a separate setting. Voice/vibration preference disabled is a supported state, not TTS engine failure or unsupported hardware. Confirm truthful statuses and retained screen guidance for any actually encountered failure. |
| Vibration UI and physical witness | Record preference/capability/request/local status and callback context, then route an actual version-bound human observation through QA Lead/Root. API success and an active label are not felt vibration. |

Metadata extraction has three concrete existing paths:
- **UI:** fresh per-attempt UIAutomator XML, sanitized semantic text and node bounds; camera-free visual captures only after checks. Record extraction time/foreground/locale, not a manufactured first-visible time.
- **Server:** authenticated GET /api/simulation?mode=equipment or fire-gas and the matching /api/events?mode=… stream through existing assigned sessions; per-worker response records from QA-owned server/DB reader. Preserve requestId, actor, occurredAt/receivedAt, primary identity, stop marker and immutable first/current records. Do not expose session tokens/cookies or log all HTTP bodies indiscriminately.
- **Native TTS:** staged flutter_tts logs tag TTS with utterance UUID for started/completed/stopped callbacks. After grant, obtain the current app PID privately and collect only that PID/tag, for example adb logcat --pid=<observed-app-pid> -v epoch 'TTS:D' '*:S' into a private file. Stop only the owned collector at the interval end; do not clear shared logcat or kill the app. Redact/allowlist before review. These UUIDs are not wire primary IDs; correlate with a controlled single-primary interval and server/UI records and preserve any mapping ambiguity.

Source detail matters: GuidancePlayback publishes playing before awaiting SpeechService.speak; GuidanceAcknowledgements maps playing to voice-started and posts to /api/workers/{workerId}/response. This is a coordinator report, not proof Android onStart or audible sound occurred. The plugin logs are inside utterance-registry dispatch, so absence does not prove a callback arrived and was rejected before logging. Native UUID→primary binding and explicit raw rejected-callback arrival are not automatically available.

## Exact unresolved adapters; do useful normal observations first

| Adapter/observation | Existing seam and unresolved part |
| --- | --- |
| Delayed voice-start ACK | GuidanceAckService posts immediately; no source-read installed-app hold/release control is established. Need an approved QA-only transport adapter that holds the actual bound worker voice-started POST, records its generation/primary/requestId, then releases after pause or rapid resume and records server disposition. Directly posting a fabricated ACK is separately labelled server testing, not the real app's delayed transport. No proxy/process or network change is started by this note. |
| Explicit obsolete completion | flutter_tts registry/coordinator generation guards exist in source/tests, but no APK4 external callback-injection control is identified. Need an assigned fixture for actual old callback delivery/arrival/disposition. Replacement with zero subsequent completions is narrower evidence; spontaneous callbacks may be recorded without claiming the unexercised injection case. |
| Duplicate/reverse/foreign/map/expiry stream faults | Existing software fixtures are not an Android fault-delivery adapter. Need a sanctioned QA stream/transport fixture with current-session ownership and event identity, separate from normal authoritative server mutations. Preserve its synthetic/fault scope and do not edit the candidate. |
| Missing ko/en voice / TTS failure | SpeechService calls isLanguageAvailable, setLanguage and speak; exceptions map to failed, false availability to unsupported. Existing test SpeechPort fakes do not operate the installed APK. No runtime fault switch was found in these service/playback files. Need an assigned fixture/owner method or an actually encountered OS error; do not remove voice data, change engines, stop OS services or grant permissions to manufacture failure. Profile voice-off and setup locale changes do not substitute. |
| Vibration failure / unavailable | Source has capability and request paths; flags/mock ports cannot prove a real hardware failure or felt output. Use actual reported unavailable/failure if encountered, or an assigned software adapter labelled as such. No new device is assumed. |
| Native camera metadata extraction | DeviceTrackingController holds lastFrame in memory; the standard device screen displays observation/source/lastObserved/clock uncertainty, not the complete raw lastFrame map. A reliable per-frame native event export with timestamp-source association is not established. UI dumps alone cannot extract fields absent from the widget tree. Authorized server records give only the persisted subset. |
| True browser presentation | Metadata-only image-load/next-rAF collection can supply a labelled proxy, not physical paint. No sensor-origin-to-physical-presentation collector/apparatus is assumed. |

These gaps keep their specific cases NOT_RUN/BLOCKED; they do not stop the feasible normal two-phone mapping/actions/lifecycle/current-state observations, and they do not authorize a new APK or product edits.

## Human observation at the actual playback moment

Follow human-observation-boundary-v1.md: at a concrete playback moment, send QA Lead and Root the phone alias, scenario/run, guidance ID/version/primary version, locale, actual UTC, expected speech/vibration and observed callbacks. Root may then ask one concise question about that exact output. Do not ask during preparation/repair or use a general earlier statement as current evidence. Heard/felt evidence covers only the witnessed instance/environment; silence, uncertainty or mismatch remains explicit. **No microphone capture, recording permission or camera expansion.**

## W3C last, PHONE-1 only

W3A synthetic full-surface review and W3B camera-free worker checks finish first. A separate W3C grant transfers PHONE-1 to CCTV; PHONE-2 camera is forbidden even if an OS flag is granted. Stop/release PHONE-1's prior worker role explicitly and record the reduced workload. Do not claim two workers plus CCTV or four concurrent roles from sequential reuse.

Obtain a fresh app clock synchronization at actual camera start; record raw/corrected times, offset, uncertainty, synchronization age and discontinuity. For each mode collect the original30s warmup +180s measured interval, counters and per-frame identifiers. Native upload success is empty204; obtain corresponding metadata through authorized admin/operator/support/observer readers and JPEG identity only through admin/operator/observer. Join frameId/stream/sequence to camera/DB/browser records; source=live is authenticated channel provenance, not pixel or accuracy attestation.

Preserve source branch sensor_realtime versus frame_acquired when actually observed; NativeCctv adds captureTimestampSource only to native event data, not upload/persisted records. capturedAt/capturedElapsedNanos alone cannot recover the branch. Server receipt, derived processedAt and upload completion are different endpoints. Browser image load/next-rAF remains a proxy with physicalPaintObserved=false; it cannot certify full capture-to-render. Clock uncertainty≤50ms and same-frame complete joins remain necessary for that G0 claim; otherwise report only the narrow measured interval and retain the gap.

Real camera pixels/preview/containing screenshots stay local; no image tools, reviewer prompts, screenshots in traces, screencasts or canvas extraction. Use sanitized metadata for model-facing W3C evidence. After actual input, model visual review needs a verified tight camera-free target or a fresh verified synthetic-only instance; stopping capture does not remove the last JPEG.

Two actual phones can establish partial-device software behavior and available PHONE-1 capture. They cannot supply Controller + two simultaneous Controlees + separate CCTV. Four-phone180s workload, real ranging, measured140cm×50cm grid/mount/offset/yaw calibration and810 independent accuracy samples remain unavailable until actual resources are supplied; no new resources are presumed.

## Practical occupancy estimate and release

These are active scheduling estimates for an already assigned C4 server/DB, working phone control and prepared recorders, not measured durations, timers, deadlines or acceptance budgets:

| Exclusive window | Estimate and scope |
| --- | --- |
| W3B PHONE-1/PHONE-2 |30–45min for installed identity/setup, coordinated final LAN handshake/attempt and any labelled USB setup, both-mode mapping/actions/Details/footer, locale/lifecycle/pause/current-state traces and available version-bound human witness. This estimate excludes building missing injection adapters and waiting indefinitely for a witness. |
| W3C PHONE-1 |12–20min for role/clock setup, two-mode camera collection, metadata joins and stop/release. The two30+180s windows alone require7min of actual collection. |
| Combined device occupancy |Approximately42–65min after prerequisites, with release as soon as a lane ends. More cases, a real failure or missing resources require a recorded disposition; no automatic extra retry or deadline-driven verdict. Stored evidence analysis should continue after release where possible. |

No current live phone availability, charge/unlock state, actual app/model/process occupancy or apparatus presence was measured in this source-only task. Parent must obtain the real handoff before reserving those estimates. If a collector/origin/witness gap prevents a particular claim, release rather than retaining idle phones while assuming it will appear.

At assigned release, stop camera/UWB via the app, preserve logs/counters, pause QA modes as directed, disconnect only QA sessions, remove only QA-added reverse rules and restore only explicitly authorized test adjustments. Record final phone ownership/settings/transport and retained-camera privacy state; preserve failures and DB/evidence. All execution and overall acceptance remain with their assigned owners and QA Lead.
