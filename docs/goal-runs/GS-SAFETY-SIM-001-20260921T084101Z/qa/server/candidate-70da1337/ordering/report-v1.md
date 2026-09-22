# S07/S22 independent web-consumer ordering observations

Executor: `/root/qa_lead/qa_server/ordering_execution`. This is a bounded G4 consumer slice, not a whole-AC or product verdict.

The exact original 1,000 injections exposed **100 confirmed stale-guidance consumer failures**. Another500 invalid inputs were filtered to null; whether their prior valid guidance must remain projected is a **retention-binding ambiguity for QA Lead**, not500 confirmed misaddressed-guidance regressions. Applying the original card's retention wording literally to the captured projections gives400 matches/600 discrepancies, which is preserved separately from the confirmed failure count. The additional24 focused policy probes matched their expectations. No actual UI, audio, vibration, network, server endpoint, DB or device behavior was executed in this slice.

## Candidate and execution

- Read-only candidate: `/home/b/.cache/gs-safety-ci.u7pR52`.
- Full candidate: `70da1337ab54652824ffb49f65cb0213822ba7c2420ae345664dbe7c48c893af`; source: `af06052baf673b40b33f8a4bb9f095b4239ff622d82fec492de6d42caeb92584`.
- Submitted HEAD: `9dc020a7c0160af17e2ac9157dcb8c390890309a`; build ID observed: `VEwOJr6BFk2kVq-L1cCiG`. HEAD is attribution supplied by parent; all 1,375 source/build entries in `runtime-artifacts/candidate-manifest-build04.json` were independently hashed before and after both executions, with no mismatches.
- Runtime: Node v22.23.2, existing candidate tsx4.23.15, TypeScript7.0.2. QA configs, loader temporary directory and outputs were restricted to owned QA directories; tsx cache disabled.
- Base ledger written at **2026-09-21T13:19:30.934Z**, before consumer execution; SHA `4f86a9a6bf723a2cdc83f4ab9c593388086d7675ddaa17550f39dfb98a0fa772`.
- Base consumer execution: **13:22:03.182–13:22:06.334Z**. Focused ledger hashed at13:25:08.468Z; focused consumer execution13:25:21.147–13:25:24.250Z. All times are2026-09-21 UTC.
- Original fixture remains SHA `62c9b14fae43d44321961a08e84395558efebd33319c0e421df90972c1bc37a7`. Exactly10 original classes ×100; 50 rounds per mode, seed20260921. Controls are uncounted, separately present in every input row.

QA independently authored full schema-valid snapshots; no producer test fixture or producer PASS was substituted for QA. The real exported `useConsoleStore`, `evaluateSnapshot`, `currentWorkerGuidance`, `samePrimaryGuidance`, `responseGuidanceVersion`, `AlertLedger`, `alertObservations` and wire schemas were imported from the frozen candidate. Routes in these fixture envelopes are synthetic ordering markers, not independently verified route geometry.

QR004 is respected: scenario virtual epoch stays09:00 with seed20260921; pure-consumer UTC is injected from actual preparation UTC and recorded; real execution UTC is separate. Guidance generation precedes that injected UTC by60s and valid expiry follows by1h. Expired inputs and exact expiry boundaries are deliberate variations. No document clock, review ledger or model is involved.

## Subcase results under original S07 retention oracle

| Original class | Count | Matching current guidance | Discrepancy |
| --- | ---: | ---: | --- |
| current-valid-forward |100|100|None; v3→v4 |
| exact-duplicate |100|100|None; forward outer sequence, identical primary v3 |
| reverse-version |100|0|Older v2 replaces v3 |
| expired |100|0|Projection becomes null; unexpired v3 lost |
| wrong-run |100|0|Projection becomes null; unexpired v3 lost |
| wrong-worker |100|0|Projection becomes null; unexpired v3 lost |
| wrong-map-id |100|0|Projection becomes null; unexpired v3 lost |
| wrong-map-version |100|0|Projection becomes null; unexpired v3 lost |
| old-snapshot-after-reconnect |100|100|Superseded epoch ignored |
| delayed-pre-reset |100|100|Lower outer sequence ignored despite old run version999 and later UTC |

Invalid inner cases deliberately have valid, forward current-stream outer sequences. Their rejection cannot be credited to transport deduplication. The initial runner recorded **900 PASS/100 FAIL for its narrower safety-filter predicate**, which allowed null as rejection. That predicate does not establish S07's explicit “latest valid version retained” requirement. The original expectation was not changed: `retention-analysis-v2.json` applies it to the preserved raw observations and is the authoritative retention analysis. Initial ledger and results remain unchanged.

## Finding ORD-01: newer snapshot accepts older primary guidance

Criterion: S07/S22, original ordered-state zero-regression requirement. Both modes affected,50 cases each.

