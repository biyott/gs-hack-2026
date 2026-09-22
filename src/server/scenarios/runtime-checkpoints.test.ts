import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadConfiguration } from "../simulation/configuration";
import { SimulationRun } from "../simulation/run";
import { ScenarioDataError } from "./loader";
import type { ExpectedResult } from "./schema";

const configuration = loadConfiguration();

function verifyCheckpoint(run: SimulationRun, expected: ExpectedResult): void {
  const worker =
    "workerId" in expected
      ? run.snapshot.workers.find((candidate) => candidate.workerId === expected.workerId)
      : undefined;
  switch (expected.kind) {
    case "guidance": {
      const guidance = worker?.currentGuidance;
      expect(guidance?.actionCode).toBe(expected.actionCode);
      if (expected.route === "empty") {
        expect(guidance?.waypoints).toEqual([]);
        expect(guidance?.destinationId).toBeNull();
      } else {
        expect(guidance?.waypoints.length).toBeGreaterThan(1);
        expect(expected.destinationIds).toContain(guidance?.destinationId);
      }
      break;
    }
    case "active-hazards":
      expect(
        run.snapshot.hazards
          .filter((hazard) => hazard.active)
          .map((hazard) => hazard.hazardId)
          .sort(),
      ).toEqual([...expected.hazardIds].sort());
      break;
    case "blocked-paths":
      expect([...run.world.state.blockedPathIds].sort()).toEqual([...expected.pathIds].sort());
      expect([...run.snapshot.closedEdgeIds].sort()).toEqual(
        configuration.map.edges
          .filter((edge) => expected.pathIds.includes(edge.pathId))
          .map((edge) => edge.id)
          .sort(),
      );
      break;
    case "source-state": {
      const entity =
        run.snapshot.workers.find((candidate) => candidate.workerId === expected.entityId) ??
        (expected.entityId === "EQUIPMENT-A" ? run.snapshot.equipment : undefined);
      if (entity !== undefined) {
        expect(entity.positionStatus).toBe(
          expected.state === "fresh"
            ? "known"
            : expected.state === "disconnected"
              ? "unknown"
              : expected.state,
        );
      } else {
        const sensor = run.world.state.sensors.find(
          (candidate) => candidate.sensorId === expected.entityId,
        );
        const hazard = run.snapshot.hazards.find(
          (candidate) =>
            candidate.zoneId === sensor?.zoneId && candidate.hazardType === sensor?.hazardType,
        );
        expect(hazard?.sensorStatus).toBe(expected.state === "fresh" ? "current" : expected.state);
      }
      break;
    }
    case "profile-route": {
      const guidance = worker?.currentGuidance;
      expect(guidance?.messageArgs["assistanceRequired"]).toBe(expected.assistanceRequired);
      const points = guidance?.waypoints ?? [];
      const usedEdges = configuration.map.edges.filter((edge) =>
        points.some((point, index) => {
          const next = points[index + 1];
          return (
            next !== undefined &&
            ((point.nodeId === edge.from && next.nodeId === edge.to) ||
              (point.nodeId === edge.to && next.nodeId === edge.from))
          );
        }),
      );
      expect(usedEdges.filter((edge) => expected.forbiddenEdgeIds.includes(edge.id))).toEqual([]);
      break;
    }
    case "arrival": {
      const destination = configuration.map.nodes.find(
        (node) => node.id === expected.destinationId,
      );
      if (destination === undefined)
        throw new ScenarioDataError(expected.destinationId, "Arrival destination missing from map");
      expect(worker?.currentGuidance?.actionCode).toBe("CONFIRM_ARRIVAL");
      expect(worker?.response).toMatchObject({
        receivedAt: null,
        understoodAt: null,
        arrivedAt: null,
      });
      expect(run.arrivalTargets[expected.workerId]).toMatchObject({
        x: destination.x,
        y: destination.y,
      });
      break;
    }
    default:
      assertNever(expected);
  }
}

function assertNever(expected: never): never {
  throw new ScenarioDataError("checkpoint", `Unsupported expectation ${String(expected)}`);
}

describe("real scenario runtime checkpoints", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-21T09:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  for (const scenario of configuration.scenarios) {
    it(`meets declared outcomes when replaying ${scenario.id}`, () => {
      // Given
      const run = new SimulationRun(scenario, configuration);
      run.start(scenario.clockEpoch, 0);
      // When / Then: each declared event checkpoint is an independently observable transition.
      for (const expected of [...scenario.expectedResults].sort(
        (left, right) => left.atMs - right.atMs,
      )) {
        run.advance((expected.atMs - run.snapshot.run.virtualTimeMs) / run.snapshot.run.speed, 0);
        verifyCheckpoint(run, expected);
      }
    });
  }
});
