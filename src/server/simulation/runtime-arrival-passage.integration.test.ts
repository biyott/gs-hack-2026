import assert from "node:assert/strict";
import { describe, expect, it } from "vitest";
import type { Guidance, SimulationSnapshot } from "@/contracts";
import { routeWorker } from "../engine";
import { closedArrival, rawDecision } from "./arrival-passage.test-support";
import { evaluateSnapshot } from "./evaluate";

describe("QD004-D1 factual arrival with unrelated passage restrictions", () => {
  it("keeps a verified arrival and permits departure/return while preserving closures and explicit ACK history", () => {
    const { f, run, snapshot, worker } = closedArrival();
    const owners = [...run.closureOwners].map(([edge, signals]) => [edge, [...signals]]);
    const first = snapshot.incidents.map((incident) => incident.firstGuidance);
    const ack = f.response("arrived");
    f.runtime.respond(ack, f.session("worker-a"));
    const departed = f.command({ action: "advance", deltaMs: 1000 });
    expect(departed.workers[0]?.currentGuidance?.actionCode).not.toBe("CONFIRM_ARRIVAL");
    expect(departed.workers[0]?.response.arrivedAt).toBeNull();
    expect(() => f.runtime.respond(f.response("arrived"), f.session("worker-a"))).toThrowError(
      expect.objectContaining({ code: "ARRIVAL_UNVERIFIED" }),
    );
    const returned = f.command({ action: "advance", deltaMs: 1000 });
    expect(returned.workers[0]?.currentGuidance).toMatchObject({
      actionCode: "CONFIRM_ARRIVAL",
      guidanceId: worker.currentGuidance?.guidanceId,
      waypoints: [],
      destinationId: null,
      routeVersion: null,
      stepId: null,
    });
    expect(returned.workers[0]?.response.arrivedAt).toBeNull();
    expect(returned.closedEdgeIds).toEqual(snapshot.closedEdgeIds);
    expect([...run.closureOwners].map(([edge, signals]) => [edge, [...signals]])).toEqual(owners);
    expect(returned.incidents.map((incident) => incident.firstGuidance)).toEqual(first);
    expect(returned.incidents.every((incident) => incident.passageReopenedAt === null)).toBe(true);
    expect(f.repository.responseReceipt(ack)?.snapshot.workers[0]?.response.arrivedAt).toBe(
      ack.occurredAt,
    );
  });

  it.each(["profile", "target access"] as const)(
    "does not confirm when current %s makes the exact target route unavailable",
    (cause) => {
      const { snapshot, worker, context } = closedArrival();
      const blocked: SimulationSnapshot = {
        ...snapshot,
        hazards: [],
        closedEdgeIds:
          cause === "target access"
            ? [
                ...snapshot.closedEdgeIds,
                ...context.map.edges
                  .filter((edge) => edge.from === "REFUGE-02" || edge.to === "REFUGE-02")
                  .map((edge) => edge.id),
              ]
            : snapshot.closedEdgeIds,
        workers: snapshot.workers.map((entry) =>
          entry.workerId === worker.workerId && cause === "profile"
            ? { ...entry, profile: { ...entry.profile, confirmedAt: null } }
            : entry,
        ),
      };
      const current = blocked.workers[0];
      assert.ok(current);
      expect(rawDecision(blocked, context)).toMatchObject({
        actionCode: "AWAIT_REOPEN_AUTHORIZATION",
        hazardIds: [],
        exposure: { current: false, plannedRoute: false },
      });
      expect(
        routeWorker({
          map: context.map,
          position: current.position,
          profile: current.profile,
          hazards: blocked.hazards,
          closedEdgeIds: blocked.closedEdgeIds,
          destinationIds: ["REFUGE-02"],
        }).kind,
      ).toBe("unavailable");
      expect(evaluateSnapshot(blocked, context).workers[0]?.currentGuidance?.actionCode).toBe(
        "AWAIT_REOPEN_AUTHORIZATION",
      );
    },
  );

  it.each(["at target", "before target"] as const)(
    "retains an unresolved sensor cause through repeated fallback %s, then requires real recovery",
    (where) => {
      const { snapshot, worker, context } = closedArrival();
      assert.ok(worker.currentGuidance);
      const guidance: Guidance = {
        ...worker.currentGuidance,
        actionCode: "SENSOR_UNKNOWN",
        priority: "critical",
        hazardIds: ["EQUIPMENT-A:missing-sensor"],
        messageArgs: {
          ...worker.currentGuidance.messageArgs,
          reasonCode: "sensor-unknown",
          assistanceRequired: true,
        },
      };
      let pending: SimulationSnapshot = {
        ...snapshot,
        hazards: [],
        workers: snapshot.workers.map((entry) =>
          entry.workerId === worker.workerId
            ? {
                ...entry,
                currentGuidance: guidance,
                position: where === "before target" ? { x: 100, y: 42 } : entry.position,
              }
            : entry,
        ),
        incidents: snapshot.incidents.map((incident) =>
          incident.incidentId === guidance.incidentId
            ? {
                ...incident,
                currentGuidance: incident.currentGuidance.map((entry) =>
                  entry.workerId === worker.workerId ? guidance : entry,
                ),
              }
            : incident,
        ),
      };
      for (let index = 0; index < 2; index += 1) {
        expect(rawDecision(pending, context)).toMatchObject({
          actionCode: "AWAIT_REOPEN_AUTHORIZATION",
          hazardIds: [],
        });
        const positioned = pending.workers[0];
        assert.ok(positioned);
        expect(
          routeWorker({
            map: context.map,
            position: positioned.position,
            profile: positioned.profile,
            hazards: pending.hazards,
            closedEdgeIds: pending.closedEdgeIds,
            destinationIds: ["REFUGE-02"],
          }).kind,
        ).toBe("valid");
        pending = evaluateSnapshot(pending, context);
        expect(pending.workers[0]?.currentGuidance).toMatchObject({
          actionCode: "SENSOR_UNKNOWN",
          priority: "critical",
          hazardIds: guidance.hazardIds,
          messageArgs: { reasonCode: "sensor-unknown", assistanceRequired: true },
        });
      }
      pending = {
        ...pending,
        workers: pending.workers.map((entry) =>
          entry.workerId === worker.workerId ? { ...entry, position: { x: 125, y: 42 } } : entry,
        ),
      };
      expect(evaluateSnapshot(pending, context).workers[0]?.currentGuidance?.actionCode).toBe(
        "SENSOR_UNKNOWN",
      );
      const historical = snapshot.hazards[0];
      assert.ok(historical);
      const recovered = {
        ...pending,
        hazards: [
          {
            ...historical,
            hazardId: "EQUIPMENT-A:missing-sensor",
            active: false,
            sensorStatus: "current" as const,
            observedAt: context.now,
            affectedWorkerIds: [],
          },
        ],
      };
      expect(evaluateSnapshot(recovered, context).workers[0]?.currentGuidance?.actionCode).toBe(
        "CONFIRM_ARRIVAL",
      );
    },
  );

  it.each(["unknown", "stale"] as const)(
    "preserves the real engine position blocker for %s input",
    (positionStatus) => {
      const { snapshot, worker, context } = closedArrival();
      const uncertain = {
        ...snapshot,
        workers: snapshot.workers.map((entry) =>
          entry.workerId === worker.workerId ? { ...entry, positionStatus } : entry,
        ),
      };
      expect(rawDecision(uncertain, context).actionCode).toBe("POSITION_UNKNOWN");
      expect(evaluateSnapshot(uncertain, context).workers[0]?.currentGuidance?.actionCode).toBe(
        "POSITION_UNKNOWN",
      );
    },
  );

  it("preserves an actual unsafe current engine decision instead of confirming", () => {
    const { snapshot, context } = closedArrival();
    const old = snapshot.hazards[0];
    assert.ok(old);
    const unsafe = {
      ...snapshot,
      hazards: [
        {
          ...old,
          active: true,
          polygon: [
            { x: 124, y: 41 },
            { x: 126, y: 41 },
            { x: 126, y: 43 },
            { x: 124, y: 43 },
          ],
        },
      ],
    };
    const decision = rawDecision(unsafe, context);
    expect(decision.exposure.current).toBe(true);
    expect(decision.actionCode).not.toBe("CONFIRM_ARRIVAL");
    expect(evaluateSnapshot(unsafe, context).workers[0]?.currentGuidance?.actionCode).toBe(
      decision.actionCode,
    );
  });
});
