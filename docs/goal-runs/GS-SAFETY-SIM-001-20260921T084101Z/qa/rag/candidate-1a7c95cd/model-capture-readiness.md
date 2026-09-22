> Historical C2 preparation copied for reference. This file does not bind executable C3 settings or transfer a result; consult C3 README and binding-readiness instead. Original C2 bytes are preserved in candidate-0d42bacc.

# C2 model capture readiness — preparation only

Recorded from source inspection at 2026-09-21T15:04:16Z by `/root/qa_lead/qa_rag/filter_adapter`. This does not grant W2, start a listener, execute a test, open a database, run a model, or establish runtime correctness. W1 retains the resource window. The copied C2 proxy needed no behavioral edit during this review. The original C1 harness and product candidate were not modified.

## Candidate and source binding

- Candidate: `sha256:0d42bacc04c50cd21c9c133e262838acb6f47e2e8d33d37ea450ce160f46bc3e`.
- Product root: `/home/b/.cache/gs-safety-qd001.7e7jy5oy`.
- Build ID from the issued C2 receipt: `QZCOSOj4hgBWlUIGbGUxu`.
- Evidence root: `/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/rag/candidate-0d42bacc`.
- Existing model process supplied by the resource owner: PID `332445`, port `8092`. This preparation did not probe, restart, or independently revalidate that process.

Small-file SHA-256 observations:

| Source | SHA-256 |
| --- | --- |
| C2 `src/server/rag/provider.ts` | `e61a4d6f262ec6796a63fc9fc92973dfeef93c3595c3b43b2603dd58f4f35426` |
| C2 `src/server/rag/configuration.ts` | `3c9881303ca1989297744f9c311e3ac3ebd5aaab0768e20e543ce4cee127a2b0` |
| `evidence/technical/g3-launch-c2.md` | `30aeac0125e2ab5d9fa053a6b6643e513b09bfc5536691be58fe655d1f17b7ec` |
| `model-capture-evidence.ts` | `88c9f93c4d372d6c0978e93f95b531794beac5a0d2e26c865a0d67b00da5c24f` |
| `model-capture-http.ts` | `22e41d657c5aba694aa036a7f56520ebf99af07834a4b0576a918c48caaf5447` |
| `model-capture-proxy.ts` | `a929922f7e7f2456c736c0e49d3b5ec676a43ed8f301e6924a5c014820892af1` |
| `model-capture-types.ts` | `e555d4bd49464d0acc520e8edfa79522acdecfe1cc5c1d970ffa7bc3ea03040a` |

No large model file was hashed in this preparation. The configuration names `Qwen3-0.6B-Q8_0`, version `23749fefcc72300e3a2ad315e1317431b06b590a`, with provider `openai-compatible` and mode `actual`. These are source-configured identities; model-process identity remains a W2 observation.

## Callable lifecycle agreed with the integration owner

Import `startModelCapture` from the C2 `model-capture-proxy.ts`. Imports do not listen. Only the parent executor, after the explicit W2 integration grant, may call:

```typescript
const handle = await startModelCapture({
  executionGrant: "W2",
  outputDirectory: `${attemptDirectory}/model-capture`,
  port: 8093,
  target: "http://127.0.0.1:8092",
  qaRequestToken,
});
```

`attemptDirectory` must be a fresh child of the C2 evidence root. `model-capture/private-capture` must not already exist: the capture writer deliberately refuses to reuse that private directory. `qaRequestToken` is an ephemeral parent-owned secret of 32–256 characters without whitespace. Keep it in memory and the child environment only; never place it in command arguments, saved launch JSON, stdout, screenshots, token hashes or artifacts. The proxy authenticates the Bearer header with a constant-time comparison after checking byte lengths. Unauthorized requests produce only an aggregate rejection count, without body capture or upstream forwarding. It removes authorization and cookie headers before forwarding to `8092`.

The integration owner is preparing import-only `runIntegration(context)` and `runIntegrationCli(argv, dependencies)` exports in `integration-main.ts`. Exact argument contract:

```typescript
await runIntegrationCli([
  "--grant=W2",
  `--attempt=${attemptId}`,
  "--base-url=http://127.0.0.1:4102",
], dependencies);
```

