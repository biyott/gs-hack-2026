import { ActionCodeSchema, SimulationModeSchema, TimestampSchema } from "@gs-safety/contracts";
import { z } from "zod";
import { ScenarioInitialStateSchema } from "./entities";
import { ScenarioEventSchema } from "./events";
import { referenceIssues } from "./references";

const expectedFields = { atMs: z.number().int().nonnegative(), note: z.string().min(1) };
export const ExpectedResultSchema = z
  .discriminatedUnion("kind", [
    z.object({
      ...expectedFields,
      kind: z.literal("guidance"),
      workerId: z.string(),
      actionCode: ActionCodeSchema,
      route: z.enum(["required", "empty"]),
      destinationIds: z.array(z.string()),
    }),
    z.object({
      ...expectedFields,
      kind: z.literal("active-hazards"),
      hazardIds: z.array(z.string()),
    }),
    z.object({ ...expectedFields, kind: z.literal("blocked-paths"), pathIds: z.array(z.string()) }),
    z.object({
      ...expectedFields,
      kind: z.literal("source-state"),
      entityId: z.string(),
      state: z.enum(["fresh", "stale", "disconnected", "unknown"]),
    }),
    z.object({
      ...expectedFields,
      kind: z.literal("profile-route"),
      workerId: z.string(),
      forbiddenEdgeIds: z.array(z.string()),
      assistanceRequired: z.boolean(),
    }),
    z.object({
      ...expectedFields,
      kind: z.literal("arrival"),
      workerId: z.string(),
      destinationId: z.string(),
      requiresExplicitConfirmation: z.literal(true),
    }),
  ])
  .readonly();

export const ScenarioSchema = z
  .object({
    id: z.string().min(1),
    version: z.string().min(1),
    label: z.object({ ko: z.string().min(1), en: z.string().min(1) }).readonly(),
    mode: SimulationModeSchema,
    mapId: z.string().min(1),
    mapVersion: z.string().min(1),
    synthetic: z.literal(true),
    seed: z.number().int().nonnegative(),
    durationMs: z.number().int().positive(),
    clockEpoch: TimestampSchema,
    policyId: z.string().min(1),
    initial: ScenarioInitialStateSchema,
    events: z.array(ScenarioEventSchema).readonly(),
    expectedResults: z.array(ExpectedResultSchema).min(1).readonly(),
    coverage: z.array(z.string().min(1)).min(1).readonly(),
  })
  .superRefine((scenario, context) => {
    const ids = new Set<string>();
    let previousMs = -1;
    scenario.events.forEach((event, index) => {
      if (ids.has(event.id))
        context.addIssue({
          code: "custom",
          path: ["events", index, "id"],
          message: "Event IDs must be unique",
        });
      ids.add(event.id);
      if (event.atMs < previousMs || event.atMs > scenario.durationMs) {
        context.addIssue({
          code: "custom",
          path: ["events", index, "atMs"],
          message: "Events must be ordered within scenario duration",
        });
      }
      previousMs = event.atMs;
      const observedAtMs =
        event.type === "sensor.reading"
          ? event.sensor.observedAtMs
          : event.type === "worker.position" || event.type === "equipment.pose"
            ? event.observedAtMs
            : undefined;
      if (observedAtMs !== undefined && observedAtMs > event.atMs) {
        context.addIssue({
          code: "custom",
          path: ["events", index],
          message: "An observation cannot occur after its delivery event",
        });
      }
      const incompatible =
        scenario.mode === "equipment"
          ? ["sensor.reading", "hazard.upsert", "hazard.clear"].includes(event.type)
          : event.type === "equipment.pose";
      if (incompatible)
        context.addIssue({
          code: "custom",
          path: ["events", index, "type"],
          message: "Event belongs to the other simulation mode",
        });
    });
    if ((scenario.mode === "equipment") !== (scenario.initial.equipment !== null)) {
      context.addIssue({
        code: "custom",
        path: ["initial", "equipment"],
        message: "Equipment is required only in equipment mode",
      });
    }
    if (
      scenario.mode === "equipment" &&
      (scenario.initial.sensors.length > 0 || scenario.initial.hazards.length > 0)
    ) {
      context.addIssue({
        code: "custom",
        path: ["initial"],
        message: "Equipment mode cannot contain fire-gas state",
      });
    }
    const workerIds = scenario.initial.workers.map((worker) => worker.workerId);
    if (new Set(workerIds).size !== workerIds.length) {
      context.addIssue({
        code: "custom",
        path: ["initial", "workers"],
        message: "Worker IDs must be unique",
      });
    }
    scenario.initial.workers.forEach((worker, index) => {
      if (worker.workerId !== worker.profile.workerId) {
        context.addIssue({
          code: "custom",
          path: ["initial", "workers", index, "profile"],
          message: "Profile must belong to the worker",
        });
      }
    });
    scenario.expectedResults.forEach((expected, index) => {
      if (expected.atMs > scenario.durationMs) {
        context.addIssue({
          code: "custom",
          path: ["expectedResults", index, "atMs"],
          message: "Expectation is outside scenario duration",
        });
      }
      if (
        expected.kind === "guidance" &&
        (expected.route === "required") !== expected.destinationIds.length > 0
      ) {
        context.addIssue({
          code: "custom",
          path: ["expectedResults", index],
          message: "Only a routed action has destination candidates",
        });
      }
    });
    for (const issue of referenceIssues(scenario)) {
      context.addIssue({ code: "custom", path: [...issue.path], message: issue.message });
    }
  })
  .readonly();

export type Scenario = z.infer<typeof ScenarioSchema>;
export type ExpectedResult = z.infer<typeof ExpectedResultSchema>;
