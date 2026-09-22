# C2 browser impact — additive preparation v1

Prepared 2026-09-22 (Asia/Seoul). Status: **file review only; runtime NOT_RUN**. No tests, schema validator, browser, server, model, device, Blender or candidate helper was executed. No product file, existing scenario, card, historical evidence or acceptance criterion was changed.

## Result and candidate boundary

**No static selector or login-input conflict was observed for the existing admin surface matrix within the affected C2 files.** Preserve its 31 states × 5 viewports = 155 semantic cases. Role transitions, request cancellation and guidance/audio ordering require separate focused runtime observations; unchanged selectors do not pass those behaviors.

| Input | Identity read |
| --- | --- |
| C2 source root | `/home/b/.cache/gs-safety-qd001.7e7jy5oy` |
| C2 candidate | `sha256:0d42bacc04c50cd21c9c133e262838acb6f47e2e8d33d37ea450ce160f46bc3e` |
| Prior candidate in Lead delta | `sha256:70da1337ab54652824ffb49f65cb0213822ba7c2420ae345664dbe7c48c893af` |
| Lead delta | [c1-c2-file-delta.json](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/g4/candidate-0d42bacc/c1-c2-file-delta.json), SHA-256 `56b530cb510cc9bf2faae5101afe8c47fd05cafa7946f451ebecb237edb9dd7c` |
| Preserved scenario | [surface.scenario.v1.json](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/surface.scenario.v1.json), SHA-256 `a0eacd365776af748823996330c5cc91c634394002c212da7bde57e56a03f8a5` |
| Tracking clarification | [clarification-tracking-access-v1.0.4.md](/home/b/.cache/gs-safety-qd001.7e7jy5oy/docs/contracts/clarification-tracking-access-v1.0.4.md), SHA-256 `001595f7fb0fb2863af5a6fa02b38a0179843487e2786ae586ceadfd6d1d3711` |

The affected source hashes below match the corresponding added/after identities in Lead's delta. This is a bounded file binding, not an independent revalidation of the entire candidate. The old source root was read only for before/after comparisons.

The historical scenario notes and original `run-surface.mjs` wrapper still name C1. They must remain historical. Parent already supplied [candidate-binding-c2.v2.json](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/candidate-binding-c2.v2.json) and [run-surface-v2.mjs](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/run-surface-v2.mjs). The concrete binding names the C2 root, candidate, manifest, BUILD_ID `QZCOSOj4hgBWlUIGbGUxu`, asset manifest and QA receipt. The v2 wrapper reads the preserved scenario and selects the runner/source root from that binding. This note records that the **unchanged action inventory** is statically compatible with the affected C2 code; the explicit C2 execution envelope must identify reuse and supersede the old candidate provenance for that execution only. No wrapper or binding was run here, and a binding file is not a resource grant.

The C2 frozen runner and action module retain their historical hashes: `tests/frontend/run-surface.mjs` = `452315b83f491821bbd9e6e1231affc884c80d277c863d386bbbc5bad5616620`; `tests/frontend/browser-actions.mjs` = `a3f7d2a06ae7228c92ecc8d6854bd61222f7eddbcdab59e91934c9e30f477416`. No changed action syntax was identified.

## Compatibility and observed behavior changes

| Existing matrix input or target | C2 source observation | Consequence |
| --- | --- | --- |
| Explicit role admin / actorId admin / QA_DEMO_ACCESS_CODE | Tracking role predicate accepts admin; login selectors and credential contract are not changed by the inspected delta | Retain current inputs and environment-only secret; no fallback needed |
| `#tracking .tracking-toolbar`, `.camera-panel`, `.tracking-observations`, `.calibration-panel` and marker input names | Admin still mounts the same TrackingPanel; its classes and children are preserved | Existing admin focus targets remain source-compatible |
| `#incident-camera .camera-panel` / related CCTV link | Console now requires tracking authorization in addition to selected incident; admin satisfies it | Existing selected-incident admin case remains source-compatible; incident release prerequisite still applies |
| Same targets under worker/device roles | Entire tracking and incident-camera containers/link are omitted | A future role case must assert absence, not wait for an empty panel. Do not replace the admin input in the 155-case matrix to test these roles |
| Support session | Complete tracking metadata remains available, but both compact/full camera panels receive canViewFrame=false; calibration remains disabled | A separate support case must retain metadata while excluding JPEG image elements/request URLs |
| Current guidance records, worker cards and original records | Store can accept newer outer facts while removing regressing/conflicting current guidance. Original firstGuidance is not rewritten by quarantine | The healthy fixture must actually have consistent current guidance. Missing current selectors during a fault case can be the intended result; do not weaken healthy-fixture assertions or fabricate a record |
| Alert/header/audio status | Eligible guidance now binds worker/profile/incident/run/mode/map and expiry; help additionally binds matching worker/incident current identity/version | Static text and selectors remain, but audio/alert eligibility needs new observations within the existing regression cards |

Source anchors:

