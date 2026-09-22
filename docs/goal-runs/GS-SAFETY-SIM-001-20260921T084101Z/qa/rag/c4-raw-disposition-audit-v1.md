# C4 raw-result disposition audit v1

Files-only audit by `/root/qa_lead/rag_gap_oracle`, observed 2026-09-21T17:55:31Z. Candidate: `sha256:cd8a2428d3d9e44703c25b4ae135f0ed5821b6b3b3794bbca6abc1ec37197eba`; isolated source `/home/b/.cache/gs-safety-c4.q2FD40`; manifest SHA-256 `a4ae231987936e6a91cc05ff380eb71a69597c7e689e315dd6e21e7222d0b53d`.

Only this new report was written. No original input, raw result, map, product or source was modified. Read-only shell/JSON parsing and SHA-256 computations were used; no product execution, database access, test, server, model or provider call occurred. This report audits dispositions and exact saved publication identities, not the parallel full semantic text review. No whole-case, AC or overall verdict is issued.

## Frozen accounting and audit conclusion

The [final module map](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/rag/qd008-next-adapter/c4-module-coverage-map-v1.json) is bound at SHA-256 `e6b20a5e6bc531ba9e9992e81c5a9b6db366660d7ec182a2396b140c9ee53ef6`. I independently recomputed every listed raw-file hash: **85/85 matched**, with no mismatches. Independent parsing of the three summary arrays and individual result status fields gives:

| Saved group | Entries | PASS | FAIL | BINDING_GAP | NOT_RUN |
| --- | ---: | ---: | ---: | ---: | ---: |
| Retrieval | 24 | 21 | 3 | 0 | 0 |
| Filters | 30 | 29 | 0 | 1 | 0 |
| Faults, service status | 31 | 25 | 1 | 0 | 5 |
| Original85 | 85 | 75 | 4 | 1 | 5 |

The 24 retrieval entries **include** Q-RAG-CLOCK-01 through 04. They are not subtracted from this saved 85-entry denominator. All 31 integrated fault results remain NOT_RUN; service PASS is not integrated delivery proof.

The module map's narrow dispositions are supported: they preserve raw failures, identify old-oracle assumptions, distinguish supplied retrieval facts from authoritative event evidence, and keep unexecuted surfaces open. They do **not** establish an 85-case pass or replace the unmet predicates in the original cases. The remaining gaps below must stay attached to any derived coverage credit.

## Source requirements retained

[G0 D lines 60–69](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/goal.input.txt:60) require applicable evidence, engine-owned action/path/policy, semantic and version checks, and fallback. [AC-06–08 lines 104–106](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/goal.input.txt:104) require actual scope/ranking evidence, required/forbidden/action/outcome comparisons and prevention of invalid or stale supplementary delivery. [003 lines 123–128](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/sources/emul-003.body.md:123) require filtering before keyword/vector search and applicability/exception checks. [004 lines 407–408](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/sources/emul-004.body.md:407) retain body conditions with the procedure. [004 lines 469–478](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/sources/emul-004.body.md:469) specify expected and forbidden document IDs, action codes and outcome; the extra COMMON-only whitelist is not a listed native field.

The [frozen applicability method](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/rag/applicability-binding-method-v1.json), SHA `5785230cb22b128a6444a79509a8b301fec0fa43d9a79d0795a6f182f915b64e`, expressly preserves original85, distinguishes supplied control facts from actual history, retains Q07-06's null policy in its fact-only diagnostic, and permits a separately named explicit-evacuation positive. The [v3 fixture binding](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/rag/qd008-retest-preparation-v1/fixture-binding-proposal.v3.json), SHA `8e4cd6dbc450e37dc787c23da5002262f00efd7b2a31d5c473d15d2d0735df89`, is consistent with that distinction.

