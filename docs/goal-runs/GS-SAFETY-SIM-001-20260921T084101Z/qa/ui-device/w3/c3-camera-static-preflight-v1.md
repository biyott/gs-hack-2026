# C3 camera static preflight v1

Owner: /root/qa_lead/qa_ui_device. Run GS-SAFETY-SIM-001-20260921T084101Z. Prepared 2026-09-22 Asia/Seoul. **Static file inspection only; all C3 runtime/device cases in this note remain NOT_RUN.** No tests, product imports, browser, Blender, adb, phone, LAN/network, camera or model actions were run. Only this additive note is written; C1/C2, failures and prior plans remain intact. No acceptance verdict or criterion change is issued.

## Frozen identity and directly read files

C2 root is /home/b/.cache/gs-safety-qd001.7e7jy5oy, candidate sha256:0d42bacc04c50cd21c9c133e262838acb6f47e2e8d33d37ea450ce160f46bc3e. C3 root is /home/b/.cache/gs-safety-c3.eulo4t9w, candidate sha256:1a7c95cd1a15df738492a368d36cc6cb98985ec1c2618b10e807c82076b247c4. Root's g3-freeze-c3.json was issued at2026-09-21T15:45:34.415Z and declares source aggregate10f658c44bc4bd511302900e02b467058b6dc558b767f2acc4b2c49773d5f6ab and build BLy4PJy6kc0sEf4JQFnE0. These receipt declarations do not replace a phase-specific W3 grant.

The following SHA-256 values were calculated directly from the staged files during this preparation:

| Exact staged path | SHA-256 |
| --- | --- |
| /home/b/.cache/gs-safety-qd001.7e7jy5oy/runtime-artifacts/candidate-manifest-c2.json | 6f146ee34b7880e3a0c8012ae2a2485ec7d95e0314e183c555eb509060f54ef0 |
| /home/b/.cache/gs-safety-c3.eulo4t9w/runtime-artifacts/candidate-manifest-c3.json | 8d9b031f68374ea939dcdebb570e76aeba4b09d1154165cab53d186e7d27c4bc |
| /home/b/.cache/gs-safety-qd001.7e7jy5oy/app/api/tracking/frame/route.ts | 10f23725504176483a0afab36de2b8b7ce9eb7708be0d84aa427545571e11971 |
| /home/b/.cache/gs-safety-c3.eulo4t9w/app/api/tracking/frame/route.ts | 2b504f8e5e36cf668bd66957205da0b1c88b8d208cbc19d63f8dacf907b858ab |
| /home/b/.cache/gs-safety-qd001.7e7jy5oy/docs/demo-runbook.md | 39a655b97536eeceb5509e9d9511ec08c34f1bd85ed75c0a653e3b725d6fe79c |
| /home/b/.cache/gs-safety-c3.eulo4t9w/docs/demo-runbook.md | a7b1e67de972979f3a00117355d9080097b3cdc995eef62c345db720741cc410 |
| /home/b/.cache/gs-safety-c3.eulo4t9w/docs/contracts/implementation-binding-v1.0.4-r2.json | 5f90a218c9dd43571046283076d6749c7c3728b846809a92e2a5e02ed27cf75a |
| /home/b/.cache/gs-safety-c3.eulo4t9w/src/server/services/tracking-api/camera-source-provenance.test.ts | ee07b2d6a75d21944c848c723f76760f5caec5d628603aaee3b487472edae59a |

Direct textual diffs show changes in the frame route and runbook. QA Lead's evidence/qa/g4/candidate-1a7c95cd/c2-c3-file-delta.json reports those two changed source files, two added files above, zero removed and988 unchanged source entries. This preparation checked the named files and the supporting pairs below, not the entire candidate/build aggregate.

These paths under **each exact staged root above** were independently hashed and match between C2 and C3:

| Path under C2 and C3 roots | Common SHA-256 |
| --- | --- |
| src/server/tracking/service.ts | cde091096700a8b035d9e31c58a80ab88a9f58ab6609ebc1b41f927077dad4aa |
| apps/mobile/android/app/src/main/kotlin/com/gssafety/mobile/NativeCctv.kt | 58368ca66e21b29fc1ebf34fe3b3db42e9002904b3dd552f2bf8413de2cd76bb |
| apps/mobile/android/app/src/main/kotlin/com/gssafety/mobile/NativeFrameUploader.kt | 5e2bcd92359ec6e3a9b49bc64d1867f2e1b085a21a6a75c0004a8af023a66412 |
| src/components/tracking/camera-panel.tsx | 7b25477f80584cd7c7d522604a57c541856aa22fd0202b52d23381271e1ca218 |
| src/components/tracking/use-tracking.ts | e86585e1e14282e4f38451ce2e69d568f0cfbfa6834aab5410007b4cd7c60905 |
| docs/contracts/implementation-binding-v1.0.4-r1.json | 35238b0b53389778df39bb4727f61d81f11c792468ea8d1c79822f63e7f8c448 |

