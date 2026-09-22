# C2 ordering harness preparation — NOT_RUN

Owner: `/root/qa_lead/qa_server/ordering_execution`. These are preparation-only QA files. No candidate imports, hashes, typecheck, tests, runner execution, DB, app, browser, model or device operation has been performed for this port. Original C1 files remain unchanged. The large input ledger is referenced read-only, not copied or regenerated.

## Prepared entrypoints

Use `launch.mjs` with exactly one scope after explicit GO: `base`, `focused`, or `alerts`. The launcher checks `QA_C2_EXECUTION_GRANT` before dynamically importing a candidate-dependent runner. Direct runner invocation is not the supported entrypoint; static module loading would precede the runner's own receipt/grant checks.

- `base-runner.ts`: original1000, original10 labels×100, original independent controls and fixed injected UTC. `reject-invalid` permits null OR exact baseline; `samePrimary:null` remains unconstrained. A valid newer outer snapshot may be accepted while invalid inner guidance is quarantined. No retention-only failure is reintroduced.
- `focused-runner.ts`: original24 focused probes and expected JSON values. `focused-fixtures.ts` derives their unchanged fixture values from the original baseline instead of copying another large data file.
- `alert-runner.ts`: original10 logical-alert/route probes at indices1,2,5,7,8,11,12,15,17,18, with frozen expectations preserved as `diagnosticChecks`. Additive `normativeChecks` implement QA Lead's clarified rejection rule below. The real `[streamId,runId,connectionEpoch]` scope and per-case baseline are preserved. Generic announcement text is recorded, not asserted as prose.

## Alert interpretation bound by QA Lead

The original10 inputs and null/empty-route assertions remain unchanged diagnostics. For the six invalid incoming envelopes, the normative outcome permits worker guidance null OR the exact still-valid baseline. Routes may be empty OR the exact retained baseline route while it remains valid under accepted outer facts. No new announcement may result from any of the six invalid incoming envelopes; this assertion is independent of whether a valid baseline is retained.

`alert-oracle.ts` records independent eligibility facts for retained baseline run, mode, worker, map ID/version, floor, profile/version, expiry and matching nonclosed incident/current guidance. Route retention additionally requires known unchanged worker position and unchanged hazard, closure and equipment facts, plus the original movement fields. These checks establish the preserved identity/context of the synthetic route fixture; they do not certify graph or hazard geometry. Retention is optional, never required. Empty/null remains valid, and no QA fallback is inserted into product state.

Original version-only null/empty comparisons are reported under `diagnosticChecks`, `diagnosticMismatches`, `diagnosticWorkerProjectionMismatches` and `diagnosticRouteProjectionMismatches`. They do not decide the product verdict or process exit. `normativeChecks` exclusively decide each result's verdict and failure totals. A valid retained baseline that differs from the raw null/empty diagnostic is not classified as a product failure. The four valid/duplicate controls retain their original expected outcomes.

## Shared parent binding

Parent-owned `bind.mjs` will create the receipt and tsconfig, not invoke these runners during preparation.

Required environment: `QA_CANDIDATE_ROOT`, `QA_EVIDENCE_DIR`, `QA_BINDING_RECEIPT_PATH`, `QA_C2_ATTEMPT`, and, only upon GO, nonempty `QA_C2_EXECUTION_GRANT`. Attempt must be a single directory name of1–64 ASCII letters/digits/dot/underscore/hyphen, beginning with a letter or digit.

Receipt fields: `runRoot`, `candidateRoot`, `manifestPath`, `manifestSha256`, `candidateId`, `sourceSha256`, `head`, `buildId`, `evidenceRoot`, `boundAt`, `grantId`. `runRoot` must be absolute and identify goal run `GS-SAFETY-SIM-001-20260921T084101Z`; immutable original input roots derive exclusively from that field, never from the copied harness location. A null receipt grant does not authorize execution; the explicit environment grant is still required. A non-null receipt grant must equal that environment value. `QA_EVIDENCE_DIR` must equal the receipt's `evidenceRoot` and remain outside both candidate root and original C1 artifact directories. Future results go under `evidenceRoot/QA_C2_ATTEMPT/`, created only during authorized output writing. Output files use exclusive creation and distinct names.

