# S22 temporal ordering binding proposal v1.0

Goal/run: GS-SAFETY-SIM-001 v1.0 / GS-SAFETY-SIM-001-20260921T084101Z. Owner: `/root/qa_lead/qa_server`. Prepared after interruption recovery on 2026-09-21. Status: **NOT_RUN**; no G3 candidate, product changes, product tests or acceptance verdict. This additive method preserves the base `fixtures-v1.json` and its ten classes ×100 envelopes. QA/Technical Lead resolve remaining handshake questions before executable binding.

Basis: G0 ordered-state requirement (zero accepted stale/wrong-run/wrong-worker/wrong-map/expired regressions); source005/006; `docs/contracts/v1.md` HTTP/guidance sections; the newly published snapshot-order section of `docs/contracts/v1.0.1-addendum.md`; QR003 primary/supplement lineage; and [QR004 clock binding](../clock-binding-v1.1.md). An independent read-only source review by `/root/qa_lead/qa_server/source_cards` separated run, incident, guidance and sensor counters before the publication-order addition. No incumbent client implementation serves as the expected-result oracle.

## Observed publication contract

At 2026-09-21T10:26:31Z, the addendum SHA-256 was `bc6f017422e8ffba04ab0ece9c3bc2e37ed95f775facdc83fb8c56141d52b3c2`; `packages/contracts/src/state.ts` SHA-256 was `c9158837c695403c97a02119a4e2f627cacb75d74ca311e8766948ab000be348`. These identify a preparation read, not a G3 candidate. QA Lead relayed that Frontend concurrence was still pending; final concurrence/contract hash must accompany the G3 binding.

Published rules now establish a fresh application-runtime UUID `streamId`; a nonnegative safe-integer `sequence` increasing per mode throughout that runtime; and matching ordering for HTTP/SSE. Changed visible state, including transient updates and run reset, advances sequence. A repeated identical publication may keep its sequence. Sequence does not restart on runId reset. `run.version` remains the persisted optimistic mutation revision, not transient-publication order.

Within a mode/current stream, only a strictly higher sequence can advance accepted state. HTTP cannot adopt a different stream. Only the first authoritative snapshot from the currently owned initial/reconnected SSE connection establishes a new stream baseline; callbacks from superseded connections are inert. A fresh runtime can restore an older persisted revision, so compare stream epochs explicitly rather than using UUID lexical order, run revision alone or mutable wall timestamps. Schema defaults `legacy`/0 are solely old-DB parsing compatibility; new wire responses require actual stamped fields.

## Independent ordering domains

| Domain | Identity/order | Required interpretation |
| --- | --- | --- |
| Snapshot publication | `(mode, streamId, sequence)` plus owned SSE-connection generation | Strictly increasing within its current stream/mode; no cross-mode counter comparison. New stream requires the authoritative owned SSE baseline. |
| Run isolation | `(mode, runId)` established by accepted authoritative snapshot | A higher-sequence current-stream snapshot may legitimately replace runId after reset. A guidance envelope whose runId disagrees with its established current run remains invalid. Do not mislabel a legitimate reset as wrong-run guidance. |
| Mutation consistency | run.version and expectedIncidentVersion | Atomic optimistic checks/idempotency; not a snapshot stream epoch and not a guidance counter. |
| Guidance envelope | `(runId, workerId, guidanceId, guidanceVersion)` | Immutable envelope version ordering within that lineage, with incident/map/profile/route/hazard validity. Distinct workers/incidents may start at version1 without being globally old. |
| Primary playback | `(runId, workerId, guidanceId, primaryGuidanceVersion)` | Same active lineage across a newer supplement produces no primary replay. A genuine new primary invalidates old callbacks and transitions once. |
| Sensor input | camera sequence or worker/session epoch+sequence | Observation ordering is separate from all snapshot/guidance/acknowledgement domains. |
| Validity time | UTC generatedAt/expiresAt and observation/document UTC | Wall time validates expiry/freshness; it cannot decide which snapshot publication is newer. |