The C3 receipt selects unchanged Mobile4 APK1d78f81eaa5d7d85a2f73d3d50b5acbbeeb4a0ea5cbbabcc538087f4fbeb515a and mobile source manifestbf5c0632ee554ea0b8fa671e7c5e9e29696e823ea54bd431e72452448f92151a. These are receipt bindings, not fresh phone-install or APK observations in this preflight. C3 physical integration remains separately required.

## Source change and narrow execution impact

C2 parsed the upload into frame and forwarded its accepted source unchanged. C3 parses incoming, authorizes that original parsed request, then creates one canonical FrameUpload: source is live for the authenticated CCTV branch and synthetic for an explicitly synthetic admin/operator fixture. That same frame is used for ingestion and raw measurement persistence. Invalid admin/operator live or omitted-source requests still fail authorization before normalization. No client role selection or image contents authorize a channel.

This is the QD007 implementation correction under contract1.0.4/r2, not a wire/schema or G0 revision. A generated JPEG submitted through the CCTV credential may exercise the canonical live label, but remains software evidence; the label identifies the authenticated producer channel and is not sensor/pixel-origin attestation.

The added provenance test source covers CCTV synthetic/live/omitted labels, admin/operator explicit synthetic, and disallowed admin/operator live/omitted cases. It inspects source propagation and stored records using a generated blank JPEG. It was read, not executed here. Producer validation figures in r2 remain producer evidence.

Runbook changes add the r2 link, select C3 handoff/state/root receipt paths, retain C1/C2 history, and tie reused APK/geometry selections to C3. They do not introduce a new camera timing procedure. The existing tracking-access table, device204 meaning, timestamp limitations and calibration requirements remain in the C3 runbook.

| Required plan binding for later assigned W3C | Concrete observation and limit |
| --- | --- |
| C3 identity | Use the C3 stage, manifest/build and its phase grant. Preserve earlier C2 QD007 failure; unchanged APK/native code does not promote old server/device evidence to C3. |
| Source propagation seam | Join the actual PHONE-1 upload frameId/streamId/sequence with server camera.source, camera observations/inputSource, projected state and persisted camera-frame record. Expected authenticated CCTV source is live; separately labelled software admin/operator fixtures remain synthetic. If a software fixture probes the CCTV branch, retain its synthetic-image provenance outside the canonical wire label. Do not call that fixture an actual camera observation. |
| Device response | Native CCTV success remains204 with no body, unchanged from C2. The unchanged uploader checks response.isSuccessful and does not require a TrackingSnapshot JSON body. Collect actual HTTP status and native outcome later; static compatibility is not a runtime result. No new body parser or APK change is requested. |
| Separate metadata reader | Obtain metadata from an authorized admin/operator/support/observer tracking reader; JPEG viewing is admin/operator/observer only. Worker/device may not fetch global tracking or JPEG; support may not fetch JPEG. Do not restore old device polling or permissions merely to collect evidence. Use existing assigned sessions; this note creates none. |
| No204 freshness shortcut | Empty204 supplies no frame identity or returned snapshot to join. Correlate native metadata with later authorized server/DB/browser records. A device uploaded flag/HTTP success is not current coordinates, calibration, fresh guidance, understanding, arrival or visible output. |
| Freshness/coverage | Record frameId, stream/sequence, capturedAt, captureClock, receivedAt, processedAt, counter progression, observation age/status and actual reader timestamps. use-tracking polls at200ms with in-flight exclusion, so it can miss intermediate frames and slow responses. A latest snapshot or receiveFps interval cannot substitute for the complete180s received-frame count/distribution. Preserve missing samples and superseded409 image requests. |
| Actual stale display | cameraView evaluates received/captured ages against1000ms and connection/status fields; actual stale/unknown and last-frame labels must be observed later. A recently fetched metadata document or source=live alone is not a fresh exposure. Match JPEG response identity headers and currentSrc before relating the displayed image to metadata. |

The source normalization does not change calibrated-position validity. A live camera can still be uncalibrated, occluded, stale or position-unknown. Null angles/yaw/offsets remain unknown; no fabricated XY, successful ranging or physical accuracy follows from live or204.

