# RAG frozen-input gap disposition — read-only v1

Created from saved-file inspection at 2026-09-21T16:35:14Z by `/root/qa_lead/rag_gap_oracle`; independent normative-source cross-check by child `/root/qa_lead/rag_gap_oracle/normative_scan`.

This report is bound to C3 `sha256:1a7c95cd1a15df738492a368d36cc6cb98985ec1c2618b10e807c82076b247c4`, candidate source root `/home/b/.cache/gs-safety-c3.eulo4t9w`, and candidate manifest SHA-256 `8d9b031f68374ea939dcdebb570e76aeba4b09d1154165cab53d186e7d27c4bc`. The candidate identity is recorded at [manifest line 2354](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/technical/candidate-manifest-c3.json:2354). The nine candidate files listed below were read and their SHA-256 values independently matched the manifest. This is a scoped source binding, not a new whole-candidate integrity attestation.

Only this report was created. Product files, frozen inputs, adapters, raw results and coverage-map files were not modified. No runtime, database query, test, server, compiler, model or provider call occurred. Proposed checks below are **not executed**. No overall, full-case or AC verdict is issued.

## Disposition

| Frozen case | Preserve raw result | Narrow disposition supported by these files |
| --- | --- | --- |
| Q-RAG-06-F13 | `BINDING_GAP`, `source-validation`, `observedEligible: null`, no assertions or steps | Frozen adapter/source-contract representability gap. Its extra source `simulationTypes` restriction is not specified by the normative source schema. Parser rejection is neither runtime exclusion proof nor leakage proof. These observations do not establish a normative product defect. |
| Q-RAG-08-16 | Service and integrated `NOT_RUN`; observed `fallback:provider_failure`; provider output null | Frozen mutation-target precondition gap. The specified source token is absent from the selected reviewed supplemental sentence. It is present in that document's Korean/English body examples. No replacement payload reached the validator; the fallback does not prove invented-placeholder rejection. These observations do not establish a normative product defect. |

The current [coverage map lines 5–14](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/rag/candidate-1a7c95cd/coverage-map.md:5) preserves these same boundaries. This disposition does not waive common-document applicability, placeholder meaning, current-version validation, or prevention of invalid supplementary text reaching clients.

## Normative boundary

- [G0 line 24](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/goal.input.txt:24) requires information-preserving normalization of 003/004, preserves `common` as a distinct kind, includes requested-mode plus common documents, and always applies site filtering. [G0 lines 61–69](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/goal.input.txt:61) require scope filtering, 004 document format, review, identifier/number/unit/placeholder and current-version checks, semantic checks beyond shape, and safe fallback.
- [AC-06 through AC-08, lines 104–106](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/goal.input.txt:104) require exclusion of disallowed modes, common site scope, actual retrieval/filter evidence, and non-delivery of invalid/stale supplements with functioning primary behavior. They do not prescribe the extra `simulationTypes` source field or require `{guidanceVersion}` in every supplemental sentence.
- [Source 003 lines 74–89](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/sources/emul-003.body.md:74) specify singular `simulationType: equipment | fire-gas`; [source 004 lines 421–437](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/sources/emul-004.body.md:421) specify singular `simulationType: common | equipment | fire-gas`. Neither schema specifies an additional common-mode allowlist field.
- Common does not remove other applicability conditions: [003 lines 123–128](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/sources/emul-003.body.md:123) require filtering before keyword/vector search and body applicability/exception checks; [004 lines 407–408](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/sources/emul-004.body.md:407) require those conditions to remain explicit and available together. A real common document with mode-specific body conditions must still respect them; F13's parser outcome does not establish this behavior.
- [004 lines 439–462](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/sources/emul-004.body.md:439) require ordered body sections, Korean/English guidance examples, example placeholders including `{guidanceVersion}`, and matching bilingual meaning/identifiers/placeholders. This applies to document examples. The text does not define `reviewedSupplementalExplanation` or require all such supplemental sentences to contain this particular placeholder. [003 lines 115–117](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/sources/emul-003.body.md:115) separately distinguish immediate reviewed action text from LLM supplementary reasoning/procedure explanation.

## F13: exact boundary trace