Candidate [retrieval-candidates.ts lines 85–96](/home/b/.cache/gs-safety-c4.q2FD40/src/server/rag/retrieval-candidates.ts:85) require true fire-route invalidation plus explicit evacuation/designated-refuge policy for FG-002, and a true equipment-direction-change fact for EQ-002. Candidate [EQ-002 body line 36](/home/b/.cache/gs-safety-c4.q2FD40/knowledge/equipment/EQ-002.md:36) requires a direction change followed by a new guidance/route version. [FG-002 lines 36–42 and 58–64](/home/b/.cache/gs-safety-c4.q2FD40/knowledge/fire-gas/FG-002.md:36) require actual prior-route invalidation and, for movement explanation, explicit movement policy and a valid replacement; missing input is not guessed. The gates therefore address real applicability conditions, not merely test convenience.

The production [history extractor lines 101–170](/home/b/.cache/gs-safety-c4.q2FD40/src/server/services/rag-applicability.ts:101) binds adjacent snapshots to run/map/worker/current primary and event changes; [lines 51–98](/home/b/.cache/gs-safety-c4.q2FD40/src/server/services/rag-applicability.ts:51) compare prior and replacement routes against fire geometry. Static inspection is not a new execution claim. The separate [case-applicability.ts lines 48–79](/home/b/.cache/gs-safety-c4.q2FD40/src/server/rag/case-applicability.ts:48) is explicitly a hash-bound test-input mapping, not a replacement for production history.

## Four raw FAIL dispositions

| Raw case | Actual saved observation | Supported disposition and remaining limit |
| --- | --- | --- |
| Q-RAG-07-02 | COMMON-004 selected; required EQ-002 absent. Request has no applicability fact. EQ-002 excluded for `equipment-direction-change-unproven`. Required-document, eligibility-equality and full-vector-pool assertions fail. | Original case remains FAIL. The described heading-change scenario has an unbound private fact in this frozen request. A separately supplied true fact establishes positive retrieval in the controlled derivative; it cannot turn the absent fact in the original into true. Actual direction-event observations separately offer EQ-002 to the model, but the model selected EQ-001, so EQ-002-specific actual accepted output/publication remains unobserved. |
| Q-RAG-07-03 | EQ-003 and EQ-001 selected; EQ-002 absent from actual FTS/vector/fusion. EQ-001 violates the added whitelist. The other two failures expect EQ-002 in an old metadata-only eligible/vector pool. | Preserve **all three** raw failures. Native required EQ-003, forbidden, action and matched comparisons are separate successful observations. The two pool mismatches do not demonstrate lost scoring of a currently eligible document; EQ-002 lacked its required event fact. The whitelist disposition does not itself prove EQ-001 body applicability or bilingual meaning. |
| Q-RAG-07-06 | COMMON-004 selected; required FG-002 absent. Both request applicability and scenario policy are absent/null. Exclusion reasons are `fire-route-invalidation-unproven` and `movement-policy-unproven`. | Preserve missing-required plus the two oracle-pool failures. A true fact alone still excludes FG-002 under null policy. Only the distinct true-fact/explicit-evacuation derivative establishes the intended positive retrieval. Actual engine/HTTP reroute observations add evidence for a valid, explicit-policy scenario; they never imply that the original null meant evacuation. |
| Q-RAG-08-22 | Expected `fallback:expired`, observed `fallback:stale_guidance`. Mock response completes after the injected expiry boundary; no accepted evidence persists and primary remains unchanged. | Preserve raw reason FAIL. Controlled expiry rejection is independently supported; the source requires discarding expired output, not these exact internal reason strings. This classification does not establish actual-model or HTTP/device behavior for the case. |

Exact raw sources: [Q02 assertions](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/rag/candidate-cd8a2428/module-attempt-01/retrieval/Q-RAG-07-02.json:725); [Q03 exclusion/vector/assertions, lines 630, 747 and 770 onward](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/rag/candidate-cd8a2428/module-attempt-01/retrieval/Q-RAG-07-03.json:630); [Q06 null policy, line 19; exclusion lines 639–640](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/rag/candidate-cd8a2428/module-attempt-01/retrieval/Q-RAG-07-06.json:19).

The exact old-oracle mismatch is visible in [eligibility-oracle.ts lines 4–26](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/rag/qd008-next-adapter/bound/candidate-cd8a2428-r2/eligibility-oracle.ts:4): no private event-fact test exists. [retrieval-oracle.ts lines 48–53](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/rag/qd008-next-adapter/bound/candidate-cd8a2428-r2/retrieval-oracle.ts:48) reuse that broader set for eligibility equality and expected scored-vector completeness. Their assertion `observed` arrays are the oracle's expected pools; actual scored vectors must be read from `result.trace.vector`. For Q03 those actual vectors are only EQ-003 and EQ-001. The map correctly describes three C4 failures, not the earlier candidate's one-failure result.

