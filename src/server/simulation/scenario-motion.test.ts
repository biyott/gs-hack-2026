import assert from "node:assert/strict";
import { describe, expect, it } from "vitest";
import type { ScenarioEvent } from "../scenarios";
import { loadConfiguration } from "./configuration";
import { SimulationRun } from "./run";

const configuration = loadConfiguration();
const selectedScenario = configuration.scenarios.find((entry) => entry.id === "EQ-APPROACH");
assert.ok(selectedScenario);
const scenario = selectedScenario;
const equipment = scenario.initial.equipment;
assert.ok(equipment);
const workerTarget: ScenarioEvent = {
  id: "worker-target",
  type: "worker.position",
  workerId: "WORKER-A",
  position: { x: 75, y: 15 },
  atMs: 1000,
};
const equipmentTarget: ScenarioEvent = {
  id: "equipment-target",
  type: "equipment.pose",
  position: { x: 40, y: 35 },
  headingDeg: 10,
  slewDeg: 10,
  speedMps: 2,
  atMs: 1000,
};
const motionScenario = {
  ...scenario,
  durationMs: 2000,
  initial: {
    ...scenario.initial,
    equipment: { ...equipment, headingDeg: 350, slewDeg: -10 },
  },
  events: [workerTarget, equipmentTarget],
};

function running(events: readonly ScenarioEvent[] = motionScenario.events): SimulationRun {
  const run = new SimulationRun({ ...motionScenario, events }, configuration);
  run.clock.setSpeed(1);
  run.start(scenario.clockEpoch, 0);
  return run;
}

describe("scenario motion between keyframes", () => {
  it("moves workers and equipment before their next position event", () => {
    const run = running();
    run.advance(500, 0);
    expect(run.snapshot.workers[0]?.position).toEqual({ x: 70, y: 20 });
    expect(run.snapshot.equipment.position).toEqual({ x: 35, y: 30 });
    expect(run.snapshot.equipment.headingDeg % 360).toBe(0);
    expect(run.snapshot.equipment.slewDeg).toBe(0);
    expect(run.snapshot.equipment.speedMps).toBe(0);
    expect(run.snapshot.events.filter((event) => event.kind.startsWith("scenario."))).toEqual([]);
    expect(run.snapshot.workers[0]?.positionInputSource).toBe("synthetic");
  });

  it("preserves exact event endpoints and stops after the last keyframe", () => {
    const run = running();
    run.advance(1000, 0);
    expect(run.snapshot.workers[0]?.position).toEqual(workerTarget.position);
    expect(run.snapshot.equipment).toMatchObject({
      position: equipmentTarget.position,
      headingDeg: 10,
      slewDeg: 10,
      speedMps: 2,
    });
    run.advance(500, 0);
    expect(run.snapshot.equipment.position).toEqual(equipmentTarget.position);
  });

  it("keeps the same trajectory across scheduler partitions and unrelated events", () => {
    const profile = motionScenario.initial.workers[0]?.profile;
    assert.ok(profile);
    const events: readonly ScenarioEvent[] = [
      { id: "profile", type: "worker.profile", profile, atMs: 250 },
      ...motionScenario.events,
      { ...workerTarget, id: "next-leg", position: { x: 95, y: 15 }, atMs: 2000 },
    ];
    const once = running(events);
    const partitioned = running(events);
    once.advance(1500, 0);
    for (let step = 0; step < 15; step += 1) partitioned.advance(100, 0);
    expect(once.snapshot.workers[0]?.position).toEqual({ x: 85, y: 15 });
    expect(partitioned.snapshot.workers[0]?.position?.x).toBeCloseTo(85);
    expect(partitioned.snapshot.workers[0]?.position?.y).toBeCloseTo(15);
    expect(partitioned.snapshot.equipment.position).toEqual(once.snapshot.equipment.position);
  });

  it.each([true, false])(
    "continues midpoint motion after recovery with checkpoint=%s",
    (durable) => {
      const original = running();
      original.advance(500, 0);
      const saved = original.snapshot;
      const checkpoint = original.checkpoint();
      const restored = new SimulationRun(motionScenario, configuration, saved);
      if (durable) restored.restoreCheckpoint(checkpoint);
      restored.clock.resume();
      restored.advance(250, 0);
      original.advance(250, 0);
      expect(restored.snapshot.equipment.position).toEqual({ x: 37.5, y: 32.5 });
      expect(restored.snapshot.workers[0]?.position).toEqual({ x: 72.5, y: 17.5 });
      expect(restored.snapshot.equipment.position).toEqual(original.snapshot.equipment.position);
      expect(restored.snapshot.equipment.headingDeg).toBe(original.snapshot.equipment.headingDeg);
    },
  );

  it("rebases the remaining segment on a manually adjusted world pose", () => {
    const run = running();
    run.advance(500, 0);
    const source = run.world.state.equipment;
    assert.ok(source);
    run.world = {
      ...run.world,
      state: { ...run.world.state, equipment: { ...source, position: { x: 38, y: 33 } } },
    };
    run.evaluate(scenario.clockEpoch);
    expect(run.snapshot.equipment.position).toEqual({ x: 38, y: 33 });
    run.advance(250, 0);
    expect(run.snapshot.equipment.position).toEqual({ x: 39, y: 34 });
  });
});
