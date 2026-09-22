import type { SimulationSnapshot } from "@gs-safety/contracts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadConfiguration } from "../simulation/configuration";
import { SimulationRun } from "../simulation/run";

const configuration = loadConfiguration();

function normalized(snapshot: SimulationSnapshot) {
  return {
    virtualTimeMs: snapshot.run.virtualTimeMs,
    status: snapshot.run.status,
    hazards: snapshot.hazards.map(({ hazardId, hazardType, polygon, active, sensorStatus }) => ({
      hazardId,
      hazardType,
      polygon,
      active,
      sensorStatus,
    })),
    workers: snapshot.workers.map((worker) => ({
      workerId: worker.workerId,
      position: worker.position,
      positionStatus: worker.positionStatus,
      actionCode: worker.currentGuidance?.actionCode ?? null,
      destinationId: worker.currentGuidance?.destinationId ?? null,
      waypointIds: worker.currentGuidance?.waypoints.map((point) => point.nodeId) ?? [],
      profileVersion: worker.currentGuidance?.profileVersion ?? null,
    })),
    closedEdgeIds: snapshot.closedEdgeIds,
  };
}

describe("deterministic complete scenario replay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-21T09:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  for (const scenario of configuration.scenarios) {
    it(`repeats all event-time outcomes when replaying ${scenario.id} three times`, () => {
      // Given
      const runs = Array.from({ length: 3 }, () => new SimulationRun(scenario, configuration));
      // When
      const outcomes = runs.map((run) => {
        run.start(scenario.clockEpoch, 0);
        return run.advance(scenario.durationMs, 0).map(normalized);
      });
      // Then
      expect(outcomes[1]).toEqual(outcomes[0]);
      expect(outcomes[2]).toEqual(outcomes[0]);
      expect(runs.every((run) => run.snapshot.run.status === "completed")).toBe(true);
      expect(new Set(runs.map((run) => run.snapshot.run.runId)).size).toBe(3);
    });
  }
});
