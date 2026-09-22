# Independent QA preparation handoff

Goal/run: GS-SAFETY-SIM-001 / GS-SAFETY-SIM-001-20260921T084101Z. Issuer: /root/qa_lead. This is a preparation handoff, not a whole-goal execution verdict.

G0 registration was issued at 2026-09-21T08:50:12.231Z before root released product implementation. AC01–16 are exact copies of the actual goal input; equality checked. Technical Lead concurred on g0-protocol-v1.md. Original acceptance snapshot and hashes are preserved in acceptance-registration-v1.md and g0-freeze-manifest.json. Runtime acceptance ledger remains ../acceptance.md.

Independent preliminary integrity observations: 18 archived raw/body source file hashes matched their source manifest; 104 requirement inventory rows match the exact goal lines, every mandatory bullet is covered and every referenced AC is within01–16. These are source/registration integrity results, not product PASS.

## Ready test packets

| Executor | Coverage | Packet | Execution state |
| --- | --- | --- | --- |
| /root/qa_lead/qa_server | AC01–05,10–11,14 | server/test-cards-v1.md and fixtures-v1.json:16 base cards,1000 guidance inputs; active server/delayed-supplement-addendum-v2.md + fixture-v2.json adds S17 | NOT_RUN; canonical API, isolatedDB invocation and G3 needed |
| /root/qa_lead/qa_rag | AC06–08 | rag/README.md and corpus/retrieval/generation cards;20 retrieval,30 filter,30 fault cases plus active fault-amendment.v1.2.json =81 cases | NOT_RUN; final review provenance, real models and G3 needed |
| /root/qa_lead/qa_ui_device | AC09,12–13,15–16 | ui-device/README.md, five AC cards, source-expectations.md,11 evidence templates | NOT_RUN; G3/APK/browser and coordinated Blender/device resources needed;4phone slice BLOCKED |

All preparation JSON validation and unique/count checks reported by each independent slice passed. They do not replace tests of product behavior. QA never wrote product files, committed or pushed. Each executor retains disjoint qa/ and evidence/qa/ child folders. Only QA Lead may aggregate and issue the official overall verdict.

## Current integration details to preserve

- QR003 in test-refinements.md governs final delayed-RAG playback binding: every immutable envelope has new guidanceVersion; updateKind distinguishes supplement; primaryGuidanceVersion stays stable and is part of playback identity. First transmitted guidance stays immutable, current accepted supplement/provenance appears, and primary audio does not replay or get interrupted. Earlier same-version proposals remain superseded records.
- Manufacturer source corrections preserve actual SK1265 individual support points and 172 EC-B unknown full support/exterior geometry; no guessed geometry is certified. All six presets/configurations stay mandatory.
- The earlier two unauthorized Windows transports and later two authorized Linux devices are separate preserved observations. Actual PHONE-1 SM-N986N/API33 and PHONE-2 SM-S926N/API36 support partial Android testing once APK exists. UWB feature flags do not prove sessions; no camera/audio/vibration/ranging success yet. AC09 is NOT_RUN; AC13/fourphone workload stays BLOCKED. See resource-blockers.md and source provenance under evidence/qa/g0.
- The cached Chromium file is present, but browser launch/dependencies have not been independently tested by this slice. Blender tool availability is not live connection/source-open success. Model provider resource preparation is not normal integrated inference evidence.

## Resume

Technical Lead submits g3-submission.md requirements with stable candidate hash, documented commands, isolated DB/port, artifacts and exact resource availability. QA Lead assigns the same candidate to the three slices, including safe port/DB/phone/Blender windows. Execute software and accessible two-phone checks independently; keep unavailable fourphone/model slices BLOCKED. Preserve all failed attempts and two-rework/one-environment-retry limits. A changed candidate invalidates affected evidence; all mandatory ACs need the same integrated candidate before overall PASS.

## Post-interruption preparation update

At2026-09-21T10:21:59Z durable-state recovery confirmed original G0/fixtures/review timestamps unchanged. Lost tool cell35 had no recoverable result; no work is claimed from the interrupted read. Existing child paths were resumed with followup tasks, not duplicated.

