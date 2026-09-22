# Q-SERVER incident, recovery and receipt addendum v1.0

Goal/run: GS-SAFETY-SIM-001 v1.0 / GS-SAFETY-SIM-001-20260921T084101Z. Owner: `/root/qa_lead/qa_server`. Preparation only; S18–S22 are **NOT_RUN**, pending QA Lead's G3 assignment. Base v1 cards/fixtures and S17 revisions remain unchanged. No product files edited or candidate executed.

Basis: `../../integration-observations.md` IO001/IO004 are implementation observations, not reproduced QA failures. Current contracts are `docs/contracts/v1.md`, `v1.0.1-addendum.md`, and linked auth/DB/guidance policies. They require distinct clear/reopen/close transitions, authenticated actor binding, immutable history, separate worker response facts, run isolation and latest-state recovery. Source005/006 and G0 remain controlling outcomes. Product tests and current implementation are not the expected-result oracle.

## S18 — Two simultaneous independent incidents and path ownership

AC03,10,11,14. Use two disjoint synthetic hazards in the same fire-gas run, with independently affected workers and distinct incident identities. The fixture identifies QA-HZ-A/WORKER-A and QA-HZ-B/WORKER-B; IDs label test data, not extra production entities. Bind actual scenario payloads to the final input contract without changing the expected set relationships.

Use PATH-A restricted only by hazard A, PATH-B only by B, and PATH-C restricted independently by both. Read actual graph edge membership from the frozen map and compare the union of owner restrictions against closedEdgeIds. Owner release does not imply a shared physical path is open while another owner still restricts it. Paths with a separate policy/other-incident restriction stay blocked.

| Step | Operation | Expected hazard / path / incident state |
| --- | --- | --- |
| 0 | Both hazards active simultaneously | Distinct incidents; A contains only its disjoint hazard and B only its own; closed paths A/B/C. No accidental merging merely because one incident is newer. |
| 1 | Acknowledge A; request reopen or close before clearance | Acknowledgement is distinct; unauthorized order is rejected without changing hazards/owners/terminal timestamps. B remains active. |
| 2 | Authorized clear A | Only A hazard becomes inactive; B stays active. All A/B/C restrictions persist. Only A hazardClearedAt is set. No passageReopenedAt/closedAt implied. |
| 3 | Authorized reopen A | Release only A's eligible restriction ownership. PATH-A opens if it has no other owner; PATH-B and shared PATH-C stay blocked by B. A reopening is recorded separately; B remains unchanged. |
| 4 | Authorized close A | A closes only after its clearance and reopening authorization. B remains active; shared PATH-C is still blocked. Closing A is not global permission to travel. |
| 5 | Clear B | B hazard inactive; B/C restrictions remain; B passageReopenedAt/closedAt still null. |
| 6 | Reopen B, then close B as separate requests | B ownership releases; PATH-B/C open only when every restriction owner is released. Distinct actor/time/request/incident records for clearance, reopening and closure. |

Repeat with A/B selected order reversed in a separate fresh fixture and exercise duplicate/conflicting administrator requests with the existing idempotency/concurrency rules. Inspect affected worker guidance and independent hazard state after every action. UI QA separately verifies selected-incident focus while the other incident arrives; server evidence establishes that the second incident exists regardless of focus.

Artifacts: before/after HTTP/SSE snapshots, incident/hazard identity map, independent path-owner union ledger, map path-to-edge mapping, authorized/denied requests, persisted audits and first-guidance digests. Missing owner visibility is addressed with observable edge/hazard/history checks and checkpoint evidence where available; a guessed global unblock is never the oracle.

## S19 — Actual process restart preserves manual state and restrictions

AC04,10,11. Start the frozen candidate on its own port with `DATABASE_PATH` under this slice's evidence directory. Use the documented migrate/seed commands only for initial fresh setup. Pause virtual time at a known checkpoint so future scenario events cannot legitimately overwrite manual choices during comparison. Capture full state and last successfully committed command receipts.

Set EQUIPMENT-A to nondefault `tadano-gr250n4` and an independently chosen valid nondefault chassis pose `(36,24)m`, heading30°, slew10°, speed0, tableLinked=false. Preserve model, pose, geometry version and other selected-configuration state. Use only final-catalog-supported controls; fixed boom baseline remains a comparison field, not an invented controllable motion. Update WORKER-A profile to version2 with preferred en and stairs forbidden and set a distinct valid mock position. The exact fixture is in `incident-recovery-fixture-v1.json`.

Take separate recovery checkpoints (a) after selected hazard clear but before passage reopen, and (b) after explicit reopen but before close. Each checkpoint must retain both incidents from S18 as applicable. Record successful response/DB commit, process PID and command, stop that process, verify it exited, and launch a new process against the same DB and same candidate/configuration. Recreating an in-memory runtime object is supporting evidence only and does not satisfy this card.