The [frozen filter input lines 6–19](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/rag/clock-binding-v1.1/derived/filter-cases.v1.json:6) use an equipment request. [Lines 144–152](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/rag/clock-binding-v1.1/derived/filter-cases.v1.json:144) mutate the document to `simulationType: common`, `simulationTypes: [fire-gas]` and expect ineligible.

The frozen adapter [prepare-filter.ts lines 10–20](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/rag/candidate-1a7c95cd/preparation/harness-snapshot/prepare-filter.ts:10) removes `simulationTypes` only when identical to the list derived from singular `simulationType`. F13's list is nonredundant, so the adapter preserves it and calls `parseKnowledgeDocument`. Candidate [knowledge.ts lines 20–66](/home/b/.cache/gs-safety-c3.eulo4t9w/src/server/rag/knowledge.ts:20) has no such source property and ends with `.strict()`. Normalization, if reached with supported source metadata, preserves `common` and derives both modes at [lines 83–89](/home/b/.cache/gs-safety-c3.eulo4t9w/src/server/rag/knowledge.ts:83).

Candidate normalized [types.ts lines 16–21](/home/b/.cache/gs-safety-c3.eulo4t9w/src/server/rag/types.ts:16) do contain both fields. The runtime mode predicate is real code: [retrieval-candidates.ts lines 64–67](/home/b/.cache/gs-safety-c3.eulo4t9w/src/server/rag/retrieval-candidates.ts:64) excludes a requested mode absent from `metadata.simulationTypes`; [lines 141–148](/home/b/.cache/gs-safety-c3.eulo4t9w/src/server/rag/retrieval-candidates.ts:141) form eligible chunks; [retrieval.ts lines 74–94](/home/b/.cache/gs-safety-c3.eulo4t9w/src/server/rag/retrieval.ts:74) constrain FTS/vector candidates and selected chunks. Static reachability reasoning is not execution evidence.

The saved [F13 result lines 97–112](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/rag/candidate-1a7c95cd/module-attempt-01/filters/Q-RAG-06-F13.json:97) records `unrecognized_keys: simulationTypes`, no observed eligibility, and zero assertions/steps. It cannot be relabeled as a passed `mode` filter. Removing the restrictive list would broaden the frozen case; changing `common` to `fire-gas` would test a different case. Neither is a valid replacement.

Minimal additive work, separately identified and preserved:

1. **Source-contract disposition:** retain F13 as unavailable at canonical source ingestion and retain its parser-error evidence. If adding a parser check, assert the actual unknown-field rejection and absence of ingestion/search activity; label it source-boundary rejection only. Do not count it as runtime scope exclusion.
2. **Canonical common behavior:** independently map existing candidate-bound execution evidence, or add a source-ingested control matrix with `simulationType: common`, matching site and otherwise compatible conditions for each requested mode, plus a wrong-site negative and ordinary noncommon wrong-mode negative. Check actual normalization, filter reasons, eligible IDs and FTS/vector/selected IDs. The positive controls must first establish eligibility, so a missing index or unrelated hazard mismatch cannot masquerade as mode/site rejection. This addresses normative behavior but does not exercise F13's extra restriction.
3. **Optional direct normalized-boundary defense:** if independently useful, construct an explicitly QA-owned normalized record with `common` plus `[fire-gas]` at the `selectCandidates`/store seam, with valid matching index and all other filters passing. Compare equipment exclusion for `mode` with a fire-gas positive control. Record that canonical source parsing is bypassed and that this state is not emitted by the current normalizer. This proves only internal allowlist enforcement if executed; it cannot close source representability or be presented as F13's source-ingestion result.

A new product requirement to ingest a restricted-common source field would need an explicit schema/normalization contract and independent scope tests. The cited G0/003/004 texts do not themselves establish that field requirement. No product change is recommended merely to make the frozen field acceptable.

## Case 16: exact boundary trace

The [frozen fault input lines 184–194](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/rag/clock-binding-v1.1/derived/fault-cases.v1.json:184) requires replacement `{guidanceVersion}` → `{routeVersion999}` and `fallback:unreviewed_explanation`. The frozen [fault-mutations.ts lines 12–20](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/rag/candidate-1a7c95cd/preparation/harness-snapshot/fault-mutations.ts:12) searches the retrieved `reviewedSupplementalExplanation` in the active locale for the source token; if absent, it throws before constructing output. Actual replacement is only at [lines 56–60](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/rag/candidate-1a7c95cd/preparation/harness-snapshot/fault-mutations.ts:56).

