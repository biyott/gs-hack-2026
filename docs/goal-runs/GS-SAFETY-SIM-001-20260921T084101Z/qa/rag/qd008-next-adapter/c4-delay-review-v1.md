# C4 delay evidence review v1

The phase correction is supported within the saved evidence window. The original result remains **OBSERVED_FAILURE, 7/9 checks**; the separate derived report remains **13/13 checks**. This review independently confirmed 18 bounded file assertions. It does not issue a full-case or overall acceptance verdict.

Only saved JSON, raw provider bytes, SSE strings, and source text were inspected. No product runtime, imports, tests, model calls, or database opening occurred. The accompanying JSON preserves all nine original checks, all thirteen derived checks, exact timings, input hashes, and explicit limits.

## Target and original failures

Run `46e31029-fd32-4e0a-b550-834e52701434`, WORKER-A: target guidance version 3, primary version 3, profile version 2, generated `2026-09-21T17:43:55.715Z`. Its stable guidance ID is shared with earlier primary 1/profile 1 and supplemental version 2, so guidance ID alone cannot identify publication phase.

Original check 5 rejects any accepted generation under that ID. The saved accepted row `41f3a4a1-6ca2-4203-b902-d2fe2ea2a294` completed and was published at `17:43:55.697Z`, before the target. It was already in the initial database projection and remains unchanged. Original check 8 rejects any same-ID evidence or supplement anywhere in the stream: the one evidence row and frame 7 supplement are also warmup records. These checks have overly broad phase scope; their raw false values are preserved.

The target fallback event `f9fa4459-20b5-40fb-842f-2d5958437128` explicitly names guidance 3/primary 3 and generation `9ad7e5c8-b9b0-4548-83b0-5db7571059f2`. That new generation records `timeout`, elapsed **5001.9227820000015 ms**, started `17:43:55.722Z`, completed `17:44:00.724Z`, with `completion:null`. There is no new accepted generation.

## HTTP, stream, and immutable history

The target primary HTTP response completed at `17:43:55.721Z` (monotonic 20789.235753 ms), before the response hold. Administrator speed 2 completed with HTTP 200 from `17:43:55.973Z` to `17:43:55.983Z` (21041.344444–21051.031508 ms), inside the hold. The administrator response and during/final snapshots all retain speed 2 and the exact target primary envelope, including route context.

All ten raw SSE data payloads equal the saved parsed snapshots. Their stream sequences 39–48 are contiguous, receipt clocks ordered, event IDs consistent, and capture failure null. Frame 7 is the prior primary 1/profile 1 supplement. Frames 8–10 retain exactly primary 3/profile 2; there is no target supplement event. The final captured frame arrives `17:44:00.729Z`. This says nothing about uncaptured future output.

The primary and administrator HTTP response hashes match their saved bytes and complete parsed snapshots. Two prior retrieval/generation rows, all three guidance history rows, the single existing evidence row, and incident firstGuidance arrays remain unchanged in final projections. No late evidence was added. The four provenance digests in the derived report match actual saved bytes.

## Completed inference and downstream abort

The unique armed capture is `52fa700e-4e24-4ef7-b8bb-36a7b0d8124e`. Of 21 captured calls, exactly one was received inside the target generation interval. Its individual metadata equals the integrated capture record; its actual 1038-byte request and 638-byte response hashes match, as do decoded response ID, model `Qwen3-0.6B-Q8_0`, and provider message hash. The source reads the complete upstream response before entering the hold (`model-capture-proxy.ts:82–96`).

| Boundary | UTC on 2026-09-21 | Proxy/harness monotonic ms |
| --- | --- | ---: |
| Proxy received target request | 17:43:55.750 | 20818.424133 |
| Upstream dispatched | 17:43:55.751 | 20818.830214 |
| Actual upstream complete | 17:43:55.969 | 21036.887161 |
| Injected hold started | 17:43:55.969 | 21037.037066 |
| Hold ended on cancellation | 17:44:00.724 | 25792.18314 |
| Downstream client complete | 17:44:00.724 | 25792.307626 |

The configured 6000 ms hold was interrupted after **4755.146074 ms**. Actual upstream inference had completed before the hold, 0.149905 ms earlier by the recorded monotonic clock. The evidence establishes downstream client abort reaching the proxy, whose own delay timer and abort listener were released. It does **not** establish cancellation of active model inference or an abort at exactly 5000 ms. Service elapsed and proxy elapsed are different intervals; they must not be conflated.

The target row has no provider completion ID because the response was withheld. Its association with the raw completed response uses the unique one-shot capture and chronological phase evidence, not a persisted service-to-provider completion join or shared request/message hashes.

## Limits retained

No full Q-RAG-08 deadline/cancellation/UI/audio verdict is issued. The saved observations do not demonstrate future-publication absence, all application timer/listener cleanup, 30-cycle stability, physical audio, rendered visibility, duplicate-publication handling, or a subsequent primary transition. Source code intends a final observation after 6250 ms from hold start, but the final snapshot GET has no separate response receipt timestamp in these saved artifacts; this review does not invent one. A 6000 ms downstream hold/timeout is distinct from the accepted-before-5000-ms supplement scenario.

All source and evidence input hashes are in `c4-delay-review-v1.json`; frozen evidence and harness files were not modified.
