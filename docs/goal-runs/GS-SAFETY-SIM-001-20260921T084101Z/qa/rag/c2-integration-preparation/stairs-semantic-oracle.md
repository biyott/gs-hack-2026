# C2 preparation: confirmed-stairs semantic oracle

Status: **PREPARATION_ONLY / NOT_RUN**. Owner: `/root/qa_lead/qa_rag/corpus_cards`. Goal/run: `GS-SAFETY-SIM-001` / `GS-SAFETY-SIM-001-20260921T084101Z`. This is an additive oracle for the forthcoming actual-model integration extension. It does not amend the frozen C1 harness, original case03, its raw FAIL, or any C1 evidence. It issues no AC, candidate or overall verdict.

The source reading and hash observation below occurred at `2026-09-21T14:04:52Z`. The author reread all three complete C1 documents, including metadata, conditions, exclusions, both body examples and both approved supplemental strings. C1 root is `/home/b/.cache/gs-safety-ci.u7pR52`; C1 identity is `sha256:70da1337ab54652824ffb49f65cb0213822ba7c2420ae345664dbe7c48c893af`. These documents are **provisional source material for preparation, not an established C2 corpus binding**. No runtime, application, provider, model or test was invoked by this preparation.

## Authority and provisional hashes

| Source actually read | Lines relevant to this oracle | SHA-256 |
| --- | --- | --- |
| [Archived source003](../../../sources/emul-003.body.md) | 117; 123–130: primary catalog, scope filtering, then applicability/exceptions, fallback and score meaning | `3de397aa1733fbda7d4ba4d9c510e147d6799c060e9a005d9a95132e6d16379e` |
| [Archived source004](../../../sources/emul-004.body.md) | 311–318; 403–417; 439–462: engine authority, conditions/exclusions, no invented route, bilingual meanings and placeholders | `5339f3cd43df552e3bda5da24fbef2e72dc49f9cd1ea77bba401dadb6548f2db` |
| [Original frozen retrieval cases](../clock-binding-v1.1/original/retrieval-cases.v1.json) | 138–191: Q-RAG-07-03, before QR004 clock derivation | `ec8b62e17f3d533524cbb915a66b651b100b69b4e8952b8a2735290dbd82ade5` |
| [C1 EQ-001](/home/b/.cache/gs-safety-ci.u7pR52/knowledge/equipment/EQ-001.md) | 23; 36–42; 65–78; 88/92 | `66847a3d71e32e565963b29be1a7d2dbafcdaa44d2e71a506f101569310e0004` |
| [C1 EQ-002](/home/b/.cache/gs-safety-ci.u7pR52/knowledge/equipment/EQ-002.md) | 23; 36–42; 62–79; 85/89 | `b10f6892ec886a96f1570909095991319adb8ad1e758ab43aca75f9da1a4dd0c` |
| [C1 EQ-003](/home/b/.cache/gs-safety-ci.u7pR52/knowledge/equipment/EQ-003.md) | 23; 36–42; 63–80; 86/90 | `efba24b4441c045b4cb266651cc984f2eefb3e3966e053f4828514e66b6ff3f8` |
| [C1 approval ledger](/home/b/.cache/gs-safety-ci.u7pR52/data/knowledge/reviews/approvals.json) | EQ-001–003 approval rows | `ef2d2352527620d43d2a8ccd15a0f00bc740b3935dd995360c46382e1f3de00e` |

All three C1 documents are synthetic `approved_for_demo`, version `0.1.0`, reviewed by `/root/rag_lead/knowledge_review` at `2026-09-21T09:13:05.116Z`. Their reviewable-content hashes, respectively, are `72c885c61053a5bfddc1f27cf841cb1e5cace93ab19888bdbbacce7bdde5c2ca`, `2d08eedcc93b31279b448e3f563562973dafe5d66b86a13162096ff0d7de686e`, and `ffa51860099aa73d2795f7065925f44b92e4e73e89d642445fc4aec9de9f81c6`. Reviewed content and complete approved-file hashes are distinct bindings.

Source003:127 explicitly says, “적용 조건과 예외를 확인해 근거를 선택한다.” Source004:407–408 requires separate applicability/exclusions and preservation of conditions/actions/exceptions in one retrieval unit. Thus a matching metadata filter, action code or high similarity score is not proof of body applicability. Conversely, source004:469–478 does not prescribe the C1 card's exclusive EQ-003-plus-COMMON additional-document list. This extension assesses actual source applicability and generated meaning; it does not silently change that original list or its result.

