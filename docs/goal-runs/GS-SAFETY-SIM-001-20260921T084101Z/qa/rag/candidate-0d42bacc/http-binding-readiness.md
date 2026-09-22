# C2 HTTP adapter preparation

Status: PREPARED / NOT_RUN. W2 remains HOLD. This document grants no execution, and the adapter has not been typechecked or tested in this preparation turn. Candidate C2 is fixed at `/home/b/.cache/gs-safety-qd001.7e7jy5oy`, ID `sha256:0d42bacc04c50cd21c9c133e262838acb6f47e2e8d33d37ea450ce160f46bc3e`, manifest SHA256 `6f146ee34b7880e3a0c8012ae2a2485ec7d95e0314e183c555eb509060f54ef0`. A future candidate requires its own binding; this preparation cannot be relabelled C3.

## Callable contract and ownership

`integration-main.ts` exports `runIntegration(context: IntegrationContext)` and `runIntegrationCli(argv, dependencies)`. Importing it has no top-level execution. The CLI helper accepts `--grant W2 --attempt <fresh-id> --base-url http://127.0.0.1:4102`, including equivalent `--key=value` syntax. It does not read credentials from arguments or print environment variables.

`IntegrationContext` extends `HttpContext` with:

- `attempt: string` and a fresh `outputDirectory` equal to `evidenceRoot + '/' + attempt`.
- `launchConfiguration`: `databasePath`, `applicationPid`, `llmBaseUrl`, `llmModel`, `llmVersion`, `embeddingModel`, `embeddingRevision`, `embeddingDimensions: 384`, `timeoutMs: 5000`, and `launchEvidence: {path, sha256}`. The schema fixes the C2 pinned model/revision values and allows the direct8092 or separately owned capture8093 provider URL. The launcher evidence file hash is checked. This is a launch declaration, not an independent process-memory inspection.
- Optional `finalizeCapture(): Promise<readonly ModelCaptureRecord[]>`, which must await the capture handle's `close()` before returning its completed record snapshot.

`HttpContext` retains `executionGrant: 'W2'`, `baseUrl`, private `accessCode`, `outputDirectory`, and injected `readOnlyDatabase: {query(sql, parameters): unknown | Promise<unknown>}`. Optional flags are `warmup` (default true), `canaryProbe` (default false), `onPhase` and `onMeasuredRun`. No SQLite package is imported by this adapter.

The parent launcher owns migration/seed, the private PIN and capture token, the Next process, read-only SQLite handle, existing-provider observation, actual E5 readiness, proxy lifecycle and final process disposal. It uses fresh sibling directories `<attempt>-launch` and `<attempt>-capture`; `runIntegration` alone creates `<attempt>`. Integration artifacts use exclusive `wx` writes. The read-only handle must remain open until `runIntegration` returns, including post-capture joins. Only the launcher's private process artifacts may contain raw process output; no token or PIN is stored by these modules.

The launcher must establish18 documents/chunks/FTS entries and18 actual384-dimensional embeddings at the pinned E5 revision, with a completed ingestion record, before calling this entry. The adapter does not replace that readiness gate or invoke the producer verifier. The launch guide is `evidence/technical/g3-launch-c2.md`; APIs inspected are candidate `app/api/session/route.ts`, `app/api/simulation/route.ts`, `app/api/events/route.ts`, `packages/contracts/src/{commands,core,guidance}.ts`, `src/server/services/rag.ts`, and `src/server/rag/{configuration,provider}.ts`.

## Normal HTTP evidence

Each mode has separate warmup, reset and measured phases: equipment `EQ-APPROACH`, fire-gas `FG-FIRE`. Seeded WORKER-A is Korean; WORKER-B is English with confirmed stairs restriction and assistance need. A seed alone is not accepted-output evidence: each locale requires a real accepted publication in both measured modes, every accepted publication must satisfy all checks, and the integrated model verdict additionally requires exact capture joins.

Artifacts retain initial primary HTTP responses, full ordered raw SSE including reconnect, command IDs/status/timings, complete initial/final snapshots, original/current persisted guidance, evidence/source records and all generation/retrieval rows. Primary content and primaryGuidanceVersion remain unchanged while the supplemental envelope version increases; incident firstGuidance remains immutable. Timings concern HTTP/SSE receipt only. They do not establish rendered p95 or physical audio.