Before advancing virtual time and after one fresh evaluation, verify manual model/pose and geometry, worker profile/version/current position, cleared-hazard world state, still-active other hazards, exact path-owner restrictions and explicit reopening timestamps. Snapshot recovery alone is insufficient if the next evaluation reconstructs stale scenario state. RunId does not reset merely because the process restarts. Wall-time expiry/staleness is measured separately and must remain truthful; it must not silently revive old guidance or conceal incorrect world-state restoration.

Replay one exact pre-restart mutation requestId: its stored original response returns without a new effect/history row. A same-key changed request or different actor conflicts. Fetch latest state after the replay to prove an old returned receipt did not roll back current state. Preserve historical guidance/firstGuidance, worker-response receipts, incident audits, actor/time and separate terminal actions. Restart must not create a duplicate incident or a duplicate primary dispatch merely by rebuilding state.

Artifacts: actual process lifecycle/PIDs/commands, isolated DB identity, pre/post checkpoint and first-evaluation snapshots, semantic field diff, request receipt/history queries and exact replay outputs. G3 determines executable launch bindings; no process execution has occurred during preparation.

## S20 — Arrival recovery uses latest rerouted destination

AC02,04,05,10,11. Arrange a valid independently checked initial route to REFUGE-01=(125,8), then change permitted paths/hazard context so the valid route changes to REFUGE-02=(125,42). Keep the original first guidance pointing to REFUGE-01. Confirm both destinations and path permissions with the frozen graph oracle rather than treating the current implementation's chosen route as expected.

Move the worker to REFUGE-02, making current action the appropriate arrival state with empty route/destination fields. Do not infer the remembered destination from those nulls or from firstGuidance. Capture the latest movement guide and its route version, the subsequent route-less arrival guide, and explicit worker responses separately. Restart the actual process as in S19 before another scenario event; recover and evaluate at the latest destination.

Expected: latest valid arrival target remains REFUGE-02; current arrival action does not revert to travel toward REFUGE-01; firstGuidance stays immutable. A later position at the old target is not treated as arrival at REFUGE-02. Position reaching the target does not synthesize user arrivedAt/understoodAt/receivedAt; an already explicitly recorded response remains recorded after restart. Repeated same requestId does not append duplicate arrival history. An internal checkpoint may preserve the target, but only post-restart behavior plus joined historical evidence proves this outcome.

## S21 — Subscribers are not target-device receipt

AC05,10,11,14. With no worker client connected and no worker-response request submitted, connect independent administrator and read-only observer SSE clients to the same mode; also open a second administrator tab. Trigger guidance for WORKER-A and vary observer/admin subscription count, reconnect them, and receive their frames.

Expected: `connectedRecipients` or a mode-wide SSE subscriber count describes transport subscriptions/attempts only. It never establishes WORKER-A receivedAt, displayedAt, spokenAt, understoodAt, arrivedAt, assistance acceptance, or successful target delivery. Generation, transmission attempt, any verified socket write, actual device receipt and user response remain separate facts. Even an authenticated WORKER-A socket receiving a frame without a matching device acknowledgement does not prove the response endpoint was called.

An observer/admin/WORKER-B request claiming WORKER-A receipt must be handled by the published role/target policy and cannot fabricate that worker's device acknowledgement. Then submit one valid WORKER-A `received` response for the exact active guidance using its authenticated identity: only receipt changes; understanding/support/arrival do not follow automatically. Replays stay idempotent. Join receipt evidence to worker/run/incident/guidance version and actor/time, independent of global subscription counts.

Actual device display/audio remain UI09 evidence. For synthetic HTTP receipt controls mark the actor fixture and mock nature explicitly; they prove server validation/storage, not real Android receipt.

## S22 — Temporal ordering binding before the 1000-envelope run

AC04,09,11. `temporal-ordering-binding-proposal-v1.md` records contract-derived invariants, a deterministic ordering proposal preserving the base ten classes ×100, and unresolved cross-run/snapshot/clock questions. It does not adopt the incumbent client policy as the oracle or alter G0. Bind only after QA/Technical Lead resolve the listed ambiguities and final contract hash is supplied. Current status remains NOT_RUN.

## Evidence limits

Each attempt records candidate/source/protocol/contract hashes, exact fixture, wall and virtual clocks, process and DB identities, request/event sequence, expected/observed deltas, raw paths and result. Existing two product-rework/one identical-environment-retry limits apply. Submit discrepancies only through QA Lead. No sub-QA whole-AC or overall verdict is issued.
