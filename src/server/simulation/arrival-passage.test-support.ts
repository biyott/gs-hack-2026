import assert from "node:assert/strict";
import { expect } from "vitest";
import type { SimulationSnapshot } from "@/contracts";
import { evaluateWorkerPlan } from "../engine";
import { ScenarioSchema } from "../scenarios";
import type { EvaluationContext } from "./evaluate";
import { configuration, fixture } from "./runtime-test-fixtures";

export function closedArrival() {
  const base = configuration.scenarios.find((scenario) => scenario.id === "EQ-ARRIVAL");
  assert.ok(base?.events[0]);
  const scenario = ScenarioSchema.parse({
    ...base,
    id: "QD004-D1",
    events: [
      base.events[0],
      {
        id: "reroute",
        type: "route.block",
        atMs: 2000,
        pathIds: ["EDGE-A-04", "EDGE-A-05", "EDGE-C-05"],
      },
      ...[
        { atMs: 3000, position: { x: 125, y: 42 } },
        { atMs: 4000, position: { x: 125, y: 8 } },
        { atMs: 5000, position: { x: 125, y: 42 } },
      ].map((event) => ({
        ...event,
        id: `worker-${event.atMs}`,
        type: "worker.position",
        workerId: "WORKER-A",
      })),
    ],
  });
  const f = fixture(":memory:", {
    ...configuration,
    scenarios: [...configuration.scenarios, scenario],
  });
  f.command({ action: "select", scenarioId: scenario.id });
  f.command({ action: "start" });
  f.command({ action: "advance", deltaMs: 3000 });
  const run = f.runtime.getRun("equipment");
  const snapshot = run.snapshot;
  const worker = snapshot.workers[0];
  assert.ok(worker?.currentGuidance);
  expect(worker.currentGuidance.actionCode).toBe("CONFIRM_ARRIVAL");
  const context: EvaluationContext = {
    map: configuration.map,
    policy: run.policy,
    now: new Date().toISOString(),
    arrivalTargets: run.arrivalTargets,
    arrivalIntents: run.arrivalIntents,
    forceWorkerIds: [],
    connectedRecipients: 0,
  };
  return { f, run, snapshot, worker, context };
}

export function rawDecision(snapshot: SimulationSnapshot, context: EvaluationContext) {
  const worker = snapshot.workers[0];
  assert.ok(worker);
  return evaluateWorkerPlan({
    map: context.map,
    worker,
    hazards: snapshot.hazards,
    closedEdgeIds: snapshot.closedEdgeIds,
    policy: context.policy,
    now: context.now,
    plannedRoute: worker.currentGuidance?.waypoints ?? [],
  });
}
