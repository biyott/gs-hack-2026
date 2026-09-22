# Local authoritative server

Run `npm ci`, `npm run db:migrate`, `npm run db:seed`, then `npm run dev` from the repository root. Node 22 is required. The default SQLite file is `data/runtime/safety.sqlite`; `DATABASE_PATH` selects another file. Set `GS_DEMO_PIN` in `.env` for the local demonstration. Production startup requires an explicit PIN. The default server binds port 3000 on all interfaces; phones use the PC's LAN address. One process owns both simulation modes, their separate virtual clocks and their shared physical input service.

See [authentication](auth/README.md), [database](db/README.md), and the [wire contracts](../../docs/contracts/v1.md). PINs, bearer tokens and UWB keys must not be copied into evidence logs. All data and risk geometry are for the declared demonstration configuration.

## Authentication and privacy

`POST /api/session` accepts the following JSON. Substitute the configured PIN locally; the role is checked against the seeded account, never trusted as authorization.

```json
{"actorId":"operator","role":"operator","accessCode":"<configured-demo-pin>"}
```

The direct response is a `Session`; browsers receive an HttpOnly, SameSite=Strict session cookie and native clients use its token as `Authorization: Bearer <token>`. Browser mutation origins must match the incoming request host and protocol. `GET /api/session` returns the authenticated session or 401. `DELETE /api/session` revokes the session, closes its SSE subscriptions, invalidates its registered UWB participant, and clears the cookie. A new mobile-role login revokes the prior role occupant. Separate administrators remain concurrent; `admin` and `admin-2` support two-manager checks.

Worker-a and worker-b are bound to WORKER-A/WORKER_1 and WORKER-B/WORKER_2. Equipment and CCTV accounts use role `device`. Worker snapshots contain only their own worker/profile, guidance and relevant incidents; incident audit, global event history and CCTV are removed. Device accounts without a worker binding receive no worker profiles. Administrative state is never inferred from UI selection.

## Simulation and events

| Endpoint | Access and behavior |
| --- | --- |
| `GET /api/catalog` | Public demonstration map, six equipment presets, scenarios and policies. |
| `GET /api/simulation?mode=equipment` | Any authenticated session; direct scoped snapshot. The other mode is `fire-gas`. |
| `POST /api/simulation` | Admin/operator; schema-checked command and current `expectedVersion`. |
| `GET /api/events?mode=equipment` | Authenticated SSE; latest complete scoped snapshot on every connection. |
| `POST /api/incidents/{id}/actions` | Authenticated role and transition guards below. |
| `POST /api/workers/{id}/response` | Bound worker only; identifiers and current primary lineage checked. |

A command example after reading the current snapshot:

```json
{"action":"select","mode":"equipment","expectedVersion":0,"requestId":"unique-command-id","scenarioId":"EQ-APPROACH","seed":20260921}
```

Use `start`, `pause`, `resume`, `reset`, `speed`, `advance`, `profile`, `equipment`, `control`, or `position-input` with the fields in the contract. A stale version returns 409 without applying the change. Request IDs make exact retries idempotent; a retry returns the current authoritative snapshot, including after reset or restart. Reusing an ID with another payload or actor returns 409.

`run.version` is the persisted concurrency version. `streamId` identifies the runtime and `sequence` increases on every publication per mode, including transient sensor/clock updates and across run resets. Establish a stream from the active connection's first snapshot; order subsequent same-stream snapshots by sequence and ignore callbacks from retired connections. Restart creates a new stream and restores running simulations as paused. SSE sends no history replay, so reconnecting must not replay old speech. Event IDs are `streamId:mode:sequence`.

## Position input selection

Each run defaults to `positionInput: "scenario"`. CCTV and raw tracking evidence remain visible, but merely connecting a camera does not overwrite scripted positions. The command below changes only the selected mode:

```json
{"action":"position-input","input":"measured","mode":"equipment","expectedVersion":3,"requestId":"unique-input-selection-id"}
```

Measured input uses current camera/UWB results. Missing, stale, occluded or distance-only observations cannot provide usable worker XY; there is no fallback to mock coordinates. The server ages observations without requiring another upload. The selector is persisted and audited, and changing it recomputes active guidance. Scenario selection/reset returns to scenario input, providing sensor-free deterministic execution. Raw input records retain their source and capture clock regardless of selector. Authored fixed-tower origins remain fixed; measured workers can still move. Position provenance is separately `live`, `synthetic`, or `unknown`, so synthetic calibration and test uploads cannot be presented as physical measurements.

## Incidents and responses