FirstGuidance means the actual first delivered record for a worker within its incident/run, not the first record of every replacement primary version. A newer primary or supplement cannot rewrite it. A rejected/duplicate input may produce diagnostic rejection evidence, but cannot create a duplicate semantic guidance/incident/user-response effect.

## Admission and handshake cases

| Case | Required state outcome |
| --- | --- |
| Unknown-stream HTTP arrives before any SSE baseline | It may be buffered or rejected, but cannot establish the current stream, claim authoritative current state, draw an accepted route or start guidance modalities. Reconcile after the owned initial SSE baseline. |
| First authoritative snapshot from currently owned initial SSE connection | Establish stream and sequence baseline, then validate its mode/map/current-run/guidance context. An older connection's first callback has no baseline authority. |
| Same stream, higher sequence, unchanged run.version | Admit legitimate transient changed state without fabricating new guidance/audio. This remains true if run.updatedAt is equal or moves backward. |
| Same stream, equal/lower sequence | Ignore/reject duplicate/reverse publication; higher wall time or guidance version inside it cannot rescue stale snapshot order. Equal-sequence different payload is a protocol conflict, never silently accepted as current. |
| Same stream, higher sequence, legitimate new runId | Accept reset snapshot and retire previous run's active guidance/context. Sequence remains increasing; mode-specific run state/timers stay isolated. |
| Delayed pre-reset HTTP/SSE snapshot | Its lower sequence is rejected even if it contains a higher old run.version, later timestamp or larger old guidanceVersion. |
| Current stream snapshot containing foreign-run/worker/map/expired guidance | Snapshot order alone does not authorize the invalid inner guidance. Reject/explicitly handle it without route/audio regression or wrong-target receipt. Keep the rejection reason separate from outer-publication admission. |
| HTTP from an unknown/new/retired stream | It cannot switch stream, even with a very large sequence or later UTC. Await an authorized current-owned SSE baseline. |
| First authoritative snapshot on owned reconnect with genuinely new streamId | May establish fresh runtime baseline even with lower sequence/run.version; cancel/retire old connection callbacks. Check persisted semantic integrity separately under S19/S20. |
| Reconnect with the same streamId | Does not reset the existing high-water sequence; an identical current snapshot is an idempotent no-op. Delayed lower-sequence data cannot roll state backward. |
| Superseded connection callback, including its first snapshot | Ignore regardless of stream, sequence, timestamps or run version. Source connection ownership is checked before baseline adoption. |
| Missing wire streamId/sequence or `streamId: legacy` | Explicit invalid wire/protocol handling; parse compatibility cannot silently turn it into an authoritative new runtime snapshot. |

Envelope checks remain layered: the declared current context comes from accepted authoritative state, not the incoming message's self-asserted worker/run/map. Exact immutable duplicate guidance in a newer harmless snapshot must not repeat speech/vibration; reversed guidance in a newer snapshot must not regress the worker. Valid supplements retain primary context/time fields while increasing envelope version and keeping primaryGuidanceVersion; superseded supplements cannot restore an older primary. Expiry is checked at delivery/application against the correctly bound UTC clock, including the equality boundary once the contract is confirmed. Simulation pause never extends guidance validity.

## Proposed deterministic 1000-envelope schedule

Retain the original ten labels and100 each. Use100 rounds,10 counted injected envelopes per round, alternating modes so each mode receives50 rounds. Each mode has its own stream/high-water and active-run context. Setup/baseline snapshots and reset/reconnect operations are separately logged as control traffic, never silently counted as additional suite envelopes. A setup record establishes known current/retired contexts; no product output is used to invent expected acceptance.

Within every round inject one valid forward primary, then the remaining nine base classes in the existing fixture order: exact duplicate, reverse version, expired, wrong run, wrong worker, wrong map ID, wrong map version, old snapshot after reconnect, delayed pre-reset. Invalid inner-envelope cases use otherwise valid current-stream forward outer publications, so they cannot all appear successful merely because an outer duplicate guard discarded them. The old-snapshot/pre-reset classes deliberately preserve stale outer sequence/connection context. Exact duplicate guidance also appears inside a newer unchanged-primary snapshot to exercise playback dedupe independently of transport dedupe.

