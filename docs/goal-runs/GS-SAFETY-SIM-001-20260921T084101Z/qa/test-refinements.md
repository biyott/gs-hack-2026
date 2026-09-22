# QA test refinements after G0

Goal/run: GS-SAFETY-SIM-001 / GS-SAFETY-SIM-001-20260921T084101Z. G0 protocol v1.0 and original acceptance remain frozen. This register records derivative test coverage and factual source interpretation, not relaxed thresholds or changed user outcomes.

## QR-001 — delayed supplement on the active primary guidance

Recorded 2026-09-21 during QA preparation; requested by root, registered by /root/qa_lead. Existing scope: goal B same-version modalities, duplicate suppression and lower RAG audio priority; goal C immutable first actual transmission/current history; goal D stale/validated explanation; AC08–11.

Input: start the primary urgent speech for a valid guidanceId/version. Before it completes, publish a valid delayed RAG supplement for the same ID/version through the canonical newer snapshot revision. Then redeliver duplicate augmentation and an older revision. Also deliver a newer primary guidance while a supplement is pending.

Expected: current UI augmentation and provenance update exactly once when valid; primary beep/speech is not restarted; original transmitted first guidance remains byte-equivalent; current augmentation/history links the correct incident/guidance/procedure. RAG audio stays lower priority and cannot interrupt urgent action speech. Duplicate/old supplements remain inert. A changed primary guidance invalidates the pending old supplement. Server dispatch, SSE/current-state revision, DB provenance, displayed current supplement and actual Android audio evidence are joined.

The canonical snapshot revision transport is a technical integration detail owned by Technical Lead. QA adapters will bind its published field name without weakening the above observation. Independent server, RAG and UI/device cards include their respective checks. No G0 threshold or required user outcome changed; prior evidence is not promoted to this unexecuted case.

Transport note: the tentative same-guidance-version plus snapshot-revision binding above was superseded before execution by QR-003 below. It is preserved as the prior proposal, not the final adapter contract.

## QR-002 — manufacturer geometry clarification

Research correction records and primary page evidence, retained in research/research-corrections.md and manufacturer evidence, refine AC12 comparison without changing the six required presets or configurations. SK1265 supports must be compared as four individually sourced points in a declared drawing-to-product frame, not only a bounding span. The 172 EC-B 4.6m source dimension supports nominal width, not an invented complete square support/exterior polygon; unknown values remain null. A fixed tower origin is the required demo behavior, not a mechanical immobility claim. QA compares source, catalog, visual model and separately declared analytical risk geometry, preserving known and unknown provenance.

## QR-003 — canonical supplemental envelope binding

Recorded 2026-09-21 after QR-001, before any candidate execution. Source: root relay of Technical/Backend Lead concurrence; published G3 contract remains required. The canonical proposal now creates a new immutable `guidanceVersion` for every envelope, uses `updateKind: primary | supplement`, and preserves `primaryGuidanceVersion` across supplemental augmentation. Playback identity is `guidanceId + primaryGuidanceVersion`.

This supersedes only QR-001's tentative same-version transport mechanism. Test the same delayed augmentation while primary speech is active, using an increased envelope version and unchanged primary version. Current supplement/provenance updates, original first transmission remains immutable, and primary beep/speech does not replay or get interrupted. Then test duplicate/reverse envelopes and an actually newer primary version. Bind exact contract only after Technical Lead publishes its version; preserve older proposed mapping for provenance. No user outcome, G0 threshold or pass condition changes.

## QR-004 — explicit virtual and UTC validity clock binding

Published after restart recovery at2026-09-21T10:23:20.799Z in [clock-binding-v1.1.md](clock-binding-v1.1.md). Scenario09:00/seed stays unchanged; deterministic document-validity UTC fixture uses09:30 after genuine09:13:05.116 reviews; live integrations use actual fresh UTC and duration checks use monotonic time. Original26 producer cases, independentQA cases, observed no_match, approval timestamps and G0 remain preserved. Only clock-domain bindings and relative isolated boundary fixtures change in separately versioned derived copies; expected documents/actions/outcomes and5000ms deadline remain unchanged. This is a test-method ambiguity correction supported by Technical Lead's published1.0.1 clock-domain contract, not a changed acceptance condition.

## QR-005 — incident scope, persisted recovery and receipt evidence

Root's IO001/IO004 implementation observations refine existing AC03–05/10/11/14 coverage. They are not independently reproduced QA failures. Additive [server S18–S22 cards](server/incident-recovery-addendum-v1.md) and [UI concurrent-incident amendment](ui-device/ac10-11-15-concurrent-incidents-amendment-v1.1.md) preserve original fixtures and outcomes.

Exercise disjoint active hazards with separate incidents, independent restricted paths and a shared path with two restriction owners. Clearing/reopening/closing one incident cannot clear another hazard or release another owner's passage restriction. While a user pins incidentA, incidentB must still create its own truthful alert/context and both administrators converge. Test actual process stop/start against the same QA-owned DB after manual model/pose changes, hazard clearance before reopening, explicit reopening, and rerouting followed by arrival. Compare persisted state both immediately after restart and after fresh evaluation; the latest arrival target must not revert to the first guide's older destination. Preserve original first guidance and audits.

Connect administrator/observer SSE subscribers without a worker response. A mode-level subscription count or transmission attempt must not be represented as device receipt, display, understanding or arrival. Only the correctly authenticated target response updates its own response fact; each fact remains independent. Exact physical display/audio evidence remains a separate actual-device test.

These are derivative checks of existing incident scoping, response separation and recovery requirements. No new product feature or numerical threshold is introduced. S22's transport field binding remains pending Technical Lead's published stream/sequence contract; untrusted delayed old-stream snapshots must not regain control merely because their timestamp/version is larger.