## Timing evidence limits remain unchanged

[Camera timing binding](../../camera-timing-binding-v1.md) and the earlier [W3 protocol](device-camera-plan-v1.md) continue to govern:30s warmup plus180s measured per mode;5–10 received fps; p95 capture-to-render≤1000ms with measured cross-clock uncertainty≤50ms or the already allowed independent physical timing method. No thresholds are added or relaxed here.

- NativeCctv still chooses sensor_realtime versus frame_acquired and adds captureTimestampSource to its native UI event from mutable run.timestampSource. NativeFrameUploader does **not** upload that branch field; the frame route's DB payload does not preserve it. capturedElapsedNanos/capturedAt/captureClock remain insufficient to infer which timestamp origin actually supplied a particular frame. Observe the actual branch with reliable frame association later or keep origin unknown. C3 source=live does not fill this gap.
- Preserve raw units/domains, device UTC/elapsed mapping, correction offset, uncertainty, synchronization age and clock discontinuities. Corrected UTC formatting is not proof of a synchronized exposure time.
- Server receivedAt remains after JSON parse/auth and before ingest, not first network-byte arrival. processingMs remains the monotonic decode/derive interval; processedAt is derived as receivedAt plus that interval. Neither is an independently observed browser presentation endpoint.
- Image load followed by the next requestAnimationFrame is a **browser load/rAF proxy**, not physical paint/presentation. Preserve its precise event, frame identity, foreground/visibility state and physicalPaintObserved=false. Do not name that value full capture-to-render or silently replace the missing physical endpoint with it.
- The unchanged camera component has an image error handler, no physical-presentation instrumentation. The existing QA browser-observer similarly labels its guidance rAF event as an intersecting-DOM endpoint with physicalPaintObserved=false; that method cannot prove camera pixel presentation.
- Same-frame joined narrower intervals may be reported under their actual names. Missing sensor-origin or true render evidence leaves the full latency aspect NOT_RUN/BLOCKED as appropriate. Retain replaced/dropped frames, missing joins and polling gaps; do not discard slow samples or manufacture zero-duration stages.

## Actual human output observation and privacy

Read [human-observation-boundary-v1.md](human-observation-boundary-v1.md), recorded2026-09-21T15:30:15.489Z; its directly observed SHA-256 is6efcbe9f4860a8a85d829b12d3f0282000ccb3e1678a087c7255277e5978bd72. Its current boundary narrows any older preparation references to possible output recording:

1. At the actual version-bound playback moment, the assigned UI/device executor sends QA Lead and Root the phone alias, scenario/run, guidanceId/guidanceVersion/primaryGuidanceVersion, locale, actual UTC, expected speech/vibration and native callback observations.
2. Root may then make one concise human observation request tied to that instance. Do not ask during repair or before a concrete playback moment, and do not independently initiate a witness request from this preflight.
3. A person's heard/felt report supports only the identified instance and environment. Preserve exactly what was heard/felt and any uncertainty. No report, a mismatched version/time/device or uncertainty leaves the physical aspect BLOCKED/NOT_RUN; callbacks, volume, vibration API success, hardware declarations and displayed status do not substitute.
4. **No microphone capture, recording permissions or camera expansion is authorized.** UWB remains both phones; camera remains PHONE-1 only. Do not turn a human witness into a blanket result for all messages/locales/modes or camera render latency.

Real camera pixels and containing screenshots stay on the local server/local evidence storage and never enter model/image tools, reviewer prompts or external services. W3C model-facing records use sanitized metadata. After real camera input, only a verified tight non-camera capture with no overlapping/retained real imagery, or a fresh verified synthetic-only instance, is eligible for separately assigned visual review. Camera stop alone does not clear retained JPEGs. PHONE-2 camera remains unused. Verified camera-free worker/setup/Details images remain subject to the existing provenance/secret check; no credential-entry capture is allowed.

## Result of this preparation

The concrete updates are C3 candidate binding, authenticated source propagation joins, retention of the empty204/device-reader separation, fresh metadata/identity coverage, and the instance-bound human witness route with no recording. Capture-origin retention and true browser presentation remain unfilled observation limits; C3 changes neither. Four-phone concurrency, actual ranging/calibration/810 samples, LAN acceptance and actual audio/haptics remain independent requirements.

All prospective observations above are NOT_RUN. No runtime outcome, acceptance PASS or additional requirement is inferred from hashes, source, the new test file or producer reports. Await the assigned C3 W3 window; no new execution is authorized by this note.