- [tracking-access.ts](/home/b/.cache/gs-safety-qd001.7e7jy5oy/src/components/tracking/tracking-access.ts) permits admin/operator/support/observer snapshot consumers and denies worker/device/null.
- [safety-console.tsx](/home/b/.cache/gs-safety-qd001.7e7jy5oy/src/components/console/safety-console.tsx:42) passes the authorization boolean into tracking, gates the related-camera link and both tracking surfaces; selected incident remains required for compact CCTV.
- [tracking-panel.tsx](/home/b/.cache/gs-safety-qd001.7e7jy5oy/src/components/tracking/tracking-panel.tsx:25) narrows frame display to admin/operator/observer while preserving support metadata.
- [use-tracking.ts](/home/b/.cache/gs-safety-qd001.7e7jy5oy/src/components/tracking/use-tracking.ts:31) stops the interval, aborts the poll and increments generation. Disabled start publishes an empty snapshot/error/connection view; the hook also exposes an empty view while disabled. Late poll success/failure and calibration success are checked against abort/generation. Calibration HTTP completion is discarded after invalidation; this code does not show cancellation of an already-submitted calibration write.
- [store.ts](/home/b/.cache/gs-safety-qd001.7e7jy5oy/src/client/store.ts:51) clears snapshot, selection, baseline and guidance watermarks when session ID changes; mode change clears them too. The existing outer snapshot/connection-epoch policy runs before quarantine. Same accepted stream/run retains watermarks.
- [guidance-order.ts](/home/b/.cache/gs-safety-qd001.7e7jy5oy/src/client/guidance-order.ts:19) keys watermarks by run/worker/guidance identity; either version regression or conflicting current copies can remove current guidance without replacing firstGuidance. Context-invalid input does not establish a higher watermark. This function is not an assertion that every invalid input is removed from every display.
- [alert-policy.ts](/home/b/.cache/gs-safety-qd001.7e7jy5oy/src/client/alert-policy.ts:14) applies the eligibility bindings above. [use-alert-audio.ts](/home/b/.cache/gs-safety-qd001.7e7jy5oy/src/client/use-alert-audio.ts) revalidates batches against the resulting observations; this read does not establish actual speech/beep output.

## Additive regression observations under existing acceptance

All rows are **NOT_RUN**. These are observations needed for existing AC09/AC10/AC11/AC15 and contract 1.0.4, not new criteria, thresholds or a replacement for the historical 155 cases. Use a separate approved role/interaction fixture and evidence record; do not change the normal login-only matrix or its mutation/error allowlists to accommodate fault injection.

| ID / existing scope | Bounded case | Required observation |
| --- | --- | --- |
| C2-B01 / AC11, AC15 | Fresh sessions: admin, operator, support, observer, worker, device and unauthenticated | Four authorized roles obtain complete tracking snapshot; worker/device receive 403 and unauthenticated receives 401 on direct read attempts. Denied responses expose no tracking measurements/JPEG bytes; an ordinary structured error body is allowed, so do not require every denial body to be empty. Browser worker/device views initiate no tracking polling and expose no cached tracking/compact camera panel or related-camera link |
| C2-B02 / AC11, AC15 | In the same browsing context, load authorized synthetic data, then logout or change to worker/device while a poll is pending | Panels disappear, polling interval stops, the active poll is aborted, and late success or failure cannot repopulate snapshot/error/connected state. Observe the actual role/session change and browser requests/DOM, including focus/auth-channel refresh; fresh contexts alone cannot prove this |
| C2-B03 / AC11, AC15 | Authorized camera viewer changes to support, then back to an authorized viewer with a new session | Support retains permitted metadata and no compact/full JPEG image element or frame URL/request; no old authorized image remains visible. Re-entry starts from the new authorized session's data. Exercise authorized-to-authorized changes too: useTracking is keyed by an enabled boolean, while session-ID snapshot clearing/workspace unmount provides the surrounding cleanup |
| C2-B04 / AC11, AC15 | Pending synthetic calibration save across disable/unmount/new session, plus manual refresh and normal same-session save | Late completion cannot publish old privileged state or trigger stale saved/refresh UI in the new session. Do not assert that an already-sent server write was cancelled. Current authorized save/refresh still works and polls do not overlap. The implementation's 200 ms interval is context, not a new performance threshold |
| C2-B05 / AC09, AC11, AC15 | Same stream/run accepts newer outer sequence containing lower guidanceVersion or lower primaryGuidanceVersion for an existing lineage, in both modes | Outer facts may advance; affected worker current guide becomes absent and incident current list omits it. No obsolete route/action/audio remains active; original first guidance and history remain unchanged. Null-current and same-stream reconnect must not forget the watermark |
| C2-B06 / AC09, AC10, AC11 | Conflicting worker/incident versions for one identity, then a consistent legitimate update; unrelated incident/worker identities alongside it | Quarantine all conflicting current copies without poisoning later valid ordering. Valid independent incident guidance and another worker's lineage remain usable. Record current-versus-original views and restored valid output, not merely an array length |
| C2-B07 / AC09, AC10, AC11 | Session/mode reset, new run and accepted new server stream, plus obsolete connection callback | Correctly scoped new baseline can progress without old watermark interference; obsolete callbacks cannot establish a stream or restore stale current guidance. Preserve baseline/reconnect silence and immutable prior history. Distinguish a new accepted server stream from a larger sequence on an obsolete connection |
| C2-B08 / AC09, AC10, AC11 | Wrong worker/profile/incident/run/mode/map/expired guide among otherwise valid guides; subsequent correction | Ineligible guide does not contribute to alert signature, count, expiry, speech/beep or help announcement. A corrected primary can alert normally; valid independent incident and genuine severity escalation are not suppressed. No synthetic ACK/understanding/arrival is inferred from manager speech |
| C2-B09 / AC09, AC10, AC11, AC15 | Current primary, supplement, duplicate/rebuild, pause/replacement/expiry, and pending/playing audio across role/session cleanup | Supplement preserves primary identity without replay; invalidated or paused batch stops and no queued old output resumes. Separate coordinator/callback evidence, visible status and actual audible cutoff; callback absence alone proves neither a callback arrival nor physical silence. Preserve the existing pause/audio amendment and required actual-device work |
| C2-B10 / AC09, AC11, AC15; cross-owner HTTP prerequisite | Bound CCTV and equipment device upload success, plus admin/operator synthetic fixture upload | Device frame/UWB success is 204 with zero response bytes; admin/operator fixture success retains 200 complete TrackingSnapshot. Device/native consumers must tolerate successful no-body response. A 204 does not prove measurement accepted, worker guidance received/understood, arrival or physical accuracy. This is a separate backend/mobile/fixture-owner regression, not a new action for the browser matrix |

