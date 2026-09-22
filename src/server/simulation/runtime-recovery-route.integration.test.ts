import assert from "node:assert/strict";
import { describe, expect, it } from "vitest";
import { assessExposure, routeWorker } from "../engine";
import { expectBlockingReissue, fixture } from "./runtime-test-fixtures";

type RouteRecovery = "valid" | "unverified-profile" | "no-safe-attachment";

function routeRecovery(state: RouteRecovery) {
  const f = fixture();
  f.command({ action: "select", scenarioId: "EQ-NO-ROUTE" });
  f.command({ action: "start" });
  f.command({ action: "advance", deltaMs: 1000 });
  const run = f.runtime.getRun("equipment");
  const previous = run.snapshot.workers[0]?.currentGuidance;
  assert.ok(previous);
  expect(previous.actionCode).toBe("ROUTE_UNAVAILABLE");
  run.world = {
    ...run.world,
    state: {
      ...run.world.state,
      blockedPathIds: [],
      workers: run.world.state.workers.map((worker) =>
        worker.workerId === "WORKER-A"
          ? {
              ...worker,
              position: state === "no-safe-attachment" ? { x: 110, y: 25 } : { x: 100, y: 8 },
              profile:
                state === "unverified-profile"
                  ? { ...worker.profile, confirmedAt: null, version: worker.profile.version + 1 }
                  : worker.profile,
            }
          : worker,
      ),
    },
  };
  return { run, previous, now: new Date().toISOString() };
}

describe("runtime guidance after route recovery", () => {
  it.each(["valid", "unverified-profile", "no-safe-attachment"] as const)(
    "requires an actual current route before recovering a %s routing context",
    (state) => {
      // Given
      const { run, previous, now } = routeRecovery(state);
      // When
      const result = run.evaluate(now);
      // Then
      const worker = result.workers[0];
      assert.ok(worker);
      expect(assessExposure(worker.position, previous.waypoints, result.hazards)).toEqual({
        current: false,
        plannedRoute: false,
      });
      const response = run.policy.responses.find(
        (entry) => entry.hazardType === previous.hazardType,
      );
      assert.ok(response);
      const actualRoute = routeWorker({
        map: run.configuration.map,
        position: worker.position,
        profile: worker.profile,
        hazards: result.hazards,
        closedEdgeIds: result.closedEdgeIds,
        destinationIds: response.destinationIds,
      });
      expect(result.closedEdgeIds).toEqual([]);
      if (state === "valid") {
        expect(actualRoute.kind).toBe("valid");
        expect(worker.currentGuidance).toMatchObject({
          actionCode: "GUIDANCE_UPDATED",
          incidentId: previous.incidentId,
          messageArgs: { reasonCode: "risk-context-recalculated" },
          waypoints: [],
          destinationId: null,
          routeVersion: null,
          stepId: null,
        });
      } else {
        expect(actualRoute).toMatchObject({
          kind: "unavailable",
          reason: state === "unverified-profile" ? "profile-unverified" : "no-safe-attachment",
        });
        expect(worker.currentGuidance).toEqual(previous);
      }
      expect(worker.response.arrivedAt).toBeNull();
    },
  );

  it.each(["unverified-profile", "no-safe-attachment"] as const)(
    "does not bypass unresolved %s when a primary update is forced",
    (state) => {
      // Given
      const { run, now, previous } = routeRecovery(state);
      // When
      const result = run.evaluate(now, 0, ["WORKER-A"]);
      // Then
      const worker = result.workers[0];
      assert.ok(worker);
      expectBlockingReissue(previous, worker, now);
    },
  );
});