Grant values are not copied into result evidence; only presence is recorded. Whole-object oracle comparisons normalize object key order while preserving arrays and all values. This avoids the earlier QA key-insertion-order defect without altering an expected input, permitting a new value, or changing null/baseline semantics.

Aliases must resolve: `@candidate/*` → candidate `src/*`; `@contracts` → candidate `packages/contracts/src/index.ts`; candidate dependencies' `@/contracts`, `@gs-safety/contracts`, and `@/*` per shared binding; bare `zod` → candidate `node_modules/zod/index.js`.

`candidate-bindings.ts` is the single named source-binding surface. Provisional exports pending receipt: store `useConsoleStore`; snapshot `evaluateSnapshot`; alert `AlertLedger`/`alertObservations`; worker `currentWorkerGuidance`/`samePrimaryGuidance`/`responseGuidanceVersion`; scene `visibleRoutes`; contract `SimulationWireSnapshotSchema`/`MapSchema` and corresponding types. No old candidate source directory is hardcoded. The C1 directory name appears only in immutable input provenance paths.

The shared parent binding owns full candidate/source/build integrity verification before and after authorized execution. This port only records the validated receipt and detects receipt changes; it must not be described as independently verifying candidate files. Immutable input hashing exists as future guarded runner behavior but was not performed during preparation.

## Immutable input references

Paths derive from the validated receipt's absolute `runRoot`, irrespective of the depth at which the harness is copied:

- `evidence/qa/server/candidate-70da1337/ordering/input-ledger-v1.json`; previously recorded SHA `4f86a9a6bf723a2cdc83f4ab9c593388086d7675ddaa17550f39dfb98a0fa772`.
- `qa/server/candidate-70da1337/ordering/focused-inputs-v1.json`; previously recorded SHA `c9f936cd19a820c96f95530ad4ba7f78bff529b891e3b688691d4d20761a313c`.
- `qa/server/candidate-70da1337/ordering/alert-extension-inputs-v1.json`; previously recorded SHA `d33531206dce8af92d2b3c6d92d6eb9b8a7498abeaf5614a485fc4b36c04e4b7`.

These are historical constants, not newly computed hashes. New result candidate identity comes only from the future receipt; C1 identity is not inherited as C2 identity. The immutable injected UTC remains a pure-consumer fixture value, distinct from actual future execution timestamps. No expired-wall-clock live integration claim is made.

## Remaining binding/validation gaps

1. Future receipt, GO grant, candidate aliases, output path and parent before/after integrity evidence are not yet supplied.
2. Named exports/signatures, notably alert observations and current-route/worker projections, require source binding against that receipt. Do not substitute a producer test helper or a QA filter if a production export moved.
3. No compile or runtime validation was permitted. After GO, run the isolated typecheck and preserve any preparation defects separately from product failures. Focused fixture derivation remains text-reviewed only.
4. QA Lead has bound the alert projection interpretation: the original null/empty comparisons remain diagnostic, while valid baseline retention is permitted normatively. Candidate-dependent export signatures and the preparation-only eligibility implementation still require validation after GO; no original input or raw assertion was edited.
5. Explicit pure projection clocks use the preserved original `context.now`. If new candidate store/alert guards read wall time internally, QA must bind that additional clock surface before execution; do not silently shift immutable ledger timestamps or call old timestamps a live integration.
6. Logical announcements and `visibleRoutes` are pure outputs. Actual UI, audio, vibration, network scheduling, server validation, persistence, route geometry and mobile behavior remain outside these runners.

Status: **PREPARED / NOT_RUN**. No result or acceptance verdict exists for the future candidate.
