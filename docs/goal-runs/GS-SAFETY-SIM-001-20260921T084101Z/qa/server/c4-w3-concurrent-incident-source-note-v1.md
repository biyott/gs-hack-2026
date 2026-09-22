# C4 W3 concurrent-incident source support

Read-only preparation for QA Lead and Q-UI-DEVICE. Candidate `sha256:cd8a2428d3d9e44703c25b4ae135f0ed5821b6b3b3794bbca6abc1ec37197eba`, root `/home/b/.cache/gs-safety-c4.q2FD40`, source `e17322b2faf5b5181f6a50bcd5cd4baeae2ca31f57f7bfd1653399b4e9e28efa`. No candidate imports, runtime, tests, database writes, model calls or UI interactions were performed for this note. Proposed fixture behavior is not an execution result.

## Existing public seeded surface

No existing seeded scenario supplies a later new independent hazard while an earlier one remains active. A read-only inventory of all fourteen JSON scenarios found: FG-COMBINED creates FIRE-ZONE-B and GAS-ZONE-B together at 1000ms; FG-FIRE and FG-ROUTE-BLOCK later upsert the same FIRE-ZONE-B identity; the other fire/gas scenarios contain one hazard identity. FG-CLEAR-REOPEN clears that one hazard at 12000ms and reopens PATH-B at 20000ms. Equipment scenarios have no fire/gas hazard events.

Equipment controls do not solve this sequence. `src/server/simulation/commands.ts:122-184` rejects equipment/preset controls in fire-gas mode, while `incident-scope.ts:3-9` normalizes every EQUIPMENT-A hazard variant to the same incident signal. Scenario schemas also prohibit mixing equipment and fire/gas event/state families (`src/server/scenarios/schema.ts:97-122`). Selecting another scenario replaces the current run rather than adding a hazard (`runtime.ts:187-214`).

The public incident action endpoint operates on existing incident identities; it does not inject hazards. Public measured-position input changes exposure, not the seeded hazard or explicit path-owner inventory. No calibrated measured-position sequence was constructed or executed here, and it is not a proven workaround for this combined UI/ownership requirement.

FG-COMBINED remains useful for simultaneous multi-hazard observations. It is not evidence of incident A being pinned before independent incident B arrives. Existing W1 S18 private owner fixtures are not public UI proof.

## Minimal declared constructor-fixture option

The production constructor accepts an explicit `SimulationConfiguration` (`runtime.ts:24-28,47-62`). A separate QA scenario can be appended to the loaded configuration without changing any candidate file, keeping required default EQ-APPROACH and FG-FIRE entries. Give it its own QA ID and `synthetic:true`; retain the original map, policies and worker profiles. Validate its schema/references when execution is authorized. This is the same configuration boundary used by existing QA constructor traces, not an HTTP scenario-upload feature.

The existing producer source `src/server/simulation/runtime-isolation.integration.test.ts:6-49` provides a concrete four-event reference:

| Virtual time | Declared fixture event | Intended observation |
| --- | --- | --- |
| 1000ms | Original FG-FIRE FIRE-ZONE-B upsert | A affects WORKER-A at (65,25); B does not yet exist. |
| 1500ms | Block PATH-B while only A is active | PATH-B has only A ownership. Pause here for a UI fixture to select/pin A. |
| 2000ms | Upsert FIRE-ZONE-C, zone ZONE-C, polygon (87,37),(94,37),(94,44),(87,44); include a connected matching fire sensor | Separate B affects WORKER-B at (90,40), while A remains. |
| 2500ms | Block PATH-C with both hazards active | PATH-C has shared A+B ownership. |

Constructor command sequence at speed1: select the declared QA scenario; start; advance1500; pause; observe/pin A in the explicitly declared UI fixture; resume; advance1000; pause; observe the new B and retained A. Each command uses the current version and a fresh requestId. A scheduler-free constructor does not race wall time while the operator pins A. The proposed scenario must not retain FG-FIRE's later unrelated expansion events or falsely retain its original expectedResults as the new fixture's oracle.

After both incidents exist: clear A; verify only A's hazard is inactive and both path restrictions remain; reopen A; verify PATH-B opens while PATH-C remains closed under B; close A separately; clear B, reopen B, close B separately. Join actual hazard/incident identities, closedEdgeIds through the frozen map's path membership, separate terminal timestamps/audits, and unchanged firstGuidance. This is a scoped A-only plus shared-owner control, not the original S18 three-path matrix.

The four-event source above is only a reference for feasibility. Its producer assertions are not independent QA results. The UI pin/focus behavior, actual snapshots and route exposure must still be observed if this fixture is authorized for W3.

## Ownership and HTTP limits

`run.ts:195-205` assigns every currently active hazard to every path in a route.block event. The event schema has pathIds but no explicit hazard-owner field (`src/server/scenarios/events.ts:34-43`). Thus blocking a new B-exclusive path after B arrives while A remains active produces A+B ownership, not B-only ownership. This is the exact limitation retained in W1 S18's scenario-only diagnostic. The proposed smaller control cannot be labelled a pass for PATH-A=A, PATH-B=B, PATH-C=A+B, and does not alter that frozen oracle.

`incident-workflow.ts:29-51` clears selected incident hazard IDs and releases only selected owner signals; `incident-scope.ts:26-36` opens a path only once no owners remain. `src/server/incidents/actions.ts:88-126` retains separate clear, reopen and close transitions.

The stock production HTTP service calls `loadConfiguration()` internally and starts its scheduler/RAG (`src/server/services/runtime.ts:15-25`). It has no public constructor-configuration upload command. Feeding this declared scenario to a constructor and then to a UI requires a separately identified QA fixture integration; it must not be reported as an unmodified C4 Next HTTP server accepting an ordinary public command sequence. No such UI transport adapter was implemented or run here, and no new endpoint or product change is proposed.

Disposition: seeded public staggered-incident sequence unavailable within the inspected scenarios/controls; declared constructor fixture is source-supported for a bounded separate observation, pending QA Lead's chosen W3 evidence boundary. No whole-criterion or overall verdict.
