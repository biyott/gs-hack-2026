# QA resource blockers

Current execution pointer (2026-09-21T17:49:38.263Z): C4 independent receipt and fresh W1 are complete; W2 actual model/engine/HTTP processes released at17:44:06.329Z and scoped report review continues. [Current C4 receipt](../evidence/qa/g4/candidate-cd8a2428/receipt-validation.json), [state](g4-current-state.json), and [C4 resource ledger](../evidence/qa/g4/candidate-cd8a2428/resource-ledger.jsonl) define current identity and grants. W3A is granted for a fresh synthetic4103 database; no C4 physical-device result yet. Only two previously available phones remain reported; four roles/two concurrent Controlees, physical810-point calibration and audible/haptic observation remain unverified. Prior candidate/status paragraphs below are preserved historical snapshots, not current resource assertions.

Current execution pointer (2026-09-21T15:58:41.767Z): C3 G3 was issued at15:45:34.415Z and independently received at15:47:07.793–15:47:10.683Z. [C3 receipt](../evidence/qa/g4/candidate-1a7c95cd/receipt-validation.json), [current state](g4-current-state.json), and [C3 resource ledger](../evidence/qa/g4/candidate-1a7c95cd/resource-ledger.jsonl) supersede earlier candidate-specific status statements below. W1 is released; W2 is conditionally granted after final adapter readiness. Prior schedules and resource observations below remain historical, not current authorizations or results.

Goal/run: GS-SAFETY-SIM-001 / GS-SAFETY-SIM-001-20260921T084101Z. Owner: /root/qa_lead. A resource blocker is not a software test failure or overall verdict.

## Current state — G4 execution

Updated 2026-09-21T13:27:16Z. G3 was released at 13:08:51.509Z; independent receipt validation at 13:10:34.652–13:10:36.514Z matched all 904 source and 471 artifact rows for candidate `sha256:70da1337ab54652824ffb49f65cb0213822ba7c2420ae345664dbe7c48c893af`. [Receipt validation](../evidence/qa/g4/candidate-70da1337/receipt-validation.json), [resource schedule](g3-resource-schedule-v1.md), and [actual grants/process ledger](../evidence/qa/g4/candidate-70da1337/resource-ledger.jsonl) are the current execution records. W1 is active; later windows require explicit grants. Prior preparation observations below remain historical.

Two authorized Android phones permit partial real-device execution in W3. Four-phone/two-concurrent-peer UWB, physical calibration apparatus and a physical audio/haptic observer remain unavailable or unverified; those requirements have not been waived. Producer camera results are historical evidence, not independent G4 acceptance. Actual camera pixels remain local-only, and only PHONE-1 camera testing is authorized. Software/browser/model tools are now available in the frozen candidate; their independent execution status is recorded per slice, never inferred from this initial inventory.

## QB-DEVICE-001 — physical Android access

- Recorded: 2026-09-21, after G0 registration.
- Report source: Mobile Lead's single Windows ADB inventory, sanitized at `.omo/teams/team-08d29e60/artifacts/mobile-environment.md`. QA read the submitted record; QA did not independently execute that command. No private serials are retained.
- Observed by Mobile Lead: `D:\App\Android\Sdk\platform-tools\adb.exe devices -l` lists two attached transports, both unauthorized. Actual model, Android version, permissions, UWB/session support and camera are unobservable through those transports.
- Required: four actual phones, device-side USB debugging authorization or equivalent authorized control, foreground Flutter APK and same LAN/table/marker apparatus. Two unauthorized transports cannot establish phone identity/capabilities or demonstrate the mandatory one Controller plus two concurrent Controlees.
- Impact: AC09 and AC13 normal physical paths BLOCKED; physical portions of AC01/10/11/15/16 also blocked. Software/emulator/build portions remain independently runnable once the candidate exists. No physical PASS can be inferred from capability UI or mock measurements.
- Resume condition: actual access state changes and four required roles can be inventoried; record the change and a fresh sanitized inventory. An identical Windows failure is not repeatedly probed. Linux ADB's first probe after installation is a distinct environment check, not automatic authorization.
- Proposed action: enable device-side authorization and connect the four actual phones/apparatus. This is a resource need, not approval to omit a requirement.

### Subsequent distinct Linux environment observation

Mobile Lead's `evidence/mobile/adb-linux-initial-sanitized.txt` subsequently reports two authorized devices: PHONE-1 SM-N986N Android 13/API 33 and PHONE-2 SM-S926N Android 16/API 36. Both list `android.hardware.uwb`; this is a feature declaration, not a ranging/session success. QA read the artifact and retained a hashed copy/provenance under evidence/qa/g0/mobile-linux-*. The raw Linux artifact lacks an execution timestamp/command header; producer metadata was requested, and QA records its own read time without inventing an earlier execution time.

This materially changes the resource state. The former unauthorized-transport blockage no longer blocks partial actual Android checks on the two accessible devices, once APK and candidate are supplied. AC09 returns to NOT_RUN pending that executable candidate. The four-phone requirement and one Controller plus two concurrent Controlees remain BLOCKED with only two devices. Camera, audio/vibration, actual UWB and calibration remain unexecuted. The original Windows failure is preserved, not overwritten or treated as an unchanged repeated probe.

## Other resources

At this initial preparation observation, browser, actual Blender source verification, model provider execution and the Android toolchain were still being prepared or independently probed. Missing initial PATH entries alone did not prove absolute unavailability. See the current-state section above for G4 availability and grants. Each concrete result receives its own evidence record; no invented success or blanket BLOCKED classification.
