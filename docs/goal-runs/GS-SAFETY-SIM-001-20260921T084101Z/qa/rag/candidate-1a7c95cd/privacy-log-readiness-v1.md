# C3 privacy log scan v1 — unexecuted preparation

This candidate copy is bound to C3 `sha256:1a7c95cd1a15df738492a368d36cc6cb98985ec1c2618b10e807c82076b247c4`, root `/home/b/.cache/gs-safety-c3.eulo4t9w`, manifest SHA-256 `8d9b031f68374ea939dcdebb570e76aeba4b09d1154165cab53d186e7d27c4bc`. Preparation is source-only: this worker has not executed, typechecked or tested the scanner or entry point. The parent owns the later scoped compiler check. Frozen C2 and the six-file `c3-preparation` snapshot remain unchanged. This document makes no runtime coverage or cleanliness claim.

The scanner imports Node filesystem/crypto utilities, Zod and the local C3 binding constants. It has no product imports, model calls, database access, listener, polling or file writes. The new guarded `privacy-log-entry.ts` publishes one redacted result only when explicitly invoked with the W2 grant and a post-cleanup assertion. Importing it does not invoke the CLI. The parent owns execution permission and every case/overall verdict.

## Post-cleanup entry point

`runPrivacyLogScan(input)` is the callable production-log entry. Required fields are `executionGrant: "W2"`, `afterCleanup: true`, `attempt`, `applicationPid`, `closedAt`, `launchSha256` and `cleanupSha256`; optional `maxBytesPerFile` defaults to 16 MiB. `runPrivacyLogScanCli(argv)` accepts the equivalent flags below. The PID must equal `launch-binding.json.application.pid`; `closedAt` must be at or after `cleanup.json.endedAt`, and neither timestamp may be in the future. Await the actual launch process exit before making these assertions. Supply the exact hashes from the reviewed, finalized sanitized proof files; do not manufacture replacement proofs to make the scan run.

Prepared invocation, **only after a separate W2 grant and complete launcher cleanup** (placeholders require actual attempt values):

```bash
cd /home/b/.cache/gs-safety-c3.eulo4t9w
TSX_TSCONFIG_PATH=/home/b/.cache/gs-safety-c3.eulo4t9w/tsconfig.json \
  /home/b/.local/share/gs-safety-runtime/node-v22.23.2-linux-x64/bin/node --import tsx \
  /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/rag/candidate-1a7c95cd/privacy-log-entry.ts \
  --grant=W2 --after-cleanup --attempt=<completed-http-attempt> \
  --pid=<actual-application-pid> --closed-at=<actual-post-cleanup-UTC> \
  --launch-sha256=<exact-launch-binding-sha256> --cleanup-sha256=<exact-cleanup-sha256>
```

The CLI fixes the input root to `E/<attempt>-launch` and the inputs to its two private application log files. It records the pinned candidate/manifest identity, supplied proof hashes and producer assertions, frozen case digest, its entry/scanner/binding source hashes, scan timestamps and per-file counts/hashes. It writes `E/<attempt>-launch/privacy-log-scan-v1.json` using exclusive creation, `O_NOFOLLOW`, mode `0600` and a file sync; an existing result is never overwritten. Stdout contains only the result path/hash/complete flag. Errors use a fixed redacted code without raw exceptions, arguments, logs or environment. Exit codes are `0` for complete coverage, `2` for an immutable incomplete result and `1` for invalid binding, publication or other failure. Positive counts do not alter these coverage exit codes or issue a verdict.

The scan verifies the launch proof's recorded manifest hash against the current C3 binding and verifies both supplied proof hashes before and after reading logs. It does not repeat the launcher's full product/model rehash. The exact launch proof ties this sidecar to that earlier verification. Final runtime binding and the parent's compiler check remain pending.

## Minimal callable contract

`scanPrivacyLogs(input)` in `privacy-log-scan-v1.ts` returns a readonly array with exactly these fields per file: `filename`, `bytes`, `sha256`, `canaryCounts`, and `complete`. Counts are keyed by `fullName`, `birthDate`, `medicalDiagnosis` and `secret`; canary values, log excerpts, raw logs, PINs and tokens are never returned. The four byte literals are the unchanged synthetic values in frozen `Q-RAG-08-26`, from `qa/rag/clock-binding-v1.1/derived/fault-cases.v1.json`, SHA-256 `51c0cf09a08cf53188f9e93761f6feb5ffaf19c4be0f9225c4015dc24cb2af62`.

Required input:

| Field | Meaning |
| --- | --- |
| `allowedRoot` | Absolute finalized attempt directory within this C3 candidate's evidence root |
| `binding.candidateId`, `.attempt`, `.processRole`, `.pid` | Explicit issued identity and producing process; role is `production-http-app` or separately labelled `module-process` |
| `binding.launchEvidence`, `.closureEvidence` | `{ path, sha256 }` for the exact sanitized launch and closure artifacts |
| `producer` | `{ closed: true, closedAt: <actual UTC>, logsStable: true }`, asserted only after the producer has exited and stopped writing |
| `files` | Exactly one stdout and one stderr entry, each with absolute `path`, `stream`, and optional `expectedSha256` |
| `maxBytesPerFile` | Optional explicit bound; defaults to 16 MiB and cannot exceed 64 MiB |

For `production-http-app`, the allowed root basename must be `<attempt>-launch`; the proof filenames are `launch-binding.json` and `cleanup.json` directly beneath it. The scanner checks their supplied SHA-256 values and C3 candidate/attempt identity, checks `binding.manifestHash`, matches `application.pid`, and requires successful `owned-application` cleanup with no failed cleanup entries. Only `private/application.stdout.log` and `private/application.stderr.log` are accepted.

For the separately labelled callable-only `module-process` role, the root basename must equal `<attempt>`; proof filenames are `attempt-start.json` and `attempt-end.json`. The scanner binds the start `pid`, manifest hash and both candidate IDs. Only `private/module.stdout.log` and `private/module.stderr.log` are accepted. Existing module `attempt-end.json` is written before the OS process necessarily exits: it is not independently sufficient evidence of process closure. The caller must await actual process exit before asserting `producer.closed`. The module entry does not create these private log files; missing files remain incomplete until an explicitly bound external process owner has captured them. The new CLI deliberately supports only production HTTP logs.

The scanner canonicalizes the evidence/allowed roots, checks every descendant path component, rejects symlinks, foreign paths, nonregular files and hard-linked files, and opens files with `O_NOFOLLOW`. It performs two bounded full reads and compares SHA-256 plus device/inode/size/mtime/ctime/link-count observations before, between and after the reads, including the final path identity. Proof artifacts receive the same stability treatment with a 1 MiB bound and are verified again after the log reads. It does not mutate or repair unstable artifacts.

If a log is missing, exceeds the bound, grows, changes, is replaced, or disagrees with an optional expected hash, the result is `complete: false` with null counts and hash. It never silently truncates and calls the remaining prefix clean. Invalid provenance/path/closure proofs throw a typed failure. A complete empty file has zero counts but proves only that this particular file was empty. The exact canaries are ASCII UTF-8 byte sequences; counting against the complete bounded byte buffer cannot lose a match at a read-chunk or UTF-8 decoder boundary. Encoded, transformed or obfuscated values are outside this literal-count result.

The entry persists the supplied binding and assertions with the returned result. Callable-only consumers retain that same responsibility. Do not print exception stacks or private buffers. A completed scan with a positive count identifies canary bytes in genuine process output; `complete` itself is a coverage flag, not a PASS verdict. Zero counts cannot establish that the intended canary challenge actually reached the relevant runtime path.

## Existing evidence locations and safe scope

Let `E` be the full C3 evidence root:

`/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/rag/candidate-1a7c95cd`.

The C3 launcher derives these paths without needing another logger:

| Surface | Existing path contract |
| --- | --- |
| Actual Next application stdout/stderr | `E/<attempt>-launch/private/application.stdout.log`, `application.stderr.log` |
| Migration/seeding output | Same directory, `migrate.stdout.log`, `migrate.stderr.log`, `seed.stdout.log`, `seed.stderr.log`; separate preparation output, not Q26 runtime-log coverage |
| Generation request/response bytes | `E/<attempt>-capture/private-capture/<captureId>.request.bin` and `.response.bin` |
| Per-call model metadata | `E/<attempt>-capture/<captureId>.metadata.json` |
| Proxy identity, source/config hashes, time range | `E/<attempt>-capture/proxy-manifest.json` |
| Aggregated captures and actual DB joins | `E/<attempt>/integration-model-captures.json`, `integration-capture-joins.json` |
| App launch/closure binding | `E/<attempt>-launch/launch-binding.json`, `cleanup.json` |

The app's stdout/stderr are opened with mode `0600` under a mode `0700` directory. Model payload files also use `0600` under `private-capture` mode `0700`. The proxy finalizer runs before the launcher stops the app; scan app logs only after launcher cleanup, so late process output is covered. No auth/PIN/token environment inspection is needed for this scanner. The privately preserved existing-provider command line and the SQLite DB are not log-scanner inputs.

## Reuse existing generation/client checks