Minimal input is original counted case3: baseline current stream sequence100, same run/worker/guidance identity with guidance/primary/route version3; incoming sequence101 contains version2 in both worker and incident current guidance. All schema, run/worker/map/profile/expiry checks pass. Expected: retain version3 or reject the stale guidance without making version2 current. Observed: the actual store advances to101 and the actual worker consumer returns guidance2, primary2, route2. Case3 input SHA: `c1960af73d6b6cd886dd68987fe6e6e5f8719560a6b957d7f828ce87ee160bc2`.

Source binding: frozen `src/client/store.ts:78` checks outer publication order and stores the incoming snapshot at101; `src/components/worker/guidance-policy.ts:61` checks current scope and incident equality but does not preserve a prior guidance high-water mark. Independent positive controls advance valid guidance3→4. This is an observed pure-consumer state regression; actual speech, vibration or rendered route regression is **NOT_RUN**.

## Observation ORD-02: invalid new guidance produces null — NEEDS_QA_BINDING

Criterion: original S07 latest-valid-version retention. In500 cases, current valid baseline guidance3 is unexpired and correctly addressed. A forward outer snapshot carrying expired or foreign-context guidance is accepted by the store; `currentWorkerGuidance` correctly filters the invalid inner guidance to null. Under a literal projection-level interpretation of the original card, the expected result is latest valid guidance3; observed result is null. This demonstrates filtering rather than retention at this pure projection seam. It does not prove persisted baseline guidance was lost and must not be reported as an accepted wrong-worker/map/run route; those projections were null.

The temporal-method proposal permits rejected/explicitly handled invalid input, while the original S07 card also requires retention. An independent skeptical reviewer confirmed the100 stale-version failures but judged the500 nulls ambiguous until projection-layer retention is explicitly bound. QA Lead owns this resolution. Both oracle interpretations and all observed values remain preserved; ORD-02 is not promoted to a confirmed product regression.

## Focused probes

24/24 scoped probes matched expectations: unowned HTTP cannot establish/switch a stream; owned SSE may establish a new lower-revision stream; equal/conflicting and lower sequences do not advance; forward sequence wins over backward wall time; coherent new run is accepted; old connection callback is ignored; same-stream reconnect retains its watermark; mode counters remain separate; missing/legacy wire ordering is rejected; exact expiry and pause do not extend validity; wrong floor/profile and missing/closed incident are filtered; supplements preserve primary identity; captured voice response remains bound to primary while stale display response is not rebound; real `AlertLedger` deduplicates repeated/supplementary primary lineage and recognizes a new primary.

These passes do not cover or negate ORD-01. In particular, equal-sequence rejection differs from accepting reverse guidance inside a higher-sequence snapshot. Identity and alert-announcement outputs are not audio playback observations.

## Evidence, preservation and limits

All paths below are under `evidence/qa/server/candidate-70da1337/ordering/` in this goal run:

- `input-ledger-v1.json` and `input-ledger-v1.sha256.json`: immutable pre-execution inputs, controls and narrower initial expected predicate.
- `results-v1.json`: raw1000 outputs; SHA `a997e2808745931c4d4c3cc44edca5c85fdf7f782b37abd2195cb379ef65c23d`.
- `retention-analysis-v2.json`: original retention-oracle analysis over the same raw output. `retention-analysis-v1.json` is preserved but superseded because the QA analysis compared JSON key insertion order; v2 recursively normalizes object keys while preserving ordered arrays. No product rerun occurred.
- `focused-inputs-v1.sha256.json`, `focused-results-v1.json`: pre-execution focused input/runner hashes and24 outputs; focused result SHA `a6c73059c67b5ad27684ac2f1c4febe7895de973c7e6364c79cab52779886471`.
- `candidate-integrity-before.json`, `candidate-integrity-after.json`: complete manifest checks; focused report embeds its own before/after checks.
- `execution-initial.log`, `focused-initial.log`, `typecheck-initial.log`, `typecheck-corrected.log`, `typecheck-focused.log`: original outputs. Initial QA typecheck import/config errors were corrected before execution; diagnostics were retained.

Exactly one base execution and one distinct focused execution occurred. No identical environment retry, product rework, server/DB mutation, browser/device/model execution or outside-owned-path artifact was performed. All five QA TypeScript files are96lines or fewer except focused.ts at101; strict typecheck passed. Responsibilities are fixture construction, preparation, integrity, counted execution, focused probes; no `any`, type assertions or ignored diagnostics were added. A read-only independent reviewer confirmed ORD-01 and the UI/audio/route-geometry evidence limits.

The 1000 workload uses explicit independent baselines so a failure cannot poison subsequent cases; it is not a real transport timing/stress run. Old connection epochs are driven through the real store interface, not real EventSource callback scheduling. No claims are made about server response identity validation, DB persistence, geometry safety, mobile behavior, actual speaker output or rendering. QA Lead retains whole-AC authority.