Admin/operator may acknowledge incidents, assign an enabled support identity, record field checks and request a follow-up. Only the assigned support identity may accept/complete its task, in order. Only admin may confirm hazard clearance, authorize passage reopening and close an incident. Clearance does not reopen paths; reopening checks the incident's own closure ownership, preserving other incidents' restrictions. Closing requires cleared hazards and reopened passages. Every action checks run and incident versions, records the actor, and preserves first guidance.

First guidance is immutable. Changed decisions produce a new primary version. RAG supplements append a new guidance version referencing `primaryGuidanceVersion`, with unchanged primary text, route and time window. A supplement must not replay primary speech. Receipt, display, voice outcome, understood, help and arrival remain separate fields. Voice callbacks for the currently active primary lineage remain valid across its supplement; unrelated old guidance is rejected. Arrival requires a current known position within the configured tolerance of the most recent validated destination.

Pausing records `voiceStopRequestedAt` for pending/playing current primaries and changes playing to `stop-requested`. This is a server request with an unconfirmed device outcome, never a completed or confirmed-cancelled fact. The marker survives resume, restart and same-primary supplements, preventing a delayed started report from reviving the old attempt. A started report while the run is inactive also records stop intent; a new primary started after resume can play normally. Actual terminal observations retain their timestamps, and a new primary resets the response marker. Contract revision 1.0.3 defines these semantics.

## Tracking and native pairing

| Endpoint | Access and behavior |
| --- | --- |
| `GET /api/clock` | Any authenticated session; `{ "serverAt": "<UTC ISO>" }`. |
| `GET /api/tracking` | Admin/operator/support/observer raw observations/calibration status, without pairing keys. Worker/device accounts receive 403 and use their scoped simulation/SSE view. |
| `POST /api/tracking/calibration` | Admin/operator; exact `CalibrationSchema` JSON. |
| `POST /api/tracking/frame` | Bound CCTV device: 204 with no body after processing. Admin/operator explicitly synthetic tooling: 200 full tracking snapshot. |
| `GET /api/tracking/frame` | Admin/operator/observer; support/worker/device receive 403. Optional camera/stream/sequence/frame identity rejects superseded images. |
| `POST /api/tracking/uwb` | Bound equipment device, current ready pairing epoch: 204 with no body after processing. Admin/operator synthetic tooling: 200 full tracking snapshot. |
| `POST /api/uwb/prepare` | Bound participant registers native address, capabilities and generation. |
| `GET /api/uwb/config` | Only the current registered participant receives its role-specific session key/config. |
| `DELETE /api/uwb/prepare?generation=N` | Participant cleanup scoped to its authenticated session and native generation. Stale generations cannot erase replacements. |

Camera JPEGs are actually decoded and markers detected; client XY is not accepted. Compact accepted-frame and raw-UWB metadata are append-only SQLite records; JPEGs and session keys are excluded. Capture and receive timestamps remain separate. A clock uncertainty above 50 ms makes capture-to-render latency inconclusive under the frozen QA protocol. Pairing keys remain memory-only, and restart requires preparing participants again.

Self-tests and implementation evidence are separate from the QA Lead's acceptance verdict. Physical four-phone ranging and physical latency require actual devices; generated JPEGs and synthetic UWB records do not satisfy those hardware checks.

## Deterministic core trace entry

Import `SimulationRuntime` from `src/server/simulation/runtime.ts` and instantiate it with `{ configuration: loadConfiguration(), database: createDatabase(path), repository: createRunRepository(database) }`. This constructor does **not** start a scheduler or attach RAG. Use the production `command()` method with a seeded authenticated session and explicit `advance.deltaMs` values. Do not call `startScheduler()` or `getRuntimeServices()` in a deterministic trace: the latter deliberately starts the real HTTP service's 100 ms scheduler and RAG attachment.

The existing Vitest helper `src/server/simulation/runtime-test-fixtures.ts` creates a real isolated SQLite database, seeds accounts, freezes wall time at the frozen 09:00 UTC scenario epoch, and exposes `fixture().command()` with current versions and unique request IDs. `runtime.integration.test.ts` repeats all 14 scenarios against their declared checkpoints. Run `npx vitest run src/server/simulation/runtime.integration.test.ts`. QA may use the production constructor independently with Vitest fake `Date` and `performance` clocks and its own oracle. Compare hazard geometry, actions, paths, profiles and scenario time; generated run/event identities are intentionally different between new runs. Dispose the runtime and close SQLite after each trace. HTTP lifecycle, device capture timing and real model latency use their separate real-clock checks.
