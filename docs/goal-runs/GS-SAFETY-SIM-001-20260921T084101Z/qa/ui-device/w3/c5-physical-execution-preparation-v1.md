# C5 physical execution preparation v1

Owner: /root/qa_resume/w3_physical. Prepared 2026-09-21T23:12Z. This is a source-preparation record, not a C5 execution grant or verdict. The only authorized current runtime work is bounded read-only host/device transport preflight with one environment retry. No app/APK/UI/role/camera/permission/network mutation has occurred in this resumed lane.

## Read sources and fixed identity

- `qa/g0-protocol-v1.md`.
- `qa/ui-device/w3/c4-device-camera-binding-v1.md`, `c4-device-execution-mechanisms-v1.md`, `c4-android-fault-device-mechanisms-v1.md`, `c4-android-fault-proxy-v1.md`, `human-observation-boundary-v1.md`.
- `qa/ui-device/w3/c5-android-fault-proxy-{v1,guard-v1,cases-v1,voice-v1}.mjs` and `c5-android-fault-proxy-binding-template-v1.json`.
- `evidence/mobile/final-device/adb-evidence-helper.cjs` and `evidence/mobile/mobile-g2-manifest.json`.

Selected Mobile4 artifact is `build/mobile-candidate/gs-safety-1.0.0-candidate-4-debug.apk`, 186350139 bytes, SHA-256 `1d78f81eaa5d7d85a2f73d3d50b5acbbeeb4a0ea5cbbabcc538087f4fbeb515a`. Mobile source manifest SHA-256 is `bf5c0632ee554ea0b8fa671e7c5e9e29696e823ea54bd431e72452448f92151a`. Producer/historical installed evidence is not fresh C5 installed-byte proof.

The producer helper enumerates devices on every invocation and appends its producer `actions.jsonl`; it must not run unchanged. Its fresh-focus, fresh-XML, same-node bounds checks are usable patterns. An assigned QA wrapper or direct scoped commands will preserve raw output privately and publish aliases only. No credential-bearing UI dump or screen capture is allowed.

## Runtime prerequisites and exact order

1. Root C5 G3 receipt, QA verification, fresh QA-owned DB/process identity and a time-bounded W3B resource grant. Read the immutable C5 source root and staged APK selected by those receipts. Do not retain C4 candidate identity in C5 evidence.
2. Working existing ADB transport and exclusive PHONE-1/PHONE-2 mapping. Freshly record model, OS/API, authorized transport state, package paths, actual installed APK bytes, app focus and existing reverse mappings. A failed process/timeout is unknown device count, never zero phones. Reinstall, daemon changes or environment restoration need their separately assigned scope.
3. After the app-runtime grant, record initial app/settings state and use observed current UI bounds for the normal connection form. Bind PHONE-1/2 to actual WORKER-A/B ko/en from server sessions. Do not create replacement role sessions merely to inspect them. Preserve PIN/token/private serial locally.
4. READY → actual listenerSTART → one grant-bound PHONE-1 LAN attempt → probeACK/release. No preliminary ping/HTTP request, network change, or repeated LAN rounds. If unavailable/failing, use only granted USB reverse and label transport explicitly. The old C4 LAN runner is hard-bound to C4 evidence and must not be run as C5.
5. In both modes, collect fresh worker current identity and app text, open and close localized Details from the same clickable XML node, scroll to eligible controls and perform actual understanding/help/replay actions, joining immutable/current server histories. Observe pause/resume, primary replacement, background/return and reconnect. Retain failed attempts.
6. Run the frozen C5 proxy only after all guard prerequisites below. Log synthetic SSE faults separately from normal server output. Required order: DUPLICATE, REVERSE, FOREIGN-WORKER, MAP-MISMATCH, EXPIRED, VOICE-REQUEST-DELAY, VOICE-RESPONSE-DELAY. A fault must join actual APK UI/ACK/server state; proxy transmission alone is not acceptance.
7. At an actual identifiable playback moment, send parent phone alias, mode/run/guidance/primary version, locale, UTC and native callback observations for a Root-mediated heard/felt witness. No microphone or extra permissions. `voice-started` precedes native speech and is not heard speech.
8. Release worker use, then perform PHONE-1-only camera in its separate last-phase grant. PHONE-2 camera remains forbidden. Two sequentially reused phones do not establish four simultaneous roles. Camera output remains local and is never sent to model/image tools. Use metadata-only collection; stop/release via app and remove only QA-added reverse mappings.

## Minimal scoped command forms