All role assertions refer to the persisted authenticated server session. Caller-supplied role/device identifiers cannot grant access. Support JPEG denial is 403 even though support snapshot reads are authorized. Existing exact frame identity, superseded/missing-frame and cache semantics remain applicable to authorized viewers; do not add blanket expected 403/aborted-request allowances to the normal matrix.

The candidate contains source-level tests for role mapping, support frame omission, disabled polling, late poll/calibration completions, guidance reversal/conflicting copies and alert bindings: `tracking-access.test.ts`, `tracking-panel.test.ts`, `use-tracking.test.ts`, `guidance-order.test.ts`, `guidance-order-conflict.test.ts`, `alert-binding.test.ts`. They were read only where relevant. Their presence is supporting intent, not a test-run result, browser session transition result or physical output observation.

## Readiness and preservation

- Normal main-matrix fixtures still require paused own-DB synthetic equipment/fire-gas states, actual selected incident/current records, known B position and coherent profile/map/primary identities. Quarantine makes those identities especially relevant; C1 screenshots or valid JSON alone cannot establish C2 runtime readiness.
- The existing five viewport sizes, login-only writes, secrets policy and 155-case count stay unchanged. No selector edit is justified by the inspected C2 delta. If a granted C2 run demonstrates a real fixture/selector mismatch, preserve the failed record and use an additive scenario revision with a stated reason.
- The v2 C2 binding exists. Runtime still requires Lead's actual C2/W3 resource grant, isolated production server/database/storage and released fixtures. This review neither starts that window nor reports its availability.
- C2 contract revision 1.0.4 leaves shared tracking schema 1.0.1 and simulation wire 1.0.0 unchanged. Its additional implementation-binding-r1 file describes format-only binding for the frame route; retain the original freeze and its separate binding rather than rewriting either.
- Confirm safe synthetic/camera-free bytes locally before model-facing capture. Stopping a real camera sender does not remove its retained last frame. The role/access correction does not relax the rule against sending real camera pixels or camera-containing screenshots to model/image tools.
- Preserve all C1 failures and prior APK/device/visual evidence. No C2 runtime PASS, whole-candidate approval, physical measurement or acceptance expansion is claimed.

## Reviewed affected-file hashes

| C2 path | SHA-256 |
| --- | --- |
| src/components/tracking/tracking-access.ts | 93f43d3c5fa584d713b3bff017a5c43b7fd7b4623b5090c29c706e963988b4cb |
| src/components/tracking/tracking-panel.tsx | 218695ae00b53ebf32dd39c08f21a3b69af3a0fc35443673c8e834ca01e77ac0 |
| src/components/tracking/use-tracking.ts | e86585e1e14282e4f38451ce2e69d568f0cfbfa6834aab5410007b4cd7c60905 |
| src/components/console/safety-console.tsx | e2b8028a9483f38d170e6597c9d0d8fe42b9b72ff10b6337005707d7d16b4a85 |
| src/client/store.ts | b3c06dc7ff12d3740160298605846771ce57eae495fe6ffcecb0bf93d325beff |
| src/client/alert-policy.ts | d2abc8e68628ae591571dea46a2ea175bb706f73a5e83a8cf05c2d9e151c8d32 |
| src/client/guidance-order.ts | d1cef82e5978c7d39b9a6a896b2bb708007368406395daaa30391298952d680e |
| docs/contracts/freeze-v1.0.4.json | 15f1456ba821634b76ec2037b7d028e7090a4408af185013f7b19ccb4664e748 |
| docs/contracts/implementation-binding-v1.0.4-r1.json | 35238b0b53389778df39bb4727f61d81f11c792468ea8d1c79822f63e7f8c448 |

