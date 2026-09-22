import { z } from "zod";
import {
  DeviceRoleSchema,
  PointSchema,
  PositionInputSchema,
  SimulationModeSchema,
  TimestampSchema,
  WorkerProfileSchema,
} from "./core";

export const SessionRoleSchema = z.enum([
  "admin",
  "operator",
  "support",
  "worker",
  "device",
  "observer",
]);
export const SessionRequestSchema = z.object({
  role: SessionRoleSchema,
  actorId: z.string().min(1).max(80),
  deviceRole: DeviceRoleSchema.optional(),
  workerId: z.string().optional(),
  accessCode: z.string().optional(),
});
export const SessionSchema = z.object({
  sessionId: z.string(),
  role: SessionRoleSchema,
  actorId: z.string(),
  token: z.string(),
  workerId: z.string().nullable(),
  deviceRole: DeviceRoleSchema.nullable(),
  expiresAt: TimestampSchema,
});
const mutationFields = {
  mode: SimulationModeSchema,
  expectedVersion: z.number().int().nonnegative(),
  requestId: z.string().min(1),
};
export const SimulationCommandSchema = z.discriminatedUnion("action", [
  z.object({
    ...mutationFields,
    action: z.literal("select"),
    scenarioId: z.string(),
    seed: z.number().int().optional(),
  }),
  z.object({ ...mutationFields, action: z.enum(["start", "pause", "resume", "reset"]) }),
  z.object({ ...mutationFields, action: z.literal("speed"), speed: z.number().positive().max(16) }),
  z.object({
    ...mutationFields,
    action: z.literal("advance"),
    deltaMs: z.number().nonnegative().max(3600000),
  }),
  z.object({
    ...mutationFields,
    action: z.literal("profile"),
    workerId: z.string(),
    profile: WorkerProfileSchema,
  }),
  z.object({ ...mutationFields, action: z.literal("equipment"), presetId: z.string() }),
  z.object({
    ...mutationFields,
    action: z.literal("position-input"),
    input: PositionInputSchema,
  }),
  z.object({
    ...mutationFields,
    action: z.literal("control"),
    pose: z.object({
      position: PointSchema.optional(),
      headingDeg: z.number().optional(),
      speedMps: z.number().nonnegative().optional(),
      slewDeg: z.number().optional(),
      boomAngleDeg: z.number().optional(),
      boomLengthM: z.number().positive().optional(),
      trolleyM: z.number().nonnegative().optional(),
      hookHeightM: z.number().nonnegative().optional(),
      tableLinked: z.boolean().optional(),
    }),
  }),
]);
export const IncidentActionSchema = z.object({
  ...mutationFields,
  incidentId: z.string(),
  expectedIncidentVersion: z.number().int().positive(),
  action: z.enum([
    "acknowledge",
    "assign",
    "accept-support",
    "complete-support",
    "field-check",
    "follow-up",
    "clear-hazard",
    "reopen-passage",
    "close",
  ]),
  assigneeId: z.string().optional(),
  note: z.string().max(2000).optional(),
});
export const WorkerResponseSchema = z.object({
  mode: SimulationModeSchema,
  runId: z.string(),
  workerId: z.string(),
  requestId: z.string(),
  incidentId: z.string(),
  guidanceId: z.string(),
  guidanceVersion: z.number().int().positive(),
  response: z.enum([
    "received",
    "displayed",
    "voice-started",
    "voice-completed",
    "voice-failed",
    "voice-unsupported",
    "understood",
    "help-requested",
    "arrived",
  ]),
  occurredAt: TimestampSchema,
  detail: z.string().optional(),
});
export const ApiErrorSchema = z.object({
  error: z.object({ code: z.string(), message: z.string(), currentVersion: z.number().optional() }),
});

export type SessionRole = z.infer<typeof SessionRoleSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type SessionRequest = z.infer<typeof SessionRequestSchema>;
export type SimulationCommand = z.infer<typeof SimulationCommandSchema>;
export type IncidentAction = z.infer<typeof IncidentActionSchema>;
export type WorkerResponse = z.infer<typeof WorkerResponseSchema>;
