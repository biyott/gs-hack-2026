# W3B Android and W3C camera execution protocol v1

Owner: /root/qa_lead/qa_ui_device. Prepared 2026-09-21 for candidate 70da1337. **PREPARATION ONLY — every execution case is NOT_RUN.** This document does not grant app, device, browser, model, runtime or network control. Its commands are future commands and have not been invoked by this preparation.

This additive protocol binds [resource schedule](../../g3-resource-schedule-v1.md), [camera timing](../../camera-timing-binding-v1.md), [Android card](../ac09-android-guidance.md), [four-phone card](../ac13-four-phone-measurement.md), [pause observations](../ac09-pause-audio-evidence-amendment-v1.1.md) and [published stop/privacy rules](../ac09-15-contract-privacy-amendment-v1.2.md). Original G0, previous failures, earlier APKs and producer evidence retain their scope. Only QA Lead issues an overall verdict.

## Exact identity and entry gates

| Item | Binding |
| --- | --- |
| Frozen product root | /home/b/.cache/gs-safety-ci.u7pR52; product reads and later launch use this root only |
| Candidate | sha256:70da1337ab54652824ffb49f65cb0213822ba7c2420ae345664dbe7c48c893af |
| Canonical manifest | runtime-artifacts/candidate-manifest-build04.json; file SHA-256 bc87dfe5caf85654a2ab96b345d141f6f182c0332c88798dc2ceacb51fd83849 |
| Source aggregate | af06052baf673b40b33f8a4bb9f095b4239ff622d82fec492de6d42caeb92584 |
| Root receipt | run-root g3-freeze-build04.json; parent reports 904 source and 471 artifact entries validated |
| Mobile4 | build/mobile-candidate/gs-safety-1.0.0-candidate-4-debug.apk; 186350139 bytes; SHA-256 1d78f81eaa5d7d85a2f73d3d50b5acbbeeb4a0ea5cbbabcc538087f4fbeb515a |
| Mobile source manifest | runtime-artifacts/mobile-candidate-4/candidate-4-source-sha256.txt; SHA-256 bf5c0632ee554ea0b8fa671e7c5e9e29696e823ea54bd431e72452448f92151a |
| Contract | revision 1.0.3; snapshot wire contractVersion remains 1.0.0; retain angular clarification 1.0.2 |
| Contract freeze file | docs/contracts/freeze-v1.0.3.json; SHA-256 9c074b761a1bfa7870066add68c75ea4a08b8595eaa6acdc52c2c167847f16bf |

Preparation directly read the build04 candidate/source fields and hashed its manifest, selected APK and contract freeze file. This is not an installed-device check or a repeated aggregate audit. Do not select runtime-artifacts/candidate-manifest-final.json: its independently read file hash is 27a9c655515fe9ca50cd5c1d62d44ade09bfe8116208877ca56ab222c3b9c01f and it is not the assigned build04 manifest.

Before W3B, obtain the phase-specific written grant and actual handoff: QA-owned 4103 production process and fresh DB/private credentials, exclusive PHONE-1/PHONE-2 control, release of competing measured workloads, and 8092 assignment only if needed. Record process/build/DB/browser identities, actual occupancy and UTC/monotonic window bounds. W3A synthetic full-surface work finishes first. Do not start or rebuild the application, invoke tests or model calls, install an APK, query adb, launch a browser or change a phone while this packet remains preparation.

Producer handoff reports PHONE-1 SM-N986N/API33 and PHONE-2 SM-S926N/API36, Mobile4 on both, paused worker A/B USB sessions to dev3000, camera stopped, media volumes 15/0 and Wi-Fi enabled on the saved network. Reobserve after grant; do not turn these reports into independent findings. Keep permanent serials, bearer tokens, PINs, cookies and session secrets out of evidence. Root authorizes UWB on both and CAMERA on PHONE-1 only. The actor who set earlier permission flags remains unknown. PHONE-2 camera stays unused regardless of OS state.

## W3B sequence and concrete future commands

One owner executes device controls; witnesses observe through that owner. Fill the private phone-alias mapping, absolute adb path and QA evidence paths after grant. Do not print the private mapping or secrets. The following command examples operate only after that grant:

```bash
GS_W3_STAGE=/home/b/.cache/gs-safety-ci.u7pR52
GS_W3_APK="$GS_W3_STAGE/build/mobile-candidate/gs-safety-1.0.0-candidate-4-debug.apk"
sha256sum "$GS_W3_APK"
"$GS_W3_ADB" -s "$GS_W3_SERIAL" shell pm path com.gssafety.mobile > "$GS_W3_PRIVATE/package-path.txt"
"$GS_W3_ADB" -s "$GS_W3_SERIAL" shell getprop ro.product.model
"$GS_W3_ADB" -s "$GS_W3_SERIAL" shell getprop ro.build.version.sdk
"$GS_W3_ADB" -s "$GS_W3_SERIAL" reverse --list > "$GS_W3_PRIVATE/reverse-before.txt"
```

For each alias independently, parse package-path.txt locally, record every returned split/base path privately, and use the actual returned path in the next command. If a single base APK is present, its content hash must match Mobile4. Multiple splits require explicit artifact matching; versionName, package name or installation success alone are insufficient.

```bash
"$GS_W3_ADB" -s "$GS_W3_SERIAL" shell sha256sum "$GS_W3_INSTALLED_BASE_APK"
# Only if final-byte verification requires the assigned reversible installation:
"$GS_W3_ADB" -s "$GS_W3_SERIAL" install -r "$GS_W3_APK"
# Then repeat pm path and installed-byte hashing before any behavioral test.
```

Record installed-byte evidence both before and after the slice. On-device hash failure is a setup gap, not permission to claim equality from the host APK. A later approved pull to private local storage can establish equality without opening the APK or exposing private paths.

**One coordinated LAN attempt:** wait until the final QA endpoint is actually listening and locally reachable. Record its assigned address and bind address; do not reuse the producer 10.15.82.5:3000 address as an assumption. Use the final app's connection form once per assigned phone as part of one coordinated attempt, with worker A/B, explicit mode and private QA access code. Record UTC, exact endpoint, transport LAN, request/response or timeout/error, app connection state, server session and matching run/stream/sequence. A host curl, Wi-Fi-enabled flag, ping or USB connection is not phone LAN success. No router, firewall, saved-network, hotspot or other network configuration changes are authorized; no repeated LAN attempts in this window.

If LAN fails, preserve its exact result and continue useful tests over separately labelled USB. Add only QA's 4103 rule; preserve inherited dev3000 rules and record their owner. The app URL must be explicitly entered again after role changes.

```bash
"$GS_W3_ADB" -s "$GS_W3_SERIAL" reverse tcp:4103 tcp:4103
# In the assigned phone's connection form: http://127.0.0.1:4103
# At release, remove only the rule this window added:
"$GS_W3_ADB" -s "$GS_W3_SERIAL" reverse --remove tcp:4103
```

Sanitized semantic dumps may support node/action inspection. Do not capture screenshots during credential entry or dump the login form while a credential is present. Store raw XML locally, redact private fields before any model-facing read, and never pair this with a screenshot of real camera content.

```bash
"$GS_W3_ADB" -s "$GS_W3_SERIAL" shell uiautomator dump /sdcard/gs-w3-ui.xml
"$GS_W3_ADB" -s "$GS_W3_SERIAL" pull /sdcard/gs-w3-ui.xml "$GS_W3_PRIVATE/ui.xml"
# Tap coordinates come from the observed current target bounds, not prior captures:
"$GS_W3_ADB" -s "$GS_W3_SERIAL" shell input tap "$GS_W3_TAP_X" "$GS_W3_TAP_Y"
```

A tap is a functional test, not proof that Android accessibility exposes a semantic click action. Retain the exact node's path/bounds/label/clickable/enabled attributes and, when available, its accessibility action list and node-directed invocation. If the extractor cannot expose action semantics, keep that aspect unverified and obtain an assigned accessibility inspector; do not infer it from a sibling/ancestor label or a source unit test. Physical scrolling/tapping and local-human readability observations are recorded separately.

