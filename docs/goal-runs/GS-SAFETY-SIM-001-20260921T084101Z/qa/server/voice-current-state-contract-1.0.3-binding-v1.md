# S23 binding to frozen playback-stop contract1.0.3

Prepared 2026-09-21 by `/root/qa_lead/qa_server`; QR009 / IO-009. Status: **NOT_RUN**. This additive note binds the preserved [S23 proposal](voice-current-state-addendum-v1.md) to [contract1.0.3](../../../../contracts/clarification-playback-stop-v1.0.3.md). It does not replace that proposal, raw producer observations, G0 or prior integrity reports. No source edit, product import/execution, database access, network request or device operation occurred. This is bounded preparation, not final review or G4.

## Frozen identity and historical preservation

`docs/contracts/freeze-v1.0.3.json` was frozen at `2026-09-21T11:55:56.536Z` and declares content SHA256 `65efcc79a230bba592dc0fc4b79771dcc1e8e565aa88b42488cb1e3509183812`. It lists21 current content files and records Root, Backend, Frontend, Mobile and QA concurrence. Simulation wire version remains1.0.0; the new status is an enum extension requiring coordinated current web/APK consumers. Catalog/tracking remain1.0.1 and map1.0.0. A contract freeze is not the final integrated source/build/APK candidate.

The separate read-only evidence file `evidence/qa/server/voice-contract-1.0.3-binding-verification-v1.json` records each current file's byte length and SHA256 against the21 entries, the previous freeze-file hashes, and the old19 archived content hashes. The declared aggregate is checked against QA Lead's supplied value; no undocumented aggregate-hash algorithm is claimed to have been reconstructed.

The historical archive is `evidence/technical/contracts-v1.0.1-before-v1.0.3/`. For each old manifest `files[].path`, prepend that archive directory to locate the old bytes. Its copied `freeze-v1.0.1.json` is metadata in addition to the19 content files. Earlier current-root integrity checks were point-in-time observations; they are not rewritten to pretend the current1.0.3 `state.ts` still has the old hash. The new source-copy/build manifests are separate artifacts from this archive.

## Bound fields and meanings

| Field/fact | Frozen meaning | S23 assertion |
| --- | --- | --- |
| `response.voiceStatus = "stop-requested"` | Server requested pause/stop for this primary; device stop outcome is unconfirmed | Never label completed, confirmed cancelled, physically silent or understood. It is a server intent, not a new device response. |
| `response.voiceStopRequestedAt?: string \| null` | Actual server UTC of the first stop request for the current primary; missing/null means no recorded intent | New producers explicitly use null initially. Preserve a nonnull marker through same-primary supplement, pause/resume, repeated stop and checkpoint/restart. Do not use virtual scenario time or device callback time. |
| Primary scope | Existing worker/run/guidance/primaryGuidanceVersion identity | A genuinely new primary resets response state and marker. Another run/worker/session/primary cannot mutate its replacement. |
| Pending with marker | Server stop intent is recorded but no start report has yet arrived | Voice status stays pending. Do not prematurely force stop-requested, cancelled or completed solely because the marker exists. |
| Local manual replay | No separate server playback-attempt identifier is introduced | Same-primary local repeat does not reset server delivery state/marker, create a new server attempt or allow a start to overwrite terminal state. Local utterance IDs may remain QA correlation evidence. |
| Genuine terminal report | Existing authenticated/current-lineage/validity guards still apply to completed/failed/unsupported observations and their factual timestamps | Do not fabricate a terminal report from stop intent. Do not reject a genuine current report solely because a stop marker exists; apply the established guards. |
| Device cancellation acknowledgement | No `voice-cancelled` HTTP event is added | Native local cancelled is a queue/TTS-stop request state, not a correlated engine-onStop report and not confirmed physical silence. |

Use exact remote wording `중지 요청 · 기기 확인 없음` / `Stop requested · device unconfirmed`. Clients render the authoritative voice status; they do not infer confirmed cancellation from a timestamp. In particular, pending-plus-marker remains pending until a qualifying delayed start changes its authoritative status. An independently displayed local coordinator cancelled state retains its local provenance.

## S23 transition assertions

`T` below is the first actual server stop-request time for this primary; `null` also includes an absent old persisted marker on input. Capture streamId/sequence separately from persisted run.version, and preserve all original receipt/audit bytes.

