import { z } from "zod";
import {
  HazardTypeSchema,
  InputSourceSchema,
  PointSchema,
  PositionInputSchema,
  PositionSourceSchema,
  PrioritySchema,
  SimulationModeSchema,
  TimestampSchema,
  WorkerProfileSchema,
} from "./core";
import { GuidanceSchema } from "./guidance";

export const ResponseStateSchema = z.object({
  receivedAt: TimestampSchema.nullable(),
  displayedAt: TimestampSchema.nullable(),
  spokenAt: TimestampSchema.nullable(),
  voiceStopRequestedAt: TimestampSchema.nullable().optional(),
  understoodAt: TimestampSchema.nullable(),
  helpRequestedAt: TimestampSchema.nullable(),
  arrivedAt: TimestampSchema.nullable(),
  voiceStatus: z.enum([
    "pending",
    "playing",
    "stop-requested",
    "completed",
    "failed",
    "unsupported",
    "cancelled",
  ]),
});
export const WorkerStateSchema = z.object({
  workerId: z.string(),
  profile: WorkerProfileSchema,
  position: PointSchema.nullable(),
  positionSource: PositionSourceSchema,
  positionInputSource: InputSourceSchema.default("unknown"),
  positionStatus: z.enum(["known", "unknown", "stale"]),
  lastObservedAt: TimestampSchema.nullable(),
  currentGuidance: GuidanceSchema.nullable(),
  response: ResponseStateSchema,
  virtual: z.boolean(),
});
export const EquipmentStateSchema = z.object({
  id: z.literal("EQUIPMENT-A"),
  presetId: z.string(),
  position: PointSchema,
  headingDeg: z.number(),
  speedMps: z.number().nonnegative(),
  slewDeg: z.number(),
  boomAngleDeg: z.number(),
  boomLengthM: z.number().nullable(),
  trolleyM: z.number().nullable(),
  hookHeightM: z.number().nullable(),
  geometryVersion: z.number().int().positive(),
  positionSource: PositionSourceSchema,
  positionInputSource: InputSourceSchema.default("unknown"),
  tableLinked: z.boolean(),
  positionStatus: z.enum(["known", "unknown", "stale"]),
  lastObservedAt: TimestampSchema.nullable(),
});
export const HazardSchema = z.object({
  hazardId: z.string(),
  hazardType: HazardTypeSchema,
  priority: PrioritySchema,
  polygon: z.array(PointSchema),
  active: z.boolean(),
  floorId: z.string(),
  source: z.enum(["mock", "measured", "engine"]),
  observedAt: TimestampSchema,
  sensorStatus: z.enum(["current", "stale", "disconnected", "not-applicable"]),
  affectedWorkerIds: z.array(z.string()),
  reason: z.string(),
  zoneId: z.string().nullable(),
  substanceId: z.string().nullable(),
});
export const AuditEventSchema = z.object({
  eventId: z.string(),
  incidentId: z.string().nullable(),
  runId: z.string(),
  kind: z.string(),
  actorId: z.string(),
  occurredAt: TimestampSchema,
  detail: z.string(),
  version: z.number().int().nonnegative(),
});
export const IncidentSchema = z.object({
  incidentId: z.string(),
  runId: z.string(),
  version: z.number().int().positive(),
  hazardIds: z.array(z.string()),
  hazardType: HazardTypeSchema,
  priority: PrioritySchema,
  status: z.enum(["active", "cleared", "closed"]),
  acknowledgedAt: TimestampSchema.nullable(),
  assignedTo: z.string().nullable(),
  supportStatus: z.enum(["none", "requested", "assigned", "accepted", "completed"]),
  hazardClearedAt: TimestampSchema.nullable(),
  passageReopenedAt: TimestampSchema.nullable(),
  closedAt: TimestampSchema.nullable(),
  firstGuidance: z.array(GuidanceSchema),
  currentGuidance: z.array(GuidanceSchema),
  audit: z.array(AuditEventSchema),
});
export const RunStateSchema = z.object({
  runId: z.string(),
  scenarioId: z.string(),
  positionInput: PositionInputSchema.default("scenario"),
  status: z.enum(["idle", "running", "paused", "completed"]),
  virtualTimeMs: z.number().nonnegative(),
  speed: z.number().positive().max(16),
  seed: z.number().int(),
  version: z.number().int().nonnegative(),
  mapId: z.string(),
  mapVersion: z.string(),
  startedAt: TimestampSchema.nullable(),
  updatedAt: TimestampSchema,
});
export const CctvStateSchema = z.object({
  cameraId: z.string(),
  name: z.string(),
  zoneIds: z.array(z.string()),
  floorId: z.string(),
  source: z.enum(["live", "recorded", "mock"]),
  status: z.enum(["connected", "disconnected", "stale"]),
  lastFrameAt: TimestampSchema.nullable(),
  frameUrl: z.string().nullable(),
  receivedFps: z.number().nonnegative(),
  latencyMs: z.number().nonnegative().nullable(),
});
export const SimulationSnapshotSchema = z.object({
  contractVersion: z.literal("1.0.0"),
  streamId: z.string().min(1).default("legacy"),
  sequence: z.number().int().nonnegative().safe().default(0),
  mode: SimulationModeSchema,
  run: RunStateSchema,
  workers: z.array(WorkerStateSchema),
  equipment: EquipmentStateSchema,
  hazards: z.array(HazardSchema),
  closedEdgeIds: z.array(z.string()),
  incidents: z.array(IncidentSchema),
  events: z.array(AuditEventSchema),
  cctv: z.array(CctvStateSchema),
});
export const SimulationWireSnapshotSchema = SimulationSnapshotSchema.extend({
  streamId: z.uuid(),
  sequence: z.number().int().nonnegative().safe(),
});

export type ResponseState = z.infer<typeof ResponseStateSchema>;
export type WorkerState = z.infer<typeof WorkerStateSchema>;
export type EquipmentState = z.infer<typeof EquipmentStateSchema>;
export type Hazard = z.infer<typeof HazardSchema>;
export type AuditEvent = z.infer<typeof AuditEventSchema>;
export type Incident = z.infer<typeof IncidentSchema>;
export type RunState = z.infer<typeof RunStateSchema>;
export type CctvState = z.infer<typeof CctvStateSchema>;
export type SimulationSnapshot = z.infer<typeof SimulationSnapshotSchema>;
