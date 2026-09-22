# Q-UI-DEVICE G3 readiness and execution binding v1

Readiness audit only, recorded2026-09-21. Owner `/root/qa_lead/qa_ui_device`. No fixed integrated candidate/resource assignment has been received; no G4 execution is performed by this document. Original cards, amendments, source expectations and previous readiness evidence remain preserved.

## Frozen contract and asset files

Direct filesystem hashing at2026-09-21T10:54:12.949Z matched all19 files in docs/contracts/freeze-v1.0.1.json, declared content SHA-256 `379a4bee66b78f2df9aa8a792f18d2edf5d6b63b26c2b94e94df55e6e51f0c63`. All34 distinct hashed references in resources/blender/safety-simulator/artifact-manifest.json also matched expected hash/byte length. Raw record: `../../evidence/qa/ui-device/g3-readiness-files-v1.json`. These are file-integrity observations, not source-open/export, rendering, complete-candidate or product acceptance results.

Design source handoff is resources/blender/safety-simulator/HANDOFF.md; catalog1.0.1 is `7b0953b6cf6505d1421d4117ef3ac042af660d1e0f50331b5caa34fb7a544219`. Assets include six crane GLBs/six editable sources plus site GLB/source. Owner reports distinguish source renders from imported-GLB renders, synthetic risk geometry from manufacturer facts, and unknown tower footprint. Independent AC12 must still open sources, export/import and manipulate the exact G3 assets.

| Asset | Editable source path under resources/blender/safety-simulator |
| --- | --- |
| SK1265 | sk1265-derived/sk1265-at6.blend |
| Tadano | mobile-cranes/tadano-gr250n4.blend |
| LTM | mobile-cranes/liebherr-ltm1050.blend |
| Maeda | maeda-site/maeda/maeda-mc305.blend |
| LR | lattice-cranes/liebherr-lr1100.blend |
|172 EC-B | lattice-cranes/liebherr-172ecb.blend |
| Site | maeda-site/site/hvo-demo.blend |

## Browser commands and missing execution bindings

Observed by filesystem reads: local node_modules/playwright/index.mjs exists; fallback module `/home/b/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs` exists; full browser `/home/b/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome` exists. Producer readiness reports Chrome for Testing153.0.8010.12. No new launch/probe was run. Harness `tests/frontend/run-surface.mjs` creates isolated contexts per route/viewport and always launches headless. Label its evidence headless-browser; do not label it a physical Android or audible-output check.

Current frontend handoff `.omo/teams/team-08d29e60/artifacts/frontend-g2-handoff.md` is titled pending final bounded verification. The available R6 showcase report is producer development PASS with productAcceptance NOT_RUN. Console desktop/narrow smoke reports are producer development FAIL, preserved at `tests/frontend/artifacts/console-dev-20260921-smoke/report.json` and `console-dev-20260921-narrow-smoke/report.json`. They are not final production reports. `tests/frontend/console.scenario.json` is development-labelled, observer-only, permits session login only and does not cover incident mutation or independent two-admin scenarios.

QA Lead proposes app ports4101 server,4102 RAG,4103 UI only after G3 availability checks; none is allocated/acquired by this audit. Frontend owns development3000; do not reuse/reset its database or stop its server. Coordinate UI server fixtures/DB with Q-SERVER. A separate per-slice server must have an explicitly assigned fresh QA DB; the shared integrated run may instead use the assigned Q-SERVER process. Document which choice applies before execution. Coordinate exclusive real-model workload windows for latency measurements.

Commands ready for final binding, not executed:

```bash
# From the frozen candidate copy, with DATABASE_PATH assigned by QA Lead.
DATABASE_PATH="$QA_DATABASE_PATH" npm run db:migrate
DATABASE_PATH="$QA_DATABASE_PATH" npm run db:seed
DATABASE_PATH="$QA_DATABASE_PATH" npm start -- --port "$QA_APP_PORT"

# After a frozen production scenario file is prepared under qa/ui-device.
QA_BROWSER_EXECUTABLE=/home/b/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome \
node tests/frontend/run-surface.mjs \
  --base-url "$QA_BASE_URL" \
  --scenario "$QA_PRODUCTION_SCENARIO" \
  --output-dir "$QA_UI_ATTEMPT_DIR/browser"
```

The installed Next CLI documentation confirms start --port/--hostname; package start already supplies hostname0.0.0.0. Technical Lead confirmed via QA Lead that PORT must be a shell environment variable or the explicit --port argument; `.env` PORT is not read by Next. Production build output must be supplied/hash-bound by Tech before start. Final frontend capture and staged build are still pending. This card does not run another build in a mutable shared checkout. Runtime/credential environment is assigned separately; never write tokens/PINs into scenario JSON, screenshots or logs. The existing valueEnv facility may reference the assigned local code without recording it. Auth account aliases admin/admin-2 provide separate administrators; observer-only capture cannot satisfy their interaction tests.

Planned UI-owned disposable profile labels are `<run>/evidence/qa/ui-device/<candidate>/profiles/admin-a`, `admin-b`, `observer` and `worker-preview`; no directories or sessions created yet. Use separate isolated contexts for simultaneous administrators and capture their IDs. Browser profile/cache contents are private transient state, excluded from evidence publication and candidate hashes; capture sanitized event/DOM/image outputs separately.

