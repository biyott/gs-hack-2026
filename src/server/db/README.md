# Server persistence

`createDatabase(path)` opens SQLite with WAL, foreign keys, a five-second busy timeout, and committed Drizzle migrations. It returns the typed Drizzle `db`, native `sqlite` connection for server-side FTS5/RAG, and `close()`. Callers must close temporary connections. All entry points run on Node.js.

From the repository root:

```sh
npm run db:migrate
npm run db:seed
npm test -- src/server/db src/server/auth
```

Set `DATABASE_PATH` to choose an independent database. The default is `data/runtime/safety.sqlite`. Account configuration and the development PIN are documented in [the auth README](../auth/README.md). Tests create their own temporary or in-memory databases.

`createRunRepository(database)` exposes:

- `create(snapshot, actorId, runtimeStateJson?)` for a mode's initial run.
- `commit({ snapshot, expectedVersion, actorId, request?, response?, runtimeStateJson? })` for an atomic state transition. The snapshot version must equal `expectedVersion + 1`.
- `replace(snapshot, { runId, version, request?, runtimeStateJson? }, actorId)` for an atomic reset after checking the previous active run. Previous run history remains available; the checkpoint describes the replacement run.
- `current(mode)`, `get(runId)`, `history(runId)`, `guidanceHistory(incidentId)`, and `audits(runId)` for reconstruction.
- `responseReceipt({ runId, workerId, requestId })` for worker-response retries.
- `requestReceipt({ mode, runId, requestId })` and `findRequestReceipt(mode, requestId)` for command retries, including retries after reset changes the active run ID.
- `runtimeState(runId)` reads checkpoint bytes joined to the exact current head version. It returns `null` when that version has no checkpoint, without falling back to earlier versions.

The optional runtime checkpoint is an opaque JSON string owned and validated by the simulation runtime. SQLite stores it immutably under the matching `(runId, version)` in the same transaction as the snapshot and receipts. Callers must include it on every transition requiring checkpoint recovery; no wire-contract fields are added.

Commits run synchronously inside an immediate SQLite transaction. Publish SSE only after the returned commit succeeds. Guidance versions, snapshots, incident audits, and request receipts have database triggers prohibiting updates and deletes. Exact request replays return their original result; changed content or actor conflicts. Control request IDs are unique within each mode; worker-response IDs are scoped by run and worker.

Supplemental guidance appends a new version referencing an existing primary version. The referenced primary must still be current, and its action, route, profile, text, generation time, expiry, and remaining context must match. The original first guidance is preserved. The service layer remains responsible for role policy and for deriving the actor from the authenticated session.

The migrations and Drizzle metadata are checked in. Generate later changes with `npm run db:generate`, review the generated migration, and retain the custom immutable-history triggers.

## Measurement evidence

`createMeasurementRepository(database)` from `measurements.ts` stores high-frequency sensor evidence independently of run snapshots and checkpoints. `append({ kind, sourceId, sequence, observedAt, receivedAt, payloadJson })` returns the stored event with a numeric `id`; `kind` is `camera-frame` or `uwb`. `latest(kind, sourceId?)` returns the most recently appended matching event. `list(kind, limit = 100)` returns newest-first events and permits limits from 1 to 1000.

The identity `(kind, sourceId, sequence, observedAt)` is unique. Identical payload bytes return the original record and original receive timestamp; changed payload bytes conflict. Timestamps and raw nullable values are retained. UWB callers should namespace `sourceId` by controller device, worker and pairing epoch to distinguish concurrent peers and restarted sequences.

Payloads must be JSON metadata objects at most 64 KiB. Callers provide sanitized upload metadata, capture-clock evidence and event-specific output positions; camera callers must remove `jpegBase64` first. The boundary rejects nested JPEG bytes/data URLs, session keys, tokens and credential fields. An optional JPEG SHA-256 digest is permitted. Database triggers prohibit updating or deleting measurement events. The table contains no image data or run-snapshot copies.
