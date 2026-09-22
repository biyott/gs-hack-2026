# C4 measured HTTP semantic and publication review

Files-only review of six measured HTTP targets found no concrete semantic or publication defect in this scope. No runtime, model, DB or test execution occurred. No overall verdict is issued.

Candidate: `sha256:cd8a2428d3d9e44703c25b4ae135f0ed5821b6b3b3794bbca6abc1ec37197eba`. JSON SHA-256: `2148cf62c83d9f85f840827770ed20a9d1cc197d805b296318a479af3f882143`. The JSON records 60 input hashes, exact target IDs, actual wire hashes, citations, texts, traces and checks.

| Measured case | Actual reviewed citation | Primary / supplement / route | Raw locale predicates |
|---|---|---|---|
| measured-equipment | EQ-001 ko | 1 / 2 / 1 | ko PASS, en FAIL |
| measured-equipment-additive-en | EQ-001 en | 1 / 2 / 1 | ko FAIL, en PASS |
| measured-fire-gas | FG-004 ko | 1 / 2 / 1 | ko PASS, en FAIL |
| measured-fire-gas-additive-en | FG-004 en | 1 / 2 / 1 | ko FAIL, en PASS |
| http-reroute-addendum/measured-ko | FG-002 ko | 3 / 4 / 2 | Requested locale checked; no two-locale aggregate |
| http-reroute-addendum/measured-en | FG-002 en | 3 / 4 / 2 | Requested locale checked; no two-locale aggregate |

All six actual request/response byte hashes match the proxy records, with exact call ID, model and message hash joins. Actual Qwen returned selection 0; the service published the corresponding reviewed locale text and citation. The saved current DB envelope, supplemental SSE and reconnect envelope agree. Primary content is retained, primary SSE precedes supplemental SSE, and each observed receipt interval and recorded generation duration is below 5000 ms.

Initial FG-FIRE has no previous route invalidation. Its false applicability trace excludes FG-002 before FTS, vector, fused selection and actual model options. FG-004 is applicable because the bound scenario explicitly selects POLICY-FG-EVACUATE, the guidance reason is evacuate, and the engine supplies the current route and destination. Equipment baseline EQ-001 is supported by engine-designated exposure and the current route. Additive English runs use supported profile commands with profile version 2; they do not relabel Korean results.

Both FG-ROUTE-BLOCK runs preserve the actual prior north y=42 route, observe PATH-B closure and fire expansion at 8000 ms, and issue primary 3 / route 2 before FG-002 supplement 4. The immediate predecessor snapshots are 7103.510855 ms (KO, run version 14, sequence 76) and 7101.111743 ms (EN, version 14, sequence 99). The target first primaries occur at 8000 ms (version 15, sequences 77 and 100). These predecessor times are distinct from route issuance or a nominal advance-command target. The new route exits south to y=8 and reaches ASSEMBLY-01 via x=132; initial egress begins inside fire. No entirely hazard-free route or invented condition is claimed.

The exact reviewed FG-002 Korean and English meanings are preserved: fire affecting an existing route causes engine reassessment, and applicability is checked against current guidance and route versions. Actual causal route history supports that condition here.

Raw global capture-join counts remain **16 PASS / 4 FAIL / 1 NOT_RUN**. The four failures belong to earlier baseline generations. The bound helper collects every envelope sharing a stable guidance ID, including later primary versions, then applies an every-generatedAt-before-this-call predicate. Delay warmup additionally spans profile versions 1 and 2. Only this broad lineage check fails; exact call/hash/model/time/options checks stay true. This is a derived scope classification, not a rewrite of those raw results. All six reviewed target capture joins themselves are PASS.

Both reroute evaluation roots retain `ambiguousRetrievalJoin: true`: two retrieval records overlap in time. The citation-filtered publication join reports `retrievalJoinAmbiguous: false` because only one contains the selected FG-002 chunk. This review does not claim unique whole-trace association or captured HTTP producer input.

Original per-run locale predicates remain unchanged. This review makes no physical UI/audio, full case 26, delay acceptance, broad regression or overall gate claim. The separate module review still leaves EQ-002-specific selected publication unobserved.

Both original normal final snapshots have English-profile WORKER-B `currentGuidance: null`; only Korean WORKER-A has an impacted/published guide. Their preserved EN FAIL is an unmet locale-coverage predicate, not an observed generation failure for an English guidance target. The separate supported WORKER-A profile-version-2 English runs provide actual additive positives.
