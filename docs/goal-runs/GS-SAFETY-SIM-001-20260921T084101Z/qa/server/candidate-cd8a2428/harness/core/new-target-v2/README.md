# New-target oracle v2 — preparation only

Status: FROZEN_PREPARATION_NOT_RUN after the accompanying freeze receipt is written. This is a versioned derivative of the C2 additive new-target case, authorized by `../new-target-oracle-disposition-v1.md`. It is not a C3 execution result. No C3 candidate receipt or execution grant exists for this preparation. Type resolution, typechecking and execution remain pending.

The preserved C2 test, scenario source, first failure log, rerouted artifact and failure artifact are byte copies under `preserved/`. Their original FAIL plus two bail-skipped repetitions remain unchanged. The separate original G0, S20 no-closure and D1 closure inputs and expectations remain unchanged and require their own later candidate-bound reruns; this derivative does not replace them.

## Input and expected behavior

`inputs/fixture-v2.json` retains the C2 scenario, all eight ordered events, seed, profiles, initial equipment, and the exact 9.5-second admin control. Its operations replay select/start, 4s, 8s, 9s, 9.5s, admin control, 10s and 10.5s. The original 11s event remains in the scenario but this case stops at 10.5s, as the C2 test intended. The C2 worker-arrival rejection probe followed the failed coordinate-only negative assertion and never executed. V2 explicitly removes that oracle-dependent response probe and sends zero worker responses. No scenario/control operation or event timestamp was changed.

Literal boundaries remain REFUGE-01 route at 4s, REFUGE-02 route at 8s, arrival at REFUGE-02 at 9s, and a new REFUGE-01 route and full target metadata after admin control at 9.5s. At 10s/10.5s, coordinates alone do not determine the selected target. Every later confirmation must bind a preceding fresh, independently valid route in the same run/incident/worker/map/profile lineage. A new route can reselect a formerly used refuge only after those checks. No particular action or destination is assumed at 10.5s.

`route-oracle.ts` independently checks frozen graph connectivity, corridor geometry, allowed destinations, closures, profile access, obstacles, hazard intersections and explicitly permitted initial egress without reentry. It does not import a production route evaluator. Hazard polygons are observed product state, not independently regenerated equipment geometry; the broader geometry/sensor/profile matrix belongs to baseline/W3. `inputs/site-map.json` and `inputs/equipment-policy.json` freeze the relevant C2 reference inputs; a future candidate must match the declared map subset and full equipment policy, or require an explicit fixture disposition.

`trace-oracle.ts` binds each checkpoint to its exact persisted run version, checks increasing run/guidance versions, worker/incident agreement, immutable profile identity, and current target/intent against the latest independently accepted route. Target metadata is persistent latest-route state: raw checkpoint, live runtime and reserialized checkpoint must agree, including floor/node metadata. It may change only with a newly validated route. Every movement route has a positive route version; changed consecutive movement routes advance it. The published contract requires route dependency freshness but does not specify monotonicity across intervening route-less guidance, so no across-null rule is added. First guidance and prior history remain immutable. Evaluation must write no response receipt, response audit, or acknowledgement/arrival timestamp.

## Clock meaning

Scenario epoch is `2026-09-21T09:00:00Z`; injected Date and guidance time are fixed at `2026-09-21T09:30:00.000Z`. Scenario virtual milliseconds advance through explicit commands. Actual UTC is captured separately with the parent's real-clock helper. Preserved C2 envelopes retain their original `virtualClock` field unchanged even though that legacy label is misleading. New observation payloads spell out all three clock meanings.

## Future binding requirements

The parent must verify a new C3 candidate receipt and execution grant before loading Vitest or any product modules. Static imports in this prepared test are not a pre-import authorization gate. `freeze-guard.ts` is a supplementary guard: it rejects the prior C1/C2 candidate IDs and W1-C2-01 grant, requires receipt fields, and verifies all files against `freeze-v2.json`. The parent must bind the approved manifest SHA-256 through `QA_NEW_TARGET_V2_FREEZE_SHA256`; the digest is in the separate preparation freeze receipt.

Resolve `@candidate/*` to the newly bound candidate's `src/*`, `@contracts` to its public contract module, and `@qa-c3/{binding,fixture,evidence}` to the parent's C3-owned helpers. Expected helper interfaces match the prior QA harness:

- `binding`: candidateId/sourceSha256/head/buildId; `grantId`; `actualUtc()` using the real clock.
- `fixture`: `configuration`; `makeFixture(name, 'equipment', configuration)` with fresh isolated SQLite, constructor runtime without scheduler start, auto-version/request-ID admin `command(input)`, repository/history/runtimeState, `dbPath`, and `close()`.
- `evidence`: `save(name,value)` with complete new-candidate stamp and secret redaction; `latestRows(database,runId)` including raw runtime checkpoints and response receipts; independent JSON-only `checkpointTarget(rawJson,workerId)`.

Run strict typechecking only after a separate grant permits it. Then select only `new-target-v2.test.ts` in the parent's granted run wrapper, with three fresh repetitions, fail-fast retention, and a new attempt directory. Preserve first failures and all later attempts. Do not infer a pass from syntax parsing or reuse any C2 execution receipt as a C3 result.

## Preparation validation and limits

Only source inspection and TypeScript syntax parsing are authorized now. Parsing uses the installed Babel parser's TypeScript syntax plugin without module resolution, imports of the prepared files, semantic checks, tests, databases or runtime construction. Two attempts to load the former TypeScript compiler JavaScript parser failed before parsing because installed TypeScript 7 no longer contains that file; both environment failures are retained. The new syntax receipt and freeze receipt live in the matching evidence preparation directory and are distinct from prior C2 receipts. All authored TypeScript files remain below 200 nonblank/noncomment lines and have separate input, authorization, geometry, trace or replay responsibilities. Unknown JSON is parsed at its boundary; no type assertion escape hatches are used.

The future C3 API/alias resolution, exact zero-length-at-destination routing behavior, and the 10.5s conditional outcome remain untested. This case provides a route-safety oracle against reported hazard polygons; independent hazard-generation correctness is outside its bounded scope. There is no AC verdict in this package.