For Q08-22, [raw events lines 55 onward](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/rag/candidate-cd8a2428/module-attempt-01/faults/Q-RAG-08-22.json:55) move controlled wall time to `2026-09-21T17:29:03.834Z` at elapsed 250 ms, equal to the guide's expiry ([line 167](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/rag/candidate-cd8a2428/module-attempt-01/faults/Q-RAG-08-22.json:167)). Provider completion is at controlled `17:29:04.334Z`, elapsed 750 ms. Before/after primary fields are unchanged. Candidate [service.ts line 80](/home/b/.cache/gs-safety-c4.q2FD40/src/server/rag/service.ts:80) names already-expired input `expired`, whereas its post-provider [lines 112–113](/home/b/.cache/gs-safety-c4.q2FD40/src/server/rag/service.ts:112) call `guidanceIsCurrent` and name rejection `stale_guidance`; [validation.ts lines 56–59](/home/b/.cache/gs-safety-c4.q2FD40/src/server/rag/validation.ts:56) reject either input/current expiry. This explains the actual condition and reason without equating the frozen strings or changing the result.

## BINDING_GAP and five NOT_RUN boundaries

- **F13 remains BINDING_GAP.** Its [raw source-validation error, lines 97–112](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/rag/candidate-cd8a2428/module-attempt-01/filters/Q-RAG-06-F13.json:97) rejects `simulationTypes` and has null eligibility/zero assertions. Candidate strict source schema is unchanged; this is source representability, not runtime filter success or leakage. Applicability controls do not close it. G0 preserves common plus site scope; 004 specifies singular simulationType, not the frozen extra allowlist field. The earlier written disposition remains conceptually applicable, but this audit binds the observation to current C4 bytes rather than transferring a C3 result.
- **Q08-16 remains NOT_RUN.** Its [provider output is null and absent-token limitation remains, lines 288–303](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/rag/candidate-cd8a2428/module-attempt-01/faults/Q-RAG-08-16.json:288). Current C4 positive and append controls separately record accepted exact EQ-003 text and rejection of appended unreviewed text, each 10/10 assertions with nonnull payload/completion identity. This is meaningful mocked-provider service evidence; it is not the frozen replacement, actual-model contamination or HTTP/client non-delivery proof.
- **Q08-01 and Q08-02 remain NOT_RUN in original85.** Current engine/reroute/module evidence can support specifically named normal-publication slices. It cannot silently replace original-normal English context with a supported-profile derivative or credit rendering/audio from service records. Full text semantics are owned by the parallel review, not this audit.
- **Q08-26 remains NOT_RUN.** The module map correctly limits zero-canary findings to captured files and preserves failed unique target E5 association (`exactE5Join=false`, two query/model calls). Absence of canaries cannot identify which embedding call belongs to the target. Production process E5, transport/client/log coverage and any distinct process join must remain explicit.
- **Q08-31 remains NOT_RUN.** Primary-preserving supplements before 5000 ms at HTTP/SSE may address that bounded publication requirement. They do not prove that primary speech/display was active first, once-only audio, no extra beep, urgent/new-primary interruption, stale old-lineage rejection or physical output. A timeout fallback cannot replace accepted-before-deadline evidence.

The [module map lines 27–39](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/rag/qd008-next-adapter/c4-module-coverage-map-v1.md:27) retains the correct split: eight supplied controls, actual engine observations, and unresolved EQ-002-specific model selection. Supplied controls establish the gates' response to explicit facts; actual history extraction and current-primary publication are separate requirements. No new blanket defect or blanket success follows from these dispositions.

## Four HTTP global lineage FAILs

