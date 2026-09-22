# Production E5 observation feasibility

Started 2026-09-21T23:45Z. Scope is QA artifacts only; parent reserved runtime to W3. No debugger/app/model starts until a new explicit W2 grant. The skill's root journal location is overridden by the explicit W2-only ownership boundary.

Runtime is pinned Node22.23.2, exact C5 Next production CLI and frozen bundled server code. Product source, bundle, docs, model and oracle hashes stay immutable. Built chunks supply exact generated JavaScript positions; TypeScript source-map assumptions are unnecessary.

Hypotheses:
1. E5 input is absent only from observability: source exposes texts, signal and actual vectors at compiled logpoints. Distinguish with an executed uniquely resolved logpoint and signal-to-generation join. Remedy: external capture.
2. Same text/warmup concurrency prevents unique association: an external WeakMap of the same AbortSignal object distinguishes generation calls without mutating the signal. Distinguish with exactly one input/output/retrieval/generation chain for each target ragRunId. Remedy: identity join.
3. V8 optimization or source positions make proposed locals unavailable: source-bound capture must record resolved breakpoint positions, evaluation errors and event counts. Any ambiguity leaves the case inconclusive. Remedy: preserve gap.

Planned additive artifacts: source-binding.json, preload.cjs, copied 79-file HTTP adapter with only preload startup/environment changes, strict compile receipt, distinct http-e5-attempt-01 evidence and postprocessing. All stay under W2-owned qa/rag and evidence/qa/rag. Runtime handles, if later granted: owned launcher/application and8093 capture proxy only; retained provider22562 remains externally owned. No inspect TCP port; in-process inspector Session attaches only to its own app process. Capture global is QA-owned, while all product objects remain read-only. Conditions always return false; errors are captured, never represented as successful observations. No performance result is inferred from instrumented execution.

References read: debugging/SKILL.md; references/runtimes/node.md; methodology/00-setup.md; methodology/02-investigate.md; programming/SKILL.md and TypeScript reference; exact candidate launch-http.ts, embeddings.ts, retrieval.ts, service.ts and two compiled C5 chunks.