The saved result selects EQ-003 at [lines 239–241](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/rag/candidate-1a7c95cd/module-attempt-01/faults/Q-RAG-08-16.json:239). Its reviewed supplemental Korean/English text at [lines 279–281](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/rag/candidate-1a7c95cd/module-attempt-01/faults/Q-RAG-08-16.json:279) contains neither placeholder. Candidate [EQ-003.md line 23](/home/b/.cache/gs-safety-c3.eulo4t9w/knowledge/equipment/EQ-003.md:23) agrees. Its body examples at [lines 84–90](/home/b/.cache/gs-safety-c3.eulo4t9w/knowledge/equipment/EQ-003.md:84) do contain `{guidanceVersion}` in both languages. Absence from the selected supplemental field is therefore not absence from the document's required example sections.

The saved [lines 288–306](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/rag/candidate-1a7c95cd/module-attempt-01/faults/Q-RAG-08-16.json:288) show null provider output, fallback with no completion, no persisted evidence, the explicit missing-sentence limitation and integrated `NOT_RUN`. Candidate [service.ts lines 159–164](/home/b/.cache/gs-safety-c3.eulo4t9w/src/server/rag/service.ts:159) maps an `Error` to `provider_failure`. This observes an adapter precondition failure safely settling; it never reaches placeholder mutation validation.

Candidate [provider.ts lines 40–57](/home/b/.cache/gs-safety-c3.eulo4t9w/src/server/rag/provider.ts:40) offers reviewed supplemental sentences; [lines 101–109](/home/b/.cache/gs-safety-c3.eulo4t9w/src/server/rag/provider.ts:101) reconstruct output from the model-selected sentence. [validation.ts lines 14–43](/home/b/.cache/gs-safety-c3.eulo4t9w/src/server/rag/validation.ts:14) check shape, action, locale, exact retrieved citation and exact reviewed-sentence equality. A novel placeholder added to an otherwise valid sentence should fail equality, but that is a static expectation, not a new observed outcome. Exact equality alone does not prove correct template substitution, bilingual semantics, body applicability or safety of every approved sentence; those obligations remain independent. [Service lines 130–155](/home/b/.cache/gs-safety-c3.eulo4t9w/src/server/rag/service.ts:130) place validation before accepted-run logging/evidence persistence.

Minimal additive work, separately identified and preserved:

1. **Document-format check:** record the Korean/English example token sets separately from supplemental fields, initially for the selected EQ-003 and, where needed for corpus acceptance, all 18 documents. Verify matched identifiers/meaning rather than treating raw occurrence anywhere in a document as compliance. The EQ-003 token presence above is a saved-source observation, not a full-corpus audit or publication result.
2. **Invented-placeholder rejection check:** use the same actually retrieved, applicable reviewed sentence, with valid action, locale and exact citation. Preserve an unmodified positive control. In a separately named mock provider output append only ` {routeVersion999}`; record before/after bytes and hashes, the token's verified absence from the approved baseline, nonnull actual injected output and validator/service arrival. Require `fallback:unreviewed_explanation`, zero accepted supplement/evidence, unchanged current primary action/route/version and one settled outcome. Keep all other inputs identical so unrelated preconditions do not explain rejection. This is a new append-contamination check, not the original replacement and not actual-model success.
3. **Publication boundary, if the additive claim extends to non-delivery:** capture the same injected attempt through the publication path, current guidance, HTTP/SSE and relevant client consumption. Require absence of the invented token and preservation of primary guidance; separately demonstrate authorized administrator continuity and required device behavior. A validator/service-only result cannot prove those surfaces. The original result itself defers these at [lines 307–310](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/rag/candidate-1a7c95cd/module-attempt-01/faults/Q-RAG-08-16.json:307).