The final raw [integration-capture-joins.json](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/rag/candidate-cd8a2428/http-attempt-01/integration-capture-joins.json) has four FAIL rows, each failing only `recorded generation joins one persisted run/guidance/worker/profile lineage`; the other four capture predicates pass. [http-capture-joins.ts lines 23–31](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/rag/qd008-next-adapter/bound/candidate-cd8a2428-r2/http-capture-joins.ts:23) collect all history under a stable run/guidance ID, then require every guide timestamp to precede the old generation and one worker/profile/locale tuple. It does not scope those rows by primaryGuidanceVersion.

I independently read the exported `finalDatabase.ragRuns`, `guidanceVersions.payloadJson`, final snapshot events and current guide for each named raw failure. All four have an explicit old-primary publication event; later-primary rows explain the failed broad predicate:

| Preserved raw generation FAIL | Old generation start → completion UTC (2026-09-21) | Later primary generatedAt UTC | Separate target observation |
| --- | --- | --- | --- |
| `971c0f0f-e67e-4358-9faa-34f94fdbf795` | 17:43:52.023 → 17:43:52.309 | 17:43:52.466 | Warmup Korean target generation `84f166a8-c104-4a91-9b02-1f7efb5ee908` |
| `19dd8e0c-dcd5-4f5d-819e-1f56b8bae147` | 17:43:53.169 → 17:43:53.469 | 17:43:53.603 | Measured Korean target generation `13b0a88e-298a-4ac3-b7c7-981261f2bc16` |
| `e39c1a87-90a6-47d6-ade5-b53e87d53dfe` | 17:43:54.309 → 17:43:54.589 | 17:43:54.716 | Measured English target generation `0ce8db44-c41e-412f-ab50-89490888189d` |
| `41f3a4a1-6ca2-4203-b902-d2fe2ea2a294` | 17:43:55.419 → 17:43:55.697 | 17:43:55.715 | Delay target `9ad7e5c8-b9b0-4548-83b0-5db7571059f2`, timeout at 17:44:00.724 |

Each old accepted generation is joined by its own snapshot `guidance.supplement` event to primary 1 / supplement 2. The three reroute targets have different generation IDs and explicit events for primary 3 / supplement 4, matching final current guidance. The delay target instead has a `rag.fallback` event for primary 3 / guidance 3, profile 2, and no target supplement. Its earlier accepted generation belongs to profile 1; both its future timestamp and mixed profile tuple invalidate the broad global predicate. This is an oracle-association explanation, not a rewrite of any raw FAIL.

The exact target [reroute report predicates, lines 18–50](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/rag/qd008-next-adapter/bound/candidate-cd8a2428-r2/http-reroute-evidence.ts:18) use run/incident, guidance ID, primaryGuidanceVersion and the outcome event's ragRunId, then restrict publication frames and generations. This supports separating later target publications from earlier failed global joins. Warmup is excluded from samples. In each measured reroute saved report the target-specific publication has 14/14 checks and primary 3 → supplement 4; those are bounded HTTP/DB/SSE/reconnect observations, not physical visibility/speech.

**Retrieval association remains qualified.** The reroute report's broad `traceJoins` contains two overlapping retrieval rows and explicitly records `ambiguousRetrievalJoin=true`; the publication's citation-compatible `retrievalJoinIds` contains one candidate and `retrievalJoinAmbiguous=false`. Those are different predicates. [Lines 51–74](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/rag/qd008-next-adapter/bound/candidate-cd8a2428-r2/http-reroute-evidence.ts:51) explain the absent guidance/worker foreign key. A unique citation-compatible observation plus independently captured model call supports that narrow join; it must not be expanded into an asserted unique producer-to-retrieval foreign-key link. Full semantic verification of selected text remains with the separate reviewer.

The [delay phase report](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/rag/candidate-cd8a2428/http-attempt-01/real-delay-phase-derived.json) preserves raw OBSERVED_FAILURE and separately classifies 13 checks for target primary 3. Its accepted warmup generation is not a late target publication. It records about 5001.923 ms to timeout, not an exact 5000 ms abort, and upstream completion occurred before downstream cancellation. It cannot demonstrate cancellation of still-running inference, all resource cleanup or Q08-31's accepted supplement/audio requirement.

## Evidence hashes

The full original85 hash table is preserved inside the exact module-map JSON hash above and was independently verified in this audit. Key files below are under `/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/rag/candidate-cd8a2428/`.