The parent's TSX bootstrap supplies the access code, read-only DB observer, sanitized launch binding and optional finalizer through `dependencies`. Running `node ... integration-main.ts` alone is not an execution command because that module has no top-level invocation. Use Node 22, the C2 locked TSX dependency, and the C2 harness `tsconfig.json` when the parent bootstrap calls the export. The selected `410x` port must match the app launch and may differ from this planned `4102` only by explicit execution binding.

The final integration contract is `finalizeCapture(): Promise<readonly ModelCaptureRecord[]>`. Its exact sequencing is:

```typescript
await handle.close();
return handle.capturedRecords;
```

Call this after the HTTP scenario runner has completed and cleaned up, including error cleanup. `close()` aborts any calls still in flight, closes only the `8093` listener, awaits capture writes and records the end time. It does not stop PID `332445`. Read `capturedRecords` after `close()` to avoid a snapshot that predates evidence persistence. A proxy persistence/handler failure causes finalization to fail rather than silently claiming complete capture.

## App launch binding after the grant

Working directory must be `/home/b/.cache/gs-safety-qd001.7e7jy5oy`. The parent starts the proxy, then supplies the following exact public environment values to the app child; the two secrets below stay private:

| Environment | Required value |
| --- | --- |
| `PATH` | `/home/b/.local/bin:` followed by the existing path |
| `DATABASE_PATH` | Fresh absolute SQLite path under this C2 QA attempt |
| `PORT` | `4102`, matching the selected QA address |
| `NEXT_TELEMETRY_DISABLED` | `1` |
| `NODE_OPTIONS` | `--max-old-space-size=1536` |
| `RAG_LLM_BASE_URL` | `http://127.0.0.1:8093/v1` |
| `RAG_LLM_MODEL` | `Qwen3-0.6B-Q8_0` |
| `RAG_LLM_VERSION` | `23749fefcc72300e3a2ad315e1317431b06b590a` |
| `RAG_TIMEOUT_MS` | `5000` |
| `RAG_LLM_API_KEY` | The same in-memory `qaRequestToken`; never logged |
| `GS_DEMO_PIN` | Same private code for migration, seeding, app and authenticated HTTP; never logged |
| `RAG_EMBEDDING_MODEL` | `Xenova/multilingual-e5-small` |
| `RAG_EMBEDDING_REVISION` | `761b726dd34fb83930e26aab4e9ac3899aa1fa78` |
| `RAG_EMBEDDING_DIMENSIONS` | `384` |
| `RAG_EMBEDDING_LOCAL_PATH` | `/home/b/.cache/gs-safety-qd001.7e7jy5oy/data/knowledge/runtime/models/Xenova/multilingual-e5-small` |

After the parent has privately populated that environment, the launch guide's commands are `npm run db:migrate`, `npm run db:seed`, and `npm run start -- --port "$PORT"`. No package install, build, provider restart or `RAG_ENABLED` variable is part of this proxy binding. No command here has been run for this preparation.

Authenticated `GET /api/simulation?mode=equipment` triggers initialization. Keep initialization and warmup outside measured samples; require the guide's 18 documents/chunks/FTS entries, actual pinned 384-dimensional vectors, and completed ingestion observation before measurement. Any launch-guide warmup through `src/server/rag/verify-server.ts` needs separately bound output ownership because it mutates fire-gas and writes producer-oriented evidence; do not start it implicitly. Reset/select the measured scenario after any warmup and distinguish its capture IDs from measured ones.

## Captures, exact joins and limits

The provider POST path is `/v1/chat/completions`. Its configured `apiKey` becomes `Authorization: Bearer ...`; the proxy's `8093/v1` base therefore fits the C2 configuration without product changes. The provider requests temperature `0`, `max_tokens: 24`, disabled thinking, a system message, a user message containing `actionCode`, `locale` and reviewed explanation/citation options, and a strict selection-index response schema. The proxy forwards the request bytes and successful provider response bytes unchanged, preserving HTTP status and content type. It does not choose or rewrite a selection and performs zero retries.

Raw request and complete raw response bytes are retained as `<captureId>.request.bin` and `<captureId>.response.bin` under `private-capture`, with mode `0600` inside a `0700` directory. These contain the actual complete model envelope/response and must not be printed or published. Public per-call metadata contains hashes, sizes, content types, actual safe provider ID/model, redacted findings and clock endpoints. No authorization, cookie, PIN or device-camera data belongs in the metadata. If an ephemeral capture token appears in a body, the implementation withholds that body and derived hashes and records a redacted finding.

Join each generation DB record only when all applicable identities agree:

1. Capture `providerCallId` equals generation `detail_json.callId`.
2. Capture `providerMessageSha256` equals generation `detail_json.responseHash`. Both hash the exact UTF-8 string at `choices[0].message.content`; JSON reserialization or whitespace normalization would change the input and is forbidden.
3. `modelReturned` agrees, the candidate/run/scenario binding is correct, and the capture UTC interval overlaps the corresponding generation interval. Use these to detect ambiguous joins rather than selecting a convenient duplicate.
4. Capture `responseSha256` hashes the whole raw HTTP response and must never be substituted for `responseHash`. `requestSha256` similarly binds the actual raw outgoing envelope.

Accepted generation records store the completion fields at the top level of `detail_json`. Fallback generation records store any observed completion under `detail_json.completion`; that value may be null if generation never completed. Use the corresponding location when joining. A raw upstream completion can exist even when the final product result falls back, so a successful capture join alone does not establish accepted supplementation.

The product can generate its own local fallback call UUID if upstream omits `id`. The proxy cannot observe that private fallback: it records `providerCallId: null`, so the call-ID join remains unavailable. Missing/unparseable content, unsupported safe-ID characters, compressed response bytes or incomplete/error responses can also leave parsed fields null. Preserve the raw evidence and mark that join incomplete; do not fabricate IDs, claim a successful join or silently treat raw-response hashes as message hashes.

The 1 MiB per-direction limit, client-abort propagation and independent 5000 ms ceiling are instrumentation controls. The app keeps its own earlier 5000 ms deadline. Captured UTC and monotonic endpoints cover receive, request completion, upstream dispatch/headers/completion and client completion. `proxyElapsedExcludingUpstreamMs` excludes upstream dispatch-to-completion and post-response artifact writes; it includes request buffering and response forwarding. The manifest records source/configuration hashes, ports, start/end, zero retries and the timing definition; its configuration digest explicitly excludes credentials. These are instrumentation conditions, not a latency-equivalence claim.

This capture covers generation transport only. Q-RAG-08-26 also requires the outgoing embedding input, logs and client envelopes. As agreed with the integration owner, the full case remains `NOT_RUN` until every required surface is observed and checked. Static review and historical C1 typechecking do not establish C2 runtime validation.

## Prepared guarded launcher

`launch-http.ts` now exports `runHttpLaunch({ executionGrant: "W2", attempt }, signal?)` and `runHttpLaunchCli(argv)`. Direct CLI execution requires exactly `--grant=W2` and a fresh lowercase `--attempt=` identifier; importing it does not invoke the launcher. It remains unexecuted and untypechecked under the current W2 hold.

After a separately issued W2 integration grant, the concrete CLI shape from the fixed C2 product working directory is:

```bash
TSX_TSCONFIG_PATH=/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/rag/candidate-0d42bacc/tsconfig.json /home/b/.local/share/gs-safety-runtime/node-v22.23.2-linux-x64/bin/node --import tsx /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/rag/candidate-0d42bacc/launch-http.ts --grant=W2 --attempt=c2-http-attempt01
```

The example identifier must be unused; the launcher refuses existing result, launch or capture paths. It keeps `<attempt>` absent until `runIntegration` creates it, and owns sibling `<attempt>-launch` (private DB/process logs, readiness and sanitized launch proof) and `<attempt>-capture` (proxy evidence). The launcher creates the PIN in memory unless `GS_DEMO_PIN` was privately supplied, creates a separate random capture token in memory, verifies the fixed candidate before starting processes, and invokes migration/seed with the package's exact Node script arguments. It invokes the packaged Next production CLI directly on `127.0.0.1:4102` so the recorded PID/process group is owned without an npm wrapper. The installed Next CLI guide was read for `next start`, hostname, port and prebuilt-production requirements.

The launcher waits for authenticated initialization and exact 18-record/vector readiness, then calls `runIntegration` with warmup and canary controls enabled. A read-only SQLite connection is injected; no producer DB is reused. Private logs are opened with mode `0600` under a mode `0700` directory and never copied into public output. The existing provider's actual `/proc/332445/cmdline` is preserved privately and its executable/model real paths are recorded separately, without claiming it was launched from C2. Final cleanup closes the read-only DB, terminates only the launcher's owned app process group, and closes its capture proxy. It never signals the existing provider. Candidate verification inside the integration entry and its final recheck remain deliberate additional immutability checks.
