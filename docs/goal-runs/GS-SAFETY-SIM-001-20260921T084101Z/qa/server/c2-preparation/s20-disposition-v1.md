# Read-only S20 disposition before C2 freeze

Recorded2026-09-21T14:13:01Z.

Goal/run GS-SAFETY-SIM-001 / GS-SAFETY-SIM-001-20260921T084101Z. Author `/root/qa_lead/qa_server`; status PREPARATION / NOT_RUN. This is a bounded interpretation for QA Lead, not a product or whole-AC verdict. No test, product import, process, DB mutation, hash sweep, input/oracle change or product edit occurred. C1 artifacts remain untouched.

**The failing producer closure case is not the frozen QA S20 input.** Its result cannot replace or silently revise S20.

## Exact input difference

Frozen QA [`s20-process-fixture.ts:3`](../candidate-70da1337/core/s20-process-fixture.ts) derives EQ-SPEED-DIRECTION, retains only equipment pose events through8s, then adds WORKER-A at latest REFUGE-02=(125,42) at9s and old REFUGE-01=(125,8) at11s. The source scenario starts with `blockedPathIds:[]` (`data/scenarios/equipment/eq-speed-direction.json:91`) and contains no route-block event in that prefix. Its first target at4s is REFUGE-01; changed heading at8s produces REFUGE-02. The preserved phase1 first/latest/arrival/paused snapshots all have `closedEdgeIds:[]` at lines640/1434/2243/3068 of `evidence/qa/server/candidate-70da1337/core/attempt-04-s20-phase1/S20-OS-phase1.json`.

The current producer `src/server/simulation/runtime-restart.integration.test.ts:139` instead derives EQ-ARRIVAL, adds a route.block at2s for `EDGE-A-04`, `EDGE-A-05`, `EDGE-C-05` (lines151–155), then puts WORKER-A at REFUGE-02 at3s. It asserts the earlier route has rerouted to REFUGE-02 before asserting arrival, then reopens SQLite and submits an explicit arrived response. No clear/reopen input exists in that original producer sequence.

| Closed producer edge | Frozen map endpoints | Relation to latest target |
| --- | --- | --- |
| EDGE-A-04 | J-A-100 → REFUGE-01 | Closes an approach to the old target. |
| EDGE-A-05 | REFUGE-01 → J-A-132 | Closes an exit from the old target. |
| EDGE-C-05 | REFUGE-01 → J-C-EAST | Closes the old target's vertical connector. |

`data/maps/site-construction-01.json:30–42` shows these are all three edges incident on REFUGE-01. They isolate that old node. Latest REFUGE-02 still has unclosed EDGE-B-04 from J-B-100, EDGE-B-05 to ASSEMBLY-01, and EDGE-C-06 from J-C-EAST. These closures do not geometrically close REFUGE-02 or its north/B route. This is a graph relationship, not a claim that graph openness alone overrides a separate hazard, freshness, profile or policy restriction.

## Why the current source selects AWAIT_REOPEN in the producer case

`src/server/engine/evaluation.ts:130–133` selects `AWAIT_REOPEN_AUTHORIZATION` whenever there is no affected hazard and **any** closedEdgeId remains. It does not test whether the remaining closure touches the latest target or its previously validated route. `src/server/simulation/arrival-intent.ts:143–148` permits arrival substitution only for no-exposure or a current validated route to the same target, and therefore preserves the passage-awaiting-reopen decision. The producer-reported result is consistent with this source path; no independent C2 runtime execution was performed.

The source guard establishes current implementation behavior. It does not by itself establish a normative rule that a closure anywhere invalidates arrival at an otherwise eligible refuge. Existing contract `docs/contracts/v1.md:54` says a destination at the current node is represented by arrival; `v1.0.1-addendum.md:78` requires explicit reopening for closed passages. Those facts can coexist: confirming presence at an eligible refuge does not reopen the old refuge's edges or authorize travel through them.

## Bounded interpretation of unchanged-input C2 outcomes

The registered S20 card at `qa/server/incident-recovery-addendum-v1.md:43–47` explicitly starts with independently valid routes, then expects the **latest valid** arrival target to remain REFUGE-02, an appropriate route-less arrival state at that target, unchanged first guidance, and no arrival claim at the old target. It does not require arrival when a new target-specific hazard, closure, unknown/stale position, expired identity or other authoritative invalidation makes the target ineligible.

For the unchanged frozen QA-S20-OS input, no closure is present. With the same map/profile/known fresh position and still-valid target context, arrival at REFUGE-02 before and after recovery remains required; substituting AWAIT_REOPEN merely because the producer's different test has closures is not permissible. If C2 changes another relevant eligibility condition, record that precise source/input binding and resulting limitation for QA Lead; do not infer ineligibility solely from whatever action the new code returned.

After the original11s movement to old REFUGE-01, current worker guidance **and the same worker's incident.currentGuidance/current response projection** must cease presenting CONFIRM_ARRIVAL for REFUGE-02. Any explicitly valid non-arrival action is permissible; no specific replacement such as GUIDANCE_UPDATED is mandated. The latest target remains REFUGE-02, first guidance/history remains immutable, and genuine user-response facts are not deleted or fabricated. The original failure concerns stale current guidance, not an already-recorded explicit arrivedAt fact.

For the producer's unchanged closure-bearing case, the exact map relation does not independently justify treating REFUGE-02 as closed or ineligible. QA Lead/root must resolve any proposed global waiting policy against the normative source. Until then the producer failure should stay preserved and separately identified; it is not an obsolete assertion merely because the new guard returns AWAIT_REOPEN. Adding clear/reopen would change that input and remove the disputed condition. It may become a separately authorized positive control, but cannot replace the original failure or the no-closure S20 retest.

QD003-D1's authorized durable recovery revision is a separate issue. A genuine first recovery may append its one committed snapshot/checkpoint revision; repeated no-op recovery must not. That does not authorize weakening immutable history-prefix checks or changing S20's arrival/target outcomes. Likewise D2 permits optional target metadata retention; a derivative C2 assertion should check original coordinates plus retained declared metadata without treating the newly preserved keys as target corruption. C1's original exact-XY assertion remains preserved as evidence.

## Concrete retest disposition

1. Keep original no-closure S20 inputs and original departure oracle unchanged. Inspect both current-guidance copies after departure and retain first/history evidence.
2. Retain the producer's three-closed-edge case as a distinct unresolved policy/regression control; do not insert clear/reopen solely to remove its failure.
3. If authorized, add separate latest-target-actually-blocked and unrelated-old-target-blocked cases. Their expected eligibility must be bound independently before execution, with closure ownership and target/path membership explicit.
4. No result is issued until a fixed C2 receipt, affected-source selection and execution grant exist.
