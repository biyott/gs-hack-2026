# Deterministic simulation scenarios

All fourteen selectable fixtures are synthetic. Coordinates, sensor values, event timing, speed, policy parameters and expected outcomes are demo inputs. They are not observations from phones or actual industrial sensors. The `demo-index` unit and `DEMO-GAS-X` material never represent a real gas concentration or threshold.

Each JSON stores its ID/version, mode, map/version, initial positions and full profile snapshots, policy ID, virtual clock epoch, seed, duration, ordered events, expected checkpoints and requirement coverage. Initial coordinates follow source 008: equipment (30,25)m, WORKER-A (65,25)m and WORKER-B (90,40)m. All position sources are `mock`. WORKER-C appears only as an optional virtual unknown-profile fixture.

| ID | Sequence | Primary coverage |
| --- | --- | --- |
| EQ-APPROACH | Approach; worker moves onto a corridor | Equipment exposure and bilingual guidance |
| EQ-SPEED-DIRECTION | Speed increase; heading changes | Predicted geometry and route revalidation |
| EQ-PROFILE-ROUTES | Same-position profiles; stairs capability changes | Stairs exclusion, required assistance, unknown capability |
| EQ-NO-ROUTE | Equipment approaches while all paths close | Explicit no-route response with no invented destination |
| EQ-POSITION-LOSS | Worker disconnect; connected stale reading; recovery; equipment disconnect/stale/recovery | Position interruption and observation freshness |
| EQ-ARRIVAL | Worker reaches a candidate refuge via graph points | Validated destination proximity versus explicit arrival confirmation |
| FG-FIRE | Fire activation and polygon expansion | Fire exposure and timed area changes |
| FG-GAS-DESIGNATED | DEMO-GAS-X alarm with designated-space policy | Policy-selected movement |
| FG-SHELTER | DEMO-GAS-X alarm with explicit shelter policy | Route-free action and empty destination |
| FG-ROUTE-BLOCK | Fire then path closure and area growth | Invalidated route and recalculation |
| FG-COMBINED | Same-time fire and gas | Both hazard IDs and explicit combined policy priority |
| FG-NO-ROUTE | Fire and all paths closed | No route is distinct from shelter |
| FG-SENSOR-STALE | Connected old gas reading, disconnection, recovery | Old values remain unknown; active hazard persists |
| FG-CLEAR-REOPEN | Fire clear at 12s, authorized path reopen at 20s | Separate hazard and passage transitions |

`loadScenarios`, `loadScenario` and `loadPolicies` in `src/server/scenarios` parse the actual JSON files using Zod and shared map/profile primitives. The timer belongs to the simulation runtime. `eventsBetween(scenario, afterMs, throughMs)` returns batches in `(afterMs, throughMs]`; start with `afterMs = -1` to include time zero. Apply every event in a same-time batch before evaluating risk. Event IDs are unique and input order is preserved within a batch. A new run/reset starts a new cursor; do not replay already-applied intervals.

Observation freshness uses virtual `observedAtMs`, separately from delivery `atMs`. Connected mock pose streams can refresh during runtime ticks. An explicit older pose timestamp freezes freshness until a fresh scripted pose or reconnection. Sensor readings refresh only through sensor events. Normal fire/gas fixtures refresh sensors every four virtual seconds. In FG-SENSOR-STALE the gas feed intentionally remains connected with its 1s reading until the 14s disconnect; a fresh reading arrives at 20s.

Policies live in `data/policies`. They use a five-second freshness timeout and prediction horizon, a two-metre demo arrival tolerance, and explicit priorities: combined 100, fire 90, gas 80, equipment 70. These are synthetic demo settings, not certified limits. Shelter policies have no route destination. Every fire/gas policy defines the combined response; order of same-time fire and gas does not select the action. A fixture `route.reopen` event names its scripted authorization source; real administrator reopening still requires the runtime permission checks and audit record.

Expected results are test inputs, not claimed execution evidence. Guidance and routes must be produced by the actual engine. Arrival locations must match its current validated destination; a location event never fabricates received, understood, support accepted or arrived timestamps. Run the scenario tests with `pnpm exec vitest run src/server/scenarios`, then the runtime/API integration tests for observable guidance, route and incident behavior. AC-04 envelope/reconnection/reset tests and demographic-only AC-05 checks belong to runtime and client test surfaces rather than introducing fake physical events here.
