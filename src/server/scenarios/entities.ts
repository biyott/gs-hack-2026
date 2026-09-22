import { PointSchema, WorkerProfileSchema } from "@gs-safety/contracts";
import { z } from "zod";

const observation = {
  observedAtMs: z.number().int().nonnegative(),
  source: z.literal("mock"),
  connected: z.boolean(),
};
export const ScenarioWorkerSchema = z
  .object({
    workerId: z.string().min(1),
    position: PointSchema.nullable(),
    profile: WorkerProfileSchema,
    ...observation,
  })
  .readonly();
export const ScenarioEquipmentSchema = z
  .object({
    equipmentId: z.literal("EQUIPMENT-A"),
    modelId: z.string().min(1),
    position: PointSchema,
    headingDeg: z.number().finite(),
    speedMps: z.number().nonnegative(),
    slewDeg: z.number().min(-15).max(15),
    ...observation,
  })
  .readonly();
export const ScenarioSensorSchema = z
  .object({
    sensorId: z.string().min(1),
    hazardType: z.enum(["fire", "gas"]),
    zoneId: z.string().min(1),
    value: z.number().finite().nullable(),
    unit: z.literal("demo-index"),
    materialId: z.literal("DEMO-GAS-X").nullable(),
    ...observation,
  })
  .readonly();
export const ScenarioHazardSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(["fire", "gas"]),
    zoneId: z.string().min(1),
    polygon: z.array(PointSchema).min(3).readonly(),
    active: z.boolean(),
  })
  .readonly();
export const ScenarioInitialStateSchema = z
  .object({
    equipment: ScenarioEquipmentSchema.nullable(),
    workers: z.array(ScenarioWorkerSchema).min(2).readonly(),
    sensors: z.array(ScenarioSensorSchema).readonly(),
    hazards: z.array(ScenarioHazardSchema).readonly(),
    blockedPathIds: z.array(z.string().min(1)).readonly(),
  })
  .readonly();

export type ScenarioWorker = z.infer<typeof ScenarioWorkerSchema>;
export type ScenarioEquipment = z.infer<typeof ScenarioEquipmentSchema>;
export type ScenarioSensor = z.infer<typeof ScenarioSensorSchema>;
export type ScenarioHazard = z.infer<typeof ScenarioHazardSchema>;
export type ScenarioInitialState = z.infer<typeof ScenarioInitialStateSchema>;
