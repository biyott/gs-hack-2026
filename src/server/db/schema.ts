import {
  foreignKey,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  role: text("role").notNull(),
  workerId: text("worker_id"),
  deviceRole: text("device_role"),
  pinHash: text("pin_hash").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  authVersion: integer("auth_version").notNull().default(1),
});

export const sessions = sqliteTable(
  "sessions",
  {
    sessionId: text("session_id").primaryKey(),
    tokenHash: text("token_hash").notNull().unique(),
    accountId: text("account_id")
      .notNull()
      .references(() => accounts.id),
    authVersion: integer("auth_version").notNull(),
    expiresAt: integer("expires_at").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [index("sessions_account_idx").on(table.accountId)],
);

export const runHeads = sqliteTable("run_heads", {
  runId: text("run_id").primaryKey(),
  mode: text("mode").notNull(),
  version: integer("version").notNull(),
});

export const activeRuns = sqliteTable("active_runs", {
  mode: text("mode").primaryKey(),
  runId: text("run_id")
    .notNull()
    .references(() => runHeads.runId),
});

export const runSnapshots = sqliteTable(
  "run_snapshots",
  {
    runId: text("run_id")
      .notNull()
      .references(() => runHeads.runId),
    version: integer("version").notNull(),
    actorId: text("actor_id").notNull(),
    createdAt: text("created_at").notNull(),
    payloadJson: text("payload_json").notNull(),
  },
  (table) => [primaryKey({ columns: [table.runId, table.version] })],
);

export const runRuntimeState = sqliteTable(
  "run_runtime_state",
  {
    runId: text("run_id").notNull(),
    version: integer("version").notNull(),
    payloadJson: text("payload_json").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.runId, table.version] }),
    foreignKey({
      columns: [table.runId, table.version],
      foreignColumns: [runSnapshots.runId, runSnapshots.version],
    }),
  ],
);

export const guidanceVersions = sqliteTable(
  "guidance_versions",
  {
    guidanceId: text("guidance_id").notNull(),
    version: integer("version").notNull(),
    runId: text("run_id")
      .notNull()
      .references(() => runHeads.runId),
    incidentId: text("incident_id").notNull(),
    workerId: text("worker_id").notNull(),
    createdAt: text("created_at").notNull(),
    payloadJson: text("payload_json").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.guidanceId, table.version] }),
    index("guidance_incident_idx").on(table.incidentId, table.workerId, table.version),
  ],
);

export const incidentAudit = sqliteTable(
  "incident_audit",
  {
    eventId: text("event_id").primaryKey(),
    runId: text("run_id")
      .notNull()
      .references(() => runHeads.runId),
    incidentId: text("incident_id"),
    actorId: text("actor_id").notNull(),
    occurredAt: text("occurred_at").notNull(),
    payloadJson: text("payload_json").notNull(),
  },
  (table) => [index("audit_run_idx").on(table.runId, table.occurredAt)],
);

export const responseReceipts = sqliteTable(
  "response_receipts",
  {
    runId: text("run_id")
      .notNull()
      .references(() => runHeads.runId),
    workerId: text("worker_id").notNull(),
    requestId: text("request_id").notNull(),
    actorId: text("actor_id").notNull(),
    payloadJson: text("payload_json").notNull(),
    snapshotJson: text("snapshot_json").notNull(),
  },
  (table) => [primaryKey({ columns: [table.runId, table.workerId, table.requestId] })],
);

export const requestReceipts = sqliteTable(
  "request_receipts",
  {
    mode: text("mode").notNull(),
    runId: text("run_id")
      .notNull()
      .references(() => runHeads.runId),
    requestId: text("request_id").notNull(),
    actorId: text("actor_id").notNull(),
    payloadJson: text("payload_json").notNull(),
    snapshotJson: text("snapshot_json").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.mode, table.runId, table.requestId] }),
    uniqueIndex("request_mode_id_unique").on(table.mode, table.requestId),
  ],
);

export const measurementEvents = sqliteTable(
  "measurement_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    kind: text("kind", { enum: ["camera-frame", "uwb"] }).notNull(),
    sourceId: text("source_id").notNull(),
    sequence: integer("sequence").notNull(),
    observedAt: text("observed_at").notNull(),
    receivedAt: text("received_at").notNull(),
    payloadJson: text("payload_json").notNull(),
  },
  (table) => [
    uniqueIndex("measurement_identity_unique").on(
      table.kind,
      table.sourceId,
      table.sequence,
      table.observedAt,
    ),
    index("measurement_kind_id_idx").on(table.kind, table.id),
    index("measurement_source_id_idx").on(table.kind, table.sourceId, table.id),
  ],
);
