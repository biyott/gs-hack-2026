# C4 privacy capture diagnosis v1

The saved C4 module capture demonstrates overlapping warmup and measured provider work. It does not demonstrate absence of E5 execution or rejection of the measured target before E5. The raw `NOT_RUN`, `failure: null`, `exactE5Join: false`, and `fullCase26Verdict: NOT_ISSUED` remain unchanged. This additive diagnosis does not issue a full case-26 or overall acceptance verdict.

Scope: saved JSON/provider-byte files and source text only; no product execution, imports, database opening, tests, model calls, or frozen-file edits. Candidate root is `/home/b/.cache/gs-safety-c4.q2FD40`; candidate ID is `sha256:cd8a2428d3d9e44703c25b4ae135f0ed5821b6b3b3794bbca6abc1ec37197eba`. Paths below use run root `/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z`, evidence directory `evidence/qa/rag/candidate-cd8a2428/module-attempt-01/privacy-extension`, and harness directory `qa/rag/qd008-next-adapter/bound/candidate-cd8a2428-r1`.

## Observed sequence

All timestamps are saved UTC observations on 2026-09-21. The run is `7f50bfcf-9828-407f-bf44-eb1ab5a1cdf3`, target WORKER-A. Its guidance ID stays constant across the primary versions; that ID alone cannot distinguish these operations.

| Observation | Recorded fact |
| --- | --- |
| Warmup advance, 17:28:23.359 | Profile 1, primary guidance version 1, guidance version 1; no terminal RAG event yet. |
| `warmup.json` boundary | `serviceCallCount=0`, zero RAG rows, two provider events comprising only the completed initialization embedding. |
| Service index 1, 17:28:23.367 | Labelled `privacy-warmup`; profile 1, primary 1. |
| Profile command, 17:28:23.388 | Profile 2, primary 2, guidance version 2. |
| Service index 2, 17:28:23.389 | Labelled `privacy-component`; profile 2, primary 2. This is the single measured service invocation. |
| Measured provider range | Two query embeddings, indices 3 and 6, plus two LLM calls, indices 5 and 8; all eight start/completion events carry `privacy-component`. |
| Old generation, 17:28:24.089 | `e0fb8b75-4055-486e-9863-210550ae7a4c`: fallback `stale_guidance` with actual model completion trace. |
| Target generation, 17:28:24.325 | `6b1a045a-7a7d-46f2-8378-2c06c0c07250`: accepted. |
| Publication, 17:28:24.330 | Same run/worker, profile 2, primary 2, guidance version 3; supplement event explicitly names the accepted target generation ID. |

There are two new matched retrieval rows: `7ec95dd2-10c6-415f-bf40-3384b690b633` at 17:28:23.391–23.410 and `8aa038c7-3bf0-44d5-b69b-3bd2d91bf13b` at 17:28:23.423–23.444. E5 calls 3 and 6 ran at 23.395–23.405 and 23.427–23.439, respectively. Final runtime capture has five starts, five completions, no failed provider events, and two service inputs. The measured provider range equals the final provider capture after its initialization prefix.

## Source-backed cause and inference boundary

C4 `src/server/services/rag.ts:110–113` defers `enrich` through `setImmediate`. The harness `privacy-component-v1.ts:87–95` drains only promises already registered in its arrays. Its terminal predicate at lines 33–40 uses `calls.every`, which succeeds for an empty array. `stairs-capture.ts:49–50` likewise settles only its existing pending array. No barrier waits for an already queued guidance callback to enter the service before the empty-call warmup drain returns.

The harness captures warmup values before awaiting the evidence write at lines 129–130, then switches phase and takes service/provider offsets at lines 131–134. The source and saved counts support this sequence: the warmup drain returned while its guidance callback was still queued; the warmup evidence write yielded and allowed that callback to start; the phase then changed before the callback reached embedding after asynchronous corpus refresh. Consequently, service index 1 is excluded from the measured service slice but its provider operations are included in the measured provider slice. This scheduling explanation is a source-backed inference, not an event-loop trace captured by the run.

The observed mismatch is sufficient without relying on inferred tick timing: the supposed completed warmup boundary contains zero service invocations and no terminal publication, yet the final evidence contains that warmup invocation and its provider completion. The passing “completed warmup capture prefix is immutable” check proves only immutability of the saved initialization prefix, not completion of warmup.

The other two proposed explanations do not explain this capture:

- Eligibility/no-match: both retrievals are recorded as matched, each with a real query vector, and both reach the LLM. `src/server/rag/retrieval.ts:40–52` gates query embedding on eligible candidates; `src/server/rag/service.ts:93–103` gates generation on a matched retrieval.
- Target rejected as stale before E5: the target result is accepted and published. The old generation's fallback contains a model completion, placing its stale result after model execution. This is consistent with profile replacement and the post-completion current-guidance check at `src/server/rag/service.ts:104–113`, not a pre-E5 rejection. The exact stale branch was not independently instrumented.

