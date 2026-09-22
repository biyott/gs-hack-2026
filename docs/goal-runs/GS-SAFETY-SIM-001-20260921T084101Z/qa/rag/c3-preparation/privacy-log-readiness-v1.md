# Privacy log scan v1 — unexecuted preparation

This is a new evidence-only companion to the preserved C2 harness. No C3 candidate is selected by this document. The scanner has not been executed, typechecked or tested, and the frozen C2 files/manifests were not edited. Inspection found only preparation artifacts under the C2 evidence directory; there are currently no C2 application logs or generation wire captures to classify as clean or leaking.

The scanner imports Node filesystem/crypto utilities and Zod only. It has no CLI, top-level invocation, product imports, model calls, database access, listener, polling or file writes. The parent owns execution permission, artifact publication and every case/overall verdict.

## Minimal callable contract

`scanPrivacyLogs(input)` in `privacy-log-scan-v1.ts` returns a readonly array with exactly these fields per file: `filename`, `bytes`, `sha256`, `canaryCounts`, and `complete`. Counts are keyed by `fullName`, `birthDate`, `medicalDiagnosis` and `secret`; canary values, log excerpts, raw logs, PINs and tokens are never returned. The four byte literals are the unchanged synthetic values in frozen `Q-RAG-08-26`, from `qa/rag/clock-binding-v1.1/derived/fault-cases.v1.json`, SHA-256 `51c0cf09a08cf53188f9e93761f6feb5ffaf19c4be0f9225c4015dc24cb2af62`.

Required input:

| Field | Meaning |
| --- | --- |
| `allowedRoot` | Absolute finalized attempt directory within this run's `evidence/qa/rag` tree |
| `binding.candidateId`, `.attempt`, `.processRole`, `.pid` | Explicit issued identity and producing process; role is `production-http-app` or separately labelled `module-process` |
| `binding.launchEvidence`, `.closureEvidence` | `{ path, sha256 }` for the exact sanitized launch and closure artifacts |
| `producer` | `{ closed: true, closedAt: <actual UTC>, logsStable: true }`, asserted only after the producer has exited and stopped writing |
| `files` | Exactly one stdout and one stderr entry, each with absolute `path`, `stream`, and optional `expectedSha256` |
| `maxBytesPerFile` | Optional explicit bound; defaults to 16 MiB and cannot exceed 64 MiB |

For `production-http-app`, the allowed root basename must be `<attempt>-launch`; the proof filenames are `launch-binding.json` and `cleanup.json` directly beneath it. The scanner checks their supplied SHA-256 values and candidate/attempt identity, matches `application.pid`, and requires successful `owned-application` cleanup. Only `private/application.stdout.log` and `private/application.stderr.log` are accepted.

For `module-process`, the root basename must equal `<attempt>`; proof filenames are `attempt-start.json` and `attempt-end.json`. The scanner binds the start `pid` and both candidate IDs. Only `private/module.stdout.log` and `private/module.stderr.log` are accepted. Existing module `attempt-end.json` is written before the OS process necessarily exits: it is not independently sufficient evidence of process closure. The caller must await actual process exit before asserting `producer.closed`. The frozen module entry does not create these private log files; missing files remain incomplete until an explicitly bound external process owner has captured them.

The scanner canonicalizes the evidence/allowed roots, checks every descendant path component, rejects symlinks, foreign paths, nonregular files and hard-linked files, and opens files with `O_NOFOLLOW`. It performs two bounded full reads and compares SHA-256 plus device/inode/size/mtime/ctime/link-count observations before, between and after the reads, including the final path identity. Proof artifacts receive the same stability treatment with a 1 MiB bound and are verified again after the log reads. It does not mutate or repair unstable artifacts.

If a log is missing, exceeds the bound, grows, changes, is replaced, or disagrees with an optional expected hash, the result is `complete: false` with null counts and hash. It never silently truncates and calls the remaining prefix clean. Invalid provenance/path/closure proofs throw a typed failure. A complete empty file has zero counts but proves only that this particular file was empty. The exact canaries are ASCII UTF-8 byte sequences; counting against the complete bounded byte buffer cannot lose a match at a read-chunk or UTF-8 decoder boundary. Encoded, transformed or obfuscated values are outside this literal-count result.