Establish a new run before local mode rounds1/11/21/31/41 and preserve prior-run examples; sequence continues across these resets. Reconnect controls occur before the old-snapshot injection. Emit and retain an expected ledger before candidate execution: counted index/class, mode, owned connection generation, stream/run, outer sequence, guidance/primary lineage, injected UTC and expected admission/effect. Use the G0 seed20260921 for any content generation; no pass-derived retry permutation. The final ledger hash and any schema adapter binding are registered before execution.

This schedule is a proposal awaiting QA Lead binding, not a newly frozen replacement fixture. Additional focused handshake/supplement/clock probes below supplement interpretation and do not change the base1000 count or existing G0 thresholds.

## Focused probes and clock binding

- Same current stream/sequence with changed content: explicit protocol-conflict/no current regression; do not order by updatedAt.
- Increasing sequences with decreasing/equal publication UTC; decreasing sequences with increasing UTC: sequence decides outer order. Validity clocks for contained guidance remain independently valid during this probe.
- Two mode streams sharing the runtime UUID but different sequence counts: no cross-mode rejection or timer/state leakage.
- Reconnect races: an old HTTP response before new SSE, old SSE callback after new baseline, two connection attempts resolving in reverse order, and a same-stream reconnect's duplicate baseline.
- QR003 valid supplement during active primary speech, duplicate supplement and obsolete-primary callback: use S17/UI09-09; do not collapse envelope and playback versions.
- QR004 preserves virtual epoch `2026-09-21T09:00:00.000Z` and seed20260921. Document-validity unit fixtures use `2026-09-21T09:30:00.000Z` only under QR004's actual-review-ledger binding. Live guidance/model/observation integration uses measured current UTC, not expired fixed09:00/09:30 envelopes. Duration/deadline tests use monotonic elapsed time. Do not rewrite the base fixtures, real reviewedAt, real audit time or historical no_match evidence.

## Questions retained for QA/Technical Lead resolution

1. **Owned SSE baseline definition:** publish the concrete connection-generation ownership rule and atomic point at which initial/reconnect authority changes. A superseded callback must be recognizable without trusting its wall timestamp. The contract already states the outcome; final client binding/concurrence is pending.
2. **HTTP before first SSE:** reject or buffer are acceptable; publish the chosen behavior and the UI's uninitialized/connecting state. Buffered data cannot establish a stream or be called current before baseline. After baseline, apply only matching-stream, strictly newer publications.
3. **Conflicting baseline identity:** specify explicit handling for an owned reconnect claiming a previously retired stream, or a same-stream/equal-sequence snapshot with changed content. Proposed result: no silent adoption; diagnostic state and fresh reconnection. Do not invent ordering by UUID, UTC or last-arrival wins.
4. **Wire/schema compatibility:** confirm live HTTP/SSE reject missing/legacy ordering fields while old DB rows can migrate. Default schema acceptance alone is not evidence of stamped runtime identity.
5. **Sequence exhaustion and restart:** safe-integer sequence must never wrap silently. Record the owner's planned behavior; no huge stress workload is newly required. A real restart must stamp fresh runtime UUID and preserve committed semantics while treating restored revisions explicitly.
6. **Expiry equality and future timestamps:** confirm `now >= expiresAt` as expired, permitted future-issued clock skew if any, and the layer owning device/server clock correction. No tolerance is invented here; snapshot admission never falls back to UTC ordering regardless of this answer.
7. **Input-to-observation seam:** identify G3's authorized isolated injection adapter, which can provide outer snapshots and inner envelopes independently without writing product files or using developer DB. Record actual browser/Android/client versus server-only slices separately.

Questions are test-method/contract bindings, not permission to weaken the existing zero-regression outcome. QA Lead owns final method registration and overall/whole-AC decisions. Preserve every failed/blocked/not-run attempt and the existing retry limits.