Before execution, bind the actual C2 candidate ID and manifest, all three applicable source/file/content hashes, genuine approval ledger, active contracts, engine/profile/map data and adapter/harness hashes. Preserve exact C1-to-C2 mapping. If a source or approved sentence changed, obtain its genuine new review and update this preparation basis explicitly; do not label C1 observations as C2 execution.

## Original intent and clocks

Original case03 supplies demo scope, `SITE-CONSTRUCTION-01`, equipment mode/hazard, worker role, `ZONE-A`, confirmed `stairsAllowed=false`, `assistanceRequired=true`, `verified=true`, `FOLLOW_VALIDATED_ROUTE`, null scenario policy and Korean locale. Its query is “계단 이용 불가 확인된 이동 제약 회피 경로”. Required evidence is EQ-003; expected action is FOLLOW_VALIDATED_ROUTE; expected outcome is matched. Explicit forbidden evidence is FG-001–008, EQ-004 and EQ-005. Preserve those prohibitions for this unchanged positive context. Optional support discussion must not replace the engine's movement action.

The original case's `09:00` is historical input, before the genuine C1 `09:13:05.116` review; it is not a valid live approved-guidance envelope. Preserve [QR004](../../clock-binding-v1.1.md): the controlled document reference is `09:30`, scenario virtual time remains `09:00`, and live integration uses freshly captured actual UTC and current generatedAt/expiresAt. Never backdate approval, silently advance engine events, or use the stale fixed document-test timestamp as live guidance expiry. Record monotonic elapsed time separately from both UTC and scenario time.

The original pure retrieval request lacked concrete guide/profile/route/event versions. The actual integration extension must obtain those facts from the authoritative server state. A query string, a fixture title, or the action enum alone does not fill missing facts.

## Facts required before judging an actual response

These are required facts, not invented new API field names. The extension adapter must record their exact paths in the active contract and saved artifacts. An unavailable fact is a binding/coverage gap; do not fabricate a field or infer a positive value.

| Fact | Evidence to capture and compare |
| --- | --- |
| Current target and guidance | Authoritative current guide/snapshot before the request and after settlement: site, mode, run, worker/target, incident/event linkage, guidance ID/version, engine action, locale, generation/expiry UTC and current map version. Verify it is the same target and active guide throughout. |
| Confirmed functional profile | Actual target's snapshot with stairsAllowed=false, assistanceRequired=true, confirmation state/time and profile version. Preserve unknown separately from false/true. Do not infer ability from age, gender or nationality. |
| Current constrained route | Engine-selected route status/version, profile version used to calculate it, map version, validated waypoint sequence and destination. Verify that it is still valid for that confirmed stair restriction. Capture the actual route/constraint validation result; do not choose a route in QA prose. |
| Equipment applicability | Engine evidence that the target is affected by the current equipment hazard, with equipment/zone identity and observation/event time. Capture the worker's current positionStatus and observation freshness: EQ-001:42 excludes movement explanation for unknown position. This binds EQ-001's exposure and position conditions; equipment-mode metadata alone is insufficient. |
| Event causality and version transition | If EQ-002 is selected/cited or its wording appears, capture the authoritative direction-change event or explicit evidence of its absence, the prior/current direction and observation time where exposed, and the causally linked old/new guide or route versions for this run/target. Capture the previous route's invalidation separately, as required by EQ-002:94; a new version number alone does not prove the old route stopped being usable. Preserve unknown if no such evidence exists. |
| Source and retrieval lineage | Genuine approval/validity at request UTC; source document ID/version/file/content hashes; complete procedure chunks; metadata exclusions; FTS/vector/fused results; candidate IDs versus selected evidence IDs; exact model-input chunks and final accepted citation rows. |
| Actual model and publication | Actual provider/model/revision, call identity, request/response UTC, raw complete response and hash, parsed fields, validation disposition, accepted supplemental text, persisted evidence, and captured HTTP/SSE/current-guidance surfaces relevant to the extension. Configuration labels alone are not invocation evidence. |

Retain full conditional sentences and adjacent sentences, not clipped keywords. Save the primary message/action/route/destination before and after the model call and at publication. Record any freshness rejection and the unchanged primary/fallback state separately from a successfully accepted supplemental explanation.

## Per-aspect semantic acceptance and rejection

The following are independent checks. Passing one cannot replace another. Semantic review supplements the active schema, citation, freshness and any exact-reviewed-output rules; it does not weaken them or supply model output.

