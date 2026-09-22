# Q-SERVER delayed supplement addendum v1.0

**SUPERSEDED preparation, preserved for provenance.** QA Lead's QR003 correction on 2026-09-21 replaces the provisional same-guidanceVersion/snapshotRevision transport assumption. Use `delayed-supplement-addendum-v2.md` and `delayed-supplement-fixture-v2.json`: every immutable envelope has a new guidanceVersion, updateKind distinguishes primary/supplement, and stable primaryGuidanceVersion identifies playback lineage. No product test was run against this provisional card. The original body below is retained unchanged.

Goal/run: GS-SAFETY-SIM-001 v1.0 / GS-SAFETY-SIM-001-20260921T084101Z. Task/card: Q-SERVER / S17. Owner: `/root/qa_lead/qa_server`. Assigned by QA Lead on 2026-09-21. Status: **NOT_RUN**. No product files changed and no product execution performed.

This adds preparation detail for existing AC08–11 outcomes: primary guidance does not wait for RAG, emergency speech has priority, first transmitted guidance is immutable, and the latest accepted state survives recovery. It preserves `test-cards-v1.md`, `fixtures-v1.json`, G0 and all prior records. Input details are in `delayed-supplement-fixture-v1.json`. It joins [UI09-09](../ui-device/ac09-android-guidance.md) and [RAG generation evidence](../rag/ac08-generation-card.md); server observations cannot substitute for actual Android audio or actual normal-model evidence.

The canonical revision contract is pending publication by Technical Lead. `snapshotRevision` names the intended state-publication ordering field; confirm its exact location, scope, monotonicity and SSE event mapping against the frozen G3 contract before writing the adapter. Do not conflate it with `guidanceVersion`, `routeVersion`, `profileVersion` or incident mutation version, and do not silently weaken the case if the contract cannot represent an augmentation.

## S17 input and procedure

1. Start each mode with the G0 seed/clock and a current eligible ko or en worker. Produce an urgent primary guide through the actual server flow while holding a valid supplementary completion. Capture the original primary dispatch, current state revision, and complete persisted first-guidance record before releasing the supplement. Hash the first record using a documented stable JSON key order; retain its raw object as well as its digest.
2. Coordinate with UI09-09: release the supplement after the actual device records primary speech started and before primary speech ended. Preserve both device events and server release/receive timestamps. A server-only timing mock remains explicitly a software slice; if speech is unavailable the actual overlap/audio slice remains BLOCKED/NOT_RUN.
3. Keep incident/run/worker/map/route/profile/hazard dependencies unchanged and the guide unexpired. RAG QA supplies a valid matched result grounded in the actual retrieved document ID/version/chunk. For normal actual-model evidence record provider/model/revision/call identity and actual/mock marker. Artificial delay alone does not turn a mock completion into real-model evidence.
4. Capture the accepted augmentation from DB, current guidance HTTP snapshot and SSE. Join with the original dispatch by runId, incidentId, workerId, guidanceId and guidanceVersion. Capture the before/after snapshot revision values independently of the unchanged primary guide version.
5. Deliver a duplicate augmentation frame, then reconnect and fetch the latest snapshot. Inspect first/current persisted records after process restart using the same isolated QA DB. UI09-09 records primary beep/TTS starts, cancellation and playback continuity; repeated render frames and transport events alone do not establish audio behavior.
6. Separately invalidate route or profile during a delayed completion and retain the rejected outcome as the existing AC08 freshness control. This negative sibling must not overwrite the normal valid case or conceal absence of an accepted supplement.

## Required observations

| Observation | Expected result | Evidence owner / join |
| --- | --- | --- |
| Initial urgency | Primary dispatch and immediate display precede supplement completion; no RAG/admin approval gate. | Server dispatch plus UI09 screen/audio event times. |
| Revision semantics | Current augmentation carries the same guidanceId/guidanceVersion and a strictly newer snapshotRevision. Any intervening unrelated snapshot revisions remain in the raw sequence; no assumption of exactly +1 is made unless the canonical contract requires it. | Server HTTP/SSE before/after frames and contract version. |
| Primary stability | Identity, action, primary message/key/arguments, language, route, destination, profile and original guide generation/expiry remain unchanged. No new primary dispatch, incident, or guide version is synthesized solely to publish explanatory text. | Primary field diff, event/dispatch ledger and DB rows. |
| First-history immutability | Original first-guidance raw record and digest stay equal before augmentation, after augmentation, after duplicate/reconnect and after DB/process recovery. | Server first-guidance records/digests joined to original dispatch. |
| Current augmentation | Valid supplemental explanation and exact document/version/chunk provenance appear in current state, SSE and persisted accepted history/current state; HTTP and recovered snapshot agree. | Server DB/snapshot/SSE plus RAG retrieval/call/validation evidence. |
| Primary audio dedupe | Updated display/provenance is visible while active emergency speech keeps priority. No repeated beep, primary TTS request/start, or augmentation-induced cancellation/restart; duplicate/reconnect delivery does not replay primary speech. | UI09-09 actual Android playback evidence keyed by guide identity/version and snapshotRevision. Server has no authority to PASS this observation alone. |
| Freshness control | Route/profile invalidation rejects the now-stale completion, leaving current primary guidance intact and preventing accepted/persisted stale augmentation. | Existing RAG fault case plus server rejection and latest-state records. |

## Evidence and result separation

Store each attempt under `evidence/qa/server/<candidate>/S17/`, retaining first-guidance-before/after raw JSON and digests, primary-field diff, HTTP snapshots, ordered SSE frames, DB query output, dispatch ledger and a correlation table. Each row records contract/candidate/protocol identity, test ID, actual/mock marker, run/incident/worker/guide identity, guidanceVersion, snapshotRevision, server UTC, device monotonic timestamp/clock offset where applicable, event kind and artifact path.

Report server first-history/persistence/revision observations separately from actual model and actual audio observations. Whole AC08–11 and overall acceptance remain QA Lead's decision. Preserve failures and the existing two-product-rework/one-identical-environment-retry limits.
