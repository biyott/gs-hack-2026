import { z } from "zod";

export const CONTRACT_VERSION = "1.0.0";
export const SimulationModeSchema = z.enum(["equipment", "fire-gas"]);
export const LocaleSchema = z.enum(["ko", "en"]);
export const PointSchema = z.object({ x: z.number().finite(), y: z.number().finite() });
export const TimestampSchema = z.iso.datetime({ offset: true });
export const HazardTypeSchema = z.enum([
  "equipment",
  "fire",
  "gas",
  "combined",
  "position-unknown",
  "sensor-unknown",
]);
export const PrioritySchema = z.enum(["critical", "high", "medium", "low"]);
export const ActionCodeSchema = z.enum([
  "ALERT_HAZARD",
  "FOLLOW_VALIDATED_ROUTE",
  "GUIDANCE_UPDATED",
  "ROUTE_UNAVAILABLE",
  "POSITION_UNKNOWN",
  "SENSOR_UNKNOWN",
  "REQUEST_ASSISTANCE",
  "SHELTER_PER_SCENARIO",
  "CONFIRM_UNDERSTANDING",
  "CONFIRM_ARRIVAL",
  "AWAIT_REOPEN_AUTHORIZATION",
]);
export const DeviceRoleSchema = z.enum(["EQUIPMENT", "WORKER_1", "WORKER_2", "CCTV"]);
export const PositionSourceSchema = z.enum(["mock", "video", "uwb", "manual"]);
export const InputSourceSchema = z.enum(["live", "synthetic", "unknown"]);
export const PositionInputSchema = z.enum(["scenario", "measured"]);
export const WorkerProfileSchema = z
  .object({
    workerId: z.string().min(1),
    version: z.number().int().positive(),
    preferredLocale: z.string().min(1).nullable(),
    locale: LocaleSchema,
    canUseStairs: z.boolean().nullable(),
    speedMps: z.object({ min: z.number().nonnegative(), max: z.number().positive() }).nullable(),
    needsAssistance: z.boolean().nullable(),
    needsCompanion: z.boolean().nullable(),
    notificationPreferences: z.object({ voice: z.boolean(), vibration: z.boolean() }),
    confirmedAt: TimestampSchema.nullable(),
  })
  .refine((profile) => profile.speedMps === null || profile.speedMps.min <= profile.speedMps.max, {
    message: "Confirmed speed minimum must not exceed maximum",
    path: ["speedMps"],
  });

export type SimulationMode = z.infer<typeof SimulationModeSchema>;
export type Locale = z.infer<typeof LocaleSchema>;
export type Point = z.infer<typeof PointSchema>;
export type HazardType = z.infer<typeof HazardTypeSchema>;
export type Priority = z.infer<typeof PrioritySchema>;
export type ActionCode = z.infer<typeof ActionCodeSchema>;
export type DeviceRole = z.infer<typeof DeviceRoleSchema>;
export type InputSource = z.infer<typeof InputSourceSchema>;
export type PositionInput = z.infer<typeof PositionInputSchema>;
export type WorkerProfile = z.infer<typeof WorkerProfileSchema>;