| File | SHA-256 |
| --- | --- |
| module-attempt-01/qa-readonly-initial-summary.json | `43be39b83fbc5b428305c15b2d8e6cc37a42d30c01caac2f0143db87bcfc4d60` |
| module-attempt-01/retrieval/Q-RAG-07-02.json | `238ea6dfc25f4f8b6689bcc3a5c20a43fc64586c1fad467a97bd10c39b750d96` |
| module-attempt-01/retrieval/Q-RAG-07-03.json | `4d3219cb5ddcc96341f3322d0bfbcc04b7d84f443d580007db2116a97f27c17d` |
| module-attempt-01/retrieval/Q-RAG-07-06.json | `27c5d5d732a94842a22dee347dafce38a6de306a03e4af948be4c0e79d379ef5` |
| module-attempt-01/faults/Q-RAG-08-22.json | `b3512009f162677925d7e22555e7b2beada4e9d4f7284f893b300901a0175572` |
| module-attempt-01/filters/Q-RAG-06-F13.json | `78f71d42b3896c21d1537296747cfd0c67d39e94b2f6fd73e93ca1da3291f1d1` |
| module-attempt-01/faults/Q-RAG-08-16.json | `5fe0f8e7c80c360968e1109222811d132aa87e5a853ce8f3b5dc32ab31e8113e` |
| module-attempt-01/case16-append/positive.json | `c98f9788de8b6ba2836543e861626389d5fe42eb7440444716f8e352cd39f25f` |
| module-attempt-01/case16-append/append.json | `fcae4d828ed3c84bb23d2138d69265b561b6845722986d688ed8d3531fc27be1` |
| http-attempt-01/integration-capture-joins.json | `8922e5d81a6d196b45ef959575e738a937ff4e9a85eb6bf531827a2544a67a71` |
| http-attempt-01/http-reroute-addendum/warmup-ko-result.json | `ba43ad798e114976b12678da73cebea12892bae20e02ac6837999d2d4eac6473` |
| http-attempt-01/http-reroute-addendum/measured-ko-result.json | `66fddf90703eec6bb36f408157fae96488fbd1c395c7fdc72b945b0508498b74` |
| http-attempt-01/http-reroute-addendum/measured-en-result.json | `6e96773e6353fae0e9db581692d19f3d1b0eab531b2ad0f7dc26178d387f712b` |
| http-attempt-01/real-delay-result.json | `7182e7136f45160fae1ee1d2d0187368941cb96e72c964ba1fa0e4e91e0512c6` |
| http-attempt-01/real-delay-phase-derived.json | `bbc96dc8461383d0660757d31ebda302fb413b43781783567d845db3d8f2bcf5` |

Eight inspected candidate files were independently hashed and matched `candidate-manifest-c4.json.sourceFiles`; this is scoped source binding, not a whole-candidate attestation:

| Candidate-relative file | SHA-256 |
| --- | --- |
| src/server/rag/retrieval-candidates.ts | `f0fa519d74e096797cb40f4aa56dd8eb776eb78f2ad7afad5e803791a93178e7` |
| src/server/rag/case-applicability.ts | `b8d2640fb3c8b7f92f75634d1acdba0a4c3656a8bafcd22f97671fdde41e6248` |
| src/server/rag/service.ts | `594062bc1ce5df27048436a149a727af715de21280c5736d12e674d0d3f29996` |
| src/server/rag/validation.ts | `23818b1658dbe90de98ac99ffb5e7994ef90ff51ebda2692252747c6110486de` |
| src/server/rag/knowledge.ts | `d947b953101881a27a9e966ca88253c05bf491905016779df883b394d18ea1f8` |
| src/server/services/rag-applicability.ts | `d1c9e9fec40e8f2a970bbcf941155c0a246c1b2a5037dc299af54328f760e6a7` |
| knowledge/equipment/EQ-002.md | `b10f6892ec886a96f1570909095991319adb8ad1e758ab43aca75f9da1a4dd0c` |
| knowledge/fire-gas/FG-002.md | `890827a5b140b5ed3e98a8bb70fc3f8d7aa6b6aa23ceb4fcb91ac609ffdee0d8` |
