# Deferred C4 collector source review

Source-only review; no application, browser, model, generator, device or checker was run by this preparation. `node --check` is the only JavaScript validation executed. Runtime acceptance remains NOT_RUN/NOT_EVALUATED as appropriate.

Independent source lanes covered the preload/checkers, browser/controller/clock interfaces, input contracts, interval boundaries and immutable joins. The following concrete findings were corrected before the runner freeze:

- Preload v1 remains unchanged. Its separately versioned v2 uses a granted identity-bound stop file, no-follow descriptor reads with a size bound, exactly-once restoration/drain/close handling including restoration failure, and a close receipt. The deferred checker evaluates the same wrapper source bytes, including malformed matching frames whose original throws.
- Controller mapping now requires prelaunch inventory, installed PID, exact approved source callsite, unique target-mode controller, and a new public command observed on that controller and the same administrator SSE request. A shared command verifies both clients. Reconnects cannot silently reuse a mapping.
- Browser guidance evidence uses an explicit metadata/hash allowlist; public request evidence redacts profile values and credentials. Dynamic exception text is not persisted by the runner.
- Generator clock bindings retain all three measured probe bounds and observed UTC/monotonic residual spread. Partial asynchronous close-receipt reads remain bounded and recorded. Browser launch/operations, input generation and cleanup are tied to the issued collection/grant boundaries.
- Both unused and selected modes are publicly paused during setup, and both are paused during authorized cleanup. Model permission is bound to an explicit credential-free existing-runtime policy; the collector does not reconfigure a provider.
- Helper prerequisites require different checker kinds and exact source bindings. Returned incomplete intervals propagate to the report/exit status. Browser cleanup executes even if evidence writing fails. Resource sampler work is tracked and drained, and logger failure cannot recursively reject an unhandled timer callback.
- The measurement's first terminal guidance read is retained for its denominator. Input joins use a separately labeled immutable read after sent requests settle, preserving the possibility that a pre-stop input commits later. Unknown server work after a transport failure remains explicitly unresolved.
- Missed designated cycles and fewer than ten completed measured public cycles mark collection incomplete. Raw snapshots support a separate actual route/hazard audit; a command count is not evidence of a state transition.
- Interval abort closes only the collector's owned browsers to unblock page rAF/fetch/evaluate waits. Normal raw evidence is read before normal closure; an aborted/unreadable page remains incomplete.

Two earlier exploratory claims were rejected on direct frozen-source inspection and must not be used as evidence:

1. “There is no public SSE endpoint” was false. `app/api/events/route.ts` implements authenticated `/api/events`, including immediate publish enqueue and pending-pull enqueue.
2. “Repeated transition-ledger start/stop accumulates MutationObservers” was false and the reviewer retracted it. The observer is constructed once in the init-script installation; lifecycle start/stop only toggles state/rAF. The collector installs once per fresh context.

Other rejected review suggestions included treating the source-defined SSE ID as opaque, choosing a later repeated enqueue to improve latency, removing nonsecret source-type/entity enums as if they were session-bearing source IDs, and interpreting offsets0/18 or0..162 as eighteen or163 cycles. The protocol binds exact framing, retains the first real enqueue, hashes session-bearing measurement source IDs, and schedules two/ten cycles at18-second spacing.

Remaining limits are runtime prerequisites, not source-review PASS claims: exact live app-origin installation/stack, helper execution, public JPEG preflight, accepted three-entity rate, actual foreground/raw windows, immutable denominator completeness, observed primary quotas, provider traces, and the graceful close receipt. The source-map proposal is not automatically Technical approval. No physical four-role or performance acceptance follows from this source packet.
