import { z } from "zod";
import { PointSchema } from "@/contracts";
import { ScenarioInitialStateSchema } from "../scenarios";
import {
  ArrivalIntentSchema,
  rememberArrivalIntents,
  restoreLegacyArrivalIntents,
} from "./arrival-intent";
import type { SimulationRun } from "./run";

const ArrivalTargetSchema = PointSchema.extend({
  floorId: z.string().optional(),
  nodeId: z.string().optional(),
});

export const RuntimeCheckpointSchema = z.object({
  schemaVersion: z.literal("1.0.0"),
  world: ScenarioInitialStateSchema,
  frozenSourceIds: z.array(z.string()),
  equipmentCleared: z.boolean(),
  arrivalTargets: z.record(z.string(), ArrivalTargetSchema.nullable()),
  arrivalIntents: z.record(z.string(), ArrivalIntentSchema).optional(),
  closureOwners: z.record(z.string(), z.array(z.string())),
});

export type RuntimeCheckpoint = z.infer<typeof RuntimeCheckpointSchema>;

export function rememberDestinations(run: SimulationRun): void {
  for (const worker of run.snapshot.workers) {
    const latest = worker.currentGuidance?.waypoints.at(-1);
    const first = run.snapshot.incidents
      .flatMap((incident) => incident.firstGuidance)
      .reverse()
      .find((guidance) => guidance.workerId === worker.workerId)
      ?.waypoints.at(-1);
    run.arrivalTargets[worker.workerId] =
      latest ?? run.arrivalTargets[worker.workerId] ?? first ?? null;
  }
  rememberArrivalIntents(run.snapshot, run.arrivalTargets, run.arrivalIntents);
}

export function serializeCheckpoint(run: SimulationRun): string {
  rememberArrivalIntents(run.snapshot, run.arrivalTargets, run.arrivalIntents);
  const checkpoint: RuntimeCheckpoint = {
    schemaVersion: "1.0.0",
    world: run.world.state,
    frozenSourceIds: [...run.world.frozenSourceIds],
    equipmentCleared: run.equipmentCleared,
    arrivalTargets: { ...run.arrivalTargets },
    arrivalIntents: { ...run.arrivalIntents },
    closureOwners: Object.fromEntries(
      [...run.closureOwners].map(([path, owners]) => [path, [...owners]]),
    ),
  };
  return JSON.stringify(checkpoint);
}

export function restoreCheckpoint(run: SimulationRun, json: string): void {
  const parsed: unknown = JSON.parse(json);
  const checkpoint = RuntimeCheckpointSchema.parse(parsed);
  run.world = { state: checkpoint.world, frozenSourceIds: new Set(checkpoint.frozenSourceIds) };
  run.equipmentCleared = checkpoint.equipmentCleared;
  for (const workerId of Object.keys(run.arrivalTargets)) delete run.arrivalTargets[workerId];
  Object.assign(run.arrivalTargets, checkpoint.arrivalTargets);
  for (const workerId of Object.keys(run.arrivalIntents)) delete run.arrivalIntents[workerId];
  if (checkpoint.arrivalIntents === undefined)
    restoreLegacyArrivalIntents(run.snapshot, run.arrivalTargets, run.arrivalIntents, {
      map: run.configuration.map,
    });
  else {
    Object.assign(run.arrivalIntents, checkpoint.arrivalIntents);
    rememberArrivalIntents(run.snapshot, run.arrivalTargets, run.arrivalIntents);
  }
  run.closureOwners.clear();
  for (const [path, owners] of Object.entries(checkpoint.closureOwners))
    run.closureOwners.set(path, new Set(owners));
}
