import assert from "node:assert/strict";
import { describe, expect, it } from "vitest";
import { expectBlockingReissue, fixture } from "./runtime-test-fixtures";

type SensorRecovery = "current" | "stale" | "disconnected" | "absent-hazard" | "absent-sensor";

function sensorRecovery(state: SensorRecovery) {
  const f = fixture();
  f.command({ action: "select", scenarioId: "FG-SENSOR-STALE" }, "fire-gas");
  f.command({ action: "speed", speed: 1 }, "fire-gas");
  f.command({ action: "start" }, "fire-gas");
  f.command({ action: "advance", deltaMs: 7000 }, "fire-gas");
  const run = f.runtime.getRun("fire-gas");
  const now = new Date().toISOString();
  const gas = run.world.state.hazards.find((hazard) => hazard.type === "gas");
  assert.ok(gas);
  run.world = {
    ...run.world,
    state: {
      ...run.world.state,
      hazards: [...run.world.state.hazards, { ...gas, id: "FIRE-ZONE-B", type: "fire" }],
    },
  };
  run.evaluate(now);
  const previous = run.snapshot.workers.find(
    (worker) => worker.workerId === "WORKER-B",
  )?.currentGuidance;
  assert.ok(previous);
  expect(previous).toMatchObject({
    actionCode: "SENSOR_UNKNOWN",
    hazardIds: ["FIRE-ZONE-B", "GAS-ZONE-B"],
  });
  run.world = {
    ...run.world,
    state: {
      ...run.world.state,
      workers: run.world.state.workers.map((worker) =>
        worker.workerId === "WORKER-B" ? { ...worker, position: { x: 100, y: 8 } } : worker,
      ),
      hazards: run.world.state.hazards.filter(
        (hazard) => state !== "absent-hazard" || hazard.id !== gas.id,
      ),
      sensors: run.world.state.sensors
        .filter((sensor) => state !== "absent-sensor" || sensor.hazardType !== "gas")
        .map((sensor) => ({
          ...sensor,
          observedAtMs: sensor.hazardType === "gas" && state === "stale" ? 0 : 7000,
          connected: sensor.hazardType !== "gas" || state !== "disconnected",
        })),
    },
  };
  return { run, now, previous };
}

describe("runtime guidance after sensor recovery", () => {
  it("updates safe-position guidance only after every previous hazard has a fresh sensor", () => {
    // Given
    const { run, now, previous } = sensorRecovery("current");
    // When
    const result = run.evaluate(now);
    // Then
    expect(result.hazards.every((hazard) => hazard.sensorStatus === "current")).toBe(true);
    expect(
      result.workers.find((worker) => worker.workerId === "WORKER-B")?.currentGuidance,
    ).toMatchObject({
      actionCode: "GUIDANCE_UPDATED",
      incidentId: previous.incidentId,
      messageArgs: { reasonCode: "risk-context-recalculated" },
      waypoints: [],
      destinationId: null,
      routeVersion: null,
      stepId: null,
    });
  });

  it.each(["stale", "disconnected", "absent-hazard", "absent-sensor"] as const)(
    "preserves uncertainty outside the old polygon when one prior hazard is %s",
    (state) => {
      // Given
      const { run, now, previous } = sensorRecovery(state);
      // When
      const result = run.evaluate(now);
      // Then
      const worker = result.workers.find((entry) => entry.workerId === "WORKER-B");
      expect(result.hazards.find((hazard) => hazard.hazardId === "FIRE-ZONE-B")?.sensorStatus).toBe(
        "current",
      );
      const gas = result.hazards.find((hazard) => hazard.hazardId === "GAS-ZONE-B");
      if (state === "absent-hazard") expect(gas).toBeUndefined();
      else expect(gas?.sensorStatus).toBe(state === "stale" ? "stale" : "disconnected");
      expect(worker?.position).toEqual({ x: 100, y: 8 });
      expect(worker?.currentGuidance).toEqual(previous);
    },
  );

  it("does not bypass an unresolved sensor when a primary update is forced", () => {
    // Given
    const { run, now, previous } = sensorRecovery("stale");
    // When
    const result = run.evaluate(now, 0, ["WORKER-B"]);
    // Then
    const worker = result.workers.find((entry) => entry.workerId === "WORKER-B");
    assert.ok(worker);
    expectBlockingReissue(previous, worker, now);
  });
});
