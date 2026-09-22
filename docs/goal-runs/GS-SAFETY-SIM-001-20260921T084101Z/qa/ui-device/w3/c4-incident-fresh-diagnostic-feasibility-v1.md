# Fresh C4 incident diagnostic feasibility

Source-only assessment, 2026-09-21 after the original W3A shutdown. No application, browser, constructor, network or device execution occurred. This note creates no start grant. Design retains priority and the parent controls serial occupancy.

**Feasible with 2–3 minutes of source preparation.** The frozen `c4-incident-browser-v1.1.mjs` already contains the complete requested flow. A fresh launch plus fixture setup is estimated at 1–2 minutes, its unchanged browser flow at 3–5 minutes, and subsequent report/image review at 5–10 minutes. These are estimates, not a guarantee of completion within a five-minute total runtime window. Stop or preserve the first failure rather than growing or repairing the harness during the diagnostic.

## Existing binding and minimal derivative

v1.1 fixes the C4 root `/home/b/.cache/gs-safety-c4.q2FD40`, candidate `sha256:cd8a2428d3d9e44703c25b4ae135f0ed5821b6b3b3794bbca6abc1ec37197eba`, build and loopback port 4103. It does not hardcode PID 981422, the original DB filename, a parent grant ID, or the old shutdown time. Grant, process and fixture paths and their hashes are supplied at runtime. A new diagnostic needs a genuinely new process receipt, grant and fixture provenance; the old receipts must not be relabeled.

The minimum additive v1.2 derivative should retain every workflow action and oracle, and change only its own freeze/output identity and process-binding guards:

- Reject PID `981422`; check the new PID's actual `/proc/<pid>/stat` start-time ticks and `/proc/<pid>/cwd` against the receipt and C4 root.
- Require a new, unique database path under the private C4 evidence area; reject the old `.private/safety.sqlite` by resolved path. Require a new private credentials file and reject the old `.private/credentials.json`. The parent launch receipt must attest creation of the new database; the helper cannot infer historical freshness from a filename alone.
- Bind the new process receipt's source/build/base URL, DB path, credentials path and new launch grant to the new diagnostic grant, while retaining existing no-camera/no-phone/fresh-DB flags and exact process/script/fixture/binding/freeze hashes.
- Require finite current UTC grant bounds and the newly authorized cutoff. The old shutdown grant is not authority for this run. New output should be labeled exploratory diagnostic and retain `productAcceptance: NOT_RUN`.

No product, scenario, selector, action, assertion or transport change is necessary. Preserve v1.1 and its freeze untouched. A v1.2 file/freeze is not created by this feasibility note. A different application root or port would require additional binding edits and should be assessed before starting; the estimate assumes the same immutable C4 stage and released port 4103.

## Minimal actual fixture preparation

After a separate launch grant, create a unique fresh DB/private PIN and start the existing C4 build with a new process receipt. Through the actual authenticated `/api/simulation` POST command interface, select `FG-FIRE`, start, advance through its 1000 ms fire event, then pause. Read a fresh version before each command. The scheduler can advance virtual time during setup, so record the observed checkpoint rather than claiming exactly 1000 ms.

Require the actual run to be paused, `positionInput: scenario`, and the selected A to be active and unacknowledged with hazard `FIRE-ZONE-B` and nonempty first guidance. Record actual run/incident IDs and the full preparation provenance with its hash. No independent B is supplied by this stock fixture.

Frozen `src/server/simulation/snapshots.ts` initializes synthetic `CCTV-01`, floor `GROUND`, zones `ZONE-A`, `ZONE-B`, `ZONE-C`, disconnected/mock with no frame. Confirm that metadata and A's actual zone/floor when writing `cameraByIncident[A]`; retain the independent source reference in provenance. Before every screenshot, the existing helper also requires actual `/api/tracking` to report `camera === null` and `receivedFrames === 0`.

## Exact existing diagnostic flow and oracles

1. Actual seeded `admin` and `admin-2` browser logins, actual native EventSource connection, actual 2D UI selection and camera lock on A; capture both views with expected camera/floor/zone context.
2. Both admins submit assignment of the same seeded `support` identity with distinct notes. Hold both outgoing requests until they carry equal run/incident revisions. Require one HTTP 200, one 409, and exactly one matching persisted `incident.assign` audit. This is not a two-distinct-assignee case.
3. A third actual `support` context accepts and completes support. Require HTTP 200 for both actions and unchanged worker semantic-response objects. Support completion is not worker receipt or arrival.
4. Admin 1 performs a real mode roundtrip, opening a new native EventSource after closing the old one, reads authoritative HTTP state, then injects delayed open/error/snapshot callbacks only into the closed former EventSource. Require the visible revision and live connection state to remain current. This is not an actual transport outage, server restart, new server stream, delayed HTTP or stress proof.
5. Admin 1 separately acknowledges, records a field check, clears the hazard, reopens passage and closes A through the actual UI/action endpoint. Require HTTP 200, immutable first-guidance records, clear without implicit reopen, and reopen without implicit close. Save each state and actual UI views. The unchanged helper can check independent B if a real B fixture is provided, but this fresh FG-FIRE run supplies none.

The helper does not prepare its own fixture. Its command remains `node <new derivative.mjs> --binding <C4 binding> --grant <new diagnostic grant> --fixture <actual fresh fixture>`, with `processPath` and `processSha256` in the new grant. It must execute only after the explicit start grant and serial handoff.

Successful assertions still yield an incomplete review result, not acceptance. No C4 PASS transfers to C5. B arrival/priority/isolation, B-only closure ownership, real worker/device receipt or arrival, supplement playback, phones/camera, performance and full visual acceptance remain unproven. Preserve first failure and raw artifacts for diagnosis before C5.