The existing `model-capture-evidence.ts` already exports `bodyFacts(requestBuffer, responseBuffer)`. It detects the same four exact canaries, flags sensitive fields, validates the reviewed-option user-envelope shape and reports only redacted findings plus safe identity/size-related facts. Reuse this pure function for model-envelope analysis instead of adding a second generation parser. Its `redactedFindings` combine request and response observations; an empty result applies only to the actual supplied, complete bytes. Missing or credential-withheld payloads, compressed/unparseable responses, byte-limit/deadline failures or incomplete captures must retain an incomplete scope.

`http-capture-joins.ts` already exports `completionIdentity` and `joinModelCaptures`. It joins a single actual `providerCallId` and `providerMessageSha256` to the recorded generation `callId` and `responseHash`, checks model, time interval, complete forwarding and run/guidance/worker/profile lineage. Accepted completions are top-level in generation detail JSON; fallback completions are nested under `completion`. The whole-wire `responseSha256` is a different hash and must never substitute for the exact `choices[0].message.content` hash. A fallback wire completion is transport evidence, not an accepted supplement.

`http-canary.ts` already reads the frozen case, challenges both malformed and otherwise functional profiles, and checks selected response/snapshot/SSE/DB projections. Its `clean` helper is local rather than exported; do not copy it into a second all-artifact directory scan. Important input/output separation:

- `canary-<mode>-malformed.json` deliberately contains the canaries in `frozen.injection.syntheticCanaries` and `request.profile`. Those are intentional QA input, not a leak. Its response, snapshots and DB projections are output observations.
- `canary-<mode>-valid-request-response.json` deliberately contains canaries under `request.profile`; inspect `response.rawResponse` for product output instead of scanning the entire file.
- `canary-<mode>-continuation-initial.json`, `-continuation-final.json` and `-sse.json` hold actual continuation/client/DB projections. Existing checks select those outputs and target post-profile guidance/generation IDs.
- Source fixtures, the scanner source, request manifests and frozen-case copies are expected to contain the synthetic input literals. Never include them in a log-file glob. Conversely, those literals appearing in the actual app stdout/stderr are a runtime log observation even if the app logged the intentionally supplied QA request.

The proposed scanner is deliberately restricted to the exact two process-log files, so it cannot confuse these intentional request artifacts with logging leaks.

## Source-only invocation gaps

`launch-http.ts` accepts only `--grant=W2 --attempt=<fresh-id>`. It enables `canaryProbe: true`, owns private stdout/stderr capture, and stops the app in its final cleanup. It has no automatic post-close scan hook. Invoke the new sidecar only after that launcher has returned and its process has exited; `finalizeCapture` is too early because the app is still alive then.

`runIntegrationCli` requires injected credential/database/launch dependencies and accepts only grant, attempt and base URL flags. Its direct callers must set `canaryProbe: true` to run the existing canary controls and provide `finalizeCapture` to join actual generation wire observations. Both dependencies are optional in the lower-level API. The launcher supplies them; direct invocation without them cannot establish those surfaces. A functional canary profile rejected at the contract boundary cannot establish downstream challenge coverage merely through clean logs.

Existing integration output deliberately retains `case26FullVerdict: "NOT_RUN"` with missing application embedding/log surfaces. This sidecar does not edit that historical artifact. The parent must join its exact attempt/PID/proof binding with the actual continuation and generation capture joins in a separately versioned assessment. A component wrapper observing separately invoked actual E5 is still a different process from the production HTTP application.

## Separate actual E5 scope remains explicit

The HTTP production app constructs E5 internally. Its readiness artifact proves 18 indexed documents/chunks/FTS rows and actual pinned 384-dimensional vectors; stored vectors and retrieval traces do not reveal the complete strings passed into that process's `embed` calls. Scanning the HTTP app logs and generation wire traffic cannot close that missing input-capture surface.

The separate module stairs extension already exports `captureProviders` from `stairs-capture.ts`. Its delegating actual-provider wrapper captures embedding `input.texts` and LLM input/completion by phase and call index, without replacing the actual model. Its primary record is `E/<module-attempt>/stairs-extension/stairs/provider-calls.json`, with per-phase records under the same `stairs` directory and wire captures under `stairs-extension/capture/private-capture`. These are the module process and its supplied resident E5 instance, not the production Next process. The existing stairs scenario is not a private-profile canary challenge; absence of canaries there is vacuous evidence for Q26 unless a separately bound component challenge is actually performed.

No log scanner or hash join can promote that separate module observation into captured production-HTTP E5 inputs. Full Q-RAG-08-26 remains unproven while any required embedding/generation/log/client surface, actual challenge continuation or exact identity join is absent. The parent must retain these separate scope labels and historical `NOT_RUN` limitations unless a new, explicitly versioned evidence set resolves them.
