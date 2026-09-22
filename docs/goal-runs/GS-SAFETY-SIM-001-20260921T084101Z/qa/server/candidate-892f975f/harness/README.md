# C2 server harness preparation — NOT_RUN

This directory is a QA-owned template, not a bound candidate or test result. No C2 execution grant has been received. Preparing a script or receiving a manifest does not authorize starting it. Product files, original C1 harnesses/evidence, original S20/1000/voice inputs and earlier failures remain unchanged.

## Prepared lanes

| Lane | Prepared coverage | Future execution boundary |
| --- | --- | --- |
| `voice/` | R01–R06: original pending/playing recovery; repeated no-op reopen; optional exact target metadata; private legacy/invalid checkpoint shapes; real competing pause/reset/resume CAS; unchanged-head conflict; actual SQLite transaction rollback; terminal/history/idempotency | Production constructors, real isolated SQLite, no scheduler or model. Separate synthetic fault controls are labelled. |
| `core/` | R07: original S20 in two OS processes; worker and incident current guidance; current response versus immutable arrival receipt; exact latest target metadata; additive return; unchanged old-refuge-closure control; genuinely blocked latest-target control | Two explicit Vitest child runs, same QA DB/private credentials. Positive/negative closure controls do not insert clear/reopen. |
| `baseline/` | Original fourteen scenarios × three fresh DBs, controls, profiles, independent route oracle and S18 ownership | Frozen C1 scenario inputs/expected results; new candidate map/equipment/policies. No producer test PASS is reused. |
| `ordering/` | Original 1000 ledger, 24 focused temporal cases, 10 logical alert probes | Pure consumers; no app/model/physical audio. Original null-only diagnostics and normative quarantine/announcement outcomes are reported separately. |
| `http/` | Actual production migration/seed, role access, device 204/zero-byte acknowledgements, synthetic-only frame/range fixtures, actual Next double restart and durable response/checkpoint joins | Fresh DB and credentials; only owned4101 process; exclusive8092 initialization/inference grant; never signal provider. |

Read each lane's README for precise inputs, assertions and remaining limits. Physical silence, target-device receipt and actual audio remain cross-slice observations; SSE subscriber counts are not device acknowledgement.

## Binding after a fixed receipt

`bind.mjs` accepts explicit paired arguments: `--candidate-root`, `--manifest`, `--manifest-sha256`, `--candidate-id`, `--source-sha256`, `--head`, `--build-id`, `--output-dir`, `--evidence-root`. Paths must be absolute, with a new output under this run's `qa/server/` and new evidence under `evidence/qa/server/`. C1 destinations and template-nested outputs are rejected.

It verifies supplied manifest identity, required source entries and BUILD_ID, copies this template into a new immutable binding directory, links that candidate's dependencies, and creates `binding.json`, `tsconfig.json` and a one-worker Vitest config. It does not import product modules, run tests or create a DB. It must not be invoked against an evolving root. Full candidate source/build integrity is checked at authorized execution; a successful binding alone is not G3 acceptance.

Required future execution environment:

- `QA_C2_EXECUTION_GRANT`: explicit current QA Lead resource grant identifier.
- `QA_BINDING_RECEIPT_PATH`: absolute generated binding receipt.
- `QA_CANDIDATE_ROOT`, `QA_EVIDENCE_DIR`: exactly the receipt paths.
- `QA_C2_ATTEMPT`: unique safe leaf per invocation; previous attempts are never overwritten.
- `QA_C2_PRIVATE_DIR`: absolute private credential directory outside candidate/public evidence. Constructor phase1/phase2 reuse the same private directory; HTTP requires a different fresh private directory.
- `QA_R07_PHASE1_FILE`: phase2 only, exact successful phase1 handoff artifact; candidate stamp and exited phase1 PID are checked.
- `QA_HTTP_RUNTIME_CONFIG_PATH`: HTTP only, explicit candidate launch/model settings from the final runbook/resource grant. Its template is not a grant or a live configuration.

For constructor lanes, `run.mjs <absolute-binding.json> <unique-attempt> <explicit-test-file...>` invokes `/home/b/.local/bin/node` and the bound candidate's Vitest. File filters must begin `voice/`, `core/` or `baseline/`; there is no default all-tests run. Separate R07 phase invocations preserve the OS boundary. The runner records command/PID/times and before/after source/build digests. No automatic retry exists.

Ordering uses its explicit `base`, `focused` or `alerts` launch selection. HTTP uses `all`, `security` or `restart`. The future executor must preserve failed stdout/JSON/DBs, classify harness/environment issues separately, report actionable product failures promptly, and obey the existing rework limits. A QD004-D1 failure returns for exact cause/options/decision; the harness cannot authorize another product iteration.

## Receipt-time checks still required

Confirm final changed-source inventory, shared contract freeze, manifest schema and source paths, Node/Vitest/tsx/native-SQLite/sharp dependency availability, aliases and exported signatures. Run the bound QA typecheck only after execution is authorized; source parsing is not type validation. If a helper's import signature changed, adapt the identity/import seam and record it; do not change frozen input or expected behavior to fit the implementation.

Confirm the HTTP model config/provider PID, free4101, fresh evidence/private paths, no conflicting8092 consumer, and final launch instructions. During the planned45-minute W1, checkpoint after initial identity/setup, constructor results, HTTP first launch, double restart, and release. Stop only the exact owned4101 PID and explicitly release the model window. Preserve all DBs.

Prepared work does not imply any subcase PASS, release acceptance, audio/device result or whole-goal verdict.
