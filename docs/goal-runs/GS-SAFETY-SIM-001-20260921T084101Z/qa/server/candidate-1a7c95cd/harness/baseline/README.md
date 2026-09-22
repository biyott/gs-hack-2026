# Prepared original regression adapter — NOT_RUN

The four original C1 files `scenarios.test.ts`, `controls.test.ts`, `profile-region.test.ts` and `route-oracle.ts` are byte-for-byte QA copies. `ownership.test.ts` is the exact S18 prefix of the original `incidents.test.ts`; no assertions were edited. Original C1 files and evidence remain untouched.

The scenario lane retains all fourteen C1 JSON inputs and expected results under `inputs/scenarios/`, with expected file digests copied from the frozen C1 source manifest. At future execution, the adapter verifies those digests before parsing. Candidate map, equipment models and policies still come from the new receipt-bound product. Thus a producer scenario-oracle edit cannot silently relax the forty-two fresh-DB traces. This lane measures behavior on the original input set, not proof that any new published scenario is equivalent.

The helper changes only candidate binding, isolated DB/private credential ownership and evidence naming. UUID normalization and command identity behavior remain the original QA behavior. Every raw checkpoint capture receives a unique artifact name so failures and intermediate states remain available.

The historical C1 S20 same-process exact `{x,y}` checkpoint assertion is not silently rewritten or included in the S18 prefix. R07 retains the original S20 event inputs in two actual processes and adds the directed optional metadata expectations, both current-guidance projections, and unchanged old-refuge-closure control. Its original failure evidence remains under C1.

Selection after receipt and GO: `baseline/scenarios.test.ts` (fourteen cases, three fresh DBs each), `baseline/controls.test.ts`, `baseline/profile-region.test.ts`, and `baseline/ownership.test.ts`. Runtime, evaluation, catalog or route changes warrant this affected regression lane; the final receipt decides that selection.

Prepared only. No candidate import, parser invocation, DB creation, test or typecheck has occurred.