| Case | Actions and exact observations; all NOT_RUN |
| --- | --- |
| W3B-01 final identity/transport | Bind both installed APK hashes, model/API, initial app/role/mode/locale, permission states and unknown historical grant actor. Record the one coordinated LAN attempt and separate USB fallback sessions. |
| W3B-02 Details same node | On both phones in ko/en, find the actual interactive Details/상세 정보 node. On that same node establish the localized accessible label and actionable/enabled state, then invoke it and observe the details sheet. Preserve node ID/path, bounds, label, action and result together; source Icon.semanticLabel and a neighbouring clickable node are insufficient. Close via labelled control and Android Back separately; verify return/focus and no stale sheet overlay. |
| W3B-03 details navigation/footer | In both locales, scroll details to Change role/역할 변경, Device capabilities/기기 기능 확인 and language control. Invoke each; exactly the requested screen/action appears after sheet dismissal, with working return path. Role change clears credentials and resets setup defaults: explicitly reenter QA endpoint/role. On worker screen, scroll to I understand/안내 이해 확인, Replay guidance/다시 듣기, Confirm arrival/도착 확인 and Request assistance/도움 요청 at actual display/text scale; record bounds, clipping, enablement and successful intended activation. Preserve intact destination tokens such as REFUGE-01; wrapping a separate suffix is evaluated for readability/operability rather than automatically failed. |
| W3B-04 modes/locales/lineage | Execute equipment and fire-gas with A ko and B en, then an assigned server profile-language change. Setup language is distinct from server-confirmed guidance locale. Record runId, workerId, guidanceId, guidanceVersion, primaryGuidanceVersion, updateKind, profile version, streamId, sequence, current action/route and fallback label. Waiting instructions invent no route. At least 20 primary versions/mode are required for dispatch-to-visible p95 ≤1000ms; screen visibility and speech start are separate endpoints. Clock uncertainty ≤50ms or mark timing inconclusive. |
| W3B-05 pause/replace/cancel | Exercise active long valid utterance and separately warning/preparing/queued stages, then pause; separately replace primary/route. Record coordinator stop/queue invalidation, callback identity/arrival/disposition, local status, server voiceStatus/voiceStopRequestedAt, and both admin displays/history. Without an assigned audible witness, active speech is only callback-reported and actual cutoff/no overlap remains NOT_RUN/BLOCKED. Preserve old expected completion window. |
| W3B-06 race/replay/supplement | Use an approved fixture to hold then release actual voice-started after pause and after rapid resume. Deliver an explicit obsolete completion after replacement and reset; record actual arrival/rejection, not merely zero accepted completions. Resume/reconnect does not play backlog; explicit eligible manual replay is observed separately. Paused/expired/wrong-map/target replay stays ineligible. Rebuild, duplicate, 10Hz position updates and a valid supplement do not retrigger the primary. Fixture coverage remains software-labelled; missing adapter leaves that variant NOT_RUN. |
| W3B-07 lifecycle/locale/error | Background/foreground, disconnect/reconnect, role change and logout; record the single current SSE ownership and superseded-callback handling. Restore newest valid guide without old-locale queue or expired response activation. Separately use assigned missing-voice/TTS/sound/vibration failure fixtures; current text and supported modalities remain, unavailable/fallback labels truthful. Do not alter user OS voices/settings without an assigned reversible procedure. |
| W3B-08 response/history joins | Select understanding, help request, support acceptance and arrival separately when eligible. Join actor/time/current primary to server/DB and two admin contexts. Receipt ≠ understanding, help request ≠ support accepted, completion ≠ arrival. Preserve immutable firstGuidance and original speech history before/after pause, supplement, refresh, new primary and any assigned restart. |

Contract1.0.3: stop-requested means server intent with device outcome unconfirmed. Record actual labels, including the published 의미 “중지 요청 · 기기 확인 없음 / Stop requested · device unconfirmed.” The first voiceStopRequestedAt survives same-primary supplement/pause/resume/recovery. A delayed start cannot regress a stop-marked current state to playing. Genuine guarded current terminal reports remain factual; do not reject one solely because stop was requested. Local manual replay creates no new server playback-attempt ID and need not clear the marker. New primary resets its own response. No new voice-cancelled event is required.

Actual heard language/words/cutoff/no overlap and felt vibration require separately assigned local observation. Requested locale, volume, OS completion, coordinator cancellation and visible labels cannot substitute. Capture/witness details and local-only output paths belong in phone-observations.v1.csv; raw pause traces retain the earlier dedicated templates.

## W3C last: camera, clocks and per-frame joins

Run only after W3B release and a W3C grant. PHONE-1 alone may become CCTV. Stop/release its worker session explicitly; this reduces the already partial workload and cannot count as four concurrent roles. PHONE-2 camera remains unused. Preserve full synthetic visual review before real frames enter 4103. Treat app preview, server last JPEG and browser cache as real-camera-exposed afterward, including after stop/reset.

For each mode, record 30s warmup followed by a continuous 180s measured interval with actual wall/monotonic bounds, source/role count/transport and resource conditions. Target 8fps in code is not measured 5–10 received fps. Record start/end received counters, full interval and one-second counts where available, unique joined frames, dropped/error/replaced frames and every collector gap. Do not calculate coverage from only observed fast frames or relabel late frames as warmup.