These are documentation, not executed device commands. `GS_QA_SERIAL` is obtained only from the private authorized alias mapping; `GS_QA_ADB` is the observed usable client. Every invocation needs a host watchdog with stdout, stderr, exit/signal/error and timeout persisted privately.

```bash
"$GS_QA_ADB" -s "$GS_QA_SERIAL" shell getprop ro.product.model
"$GS_QA_ADB" -s "$GS_QA_SERIAL" shell getprop ro.build.version.release
"$GS_QA_ADB" -s "$GS_QA_SERIAL" shell getprop ro.build.version.sdk
"$GS_QA_ADB" -s "$GS_QA_SERIAL" shell pm path com.gssafety.mobile
"$GS_QA_ADB" -s "$GS_QA_SERIAL" shell sha256sum "$GS_QA_OBSERVED_APK_PATH"
"$GS_QA_ADB" -s "$GS_QA_SERIAL" shell date +%s%3N
"$GS_QA_ADB" -s "$GS_QA_SERIAL" reverse --list
"$GS_QA_ADB" -s "$GS_QA_SERIAL" shell dumpsys window
```

APK path must come from that phone's successful fresh `pm path`; enumerate and match any splits explicitly. Bracket device UTC with host UTC and include clock-read precision in the bound; never adjust device clock. Future app-granted operations:

```bash
"$GS_QA_ADB" -s "$GS_QA_SERIAL" shell uiautomator dump /sdcard/gs-c5-qa-ui.xml
"$GS_QA_ADB" -s "$GS_QA_SERIAL" pull /sdcard/gs-c5-qa-ui.xml "$GS_QA_PRIVATE/ui.xml"
"$GS_QA_ADB" -s "$GS_QA_SERIAL" shell input tap "$GS_QA_NODE_X" "$GS_QA_NODE_Y"
"$GS_QA_ADB" -s "$GS_QA_SERIAL" reverse tcp:4103 tcp:4103
"$GS_QA_ADB" -s "$GS_QA_SERIAL" logcat --pid="$GS_QA_APP_PID" -v epoch 'TTS:D' '*:S'
```

Require confirmed app focus and a successful fresh dump; do not reuse stale XML. Inputs use current enabled/clickable bounds. PIN entry is private with no captured credential UI. Camera phase uses no screen capture. Stop only the owned native log collector and never clear shared logcat.

## Proxy guard blockers at preparation

The C5 derivative currently has a binding template whose status is `PENDING_C5_G3_AND_QA_LEAD_RECEIPTS`. The required `c5-android-fault-proxy-v1.freeze.json` is absent at this observation. No proxy launch is possible until the source freeze and proper binding exist. Its guard requires:

- New Root C5 receipt and manifest/APK selection, plus verified QA lead receipt; source/build/candidate and every hash must agree.
- Binding path below this `w3` directory, correct C5 evidence root, preserved C4 source freeze and matching reviewed mobile/wire source hashes.
- Original W3B parent grant and authorized fault subgrant with exact logical issuers expected by the guard (`/root/qa_lead`, `/root/qa_lead/qa_ui_device`). Resumed owners must resolve delegation explicitly; do not forge old ownership fields merely to satisfy code.
- Actual process PID/start ticks/cwd and ownership of 4103, private DB/credentials under the C5 evidence root, current APK receipt within 30 minutes, and device UTC receipt fresh enough for five-minute injection bounds.
- Existing dedicated fault-proxy output, exclusive 4105, actual one-phone worker session, and at most 30-minute subwindow inside the parent grant. One attempt only.

Future command form:

```bash
node qa/ui-device/w3/c5-android-fault-proxy-v1.mjs --binding "$GS_QA_C5_BINDING" --freeze "$GS_QA_C5_FREEZE" --grant "$GS_QA_C5_FAULT_GRANT"
```

Run from the run directory or use the full script path. Baseline hashes must be freshly observed within three seconds. Injected SSE observation/recovery is bounded to five seconds; voice release must occur within nine seconds of actual request capture, before the mobile 12-second timeout. Missed clocks/windows remain inconclusive/NOT_RUN, not silently retried. Recovery after map invalidation may need a genuinely new primary or explicit authorized reconnect; a same-event replay need not restore the UI.

## Non-substitutable missing physical evidence

Four phones with separate CCTV, Controller and two simultaneous Controlees; 180-second actual two-peer ranging; the measured 140 cm × 50 cm table and offsets/yaw; 810 independent calibration samples; and guidance-version-bound heard/felt witness remain required. Two phone observations, model assumptions, synthetic positions, native callback success, or a virtual viewport cannot replace them. Metadata-only image-load/rAF is a render proxy, not full physical capture-to-display proof.
