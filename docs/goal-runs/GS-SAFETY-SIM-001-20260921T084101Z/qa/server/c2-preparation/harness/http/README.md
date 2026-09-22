# C2 HTTP/restart preparation

Prepared only. No execution, typecheck, product import, database creation, network request, model request, or process start is claimed. C1 files and evidence remain unchanged. The parent may statically parse these files without executing them.

This directory owns one fresh production HTTP database and the exact Next process it spawns on 4101. It never uses the constructor lane's database or fixture. It does not start, restart, stop, or signal the existing provider on 8092. No browser, device, camera acquisition, microphone, speaker, Blender, or physical ranging is involved.

## Required binding and authorization

The parent's bind utility must copy this template to a new C2 harness directory, bind the issued receipt, generate strict TypeScript aliases (`@contracts` and candidate aliases), and link the selected candidate's dependencies. The receipt identifies `candidateRoot`, `manifestPath`, `manifestSha256`, `candidateId`, `sourceSha256`, `head`, `buildId`, `evidenceRoot`, and `harnessRoot`. C1's candidate ID is rejected. Manifest and every listed source/build artifact are checked before and after the future run.

Execution requires all of these explicit environment inputs:

- `QA_BINDING_RECEIPT_PATH`: absolute fixed C2 binding JSON.
- `QA_CANDIDATE_ROOT` and `QA_EVIDENCE_DIR`: exact receipt values.
- `QA_C2_EXECUTION_GRANT`: QA Lead's actual W1 grant ID; preparation is not a grant.
- `QA_C2_ATTEMPT`: new HTTP-only label. Its direct child of `evidenceRoot` must not exist.
- `QA_C2_PRIVATE_DIR`: new, nonexistent absolute HTTP-only directory outside candidate and public evidence. Setup creates it as 0700 and stores fresh random PIN, process environment, tokens, and original subprocess logs as 0600. Do not reuse the constructor runner's directory.
- `QA_HTTP_RUNTIME_CONFIG_PATH`: explicit nonsecret configuration based on the issued C2 launch/model receipt. Copy the example into the future bound directory and replace every placeholder plus provider PID. Node version, 4101 app port, 8092 provider port, and the original 5000 ms RAG timeout are checked. No private C1 environment, credentials, or implicit shell RAG settings are copied.

The prepared example intentionally cannot execute: provider PID 0 and placeholder model fields need binding. Runtime refuses candidate `.env`, `.env.local`, `.env.production`, or `.env.production.local` so Next or the migration command cannot silently add private or unrecorded settings. A candidate with such a file needs an explicit launch disposition before execution; do not edit the frozen package or weaken this check silently.

The Node-only controller authorizes before invoking product code. TypeScript entrypoints load the shared grant guard before dynamically importing contract/QA modules. Aliases and installed `tsx`, `sharp`, `zod`, and `better-sqlite3` remain binding requirements. Pinned Node/npm/tsx follows the issued launch recipe; no dependency installation or compilation is performed by the controller.

## Future command sequence

Only after the receipt, explicit runtime configuration, and W1 GO are supplied, invoke the pinned Node executable on the bound `http/run.mjs`, with exactly one selection: `all`, `security`, or `restart`. All selections migrate and seed a new isolated database using the original production commands, then start production Next from the selected candidate with `--hostname 0.0.0.0 --port 4101`. No build, dev server, broad smoke driver, or RAG verifier runs.

`all` runs security, preserves any observed failures, then prepares and observes the original two-restart fixture. `security` and `restart` use separate fresh attempts if invoked independently. All original subprocess stdout/stderr remain in the private directory; public logs redact known PIN/token values. HTTP records include sanitized JSON, exact response byte counts, binary hashes, identities, and actual UTC. Every evidence artifact is written exclusively; no prior attempt is overwritten or deleted. Failed inputs and outputs must be classified before the one permitted environment retry or any authorized product rework.

The controller stops its owned process between phases and in normal/error cleanup. It verifies PID start ticks, working directory, database environment, and port ownership before signalling. If the controller itself is externally terminated, the independently guarded `http/stop.mjs` accepts the recorded process label (`initial`, `first`, or `second`) and signals only that receipt's unchanged 4101 process. It never escalates to SIGKILL or acts on the provider. Preserve every receipt and explicitly tell QA Lead when W1/model access is released; a completion JSON is not an automatic grant transfer.

## Prepared checks

The security lane retains the original synthetic admin WORKER-A 0.31 m / WORKER-B 0.77 m inputs, equipment 0.42 m input, fabricated UWB capabilities, and generated blank 16×16 white JPEG. The additional operator UWB/frame fixtures test the clarified permitted upload path. Contract 1.0.4 expectations are fixed independently of response contents:

| Surface | 200 | 403 | 401 |
| --- | --- | --- | --- |
| GET tracking | admin, operator, support, observer | worker, device | unauthenticated |
| GET frame, with synthetic frame present | admin, operator, observer | support, worker, device | unauthenticated |

Both concrete device accounts and both worker accounts are included. Equipment UWB and CCTV frame POSTs must return 204 with **exactly zero bytes**; admin/operator synthetic POSTs must return 200 with a valid tracking snapshot. Empty bodies are never parsed as JSON. Own-worker simulation projection and fresh nine-account/database checks remain separate. Error responses and denied roles do not count as successful projection checks. Product role labels such as `live` cannot establish physical ranging from these fabricated inputs.

The restart lane preserves the C1 sequence: FG-FIRE, seed 20260921, speed 0.001, start, advance 1000000 ms, then the original 6500 ms allowance for ordinary RAG completion/fallback. This fixed delay is retained input, not a latency threshold or deterministic virtual-time claim. WORKER-A must have a current pending primary, running state, and null stop marker in current and persisted state before shutdown.

The controller stops the first actual Next process, starts a new process on the same DB, performs only an authenticated GET snapshot and read-only SQLite query, stops it, and starts a third process for the second observation. Sessions survive via the private file; there is no login, pause, callback, command, fixture reset, or unrelated mutation between the two recoveries. Normal background initialization remains enabled and is not replaced by a mock.

After each restart, separate assertions verify paused current state with the same primary and a non-null stop marker, then persisted paused state with that same marker. The second observation additionally compares both current and persisted markers with the first observation. Raw latest `run_snapshots` rows are saved before assertions, so a failure remains available when the second restart continues. A failed preparation precondition blocks downstream interpretation instead of changing the fixture. This is server-state evidence only; it proves no device cancellation acknowledgement or physical silence.

Broader S19 incident/profile/pose lifecycle, CAS fault injection, legacy import, S20, and constructor tests belong to the parent's other cards/lanes. This bounded harness does not imply coverage of those cases or an overall verdict.
