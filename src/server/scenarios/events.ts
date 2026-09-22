import { PointSchema, WorkerProfileSchema } from "@gs-safety/contracts";
import { z } from "zod";
import { ScenarioHazardSchema, ScenarioSensorSchema } from "./entities";

const eventFields = { id: z.string().min(1), atMs: z.number().int().nonnegative() };
export const ScenarioEventSchema = z
  .discriminatedUnion("type", [
    z.object({
      ...eventFields,
      type: z.literal("equipment.pose"),
      position: PointSchema,
      headingDeg: z.number().finite(),
      speedMps: z.number().nonnegative(),
      slewDeg: z.number().min(-15).max(15),
      observedAtMs: z.number().int().nonnegative().optional(),
    }),
    z.object({
      ...eventFields,
      type: z.literal("worker.position"),
      workerId: z.string().min(1),
      position: PointSchema.nullable(),
      observedAtMs: z.number().int().nonnegative().optional(),
    }),
    z.object({ ...eventFields, type: z.literal("worker.profile"), profile: WorkerProfileSchema }),
    z.object({
      ...eventFields,
      type: z.literal("source.connection"),
      entityId: z.string().min(1),
      connected: z.boolean(),
    }),
    z.object({ ...eventFields, type: z.literal("sensor.reading"), sensor: ScenarioSensorSchema }),
    z.object({ ...eventFields, type: z.literal("hazard.upsert"), hazard: ScenarioHazardSchema }),
    z.object({ ...eventFields, type: z.literal("hazard.clear"), hazardId: z.string().min(1) }),
    z.object({
      ...eventFields,
      type: z.literal("route.block"),
      pathIds: z.array(z.string().min(1)).min(1),
    }),
    z.object({
      ...eventFields,
      type: z.literal("route.reopen"),
      pathIds: z.array(z.string().min(1)).min(1),
      authorizedBy: z.string().min(1),
    }),
  ])
  .readonly();

export type ScenarioEvent = z.infer<typeof ScenarioEventSchema>;
