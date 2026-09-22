# Q-RAG-08-26 actual privacy surfaces — C3 preparation v1

Status: PREPARED / NOT_RUN / C3_RECEIPT_PENDING. This addendum preserves the original frozen case, expected canary absence and all C1/C2 evidence. It adds the smallest component observation needed to exercise the missing embedding surface. It neither edits the candidate nor instruments the production Next bundle. The frozen C2 preparation remains 56 files, manifest `1d22e410643adff40c5417d9ff265abad1ce3b465913a3592a44c80dd3121cfd`, harness `e23dcd3c6b81aa0ef24b9b5885436a84268163402df945c87b9c8f8bab12c0e7`.

The frozen source is `clock-binding-v1.1/derived/fault-cases.v1.json`, SHA256 `51c0cf09a08cf53188f9e93761f6feb5ffaf19c4be0f9225c4015dc24cb2af62`, case Q-RAG-08-26. Its four synthetic private fields are used exactly. Source003/source004:35 prohibits indiscriminate embedding of personal profile data; :48–49 requires only necessary information for the LLM and functional constraints instead of name, birth date or diagnosis. This is a canary observation within that scope, not proof against every possible personal-data encoding.

## Existing wrapper and actual candidate boundary

Reuse the explicitly C3-bound copy of `captureProviders` from the frozen C2 `stairs-capture.ts`; do not write a replacement embedding or fake vectors. The original QA file hash is `ce1dafbe076508401c8dd9b668e74d4d186122201a16f73f9cb5416fdba79824`. It forwards the original text array and AbortSignal to the supplied actual E5 provider, returns its original vector result, and records exact input/output with call index, phase, UTC/monotonic timing and identity. The actual model returns the real 384-dimensional arrays. Observational cloning/serialization adds small overhead and is recorded; the normal 5000 ms service deadline remains unchanged.

The new driver uses this production path with real injected C3 APIs:

1. Reuse one actual resident E5 instance and the real model provider, with a fresh isolated component runtime/database and authenticated session. Inject those wrapped providers through `attachRag(runtime, db => createRagService({db, embedding: capture.embedding, llm: capture.llm, timeoutMs:5000}))`.
2. Await actual corpus readiness. Establish and fully drain a labelled normal warmup before the measured profile command. Keep the scheduler off so no unrelated tick creates overlap.
3. Take a complete supported functional profile, increment its version, and attach the four frozen synthetic private fields. Save this intentional QA input separately. Submit it to the actual candidate `SimulationCommandSchema.parse`, then pass exactly that returned command to `runtime.command`. The QA driver never fabricates a sanitized `EnrichmentInput`, query or guide.
4. The actual `attachRag` builds the query from the genuine current guidance; actual retrieval calls `embedding.embed(["query: " + request.query], signal)`. Capture those exact inputs and corresponding actual vector arrays. A narrow service observer records the exact input, forwards the original input and `getCurrent` callback, and tracks the original returned promise without replacing it, linking run/guidance/profile versions to provider observations.
5. Wait for all tracked enrichments and the target terminal publication before the final provider drain. A pending-array snapshot alone is insufficient because `attachRag` schedules asynchronous work. If overlapping calls prevent an exact target/input/vector join, retain ambiguity and withhold that join. Compare the captured vector with the actual retrieval trace for the same measured request.

The existing phase setter is typed for the older stairs instrumentation. Only the future C3 QA copy may minimally extend its phase labels for this privacy phase; preserve the delegation logic and retain the original C2 bytes. Alternatively the bootstrap must provide an explicitly labelled phase hook. The new driver has no runtime C2 import; provisional C2 types are only the current API reference and must be checked against the issued C3 receipt.

The current inspected C2 product source hashes below are preparation references, not an invented C3 binding:

| Source | SHA256 |
|---|---|
| `src/server/services/rag.ts` | `35aa2a1c22a6830b7eb8b4250b88dddbdae17b7b823ba1f367d584ac7ab20601` |
| `src/server/rag/embeddings.ts` | `72b92c3ae90001b7c7ecb061dee020c9062afc041c39658f82fa3730a11af448` |
| `src/server/rag/retrieval.ts` | `d6dcdc8b35a2e2a907a88fe60ce5149953116d711be58c290a96f5664bbaf05b` |
| `app/api/simulation/route.ts` | `3fbcdb1b44f9aabab8143ae2669962bb7dca61922096e379952bef200a4366d3` |

## Separate observed surfaces and their joins

| Surface | Real observation planned | Required scope distinction |
|---|---|---|
| Component E5 | Exact actual `embed` texts, actual vectors/dimensions/model revision, genuine command/profile/guide and retrieval trace | A separate QA component process executes the real candidate path. This is not direct capture inside the production Next process. |
| Component generation | Same real service's provider input/completion and actual proxy call ID/content hash | Links the component command and E5 observation through the unchanged normal attachment path. It does not replace production publication evidence. |
| Production HTTP/client envelopes | Existing malformed-profile rejection and valid-profile-plus-canaries command, actual returned profile, ordered SSE, current/first guidance and DB records | Observe strip/reject behavior as it occurs. Do not claim that discarded private fields entered the accepted profile. |
| Production LLM | Existing authenticated transparent proxy, joined to production generation rows and target/profile lineage | Match actual call ID, message-content hash, model and times. Raw response-body SHA is a separate digest. Reuse existing `bodyFacts` canary scans. |
| Production application logs | Closed application's private stdout/stderr files, checked by the new bounded log scanner | Report only path, size, hash, stability and canary-key counts. No raw log/PIN/token/excerpt is published. |

Combine these through one frozen case ID/injection hash, the exact C3 candidate/source/model bindings, and explicit per-process attempt IDs/PIDs. Within each process retain its own request/run/guidance/profile/call IDs. Do not join unrelated processes merely by timing or invent shared guidance IDs. Functional-profile fixtures may differ only where the recorded supported scenario/locale requires it; preserve both actual raw inputs.

The log scanner accepts only explicit allowed application log files after owned-process cleanup, verifies supplied launch/cleanup evidence hashes, rejects symlinks/foreign paths, and checks bounded complete bytes twice with stable file metadata/digests. An oversized, missing or changing log is INCOMPLETE, not a clean scan. Intentional QA injection payloads and fixture source files are excluded from the leak surface; otherwise the test would report its own setup as leakage. Private raw evidence remains private.

## Outcomes and hard limits

Record separate results for parsed profile privacy, actual component E5, actual generation, production HTTP/SSE envelopes and production logs. A missing invocation, ambiguous join, incomplete log or changed candidate binding remains unavailable. A canary appearing in a declared outgoing/log/client surface is a retained failure; do not retry it away or filter it from evidence. CAPTURED_FOR_REVIEW is not PASS.

When all these feasible surfaces have genuine current observations and successful joins, QA Lead can assess the combined frozen26 coverage without asserting production in-process E5 capture. That direct production observation remains unavailable through the public API and is not silently inferred from the component run. No production preload, monkey patch, candidate edit, extra endpoint or broad instrumentation is introduced.

C3 source/type binding, bounded harness validation, the exclusive W2 grant, actual component and production execution, post-cleanup scans and independent result review are still pending. No model, application, database, proxy, test or typecheck is executed by this preparation.