There is a separate source limitation: `terminal` checks shared guidance ID without primary/profile version. A newer supplement can satisfy that predicate for an older call. In this attempt the saved older generation and both provider completions are present; this limitation does not itself demonstrate premature resource disposal here.

## Why the strict join remains unavailable

Exactly two of the five raw joins pass: the measured service targets the updated profile, and the prior capture prefix is immutable. The query-call, single-vector/new-retrieval, and generation-containing-single-retrieval joins fail because the range contains two queries and two new retrievals. These are genuine failures of the isolation precondition, not evidence of an embedding or generation failure.

Both service queries are byte-identical (SHA-256 `f6b11bcc8d8ae7b798cf97051b243cef98185939eb2d24109027c8810df32767`); the profile snapshots differ only in version. Both query vectors are identical, finite 384-vectors with norm approximately 0.9999998, and each equals both retrieval trace vectors. Both trace identities equal the captured actual provider: `transformers.js@3.8.1/onnxruntime-node`, `Xenova/multilingual-e5-small`, revision `761b726dd34fb83930e26aab4e9ac3899aa1fa78`, dimension 384.

Each E5 interval is contained in a distinct retrieval interval, but both retrieval intervals are contained within both overlapping service generation intervals. The retrieval traces have no generation ID. Identical query text, vectors, and shared guidance ID cannot recover a unique target service-to-E5 join. Do not relabel provider phases or rewrite `exactE5Join` using a guessed association.

The model transport associations are independently recoverable. Proxy capture `9100db72-3dc5-45d7-8fd4-deb55900cc66` joins by provider call ID to the stale generation; `91fee4de-f604-45ff-9f15-e160cbea1eff` joins to the accepted target generation. Both are forwarded HTTP 200. For both, saved request/response byte hashes, provider message-content hash, response ID, completion capture, and generation call ID agree. The accepted target generation also joins the supplement publication by `ragRunId`. Shared response-message hashes alone would not distinguish them.

## Privacy observations recoverable without replay

The four frozen canaries are present in their intended raw injection fields. The actual parsed profile removes exactly those four unknown fields, and the saved parsed command equals the command recorded at the runtime boundary. No canary values are reproduced here.

A bounded file scan examined 12 files / 1,545,803 bytes: `measured.json`, `runtime-captures.json`, `warmup.json`, `entry-end.json`, `parsed-boundary.json`, `proxy-final.json`, the two proxy metadata files, and their four raw request/response files. It found zero literal UTF-8 canary occurrences and zero occurrences in decoded JSON string leaves/keys. The intentional `raw-injection.json` was used only as positive injection evidence and to obtain the frozen values, and was excluded from the leak scan. No SQLite file or log content was opened.

This is non-vacuous component observation: the capture contains all recorded actual E5 query inputs and outputs across both overlapping paths, and both actual LLM input/output exchanges. Universal absence across those captured operations does not require guessing which identical E5 vector belongs to the target. The target's successful actual generation and publication are separately joined. These saved files therefore support an additive, explicitly scoped component privacy finding without replay, while the isolated exact-E5-join objective remains unproved.

Limits: this is not a production HTTP in-process E5 capture or a scan of production logs/client envelopes. Those surfaces require their separate saved evidence and review. Complete provider instrumentation, intended model pins, candidate receipt, and source integrity remain dependent on the entry/binding evidence and parent validation; this bounded review did not re-hash the entire candidate or independently prove capture completeness outside the recorded interval. No full Q-RAG-08-26 or overall AC verdict is issued.

## Input hashes

| File | SHA-256 |
| --- | --- |
| `measured.json` | `f9cee7a00285b1586e2deb9d04b209080655afdf336d16d6900a7e89cff72ada` |
| `runtime-captures.json` | `4675c9e132a509def2613796a00f5012bea40daedd5f17aa1c46949f1f4e4a90` |
| `warmup.json` | `d2ec25cbc2608fc12a58dea3251844c19b068d43f8298717d39c32fcb6f8df32` |
| `entry-end.json` | `89054fd9509b5cfa5a6e951e3cec5d1d60f93472d7b35616aa3a5612b846ea24` |
| `parsed-boundary.json` | `ea9f46f4fe3a474d73a3be0e0fe528558b8c8009cee3d9d6570d8c94a171ff5b` |
| `raw-injection.json` | `6ad852040566ea7009bf2a03232260d0dff50a06c24436c09ae1937e13506355` |
| Harness `privacy-component-v1.ts` | `b304db6c81da8e6b26c81eea95fb089118cb0ae3318415d8c0a1b31c0dac9b8b` |
| C4 `src/server/services/rag.ts` | `16bc3ae7be9f6524c2f134e805afb8d635d2ea15120aaa2b59aaf3d73401a2a5` |