Persist the supplied binding and assertions beside the returned result under the parent's new versioned evidence location. Do not print exception stacks or private buffers. A completed scan with a positive count identifies canary bytes in genuine process output; `complete` itself is a coverage flag, not a PASS verdict. Zero counts cannot establish that the intended canary challenge actually reached the relevant runtime path.

## Existing evidence locations and safe scope

Let `E` be the full C2 evidence root:

`/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/rag/candidate-0d42bacc`.

The frozen launcher derives these paths without needing another logger:

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

The preserved C2 `model-capture-evidence.ts` already exports `bodyFacts(requestBuffer, responseBuffer)`. It detects the same four exact canaries, flags sensitive fields, validates the reviewed-option user-envelope shape and reports only redacted findings plus safe identity/size-related facts. Reuse this pure function for model-envelope analysis instead of adding a second generation parser. Its `redactedFindings` combine request and response observations; an empty result applies only to the actual supplied, complete bytes. Missing or credential-withheld payloads, compressed/unparseable responses, byte-limit/deadline failures or incomplete captures must retain an incomplete scope.

`http-capture-joins.ts` already exports `completionIdentity` and `joinModelCaptures`. It joins a single actual `providerCallId` and `providerMessageSha256` to the recorded generation `callId` and `responseHash`, checks model, time interval, complete forwarding and run/guidance/worker/profile lineage. Accepted completions are top-level in generation detail JSON; fallback completions are nested under `completion`. The whole-wire `responseSha256` is a different hash and must never substitute for the exact `choices[0].message.content` hash. A fallback wire completion is transport evidence, not an accepted supplement.

`http-canary.ts` already reads the frozen case, challenges both malformed and otherwise functional profiles, and checks selected response/snapshot/SSE/DB projections. Its `clean` helper is local rather than exported; do not copy it into a second all-artifact directory scan. Important input/output separation:

- `canary-<mode>-malformed.json` deliberately contains the canaries in `frozen.injection.syntheticCanaries` and `request.profile`. Those are intentional QA input, not a leak. Its response, snapshots and DB projections are output observations.
- `canary-<mode>-valid-request-response.json` deliberately contains canaries under `request.profile`; inspect `response.rawResponse` for product output instead of scanning the entire file.
- `canary-<mode>-continuation-initial.json`, `-continuation-final.json` and `-sse.json` hold actual continuation/client/DB projections. Existing checks select those outputs and target post-profile guidance/generation IDs.
- Source fixtures, the scanner source, request manifests and frozen-case copies are expected to contain the synthetic input literals. Never include them in a log-file glob. Conversely, those literals appearing in the actual app stdout/stderr are a runtime log observation even if the app logged the intentionally supplied QA request.

The proposed scanner is deliberately restricted to the exact two process-log files, so it cannot confuse these intentional request artifacts with logging leaks.

## Separate actual E5 scope remains explicit

The HTTP production app constructs E5 internally. Its readiness artifact proves 18 indexed documents/chunks/FTS rows and actual pinned 384-dimensional vectors; stored vectors and retrieval traces do not reveal the complete strings passed into that process's `embed` calls. Scanning the HTTP app logs and generation wire traffic cannot close that missing input-capture surface.

The separate module stairs extension already exports `captureProviders` from `stairs-capture.ts`. Its delegating actual-provider wrapper captures embedding `input.texts` and LLM input/completion by phase and call index, without replacing the actual model. Its primary record is `E/<module-attempt>/stairs-extension/stairs/provider-calls.json`, with per-phase records under the same `stairs` directory and wire captures under `stairs-extension/capture/private-capture`. These are the module process and its supplied resident E5 instance, not the production Next process. The existing stairs scenario is not a private-profile canary challenge; absence of canaries there is vacuous evidence for Q26 unless a separately bound component challenge is actually performed.

No log scanner or hash join can promote that separate module observation into captured production-HTTP E5 inputs. Full Q-RAG-08-26 remains unproven while any required embedding/generation/log/client surface, actual challenge continuation or exact identity join is absent. The parent must retain these separate scope labels and the frozen C2 case's `NOT_RUN` limitation unless a new, explicitly versioned evidence set resolves them.