| Stage and frozen source | Actual observations required and limits |
| --- | --- |
| Native origin: apps/mobile/android/app/src/main/kotlin/com/gssafety/mobile/NativeCctv.kt readFrame, lines 171–190 | Read the actual CameraCharacteristics.SENSOR_INFO_TIMESTAMP_SOURCE and chosen branch. Code uses Image.timestamp in ns only when REALTIME and valid; otherwise sampled elapsedRealtimeNanos at frame acquisition. Preserve raw image timestamp if obtainable, capturedElapsedNanos, acquisition sample, branch and clock domain. Do not infer an exposure origin from capturedAt or from a source branch that was never observed. |
| Origin reporting | Native UI events add captureTimestampSource from mutable run.timestampSource on upload completion; the upload payload/server DB do not persist this field. A source label must be correlated to its frame and its association limits stated. If a collector cannot observe it reliably for a frame, origin is unknown; per-frame sensor origin is not established by static source. |
| Device conversion: NativeClockGuard.kt and tracking_clock.dart | Raw wall ms + midpoint elapsed ns sample (up to 3 samples, narrowest span); wallTime = wallNow − floor((now − captured)/1e6). /api/clock uses 3 probes, best minimum full RTT; offset = serverAt − device receipt UTC, uncertainty = full RTT (not assumed half RTT). Native upload adds offset in ns and abs clock residual to uncertainty. Retain raw/corrected UTC, all available probes, selected probe, synchronizedAt/age, residual, sample span and clock-change events. Missing raw fields stay blank with reason. |
| Encode/upload: NativeFrameUploader.kt | frameId = uploader stream UUID + sequence. Retain native frame/run/device/stream IDs, capturedElapsedNanos, encodeMs, jpegBytes, uploadMs, processingMs, captureToUploadMs, completion UTC/elapsed, HTTP result and counters. encodeMs starts before validation/JPEG encoding; it is not an instrumented exposure-to-encode duration. Upload completion is after HTTP response. Separate native busy/throttle/acquireLatest losses, uploader errors and server rejects; unavailable upstream counts stay unknown. Never print jpegBase64/body. |
| Server: app/api/tracking/frame/route.ts and src/server/tracking/service.ts | receivedAt is Date UTC after request JSON parse/auth, before ingest; it is not socket-first-byte time. camera-frame DB payload retains capturedElapsedNanos/captureClock/camera metadata without JPEG. processingMs is monotonic ingest decode/derive interval; processedAt is receivedAt + processingMs, a derived value, not separately observed publication. DB append and synchronizeTracking follow ingest. Separate actual observed receipt/DB/publication times from those missing or derived. |
| Browser identity: camera-panel.tsx and tracking-view.ts | URL includes cameraId/frameId/streamId/sequence/receivedAt; JPEG GET response headers x-frame-camera-id, x-frame-stream-id, x-frame-sequence and x-frame-id identify actual bytes. A superseded request returns409 and is retained as replaced/not rendered. Join decoded image to response headers and currentSrc; never pair latest DOM metadata with a different cached image. |
| Browser timing endpoint | A separately assigned metadata-only collector must record resource/event receipt, decode/load, current visible image/frame identity, foreground visibility and actual render/presentation method with browser monotonic-to-server clock mapping. The current Image onError handler does not emit render timestamps. onload, decoded=true, React commit or requestAnimationFrame-after-load alone are labelled those narrower events, not automatically confirmed presentation. No tracing screenshots, screencasts, canvas extraction, response bodies or image-tool inspection. Missing render instrumentation leaves full capture-to-render unmeasured. |

Before measuring, run the planned clock probes through existing authenticated app/browser sessions and retain only nonsecret numeric metadata. Do not change host/device clocks. Combine relevant device/server/browser mapping bounds and correction age; require measured uncertainty ≤50ms for the G0 cross-clock result. A local independently observed physical-timer method is permitted only with assigned apparatus and approved local-only observation. No apparatus/endpoint means that latency subcase stays NOT_RUN/BLOCKED.

Use stable frame joins to compute narrowly named intervals. Sensor-origin-to-observed-render with valid mapping may support capture-to-render; acquisition-to-receipt, upload response or image load alone cannot. Apply nearest-rank p95: sorted sample at ceil(0.95 × N), keeping sample count, coverage denominator, missing reasons and all slow frames. Report received rate separately from display rate and from calibration/ranging.

