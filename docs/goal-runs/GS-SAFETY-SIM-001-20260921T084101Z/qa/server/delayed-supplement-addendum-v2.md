# Q-SERVER delayed supplement addendum v2.0

Goal/run: GS-SAFETY-SIM-001 v1.0 / GS-SAFETY-SIM-001-20260921T084101Z. Task/card: Q-SERVER / S17. Owner: `/root/qa_lead/qa_server`. Status: **NOT_RUN**. QA Lead correction QR003 on 2026-09-21 supersedes only the provisional transport assumption in v1; no goal criterion or threshold changes. Original v1 documents and base fixtures remain preserved. No product files changed or product execution performed.

Canonical preparation binding observed at 2026-09-21T09:08:55Z: `docs/contracts/v1.md` guidance section and `packages/contracts/src/guidance.ts` now specify immutable envelope versions, `updateKind: primary|supplement`, and `primaryGuidanceVersion`. At G3 bind to the final contract/hash again; an evolving checkout observation is not a candidate freeze.

- A primary envelope has `primaryGuidanceVersion === guidanceVersion`.
- A valid explanation-only supplement keeps guidanceId and primaryGuidanceVersion, gets a newer guidanceVersion, and has `updateKind: supplement`.
- Playback identity is `(runId, workerId, guidanceId, primaryGuidanceVersion)`. A state/snapshot revision, if present, is transport ordering rather than playback identity.
- The contract requires unchanged primary action/text/route/profile/map/hazard context and original generated/expiry timestamps. Current evidence/explanation may augment; actual firstGuidance remains the originally dispatched immutable version.

This elaborates existing AC08–11 urgency, audio priority, immutable first-history and recovery outcomes. It joins [UI09-09](../ui-device/ac09-android-guidance.md) and [RAG generation evidence](../rag/ac08-generation-card.md). Server evidence cannot satisfy actual Android audio or normal actual-model execution by itself.

## S17 procedure

1. For both modes and the existing ko/en profiles, produce an urgent primary guide through the actual server flow while holding a valid supplementary completion. Capture original primary dispatch, complete persisted first-guidance object and stable-key JSON SHA-256 digest before release. Record both primary and envelope version; do not rename one as the other.
2. Release the supplement after UI09-09 observes actual primary speech started and before it ends. Preserve device events and server release/receive timestamps. An isolated timing mock remains a software slice. Missing actual speech keeps the overlap/audio slice BLOCKED/NOT_RUN.
3. Keep the primary lineage's incident/run/worker/map/route/profile/hazard dependencies unchanged and unexpired. RAG QA supplies a valid matched result with real retrieved document/version/chunk provenance. Preserve provider/model/revision/call identity and actual/mock marker; injected delay cannot make a mock result real-model evidence.
4. Observe the appended supplement through DB, HTTP current snapshot and SSE: same guidanceId and primaryGuidanceVersion, newer guidanceVersion and `updateKind: supplement`. Capture any independent snapshot revision without using it to deduplicate primary audio. Current explanation/provenance become visible while the first-guidance object/digest remain equal.
5. Deliver a duplicate supplement frame, reconnect and fetch latest state, then restart against the same isolated DB. Recover augmented current guidance and unchanged first history. Inspect append-only envelope/supplement history and verify augmentation did not create a second primary dispatch or duplicate incident.
6. Observe completion of the ongoing primary speech after supplementation. Its callback references the still-active primary lineage and must remain acceptable without being relabelled as playback of the supplement. Receipt of the latest supplement remains separately recorded. UI09-09 supplies actual beep/TTS start/cancel/end evidence.
7. As a positive transition control, publish a genuinely new primary route/profile guide: its primaryGuidanceVersion equals its new guidanceVersion, it invalidates prior primary callbacks, and it initiates the primary transition once. Separately delay a supplementary completion across route/profile invalidation and verify rejection. These are existing primary replacement/freshness checks, not new acceptance criteria.

## Expected server/client joins

| Observation | Expected outcome | Evidence |
| --- | --- | --- |
| Primary urgency | Original dispatch/visible state precedes supplement completion without waiting for RAG/admin. | Dispatch ledger and UI09 screen/audio times. |
| Immutable envelope versioning | Supplement guidanceVersion is strictly newer; updateKind is supplement; primaryGuidanceVersion and playback identity stay unchanged. | Raw HTTP/SSE and DB envelope rows plus final contract hash. |
| Primary content integrity | Identity/context, action, primary text/key/arguments, locale, route/destination, profile and original generation/expiry remain equal. Supplement has valid explanation/evidence and rag-assisted mode. | Primary field diff, validation and RAG provenance records. |
| Immutable first record | Complete original first-guidance object/digest remains equal after supplement, duplicate, reconnect and restart. | Before/after raw objects and hashes linked to original dispatch. |
| Current persistence | Current accepted explanation/provenance and newest envelope recover consistently; older envelope and supplement history persist. | DB queries, HTTP snapshot, ordered SSE and restart comparison. |
| Primary dispatch/audio dedupe | No augmentation-induced new primary dispatch, beep, primary TTS start, cancellation or restart. Ongoing emergency speech keeps priority; duplicated/recovered supplement does not replay it. | Server dispatch count; actual UI09-09 device audio/display events keyed by primary lineage. |
| Callback and response identity | Current primary completion is accepted for its active primary lineage; supplement receipt is a separate fact; replacing primary invalidates old completion callbacks. | Worker-response requests, accepted/rejected reasons, DB state and device logs. |
| Genuine replacement/stale supplement | New primary causes exactly one valid primary transition; delayed result for obsolete route/profile is rejected without accepted stale state. | New primary envelope, rejected supplement record and UI09 event joins. |

## Evidence and result boundaries

Use `delayed-supplement-fixture-v2.json`. Preserve the base 1000-envelope suite unchanged. Each attempt writes `evidence/qa/server/<candidate>/S17/`: original/after first-guidance JSON and SHA-256, primary-field diff, dispatch ledger, ordered SSE, HTTP snapshots, DB queries, recovered state and correlation table. Correlation keys are candidate/contract/protocol/test, runId, incidentId, workerId, guidanceId, guidanceVersion, primaryGuidanceVersion and updateKind, plus transport revision when present, event kind, timing and artifact path.

Report server persistence/version/dispatch results independently from real-model and actual-audio results. Whole AC08–11 and overall acceptance remain QA Lead's decision. Preserve failures and the existing two-product-rework/one-identical-environment-retry limits.