## QR-006 — published stream and sequence ordering binding

Subsequent Technical Lead publication in docs/contracts/v1.0.1-addendum.md resolves QR-005/S22's transport binding; Backend, Frontend and Mobile concurrence is reported by Technical Lead. G3 must still pin the actual contract and candidate hashes.

`streamId` identifies a fresh application-server runtime. A per-mode `sequence` strictly increases for changed publications, including transient updates and resets; it does not reset with runId. Within the same accepted stream/mode, only a higher sequence changes current state. Mutation run.version, virtual time and wall-clock timestamps are not snapshot publication ordering. Identical repeated publications may retain their sequence and remain inert.

Only the first valid snapshot from the currently owned initial/reconnected SSE connection may establish a stream baseline. An HTTP response before that baseline is pending or ignored, never authoritative. HTTP cannot change an established stream, and old connection callbacks cannot regain ownership. Reconnect retains the accepted watermark: same stream needs a higher sequence, while an authoritative new stream permits restored state with a lower persisted revision. A legitimate higher-sequence snapshot may introduce a new run; contained worker guidance must still match its own run/worker/map/expiry constraints.

Legacy ordering defaults exist only for reading old persisted snapshots. The server must stamp real ordering fields before wire publication; missing/default legacy fields on a new wire response do not establish an authoritative baseline. Preserve all1000 frozen input classifications and count; bind them by distinguishing invalid guidance from a legitimate newer-run snapshot instead of rejecting every new run or accepting every new UUID. Additional reconnect/epoch cases in server S22 and UI amendmentv1.2 test ownership and delayed HTTP callbacks. No criterion or performance threshold changes.

## QR-007 — physical UWB frame and mounting verification

Registered during G3 preparation after Tracking Lead's angular correction report. Producer source memo `.omo/teams/team-08d29e60/artifacts/tracking-angular-source.md` records Android raw clockwise azimuth and the application's one server conversion: `bearing = equipmentHeading + uwbYawRad - azimuthRad`. Native degrees-to-radians conversion preserves raw sign. Producer red/green fixture logs remain producer evidence, not an independently executed radio result. Technical Lead must version and bind the semantic clarification in the submitted candidate; the existing Contract1.0.1 freeze and G0 remain preserved.

For the angle-derived 2D path, physical AC12/13 execution must record the actual mounted Controller reference: upright portrait, the angle measurement plane aligned horizontally, the sensor zero ray and observed left/right response. The printed marker is separately mounted parallel to the table; a horizontal marker does not prove a horizontal UWB angle plane. Measure the rigid marker-to-sensor yaw before supplying `uwbYawRad`; retain null if unmeasured. Compare raw uploaded angles with the separately transformed table/world coordinates and known physical locations. A flat or arbitrarily tilted handset cannot be accepted under a yaw-only fixture assumption without an applicable measured transform. Synthetic signed-angle and height tests do not satisfy this physical check. Null-angle distance-only operation remains a valid required fallback and must never fabricate XY; successful angle availability is not a new hardware requirement. The derivative [UI/device mounting card](ui-device/ac12-13-angular-mount-amendment-v1.1.md) records these branches. No new distance accuracy threshold, reduced device count or changed G0 marker criterion is introduced.

## QR-008 — immutable idempotency receipt versus current HTTP replay

The additive [server replay binding](server/replay-current-binding-addendum-v1.md) clarifies S12/S13/S19 without rewriting their original cards. Stored operation receipts and their historical snapshots remain immutable. An exact authenticated retry has no duplicate effect and returns the current authoritative scoped HTTP snapshot; it must not promote the historical receipt into a newer publication. Different actors or payloads reusing an idempotency key remain conflicts. This preserves recovery, audit and current-state outcomes while distinguishing two records that the initial S19 wording conflated. Actual process restart, current stream/sequence and unchanged first guidance/history still require independent execution.

## QR-009 — cancellation evidence and truthful current voice state

The [pause/cancellation binding](pause-cancellation-semantics-v1.md) preserves G0 and distinguishes a historical start receipt, local cancelled status, current server/admin state, deliberate late-callback rejection and actual audible cutoff. A producer prior-APK pause observation is retained without promoting it to final-candidate acceptance. Final tests join the same run/worker/primary/utterance identities and preserve immutable history; they do not require a particular new wire enum. Actual audio/haptic observations remain separate from callbacks and volume. Both modes, route replacement, same-primary resume, delayed supplement and lifecycle cleanup retain their original outcomes. Actual camera evidence follows the explicitly authorized local-only boundary; two phones cannot satisfy the four-phone condition.


## QR-010 — C4 software workload and dispatch observation binding

Recorded 2026-09-21T17:47:30.467Z. [Versioned method concurrence](../evidence/qa/g4/candidate-cd8a2428/QR010-performance-method-concurrence-v1.json) preserves the G0 thresholds and physical environment. Public 18-second select/measured/speed1/start cycles provide the separately named continuous software workload; every transition, slow frame, conflict and delay remains recorded. Two actual admin contexts, synthetic accepted-input distributions and authoritative generated-primary counts are retained. A proven application-origin SSE controller enqueue is the server dispatch observation, joined to qualified current primary DOM/rAF observations with clock and presentation limits. Engine generation, forwarding controllers and network flush are distinct. Missing/coalesced-before-enqueue primary versions stay in the no-missing accounting. This does not replace full-scenario coverage or the four-phone physical workload. Helper/runner execution and timing results remain separately gated; no new latency threshold or acceptance relaxation is introduced.