Provider joins require exact upstream call ID and SHA256 of `choices[0].message.content`, model identity, one matching capture, timing containment and persisted run/guidance/worker/profile lineage. Raw HTTP response SHA256 is a separate hash. Missing IDs or ambiguous captures remain NOT_RUN/FAIL; an absent ID is never fabricated. A captured fallback completion is recorded separately from accepted publication. Temporal retrieval joins remain explicitly ambiguous because retrieval records lack guidance ID.

## Two separately labelled canary controls

With `canaryProbe: true`, both controls run after all normal measurements, once per mode, with a fresh selected run and their own raw SSE/DB/HTTP evidence. The exact four synthetic values come from frozen Q-RAG-08-26; frozen input hashes are verified by the enclosing binding.

1. A profile containing only the private canaries lacks required functional fields. Expected contract result is400 INVALID_INPUT, unchanged captured snapshot/DB and no response canaries. This tests malformed-profile rejection, not the cause-specific sanitization of an otherwise valid profile.
2. A complete supported WORKER-A functional profile with the next profile version includes those four extra fields. C2 uses a non-strict Zod profile object, so source inspection predicts stripping rather than400; the observed response and resulting state decide the recorded result. Rejection is retained with no continuation claim. Acceptance is followed through actual primary generation and terminal supplemental/fallback publication. The adapter checks the applied functional profile, raw response/SSE/snapshots/captured DB rows, and a completed generation record belonging to the updated target/profile. The proxy stays open through this phase; exact capture joins are reported afterward.

The valid-profile continuation verdict is candidate-record evidence until joined to captured provider bytes. A generation capture PASS is only that surface. Actual HTTP responses and ordered SSE frames supply captured client-envelope evidence. The implementation does not capture actual in-process E5 inputs or exhaustively inspect application logs, so full Q-RAG-08-26 remains NOT_RUN even if both controls and generation joins pass. Physical UI/audio is a separate case31/UI requirement, not a missing case26 requirement. Captured DB rows are the declared query subset, not an exhaustive database audit.

## Stairs hook and pending semantics

`onMeasuredRun(observation: HttpMeasuredRun)` runs after each measured scenario's stream is closed and final evidence saved. The exported record contains `mode`, `runId`, `outputDirectory`, the complete `initial` command/snapshot, `final` and `reconnect` snapshots, copied raw ordered `frames`, `initialDatabase`, `finalDatabase`, and `evaluation`. It grants no extra model calls or profile commands. Independent hooks can use it to link actual live stairs evidence and must save separate artifacts without replacing the baseline report.

The actual HTTP query is constructed by candidate `src/server/services/rag.ts` from the primary message, hazard and action; limit is3. `service.enrichGuidance` applies fresh wall UTC. Neither is the exact frozen Korean09:30/limit18 retrieval input. That fixed request remains a separately labelled pure retrieval sidecar. Any in-process actual engine/service stairs phase belongs to the parent and must identify its live UTC/context explicitly; a controlled09:30 service replay cannot be claimed by silently overriding the candidate's clock.

The supplied-record stairs schema/oracle and independent semantic review remain separate. Exact approved EQ003 output, retrieval rank or compatible metadata cannot establish operative current applicability by themselves. Unknown body conditions remain unverified; contradicted conditions cannot produce DEMONSTRATED. Korean stairs coverage is not inferred from the normal English restricted worker. Any new functional profile/locale transition needs authoritative guide/route/profile joins.

Frozen Q-RAG-07-03 required/forbidden/action expectations and the original C1 raw whitelist FAIL remain unchanged. This extension issues no AC or goal verdict. Q-RAG-08-31 retains only the HTTP lineage/reconnect subset; physical speech, duplicate-publication and subsequent-primary checks remain separately pending.

## Preparation validation

Only source reading, bounded edits and manual review were performed. No app, database, model, proxy, test, compiler, producer verifier or runtime import was executed. Copied HTTP modules were split to remain below250 total lines per module. Strict typecheck and meaningful adapter checks are deferred until the explicit preparation-validation/resource grant; the presence of copied selftests is not an execution result.
