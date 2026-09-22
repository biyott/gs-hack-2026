# C5 physical resume card

Executor `/root/qa_resume/w3_physical`; deadline 2026-09-22T00:35:49Z. Current state at 2026-09-21T23:29Z: source preparation and granted Blender collection complete; device app execution has not started. W3B is expected later after browser/timing occupancy. No runtime action is granted by this card.

## Bound files

- Candidate `sha256:91375a9d76f058ac4d79f194988ada70792b6e118152dbd25f3ba0f99665efe2`; root `/home/b/.cache/gs-safety-c5.H4mElI`; source `a9522ae4668f3909993662feb06b17ee406e35a3f4887a00a0db989aac50048a`; build `a0SBz4_RkrdgOI7tmlBVr`.
- Canonical browser/device binding: `candidate-binding-c5.v2.json`; Root receipt `../../../g3-freeze-c5.json`; QA verification `../../../evidence/qa/g4/candidate-91375a9d/receipt-validation.json`.
- Actual usable ADB: `/mnt/d/App/Android/Sdk/platform-tools/adb.exe`, Windows daemon PID 19940 started under explicit Root authorization. Do not restart or kill it implicitly.
- Private alias map: `../../../evidence/qa/ui-device/resume-physical-preflight-20260921/.private/device-alias-map-01.json`. Two actual authorized phones: PHONE-1 SM-N986N Android13/API33; PHONE-2 SM-S926N Android16/API36. No serial belongs in public artifacts.
- Installed bytes: `../../../evidence/qa/ui-device/candidate-91375a9d/device-readonly-02/PHONE-{1,2}-installed-apk-01.json`; both observed at 23:20:16/17Z, SHA-256 `1d78f81eaa5d7d85a2f73d3d50b5acbbeeb4a0ea5cbbabcc538087f4fbeb515a`, 186350139 bytes. Refresh before fault grant if older than 30 minutes.
- Blender complete: candidate evidence `assets/c5-blender-{preparation-v1,summary-v1,release-01}.json`, `c5-blender-execution-v1.jsonl`, seven metadata/log/export sets under `W3A-C5-BLENDER-01`. Actual 23:22:16.951Z–23:23:13.862Z; all seven native processes exited; no source saves/renders.
- Fault proxy source freeze `c5-android-fault-proxy-v1.freeze.json` SHA-256 `b31525c3261c25e522545e1e872eec451ee65acfef6e5ac867d5eb3df55d3f81`; binding `c5-android-fault-proxy-binding-v1.json` SHA-256 `97be47aeddb71e3774b5975a51b9832cd529b4923921b67722243884a62ca2eb`. Parent reports independent static audit CONCUR with no findings: `../../../evidence/qa/server/candidate-91375a9d/physical-fault-proxy-adapter-static-audit.json`. Actual fault execution remains separately ungranted.

## Normal form and app actions

Source: frozen `apps/mobile/lib/setup/connection_screen.dart`, `main.dart`, `session/mobile_session_lifecycle.dart`, `features/safety_guidance/presentation/{safety_worker_screen,worker_details_sheet}.dart`.

The connection form has server text field, simulation dropdown, device-role dropdown, obscured demo-code field, and `연결` / `Connect` button. Initial endpoint is `http://10.15.82.5:3000`, mode `equipment`, role `WORKER_1`, setup locale ko. A new role/mode session recreates these defaults: reenter the assigned QA endpoint every time. The setup locale does not change the server worker's guidance/voice locale.

Read a fresh credential-free UI before input. Use current XML enabled/clickable bounds. Choose all dropdowns and endpoint before credential entry. Record PIN-field and connection-button bounds, enter the private PIN last, then activate the preobserved button without taking a credential-bearing capture. Establish successful session/current displayed guidance from the authorized server reader before the next worker UI extraction. Preserve any setup failure and clear the credential through the already observed field before further form capture. Never print PIN, bearer token, serial, or raw credential-bearing command arguments.

Localized worker controls include `상세 정보` / `Details`, `닫기` / `Close`, `역할 변경` / `Change role`, `기기 기능 확인` / `Device capabilities`, `안내 이해 확인` / `I understand`, `도움 요청` / `Request assistance`, `다시 듣기` / `Replay guidance`, and `도착 확인` / `Confirm arrival`. Actual presence and enabled/clickable state must be freshly observed. Details footer controls can require bounded scrolling; closing the sheet precedes underlying actions. Do not infer an arrival result when the actual route/position makes that control ineligible.

App foreground return may use its observed activity through ordinary launch; Home/return is not server pause. Native TTS collection is scoped to observed package PID/tag; no shared logcat clearing. An app-requested `voice-started` is not physical output evidence.

## Resource and privacy boundaries

Only the granted fresh QA process/DB/credentials and roles may be used. One coordinated final LAN attempt needs READY/listenerSTART/probeACK. After its failure, only explicitly granted USB reverse is a usable fallback; preserve prior mappings and remove only added mappings. Windows ADB reverse targets the Windows host, so the runtime owner must establish that the granted 4103 listener is reachable through the actual Windows-to-WSL path before app connection. Host readiness is not a phone LAN result.

Camera is last and PHONE-1 only. No pixel capture, view_image, model-facing frame, screen recording, or containing browser screenshot. PHONE-2 camera remains forbidden. Two normal 30s+180s camera intervals consume at least seven real minutes; no shortened interval can be called the frozen workload.

Four simultaneous roles, Controller plus two real concurrent Controlees, 810 independently measured physical calibration samples, and version-bound heard/felt witness remain missing unless actually supplied and recorded. Prior two-phone/producer/source/test observations do not satisfy those physical requirements.
