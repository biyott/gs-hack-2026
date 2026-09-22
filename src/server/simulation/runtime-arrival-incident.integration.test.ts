import assert from "node:assert/strict";
import { describe, expect, it } from "vitest";
import type { SimulationSnapshot } from "@/contracts";
import { evaluateWorkerPlan } from "../engine";
import { type EvaluationContext, evaluateSnapshot } from "./evaluate";
import { fixture } from "./runtime-test-fixtures";

describe("QD004 incoming incident arrival boundary", () => {
  it.each(["same destination", "different destination", "overlapping incidents"] as const)(
    "requires the selected incident's own eligibility with %s",
    (boundary) => {
      const f = fixture();
      f.command({ action: "select", scenarioId: "EQ-ARRIVAL" });
      f.command({ action: "start" });
      f.command({ action: "advance", deltaMs: 1000 });
      const run = f.runtime.getRun("equipment");
      const before = run.snapshot;
      const worker = before.workers[0];
      const previous = worker?.currentGuidance;
      const oldHazard = before.hazards[0];
      assert.ok(worker && previous && oldHazard);
      expect(previous.actionCode).toBe("FOLLOW_VALIDATED_ROUTE");
      const target = previous.waypoints.at(-1);
      const behind = previous.waypoints[0];
      const incidentA = before.incidents.find(
        (incident) => incident.incidentId === previous.incidentId,
      );
      assert.ok(target && behind && incidentA);
      expect(Math.hypot(target.x - behind.x, target.y - behind.y)).toBeGreaterThan(2);
      expect(run.arrivalIntents[worker.workerId]?.incidentId).toBe(previous.incidentId);
      const now = new Date().toISOString();
      const overlapping = boundary === "overlapping incidents";
      const hazardIds = overlapping
        ? [oldHazard.hazardId, "QD004-UNRELATED-B"].sort()
        : ["QD004-UNRELATED-B"];
      const destinationId =
        boundary === "different destination" ? "REFUGE-02" : previous.destinationId;
      const policy =
        boundary === "different destination"
          ? {
              ...run.policy,
              responses: run.policy.responses.map((response) => ({
                ...response,
                destinationIds: ["REFUGE-02"],
              })),
            }
          : run.policy;

      // This exact evaluation seam supplies a fresh position and a distinct hazard behind it.
      const incoming: SimulationSnapshot = {
        ...before,
        workers: before.workers.map((entry) =>
          entry.workerId === worker.workerId
            ? {
                ...entry,
                position: { x: target.x, y: target.y },
                positionStatus: "known",
                lastObservedAt: now,
              }
            : entry,
        ),
        incidents: overlapping
          ? [
              ...before.incidents,
              {
                ...incidentA,
                incidentId: "QD004-INCIDENT-B",
                hazardIds: ["QD004-UNRELATED-B"],
                firstGuidance: [],
                currentGuidance: [],
                audit: [],
              },
            ]
          : before.incidents,
        hazards: hazardIds.map((hazardId) => ({
          ...oldHazard,
          hazardId,
          active: true,
          affectedWorkerIds: [],
          polygon: [
            { x: behind.x - 0.25, y: behind.y - 0.25 },
            { x: behind.x + 0.25, y: behind.y - 0.25 },
            { x: behind.x + 0.25, y: behind.y + 0.25 },
            { x: behind.x - 0.25, y: behind.y + 0.25 },
          ],
        })),
      };
      const currentWorker = incoming.workers[0];
      assert.ok(currentWorker);
      const decision = evaluateWorkerPlan({
        map: run.configuration.map,
        worker: currentWorker,
        hazards: incoming.hazards,
        closedEdgeIds: incoming.closedEdgeIds,
        policy,
        now,
        plannedRoute: previous.waypoints,
      });
      expect(decision).toMatchObject({
        actionCode: "FOLLOW_VALIDATED_ROUTE",
        hazardIds,
        destinationId,
        exposure: { current: false, plannedRoute: true },
      });
      if (boundary !== "different destination")
        expect(decision.route?.waypoints.at(-1)).toEqual(target);
      const context: EvaluationContext = {
        map: run.configuration.map,
        policy,
        now,
        arrivalTargets: run.arrivalTargets,
        arrivalIntents: run.arrivalIntents,
        forceWorkerIds: [],
        connectedRecipients: 0,
      };
      const result = evaluateSnapshot(incoming, context);
      const guidance = result.workers[0]?.currentGuidance;
      assert.ok(guidance);
      expect(guidance.incidentId).not.toBe(previous.incidentId);
      if (overlapping) expect(guidance.incidentId).toBe("QD004-INCIDENT-B");
      const incidentB = result.incidents.find((entry) => entry.incidentId === guidance.incidentId);
      expect([...(incidentB?.hazardIds ?? [])].sort()).toEqual(hazardIds);
      expect(incidentB?.firstGuidance[0]).toEqual(guidance);
      expect(
        result.incidents.find((entry) => entry.incidentId === previous.incidentId)?.firstGuidance,
      ).toEqual(incidentA.firstGuidance);
      expect(guidance).toMatchObject({ actionCode: "FOLLOW_VALIDATED_ROUTE", destinationId });
      expect(result.workers[0]?.response.arrivedAt).toBeNull();
      run.snapshot = result;
      run.rememberDestinations();
      expect(run.arrivalIntents[worker.workerId]).toMatchObject({
        incidentId: guidance.incidentId,
        guidanceId: guidance.guidanceId,
        destinationId,
      });
      if (boundary !== "different destination") {
        const returned = evaluateSnapshot(result, context);
        expect(returned.workers[0]?.currentGuidance).toMatchObject({
          actionCode: "CONFIRM_ARRIVAL",
          incidentId: guidance.incidentId,
        });
        expect(returned.workers[0]?.response.arrivedAt).toBeNull();
        expect(
          returned.incidents.find((entry) => entry.incidentId === guidance.incidentId)
            ?.firstGuidance,
        ).toEqual(incidentB?.firstGuidance);
      }
    },
  );
});