Missing final browser bindings: production build/hash and location, candidate freeze owner/time, unused assigned port/base/LAN URL and DB owner, final production scenario/state inventory, two-admin fixture controls, performance/raw timing collectors and actual API readiness check. Phone reachability to the assigned LAN port4103 needs later execution; no firewall expansion is presumed. Real-model provider8092 ownership/exclusive workload window is pending. Existing harness does not measure180s/10Hz,20 guides/mode,1000 envelopes,200% zoom, actual Android, source-open or CCTV latency. Bind independent collectors to those cards rather than claim their coverage from smoke screenshots.

## Blender resource and copy discipline

Windows Blender binary exists at `/mnt/c/Program Files/Blender Foundation/Blender 5.2/blender.exe`; producer source documentation reports5.2.2 LTS. No binary/version/live MCP call was run by QA. Source README reproduction command launches isolated background factory-startup Blender but writes production assets; do not run that rebuild command during independent QA.

Planned QA copy root: `<run>/evidence/qa/ui-device/<candidate>/assets/source-copies/<assetId>/`. Copy frozen source plus required relative dependencies only after resource assignment, record source/destination hashes, open copied .blend, and export to sibling `exports/`; never save over submitted sources or designer scene. Windows path mapping must be supplied/confirmed for the copied paths. Allocation request is pending through QA Lead to `/root/design_assets`: exact executable/version, safe source-copy/dependency method, open/export verification invocation and exclusive window or explicitly isolated background method. This audit acquires neither live Blender nor background resources. Live scene continuity owner evidence is supporting provenance only.

## Actual phones and APK

Read producer evidence/mobile/preliminary-device/README.md and initial Linux metadata. Only preliminary APK `build/mobile-preliminary/app-debug-pre-final.apk` was supplied:164843370 bytes, SHA-256 `ff17fe249a2591bdcb46beccc4c714e5524081d79076ab1ff57d89a2e9b933cc`. It predates final fixes and is explicitly not G2/G3. Final APK/build hash, source association and install command await Mobile/Tech submission.

Producer installation began10:44:41Z, focused startup screenshots from10:45:35Z: PHONE-1 SM-N986N Android13/API33 and PHONE-2 SM-S926N Android16/API36 installed/launched. This proves only reported install/startup/basic setup rendering on that preliminary artifact. Initial inventory feature declarations and TTS initialization do not prove permissions, guidance, camera upload, ranging or audio. Preserve prior Windows unauthorized history separately. Linux metadata recorded09:09:26.508Z explicitly lacks exact probe execution timestamps.

Host SDK env file `/home/b/.local/share/gs-safety-sdk/env.sh` and adb path `/home/b/.local/share/gs-safety-sdk/android/platform-tools/adb` now exist. Producer environment reports Flutter3.47.5/Dart3.13.4/JDK17.0.20.1/platform-tools37.0.1. Do not rerun inventory or install without assigned phone aliases/session window. Four phones and simultaneous Controller+two Controlees plus separate CCTV remain unavailable. Two available phones have no QA role allocation yet; partial actual Android checks await final APK and explicit assignment. Never use phone model as permanent role or capability rule.

## Audio, vibration and display evidence boundaries

| Aspect | Necessary independent evidence | What alone cannot pass it |
| --- | --- | --- |
| Accepted modality version | Matched run/worker/guide/envelope/primary IDs in payload, coordinator/OS events and visible screen | Static source reading or an uncorrelated callback |
| Screen guidance | Actual device screenshot/video showing current action, route/no-route, locale/version and transition; server dispatch correlation | Browser preview or APK setup screenshot |
| Audible warning and ko/en TTS | External audio/video capture of the actual active output route synchronized with screen/version, plus executor listening notes; or named on-site witness statement tied to exact attempt/device/time/expected and heard words | TTS engine bind/start/end callback, media-volume value, OS process, or screen-only adb recording |
| Audible cancellation/no replay | Continuous actual-output capture covering old speech active, route/primary replacement or supplement/dedupe/reconnect, then new state; record old cutoff and any replay against timestamps | Cancel API return, queue-size/log assertion or short isolated after-clip |
| Physical vibration | Assigned observer's tactile/visible observation with device/version/time/action, or independent external measurement synchronized with requested event; record absence/failure honestly | Vibration capability declaration or service request callback |
| Supported/failure fallback | Actual triggered device condition, retained screen/other available modality and explicit failure state; mock faults labelled separately | Treating missing audio as a successful sound solely because the app requested playback |

Before audio attempt, record active speaker/headset/output route, media volume, mute state, locale/voice availability, foreground status, ambient/capture conditions and witness/capture method. Producer read-only10:48:25Z volume was PHONE-1 15/15 and PHONE-2 0/15; this proves only setting state at that time. Do not conclude audibility or silently treat the muted phone as audio-tested. Any assigned test setup changes are logged in that attempt. When no actual audio capture or qualified direct witness is available, audible output remains BLOCKED/NOT_RUN even if callbacks and visual behavior have separate results. The same separation applies to vibration.

## Release prerequisites for this slice

QA Lead/Tech must supply stable integrated manifest/builds and assigned runtime/fixtures; Mobile must supply final APK/hash and phone assignment; Design must supply independent safe source-open/export method/window; apparatus owner must supply four phones/table/markers/LAN plus actual audio/haptic observation. All original required outcomes remain unchanged. Missing physical resources do not prevent separately assigned software QA once a stable candidate exists, but they prevent completion of the mandatory physical subcases.