| Aspect | Required observation | Reject or withhold coverage when |
| --- | --- | --- |
| Engine action | Current request, validated output envelope and published guide preserve FOLLOW_VALIDATED_ROUTE. Movement remains conditional on the current engine-validated constrained route. | Text or structured output selects a different action/policy, permits an old/invalid route, universally orders waiting/shelter, or claims the document/LLM chose the route. |
| Confirmed stairs constraint | For positive **stairs-explanation coverage**, obtain an actual accepted EQ-003-grounded response whose complete meaning retains the confirmed restriction and engine route authority. Match it to the current profile and route snapshots. | It turns false into true/unknown, treats missing profile as unconstrained, tells the worker to use stairs, relaxes the restriction, or invents demographic capability. A generic response that merely avoids contradiction does not establish that this positive explanation was exercised. |
| Route and identifiers | Any mentioned current route, waypoint, destination, equipment, zone, version, number or unit matches authoritative data and the cited source. Do not require every illustrative placeholder to appear. | A new route/waypoint/destination or physical connection is invented; an existing value is altered; a guidance version is substituted for a route/profile version. Unexpanded placeholders must satisfy the actual output contract rather than be silently resolved by QA. |
| Assistance and acknowledgments | Assistance need/request may be explained as a separate flow; request, assignment, acceptance, arrival, receipt and understanding remain distinct. | AssistanceRequired=true becomes a claim that a responder accepted/arrived, or help changes the engine movement action without a new authoritative guide. |
| Event meaning | Preserve the complete conditional scope of an EQ-002 hypothetical explanation. Any claim that direction already changed or that a new guide was caused by it must have matching event/version evidence. | “When/if direction changes” becomes “direction changed/has changed,” a current causal event or new version is invented, or surrounding sentences turn a conditional sentence into a present-tense event claim. |
| Source applicability | Independently verify each selected operative source's conditions/exclusions against current facts, beyond metadata and rank. Separate raw retrieved candidates from sources actually supplied to/accepted from the model. | Required body conditions are contradicted or unproved but the source is credited as verified applicable. A conditional sentence alone cannot establish its document's event precondition. |
| Locale and publication | Test the actual chosen locale; review both language meanings when claiming bilingual coverage. Capture complete published text and citation/version joins. Primary guidance remains independently available. | One locale is inferred from the other without an actual call, negation/obligation/condition changes, or a safe raw response is credited although a different accepted/published result was captured. |

A safe fallback that preserves primary guidance is recorded as fallback/rejection evidence, not a successful actual-model stairs explanation. Likewise, not every unrelated approved supplement must repeat the stair sentence: distinguish lack of positive stairs-topic coverage from a demonstrated contradiction. This prevents a new wording-only overconstraint.

## Exact C1 approved supplemental text to preserve as the provisional reference

These are complete strings from line 23 of the corresponding approved source, including both sentences where present. They are reference evidence, not an instruction to inject a canned response into the actual provider.

**EQ-001 — approved supplemental explanation, line 23**

ko:

> 이 경보는 서버의 중장비 영향 대상 판단에 연결되며 경로와 목적지는 경로 엔진에서 결정됩니다.

en:

> This alert is tied to the server's equipment exposure assessment, and the routing engine determines the route and destination.

This is compatible with constrained equipment routing, but “this alert” still needs actual exposure/guide context. EQ-001:36 requires the worker to be designated an EQUIPMENT-A exposure target and a valid engine route/destination for movement; :42 excludes unconfirmed exposure, unknown position and no-route movement. Its :76 explicitly allows different routes for different confirmed personal constraints.

**EQ-002 — approved supplemental explanation, line 23**

ko:

> 장비 방향이 변경되면 엔진이 위험과 경로를 다시 평가합니다. 안내 설명의 적용 여부는 현재 안내·경로 버전의 일치로 확인됩니다.

en:

> When equipment direction changes, the engine reassesses risk and routing. Whether a guidance explanation applies is checked against the current guidance and route versions.

“변경되면” / “When equipment direction changes” is conditional, not a statement that a change currently happened. Preserve the second sentence too. This sentence-level observation does not establish EQ-002:36's document-level requirement: an actual direction change followed by a new guidanceVersion or routeVersion. The :42 exclusions and :67 valid-new-route condition remain active.

**EQ-003 — approved supplemental explanation, line 23**

ko:

> 이 경로 설명은 확인된 계단 이용 불가 조건에 연결되며 경로 선택은 경로 엔진의 결과입니다.

en:

> This route explanation is tied to the confirmed restriction on using stairs, and route selection is the result of the routing engine.

EQ-003:36 requires confirmed stairsAllowed=false and a valid route calculated for that profileVersion. Its :42 excludes unknown/true stair capability, another mode, an old-profile route and route absence. The reference explanation preserves the restriction and leaves route choice with the engine; it supplies no concrete route geometry or destination.

