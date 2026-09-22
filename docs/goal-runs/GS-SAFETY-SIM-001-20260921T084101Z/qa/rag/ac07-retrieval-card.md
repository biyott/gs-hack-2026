# Q-RAG AC-07 retrieval card v1

Owner/executor: /root/qa_lead/qa_rag. Frozen preparation input; candidate result NOT_RUN. Authority: acceptance.md AC-07, G0 protocol v1.0, exact archived source003 §§2/4/6/9 and source004 generation prompt §§3/5/7/8. This independent oracle was authored before reading producer retrieval test expectations. It does not certify the candidate.

## Inputs and independent expected results

Use [retrieval-cases.v1.json](retrieval-cases.v1.json): 20 named cases with context, query, expectedDocumentIds, forbiddenDocumentIds, expectedActionCodes, expectedOutcome and reasons. Cases 01–12 cover every source004 mandatory retrieval topic; 13–20 expand route absence, combined risk, sensor absence, reopening, arrival, assistance and common rules. Source004 assigns document subjects, while engine action remains a supplied scenario fact rather than a retrieval decision.

Run fresh QA DBs on the G3 candidate with G0 clock 2026-09-21T09:00:00Z and seed 20260921. Normal corpus is the 18 independently reviewed documents. Negative cases use explicitly named isolated datasets, never the normal ingestion root. Do not mutate a developer DB or approved corpus. Clone a known eligible document and change only the factor under test; preserve the base hash and exact patch.

The fixture schema is an independent QA schema. Adapter mapping must document, without altering meaning: canUseStairs→stairsAllowed; needsAssistance→assistanceRequired; confirmedAt→verified; requested/selected locale stays in guidance context; semantic move/shelter tokens map to the frozen policy IDs. API field absence is a readiness/contract gap, not permission to drop the assertion. Route coordinates, destinations and model decisions are taken from the validated engine fixture, never invented by QA prose.

Expected IDs are required primary evidence; listed common additional IDs can be included only if their own action and applicability conditions match. Unexpected evidence is retained and investigated, never silently ignored. Conflict expected IDs refer to conflict witnesses; the returned usable chunk list and generated evidence remain empty. No-match returns no usable evidence and keeps the reviewed primary template. Unrelated similarity cannot authorize a document.

## Execution card

1. Validate G3 manifest before execution and save candidate/tooling/provider configuration hashes. Snapshot all 18 source bodies, normalized metadata, review-ledger records and indexed rows in the QA evidence directory.
2. Fresh migration and seed with documented commands; ingest approved demo documents through actual production ingestion. Log every path accepted/rejected and document→procedure chunk mapping. Assert negative fixture paths are absent from normal index.
3. Capture actual embedding provider, model name, pinned revision/version, dimension, call identity, start/end times and mode actual/mock. Save every generated document vector and query vector plus finite-number/dimension checks. A configured model name, synthetic numeric vector, hash-based embedding or mocked response is not actual multilingual embedding evidence.
4. Run each case against the real embedding adapter and SQLite FTS5. Preserve SQL/FTS query, eligible and rejected IDs/reasons, individual keyword scores, individual vector scores, fused order/scores, final eligible evidence and conflict witnesses. Verify the SQLite virtual table uses FTS5; a plain substring scan cannot stand in for it.
5. Independently recompute cosine/dot score under the implementation's documented normalization from saved real vectors. Verify fusion from the recorded rank/weight formula. Do not invent a mandatory rank formula: the implementation must expose its formula and deterministic tie handling, and the observed fused result must follow it.
6. Compare actual result IDs/actions/status to the frozen fixture. Resolve every citation to the exact stored document version and complete procedure chunk. Verify applicability, exceptions, policy and confirmed profile conditions independently of text score. A high score is not a safety probability.
7. Exercise [filter-cases.v1.json](filter-cases.v1.json) with high-similarity exclusions. Check exclusion at ingestion/eligibility and after fusion. Run document-update, retirement and model-revision/dimension changes; old content/vector/cache/citations cannot persist.
8. Preserve all original raw results and discrepancy records. Verify manifest after execution. Candidate drift invalidates affected results; do not write a final candidate verdict before G3.

## Mandatory vector and fusion abuse cases

| Input | Required behavior |
| --- | --- |
| Embedding provider returns wrong vector count | Explicit invalid-provider failure; no silent document/vector misalignment |
| Empty vector, wrong dimension, NaN or Infinity | Reject and record invalid provider evidence; no accepted scoring |
| Provider identity changes between index and query | Re-embed or explicit incompatibility fallback; no mixing revisions/dimensions |
| Zero norm vector | Explicit documented failure/fallback without division-by-zero or arbitrary matched evidence |
| Duplicate chunk ID with different document/version | Reject integrity violation; no overwritten provenance |
| Filtered document deliberately has highest FTS/vector score | No evidence or model input from that document |
| Equal fused rank/score | Deterministic recorded tie handling; no bypass of applicability |
| Mutation/retirement after cached retrieval | Cached old version excluded and accepted citation rows remain consistent |

## Evidence required per case

Save goal/run/test/protocol/source versions, candidate hash, UTC start/end, executor, exact commands/actions and input fixture, fresh DB identity/path, expected/observed IDs/actions/outcome, raw FTS/vector/fusion/filter trace, retrieved procedure text/hash, model identity/vector/call metadata, error/fallback and result status. Evidence goes under ../../evidence/qa/rag/<candidate>/<testId>/ with raw records and a concise result row. No real secret values or unnecessary personal fields.

Real embedding availability and the G3 adapter are prerequisites. Their absence after concrete execution probing is BLOCKED for the relevant MODEL slice; unattempted cases remain NOT_RUN. Software mocks cannot upgrade the real-search slice.