| Case | Before and input | Required current response and history |
| --- | --- | --- |
| Fresh state / legacy parser | New primary; separately parse an old snapshot without marker | New producer initializes marker null. Old missing marker loads without inventing completion/cancellation or a historical stop time. |
| S23-A playing pause | playing, no marker → pause | stop-requested with markerT; spokenAt and other response facts are unchanged. Original start event remains. |
| S23-H pending pause | pending, no marker → pause before delayed start arrives | pending with markerT. This must work without any prior playing status. |
| S23-H delayed start | pending with markerT → genuine delayed voice-started for the same primary | stop-requested, sameT; keep actual received start in audit. No completed/understood fact is created. |
| S23-I rapid resume | pending with markerT → resume → delayed pre-pause start | Resume preservesT; delayed start becomes stop-requested rather than currently playing. Current run.status being running does not erase the interruption. |
| Repeated stop/start | NonnullT and stop-requested → repeated pause/resume/start reports | FirstT remains unchanged. Start cannot overwrite stop-requested. Exact request replay remains one effect/receipt. |
| Valid positive start | pending with no stop intent, playback-permitted current run → genuine start | playing. This separate positive control prevents a guard from rejecting every start. |
| Existing terminal then start | completed/failed/unsupported or other existing terminal status → later started report for same primary | Keep terminal status/factual timestamps; the start report does not regress it to playing. Retain accepted report history under current guards. |
| S23-D genuine terminal after stop | stop-requested or pending-withT → genuine current completed/failed/unsupported report that passes existing guards | Preserve its real terminal fact and applicable timestamps; stop intent itself never supplies spokenAt. RetainT for this primary. No blanket arrival-time rule substitutes for identity/session/validity checks. |
| S23-B supplement | Same primary becomes a later supplement envelope | Status, markerT, receipt/display/terminal facts and primary playback identity remain; no primary restart/cancel is caused by supplementation. Genuine active-primary callbacks use the existing supplement-lineage rule. |
| S23-E restart with prior marker | Same QA DB restored after a real process exit, markerT already present | PreserveT and terminal facts; fresh runtime stream UUID and correct current status. Do not refreshT merely because the process changed. |
| S23-E running recovery without marker | Persisted running primary with pending or playing status, marker absent → server restores as paused | Record a new first stop request at actual current server UTC. Pending stays pending; playing becomes stop-requested. A later delayed start cannot restore playing. Existing terminal facts remain terminal. |
| New primary positive control | A genuinely new primary while playback is permitted | New response state/marker null; valid new start may become playing. Old primary/run/session callbacks cannot update it. |
| S23-G same-primary manual replay | Local explicit repeat without a new primary | No new server attempt ID, no marker reset and no inferred new delivery attempt. A local utterance cannot bypass the above server guards; do not demand a new server start transition merely to mirror local repeat UI. |

This narrows the original S23-I wording “new valid primary/attempt”: the positive server reset control must use a **new primary**. A same-primary local attempt is diagnostic client evidence only. The S23-C callback-injection case still distinguishes client suppression from server stale-identity rejection; a passive observation window with no completion is not an injected rejection test.

## Required joined observations

Retain the proposal's candidate/primary/request/audit/publication/UI ledger and add `voiceStopRequestedAt` before pause, immediately after pause, after delayed start, after resume, after supplement and after actual restart. Query the current persisted snapshot/checkpoint response and compare current HTTP/SSE with the correct stream/sequence. Historical receipt snapshot bytes can keep their original status/absent marker; QR008 requires the replay HTTP response to use the current authoritative snapshot, not restamped old receipt state.

Join marker origin to the authenticated pause action or explicit recovery transition and actual server clock observation. A marker is not a separate device-received receipt. Capture exact manager/worker/mobile remote labels for pending-with-marker and stop-requested; keep local native/coordinator state distinct. Verify final APK parsing as well as server/schema data: the old APK or build02 test report cannot prove compatibility with this new enum.

A genuine completion, failure or unsupported report must have its own request/actor/primary identity and factual timestamp. Unauthenticated/revoked/wrong-worker/wrong-run/wrong-map/wrong-profile/expired/obsolete-primary responses continue to follow existing guards. Stop intent cannot manufacture or remove user understanding, assistance, arrival, hazard clearance, passage reopening, first-guide history or visible alert continuity.

## Remaining boundaries for final execution binding

There is no remaining ambiguity for pending-pause H, rapid-resume I, marker lifetime, server-intent versus device-confirmation meaning, or absence of a same-primary server attempt ID.

The clarification preserves “existing guarded handling” of genuine terminal facts; it does not specify a new ordering rule between contradictory terminal reports for the same still-current primary (for example completed then failed with distinct request IDs). If that focused case is included, Backend/Tech must identify the existing terminal-to-terminal projection policy; QA must not invent last-wall-time-wins, terminal priority or a new attempt ID. Start-after-terminal non-regression is explicitly bound above and is not ambiguous.

The explicit recovery rule concerns a previously running state converted to paused. The optional-field compatibility rule alone does not say whether an already-paused legacy checkpoint with playing/no marker is backfilled. Before including that migration-specific case, bind its treatment separately; do not confuse it with the required new1.0.3 same-DB recovery path or weaken truthful current/historical presentation.

The contract mandates marker creation for pause and running-to-paused recovery. Expiry, network disconnection and local-only mute/cancel remain the existing validity/lifecycle cases; do not assume each creates the same server marker without a documented producer rule. Test their truthful state/voice suppression under the existing goal, without adding a new timeout or physical-stop guarantee.

These narrow boundaries do not hold up the fully specified S23 cases. Final candidate path/build/APK hashes, affected producer handoffs and later QA Lead G4 dispatch remain required. The independent execution slices and planned final reviewers have not been started by this preparation. QA Lead owns registration and whole-AC/overall decisions.