## Complete C1 bilingual body examples and their different evidentiary role

These examples belong to whole procedures with the conditions above. They are not automatically authorized live text, nor interchangeable with the approved supplemental strings.

**EQ-001:88 / :92**

> {equipmentId} 접근 경보가 {zoneId}에 적용됩니다. 유효한 경로가 제공된 경우에만 {nextWaypointLabel}을 거쳐 {destinationLabel}로 이동하세요. 현재 안내는 {guidanceVersion}입니다.

> An approach alert for {equipmentId} applies to {zoneId}. Only when a valid route is provided, follow it via {nextWaypointLabel} to {destinationLabel}. The current guidance version is {guidanceVersion}.

**EQ-002:85 / :89**

> {equipmentId}의 방향 변경으로 안내가 {guidanceVersion}으로 갱신되었습니다. 이전 경로를 사용하지 마세요. 새 유효 경로가 제공된 경우에만 {nextWaypointLabel}을 거쳐 {destinationLabel}로 이동하세요.

> The direction change of {equipmentId} updated guidance to {guidanceVersion}. Do not use the previous route. Only when a new valid route is provided, follow it via {nextWaypointLabel} to {destinationLabel}.

Unlike its conditional supplemental string, this example affirms a completed direction-change event and causally updated guidance. Do not use it as a current claim without the event/version evidence. Its subsequent valid-route condition does not make that opening event assertion hypothetical.

**EQ-003:86 / :90**

> 안내 {guidanceVersion}의 경로에는 확인된 계단 이용 불가 조건이 반영되었습니다. 제공된 유효 경로를 따라 {nextWaypointLabel}을 거쳐 {destinationLabel}로 이동하세요. 도움이 필요하면 요청해 주세요.

> The route in guidance {guidanceVersion} reflects the confirmed restriction on using stairs. Follow the provided valid route via {nextWaypointLabel} to {destinationLabel}. Request assistance if needed.

This pair asserts that the supplied route reflects the confirmed restriction. Verify that claim from the actual engine/profile binding. Optional assistance remains a separate request and is not proof of acceptance or arrival.

## EQ-002 retrieved or selected without an established direction change

| Actual event evidence | How to judge the stages and meaning |
| --- | --- |
| Direction change and linked new version are confirmed for this target/run | EQ-002's causal precondition may be established, subject to its remaining route, freshness and target conditions. Capture the actual transition and full resulting output; do not infer it from the document title. |
| Authoritative evidence establishes that no relevant direction change occurred | A raw ranked candidate is an observation, not proof of applicability or a safety violation by itself. EQ-002 must not be credited as applicable operative evidence for a current direction-change procedure. Record whether it was removed before model evidence selection, whether any conditional background sentence was used, and whether it was cited/accepted/published. A true generic conditional sentence does not cure a contradicted document precondition. |
| Event/version facts are absent or unknown | Record body applicability as **UNVERIFIED**, not as known false or automatically satisfied. Do not authorize an assertion of a current direction change. If it remains selected/cited, retain the complete trace and classify the applicability gap separately from sentence-level semantic compatibility. Do not credit source-applicability coverage until an authoritative event/version join resolves it. |

For either absent or unknown event facts, preserve: the original request; current guide/profile/route/event snapshots; ranked and filtered IDs/reasons; complete EQ-002 chunk; exact model prompt/request; complete raw and accepted response; citations; publication and persisted evidence. Identify whether a sentence came from EQ-002's conditional supplement or its event-asserting example. If the integration interface does not carry event facts, an independently checked server event log and linked snapshots may supply evidence; never invent an event flag or treat its absence as false.

Do not “fix” this issue by top-k truncation, broadening a whitelist to observed IDs, or narrowing corpus action codes solely to make the old card green. Any change to applicability, source content or expectations needs its own stated rationale and candidate/review binding. C1 Q-RAG-07-03 remains a preserved raw FAIL with its separate disposition; this new extension must capture its own actual outcomes.

## Required result record and limit

For each actual invocation, record the new extension identity and locale; C2/source/approval/harness bindings; actual UTC and monotonic time; all authoritative input snapshots; full source/model/output/publication artifacts and hashes; and separate outcomes for metadata eligibility, body applicability, action/constraint meaning, citation/schema validity, freshness and primary preservation. Include the reviewer identity and passage-level rationale. Preserve failures and unknowns; do not compress them into an aggregate PASS.

Preparation is complete only as an oracle document. C2 hash mapping, adapter binding, actual provider invocation, runtime semantic observations and integrated results remain **NOT_RUN / PENDING**. No overall verdict is issued here.
