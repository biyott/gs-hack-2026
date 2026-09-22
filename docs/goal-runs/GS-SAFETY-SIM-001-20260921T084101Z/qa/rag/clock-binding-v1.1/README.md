# Independent RAG clock binding v1.1

Authority: [QR-004](../../clock-binding-v1.1.md), issued by QA Lead at 2026-09-21T10:23:20.799Z. This preparation derives new inputs without overwriting the original 80 base cases, active Q-RAG-08-31 amendment, prior manifests or readiness observations. Candidate execution remains NOT_RUN.

| Clock domain | Active binding |
| --- | --- |
| Scenario virtual epoch and events | 2026-09-21T09:00:00.000Z, seed 20260921; event schedule unchanged |
| Deterministic document validity | 2026-09-21T09:30:00.000Z |
| Live server/model integration | Actual freshly captured request UTC, including current guidance generatedAt/expiresAt; record real execution start/end separately |
| Deadline/performance duration | Monotonic elapsed time; strict 5000ms RAG deadline and prior thresholds unchanged |

The genuine 18-entry approval ledger is bound by SHA-256 ef2d2352527620d43d2a8ccd15a0f00bc740b3935dd995360c46382e1f3de00e. Its actual reviewedAt values remain 2026-09-21T09:13:05.116Z. Preparation verified current ledger and all 18 approved-file hashes against the saved ledger; this is input applicability, not a new corpus review or product test. A later corpus/ledger change requires G3 rebinding. Any review after 09:30 makes this deterministic normal binding inapplicable and requires an explicitly issued new mapping; never backdate an approval.

## Active inputs

- [bindings.v1.1.json](bindings.v1.1.json) declares each clock domain and all source/original/derived paths.
- [derived/retrieval-cases.v1.json](derived/retrieval-cases.v1.json): 20 cases; only each context.now changes to document-test UTC. The top-level clock remains the scenario virtual epoch.
- [derived/filter-cases.v1.json](derived/filter-cases.v1.json): 30 cases; anchorContext.now and five QA-only synthetic effectiveFrom/expiresAt boundaries move by exactly 1800000ms. Each original before/at/after relation is preserved.
- [derived/fault-cases.v1.json](derived/fault-cases.v1.json): 30 cases, byte-identical to the source. Exact duration injections and semantic/provider expectations do not change.
- [derived/fault-amendment.v1.2.json](derived/fault-amendment.v1.2.json): one case, byte-identical to the active source. Immutable guidanceVersion, updateKind=supplement, stable primaryGuidanceVersion and playback identity are unchanged.
- [review-time-cases.v1.1.json](review-time-cases.v1.1.json): four additional QR-004 cases, covering genuine-corpus pre-review 09:00 exclusion plus the exact genuine EQ-001 reviewedAt and adjacent milliseconds in an isolated copy. Copy the genuine record and ledger row unchanged; these inputs do not invent or mutate historical approval.

All 81 prior expected/forbidden document IDs, action codes, outcomes, eligibility values, applicability explanations and other non-temporal inputs remain unchanged. The active preparation total is 85 cases. Files under original/ are byte-identical snapshots of the four active original fixture files; superseded transport v1.1 and all older cards/readiness remain preserved in their original paths.

Relative source/card references embedded in byte-preserved fixture fields resolve against the original source fixture directory recorded in bindings.v1.1.json. Copying a fixture into derived/ does not rewrite those non-temporal references or change their meaning.

## Manifest and validation

[manifest.v1.1.json](../../../evidence/qa/rag/clock-binding-v1.1/manifest.v1.1.json) records original and derived hashes, every one of the 26 changed JSON fields, exact before/after values and reasons, original preservation hashes, ledger binding and corpus-hash observations. [validation.v1.1.json](../../../evidence/qa/rag/clock-binding-v1.1/validation.v1.1.json) records independent structural comparison of every actual JSON difference against the declared changes, expectation equality, temporal-offset equality and all 85 unique case IDs.

For deterministic retrieval, use the derived document UTC. For live integration, the adapter materializes an execution request with fresh actual UTC and records that request separately; it never edits the immutable fixture or reuses a fixed 09:30 envelope as live guidance. Do not change generatedAt/expiresAt to virtual scenario time. Actual start/end UTC and monotonic durations are separate fields from the injected document/virtual clocks.

Producer 26-case inputs and their own derivation remain producer-owned; QA's preserved original snapshot is at ../../clock-binding-v1.1/producer-cases.original.json. This directory contains no edits to those files, product code, approved corpus, review ledger or DB.

## Prior observations and missing evidence

RAG Lead, relayed through QA Lead, confirmed that the original 26-case retrieval raw output was not saved as a file and its original candidate hash was not captured. Prior transcript/agent summaries do not become reconstructed raw evidence. A surviving producer service-failure log is a different run and is recorded with reporter provenance under evidence/qa/g0/clock-preservation/. See [producer evidence observation](../../../evidence/qa/rag/producer-evidence-observation.clock-v1.1.md).

The historical 09:00 exclusion case remains NOT_RUN. Any future reproduction needs its own actual timestamp, candidate, corpus and ledger hashes and must not be labeled the lost original run. Producer models-only readiness evidence remains component evidence; no G3/G4 result or whole-AC verdict is issued here.
