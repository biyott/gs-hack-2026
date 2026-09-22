import assert from "node:assert/strict";
import { describe, expect, it } from "vitest";
import type { ScenarioEvent } from "../scenarios";
import { loadConfiguration } from "./configuration";
import { SimulationRun } from "./run";

const configuration = loadConfiguration();
const selectedScenario = configuration.scenarios.find((entry) => entry.id === "EQ-APPROACH");
assert.ok(selectedScenario);
const scenario = selectedScenario;
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
  headingDeg: 170,
  slewDeg: 10,
  speedMps: 2,
  atMs: 1000,
};

function running(events: readonly ScenarioEvent[] = [workerTarget, equipmentTarget]) {
  const run = new SimulationRun({ ...scenario, durationMs: 2000, events }, configuration);
  run.clock.setSpeed(1);
  run.start(scenario.clockEpoch, 0);
  return run;
}

describe("scenario motion authority boundaries", () => {
  it.each(["scenario", "measured"] as const)(
    "preserves measured entity positions while the run input is %s",
    (positionInput) => {
      const run = running();
      run.snapshot = {
        ...run.snapshot,
        run: { ...run.snapshot.run, positionInput },
        equipment: {
          ...run.snapshot.equipment,
          position: { x: 42, y: 7 },
          positionSource: "uwb",
        },
        workers: run.snapshot.workers.map((worker) => ({
          ...worker,
          position: { x: 75, y: 9 },
          positionSource: "video",
        })),
      };
      run.advance(500, 0);
      expect(run.world.state.equipment?.position).toEqual({ x: 30, y: 25 });
      expect(run.world.state.workers[0]?.position).toEqual({ x: 65, y: 25 });
      run.advance(500, 0);
      expect(run.snapshot.equipment.position).toEqual({ x: 42, y: 7 });
      expect(run.snapshot.workers[0]?.position).toEqual({ x: 75, y: 9 });
    },
  );

  it.each([true, false])("holds existing frozen or disconnected sources (frozen=%s)", (frozen) => {
    const run = running();
    const equipment = run.world.state.equipment;
    assert.ok(equipment);
    run.world = {
      frozenSourceIds: new Set(frozen ? ["EQUIPMENT-A", "WORKER-A"] : []),
      state: {
        ...run.world.state,
        equipment: { ...equipment, connected: frozen },
        workers: run.world.state.workers.map((worker) => ({ ...worker, connected: frozen })),
      },
    };
    run.advance(500, 0);
    expect(run.snapshot.equipment.position).toEqual({ x: 30, y: 25 });
    expect(run.snapshot.workers[0]?.position).toEqual({ x: 65, y: 25 });
    expect(run.world.state.equipment?.observedAtMs).toBe(0);
    expect(run.world.state.workers[0]?.observedAtMs).toBe(0);
  });

  it("does not move toward a delayed stale observation or skip it for a later fresh pose", () => {
    const run = running([
      { ...workerTarget, observedAtMs: 0 },
      { ...equipmentTarget, observedAtMs: 0 },
      { ...workerTarget, id: "fresh-worker", atMs: 2000 },
      { ...equipmentTarget, id: "fresh-equipment", atMs: 2000 },
    ]);
    run.advance(500, 0);
    expect(run.snapshot.equipment.position).toEqual({ x: 30, y: 25 });
    expect(run.snapshot.workers[0]?.position).toEqual({ x: 65, y: 25 });
    run.advance(1000, 0);
    expect(run.world.state.equipment?.observedAtMs).toBe(0);
    expect(run.world.state.workers[0]?.observedAtMs).toBe(0);
    expect(run.world.frozenSourceIds).toEqual(new Set(["EQUIPMENT-A", "WORKER-A"]));
  });

  it("does not interpolate through an upcoming source connection gap", () => {
    const run = running([
      {
        id: "disconnect",
        type: "source.connection",
        entityId: "WORKER-A",
        connected: false,
        atMs: 250,
      },
      {
        id: "reconnect",
        type: "source.connection",
        entityId: "WORKER-A",
        connected: true,
        atMs: 750,
      },
      workerTarget,
    ]);
    run.advance(125, 0);
    expect(run.snapshot.workers[0]?.position).toEqual({ x: 65, y: 25 });
    run.advance(500, 0);
    expect(run.snapshot.workers[0]?.position).toEqual({ x: 65, y: 25 });
    expect(run.snapshot.workers[0]?.positionStatus).toBe("unknown");
    run.advance(250, 0);
    expect(run.snapshot.workers[0]?.position).toEqual({ x: 70, y: 20 });
  });

  it("preserves unknown positions until a fresh non-null delivery", () => {
    const run = running([
      { ...workerTarget, position: null },
      { ...workerTarget, id: "restored", atMs: 2000 },
    ]);
    run.advance(500, 0);
    expect(run.snapshot.workers[0]?.position).toEqual({ x: 65, y: 25 });
    run.advance(1000, 0);
    expect(run.snapshot.workers[0]?.position).toBeNull();
    run.advance(500, 0);
    expect(run.snapshot.workers[0]?.position).toEqual(workerTarget.position);
  });

  it("uses the short heading arc across negative and positive angles", () => {
    const run = running();
    const equipment = run.world.state.equipment;
    assert.ok(equipment);
    run.world = {
      ...run.world,
      state: { ...run.world.state, equipment: { ...equipment, headingDeg: -170 } },
    };
    run.advance(500, 0);
    expect(run.snapshot.equipment.headingDeg).toBe(-180);
  });

  it("keeps fixed tower chassis constraints during intermediate motion", () => {
    const run = running();
    run.snapshot = {
      ...run.snapshot,
      equipment: { ...run.snapshot.equipment, presetId: "liebherr-172ecb" },
    };
    run.advance(500, 0);
    expect(run.snapshot.equipment).toMatchObject({
      position: configuration.map.metadata.craneOrigin,
      headingDeg: 0,
      speedMps: 0,
      slewDeg: 5,
    });
  });

  it("keeps same-time event ordering and pauses movement with the clock", () => {
    const run = running([
      workerTarget,
      { ...workerTarget, id: "latest", position: { x: 80, y: 10 } },
    ]);
    run.advance(500, 0);
    const midpoint = run.snapshot.workers[0]?.position;
    run.clock.pause();
    expect(run.advance(250, 0)).toEqual([]);
    expect(run.snapshot.workers[0]?.position).toEqual(midpoint);
    run.clock.resume();
    run.advance(500, 0);
    expect(run.snapshot.workers[0]?.position).toEqual({ x: 80, y: 10 });
  });
});