Preserve case 16's exact replacement as unavailable unless a legitimately reviewed, applicable supplemental sentence already containing `{guidanceVersion}` becomes available under an explicitly versioned corpus/input binding. Do not copy a body template into the approved supplemental field, fabricate review provenance, accept unresolved placeholders, or change the original injection solely to force this case to run.

## Immutable input and observation hashes

All paths in this table are under `/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/`. Hashes were computed from saved files during this read-only task.

| File | SHA-256 |
| --- | --- |
| goal.input.txt | `5acf113eee7b75724f5b9e9b3e7d92f8bf99d714f812a35c6946f7a2d4239796` |
| sources/emul-003.body.md | `3de397aa1733fbda7d4ba4d9c510e147d6799c060e9a005d9a95132e6d16379e` |
| sources/emul-004.body.md | `5339f3cd43df552e3bda5da24fbef2e72dc49f9cd1ea77bba401dadb6548f2db` |
| qa/rag/clock-binding-v1.1/derived/filter-cases.v1.json | `9b4ce2b63c65ecc95aef3add69cd04f48f0ddbf441445d1a8580088a8448c1e3` |
| qa/rag/clock-binding-v1.1/derived/fault-cases.v1.json | `51c0cf09a08cf53188f9e93761f6feb5ffaf19c4be0f9225c4015dc24cb2af62` |
| evidence/qa/rag/candidate-1a7c95cd/coverage-map.md | `1e0c99085d5a48f03a60b9371e15e22a91c6b303a5600e08abe4fdc91fcc8d48` |
| evidence/qa/rag/candidate-1a7c95cd/module-attempt-01/filters/Q-RAG-06-F13.json | `68b20fc424db5c2984de0d494a0ccce21b3a5bcfea54a5f5a4dac5b2b92c3f97` |
| evidence/qa/rag/candidate-1a7c95cd/module-attempt-01/faults/Q-RAG-08-16.json | `181e9f332e43e1108dcfd26e41fb6f7606e7a66d93b80b5a6082ea73437127ff` |
| evidence/qa/rag/candidate-1a7c95cd/preparation/harness-snapshot/prepare-filter.ts | `b01b2d8e2a26c5f70f67399931fe779c9764094f4d930bf94e5ebdf6e806ff2d` |
| evidence/qa/rag/candidate-1a7c95cd/preparation/harness-snapshot/fault-mutations.ts | `24f091697e2127f3695624c6ad57a89a07901b118f5d2f50792090f9069d7646` |

## Candidate files independently matched to manifest

Paths below are relative to the isolated candidate root `/home/b/.cache/gs-safety-c3.eulo4t9w/`; line numbers refer to `evidence/technical/candidate-manifest-c3.json` in the run.

| Candidate file | SHA-256 | Manifest entry lines |
| --- | --- | --- |
| src/server/rag/knowledge.ts | `d947b953101881a27a9e966ca88253c05bf491905016779df883b394d18ea1f8` | 6486–6488 |
| src/server/rag/types.ts | `20446f6611eac89cef54f5ea044cfcf336ef97dcd5d0fb504a5cec9e7801e543` | 6536–6538 |
| src/server/rag/retrieval-candidates.ts | `732b94f9d0554961e10c71a92c5618c376cf79e88a3eaa25357b098e36e80654` | 6496–6498 |
| src/server/rag/retrieval.ts | `d6dcdc8b35a2e2a907a88fe60ce5149953116d711be58c290a96f5664bbaf05b` | 6511–6513 |
| src/server/rag/validation.ts | `23818b1658dbe90de98ac99ffb5e7994ef90ff51ebda2692252747c6110486de` | 6546–6548 |
| src/server/rag/provider.ts | `e61a4d6f262ec6796a63fc9fc92973dfeef93c3595c3b43b2603dd58f4f35426` | 6491–6493 |
| src/server/rag/service.ts | `594062bc1ce5df27048436a149a727af715de21280c5736d12e674d0d3f29996` | 6521–6523 |
| src/server/rag/generation-types.ts | `52192819d9939f1cc5850db7bf2ac91bad3f5fd373cae322491a17971e5cc345` | 6461–6463 |
| knowledge/equipment/EQ-003.md | `efba24b4441c045b4cb266651cc984f2eefb3e3966e053f4828514e66b6ff3f8` | 4736–4738 |