- QR004 [clock-binding-v1.1.md](clock-binding-v1.1.md) is issued: scenario09:00 remains; controlled document-test UTC09:30 is distinct; live integration uses actual UTC. Original26 producer cases and approval ledger are snapshotted. Original26 raw output/candidate identity were not captured, explicitly recorded as an evidence gap; surviving maker service failures are preserved separately.
- Independent RAG clock derivatives retain81 existing cases and add4 clock boundary/history cases (85 total), with original-to-derived field diffs and unchanged expectations. Packet: rag/clock-binding-v1.1/.
- Server incident-recovery-addendum-v1.md adds S18–S22 for incident/path scope, actual process restart, latest arrival target, transport versus receipt and ordering; original16+S17 cards remain preserved.
- UI concurrent incident amendmentv1.1 and ordering/clock amendmentv1.2 add pin/context/shared restriction/receipt and8 reconnect cases; original cards remain preserved.
- QR006 binds the published streamId/per-mode sequence and owned-SSE authority contract. Legacy defaults are persistence-only. G3 still pins all actual versions and content.

All product execution remains NOT_RUN pending fixed G3 candidate/resource assignment. Four-phone actual measurement is still blocked; earlier two authorized phones are resource observations, not app/audio/vibration/UWB success. Component real-model/self-test/artifact readiness reports remain producer evidence and are not reused as independent whole-AC PASS.

## G3 entry preparation

[G3 readiness review](g3-readiness-review.md) consolidates the independent server, RAG and UI/device readiness packets. Contract1.0.1 file hashes match19/19; the UI slice matched34/34 asset references. The supported scheduler-free production constructor is now identified for exact virtual-time tests, separate from actual HTTP lifecycle/restart execution. RAG keeps85 independent cases and requires a QA-owned adapter plus exclusive actual-model measurement window. Generated Next artifacts must be included in final build identity; the preliminary Android APK is not the final candidate.

QR007 adds actual UWB sensor-frame/mount verification after the producer's signed-angle correction. QR008 clarifies immutable stored receipts versus current HTTP retry responses. All frozen G0 inputs, criteria and original cards remain preserved. These readiness records are not G4 results; final production artifacts, resource assignment and same-candidate execution remain pending.

QR009 [pause/cancellation semantics](pause-cancellation-semantics-v1.md) adds final-candidate joins for historical voice-start, current server request/status, local cancellation, deliberate obsolete callback rejection and actual audible cutoff. Server S23 and UI09 pause amendments include delayed-start ordering and keep physical observation separate. The pending1.0.3 stop-requested clarification must remain device-unconfirmed; original records and G0 remain unchanged. Real camera pixels stay local-only, with CAMERA testing limited to PHONE-1 despite observed permission flags. Whole G3 is still held for final mobile hierarchy/current-voice changes; prior APK and producer reports are preserved.

The [postimplementation review plan](review-work-plan-v1.md) applies the full review-work skill through five fresh native leaf reviewers after final G3. Existing execution ownership remains unchanged. Every result binds full HEAD plus dirty source/artifact identity; physical blockers and missing lanes cannot become PASS. Reviewer scope follows the existing user goal, including approved local HTTP and local-only camera constraints, without adding generic implied acceptance criteria.

[Camera timing binding](camera-timing-binding-v1.md) requires the actual capturedAt source/domain and separate server-receipt versus browser-render stages. Recent fps, upload latency and callbacks cannot silently become the frozen full-interval/end-to-end measurement. It preserves G0 values and local-only pixel restrictions.

[Final resource schedule](g3-resource-schedule-v1.md) allocates the three execution slices and five review leaves after exact G3 plus root GO. Live app/model/embedding, browser pacing and Blender work are serialized with resource records; phones have one owner and one authorized meaningful LAN retry. Web03/prior49f4 are not the awaited web04/Mobile4 candidate. Static readiness does not start G4.
