# C4 incident browser v1.1 — account-bound correction

Source preparation only, NOT_RUN. Preserve v1 and its earlier static review as history; **do not execute v1 on the default fresh C4 DB**. The earlier review missed fixed account seeding. Further source inspection found `src/server/auth/config.ts` provides `admin`, `admin-2`, and one `support` account; `sessions.ts` authenticates existing account IDs, and `support-actor.ts` requires a registered support assignee. v1's arbitrary `qa-admin-*` and `qa-support-*` identities would fail before the intended incident flow. No runtime attempt was made, so this is a pre-execution source correction, not a repaired product failure.

The additive [v1.1 script](c4-incident-browser-v1.1.mjs) changes login identities to the seeded accounts. Both admins race assignment of the same valid `support` account with distinct notes from equal run/incident revisions. The core requires one 200, one 409, and exactly one persisted `incident.assign` audit matching the two request IDs and an actual admin actor. This proves conflicting-revision handling for two administrators, not selection between two different support assignees. A two-distinct-assignee case needs separately authorized account configuration and remains NOT_RUN.

The matching support context then accepts and completes support. The original checks remain: no semantic worker response fabricated by transport or support activity; immutable first guidance; separate clear/reopen/close; optional B hazard/lifecycle isolation; explicit camera/floor expectations; and delayed callbacks injected only into the actually closed former native EventSource after a real mode roundtrip. Snapshot capture waits permit a newer incident revision because a real supplement may arrive asynchronously; raw DOM context is retained and must be joined to the wire evidence, not described as an exact revision equality proof. A fresh authoritative state is obtained before the old-callback probe.

v1.1 also requires its own source freeze hash. The full input, scope, screenshot privacy and remaining NOT_RUN boundaries in [v1 protocol](c4-incident-browser-v1.md) still apply except its obsolete account names and distinct-assignee description. The fixed seeded account sources are now included in the candidate source check.

## Fixture and grant

Use the current parent-owned C4 process on 4103 with its fresh DB/private PIN receipt. An already paused `FG-FIRE` run after the 1000 ms hazard event is a practical single-incident core fixture; it does not supply independent B. Select the actual active, unacknowledged incident whose hazard set contains `FIRE-ZONE-B`, with actual nonempty first guidance. The selected camera must be independently mapped from frozen site/CCTV metadata for ZONE-B/GROUND and recorded in `cameraByIncident`; no guessed ID is supplied here. Alternatively an active equipment incident has no zone and should use explicit `null` camera expectation, after confirming the actual snapshot's hazard zone metadata. The helper does not reset scenarios or inject hazard events.

Fixture still needs actual candidate/mode/run/incident IDs, optional B ID, camera expectations, and path/hash of the parent's independent fixture preparation provenance. Parent must create these from the actual fixture; placeholders in v1 docs are not executable inputs.

Grant retains `phase: INCIDENT-BROWSER`, exact C4 candidate, `grantedBy: /root/qa_lead/qa_ui_device`, loopback 4103, valid actual UTC interval, script/binding/fixture/process hashes, matching server PID, and all synthetic/exclusive/no-real-frame/evaluation flags documented in v1. Add `freezeSha256` for `c4-incident-browser-v1.1.freeze.json`. No grant is created by this preparation. The valid interval must fit the parent's current runtime window.

```bash
node /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/c4-incident-browser-v1.1.mjs \
  --binding /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/candidate-binding-c4.v2.json \
  --grant /absolute/C4-evidence/approved-incident-v1.1-grant.json \
  --fixture /absolute/C4-evidence/actual-independent-incident-fixture.json
```

Only syntax checking has occurred. Estimate 3–5 minutes browser/application occupancy, then 5–10 minutes report/image review. A successful core still reports `INCOMPLETE_REVIEW_REQUIRED`, `productAcceptance: NOT_RUN`. Late independent B/priority identity, edge-ownership DB joins, worker receipt/arrival, follow-up and delayed supplement playback, actual network outage/server restart and all physical-device work remain NOT_RUN.