| Case | Procedure; all NOT_RUN |
| --- | --- |
| W3C-01 readiness/origin | PHONE-1 approved CCTV role, QA endpoint, clock sync, actual permission/source/origin branch and metadata collection. No screenshot/image read. Device capability and negotiated state alone are not successful live capture. |
| W3C-02 equipment timing | 30s +180s with exact joins above; actual transport and partial phone count labelled. Separate fps, available latency stages and full-latency eligibility. |
| W3C-03 fire-gas timing | Repeat independent 30s +180s in this mode; do not reuse equipment samples as fire-gas evidence. |
| W3C-04 outage/stop | Explicitly stop the assigned camera and inspect metadata/DOM stale/unknown transition, last-frame warning, cancelled upload/native generation and stopped counter progression. Restart only within assigned scenario and record new stream identity. A retained last JPEG does not establish current capture or make full screenshots safe. |
| W3C-05 available tracking | Record actual calibration null/unknown and raw/live/synthetic source. Do not infer marker accuracy from streaming. Two phones can inspect readiness/precise waiting failure but cannot supply Controller + two simultaneous Controlees + separate CCTV. Full ranging/accuracy apparatus remains separate. |

Physical G0 remains four actual phones, 140cm×50cm table, measured markers/mounts/heights/offsets, two concurrent Controlees over180s, and independent 9-point ×30 ×3-marker evaluation (810 samples; p95≤0.02m table/2m world). Missing angle remains null; no invented XY, yaw, calibration or successful ranging. These requirements are not waived by two-phone USB or synthetic10Hz software evidence.

## Evidence, release and concrete gaps

Templates: evidence/qa/ui-device/candidate-70da1337/templates/device-camera-timing.v1.csv and phone-observations.v1.csv under this run. They are header-only schemas, not measured rows. Use one frame-stage/event/interval row or phone observation row with explicit case_status; all cases above currently NOT_RUN. Unknown numeric fields remain empty with missing_reason, never zero. Use evidence_scope to distinguish local semantic observation, native callback, controlled fixture, server metadata and physical witness. Metadata can enter QA review only after secret/pixel checks.

Assigned W3B actual-device worker/setup/Details screenshots may undergo model-assisted visual review only after an explicit camera-free, provenance and secret check. Verify that the exact capture target contains no real camera image, preview, thumbnail, background or overlapping camera region, and no credentials or private identifiers. Do not capture screens during credential entry. Record the checked target and provenance before sending a permitted image to a tool.

Real camera frame bytes and containing screenshots remain on the local server/local evidence storage and never enter model/image tools, reviewer prompts or external services. W3C camera previews and full-viewport captures remain local-only; model-facing evidence for those surfaces is sanitized metadata. After real camera input, model visual review may use only a verified tight non-camera element capture/crop with no overlapping or retained real imagery, or a fresh verified synthetic-only process/DB/browser context, following the existing privacy amendment. Stopping capture alone does not establish camera-free provenance. Do not use PHONE-2 as an external recording camera. These capture rules grant no device control during preparation.

Release after grant: pause both QA modes, stop assigned camera/UWB with the app Stop control, disconnect QA roles/sessions, remove only added4103 reverse mappings, restore any explicitly recorded authorized media/Wi-Fi adjustments, preserve prior settings/rules, and report phone state/owner plus app/model resource release. Stop only QA-owned processes when directed; keep DB/evidence and all failures. Recheck installed identity and hash evidence. No cleanup is executed by this protocol.

Concrete unresolved setup at preparation:
- Phase-specific W3B/W3C grants, private alias/adb/credential paths, actual QA LAN endpoint and reserved process/browser/model ownership.
- Final installed-byte observations on both phones; producer installation report is insufficient.
- Final-device semantic-node extraction/action inspection and actual scrolling/navigation measurements.
- Approved long-utterance, held-start and explicitly delivered obsolete-callback adapters; no product or APK modification is authorized.
- Reliable per-frame captureTimestampSource/raw origin observation; the server-persisted payload alone lacks the branch.
- Browser render/presentation collector, synchronized clock bound and frame coverage ledger; polling latest metadata loses intermediate frames.
- Independent audible/haptic witness or permitted local capture; PHONE-2's reported zero media volume cannot prove speech.
- Two additional phones, full simultaneous UWB/CCTV workload, measured table/marker/mount apparatus and valid calibration. Their absence remains an explicit gap while feasible two-phone software checks proceed.

No live command, device query/control, runtime/model/browser initialization or actual-image inspection occurred in preparing this packet. No acceptance PASS is issued.
