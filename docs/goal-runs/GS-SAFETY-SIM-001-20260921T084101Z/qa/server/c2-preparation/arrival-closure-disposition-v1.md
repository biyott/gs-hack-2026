# Arrival and closure disposition — read-only, 2026-09-21T14:11:28Z

QA Lead interpretation while C2 remains unfrozen. No product execution, source fix, fixture change or acceptance verdict accompanies this note. C1 is `sha256:70da1337ab54652824ffb49f65cb0213822ba7c2420ae345664dbe7c48c893af`; prospective root source is not that candidate. Existing failures and original inputs remain preserved.

## Decision

Do not replace the failed producer reroute case with a case that clears hazards and reopens passages. Keep that original case and its failure. An additional authorized-reopen positive control is useful but cannot prove the original closed-edge case. Root retains repair authorization and exhausted-attempt decisions.

The frozen independent QA S20 remains unchanged: valid first REFUGE-01 route, valid latest REFUGE-02 route, current arrival at REFUGE-02, actual process restart, and later departure to the old target that must not retain current arrival. The additive return-to-latest check remains conditional on that target still being eligible. Worker and incident current projections are both checked; history and genuine user responses remain separate.

## Evidence and distinction

- `qa/server/candidate-70da1337/core/s20-process-fixture.ts` derives EQ-SPEED-DIRECTION events through 8s, adds REFUGE-02 position at 9s and old REFUGE-01 position at 11s. It adds no route-block event.
- Retained `evidence/qa/server/candidate-70da1337/core/attempt-04-s20-phase1/S20-OS-phase1.json` has `closedEdgeIds: []` at first, latest, arrived and paused checkpoints. First/latest positions are `(65,25)` with destinations REFUGE-01 then REFUGE-02; arrival/paused positions are `(125,42)` with `CONFIRM_ARRIVAL`. This was read from existing raw data, not rerun.
- The distinct producer `src/server/simulation/runtime-restart.integration.test.ts` reroute case derives EQ-ARRIVAL and closes EDGE-A-04, EDGE-A-05 and EDGE-C-05 at 2s before arriving at REFUGE-02 at 3s.
- The map connects all three closed edges to old REFUGE-01. Latest REFUGE-02 connects through EDGE-B-04, EDGE-B-05 and EDGE-C-06, which that input does not close. This is graph evidence, not a new physical-safety certification.
- Goal lines 35, 41, 54, 100 and 103 distinguish arrival, current action, explicit worker response and reopening. Source002 lines 73/83 and 129 distinguish destination arrival and reopening. S20 addendum lines 43–47 requires a valid latest destination and preserved first history. None requires reopening unrelated old-target edges before acknowledging valid latest-target arrival.

## Competing explanations and next evidence

1. **Different preconditions:** the failing producer fixture and independent S20 are different inputs. Confirmed from their event lists and retained QA snapshots. Do not silently import one fixture's closures into the other's expected result.
2. **Product eligibility regression:** root `engine/evaluation.ts` returns AWAIT when no hazards affect the worker and any closed edge exists; root `arrival-intent.ts` preserves a non-no-exposure, non-authoritative-target decision. This is a source-supported hypothesis, not a fresh QA runtime result. `run.advance` evaluates at the event and again at the final clock boundary. Capture both decisions, targets, positions, incident bindings and closure ownership before concluding which transition causes the producer failure.
3. **Historical oracle mismatch:** four producer receipt/history equality checks may conflict with the intentional durable recovery commit. A corrected assertion must preserve exact prior history, exactly one eligible recovery append, and no additional append caused by receipt replay or unchanged second recovery. It must not normalize away duplicate recovery commits, lost history or changing first-stop timestamps.

Root's separate recovery-boundary reviewer independently reached the same no-fixture-replacement interpretation. C2 remains held until an honest producer disposition and candidate receipt; independent C2 execution remains required.
