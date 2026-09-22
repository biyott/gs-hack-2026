import assert from "node:assert/strict";
import { describe, expect, it, vi } from "vitest";
import type { SimulationSnapshot } from "@/contracts";
import { createAuthService, seedAccounts } from "../auth";
import { assessExposure, evaluateWorkerPlan } from "../engine";
import { configuration, fixture } from "./runtime-test-fixtures";
import { emptyResponse } from "./snapshots";

function workerC(snapshot: SimulationSnapshot) {
  const worker = snapshot.workers.find((entry) => entry.workerId === "WORKER-C");
  assert.ok(worker?.currentGuidance);
  return { worker, guidance: worker.currentGuidance };
}

function blockingRun() {
  const f = fixture();
  f.command({ action: "select", scenarioId: "EQ-PROFILE-ROUTES" });
  f.command({ action: "start" });
  f.command({ action: "advance", deltaMs: 1000 });
  const initial = workerC(f.snapshot());
  expect(initial.guidance).toMatchObject({
    actionCode: "ROUTE_UNAVAILABLE",
    hazardType: "equipment",
    messageArgs: { reasonCode: "profile-unverified", assistanceRequired: true },
  });
  expect(initial.guidance.hazardIds.length).toBeGreaterThan(0);
  seedAccounts(f.database, [
    { id: "qd009-worker-c", role: "worker", workerId: "WORKER-C", pin: "2026" },
  ]);
  const session = createAuthService(f.database).login({
    actorId: "qd009-worker-c",
    role: "worker",
    accessCode: "2026",
  }).session;
  f.runtime.respond(f.response("help-requested", "WORKER-C"), session);
  f.incident({ action: "acknowledge" });
  f.incident({ action: "assign", assigneeId: "support" });
  f.incident({ action: "accept-support" }, f.session("support"));
  const profile = workerC(f.snapshot()).worker.profile;
  f.command({
    action: "profile",
    workerId: "WORKER-C",
    profile: {
      ...profile,
      version: profile.version + 1,
      preferredLocale: "en",
      locale: "en",
    },
  });
  return f;
}

describe("QD009 current equipment guidance references", () => {
  it.each([
    { change: "pose", expired: false },
    { change: "pose", expired: true },
    { change: "model", expired: false },
    { change: "model", expired: true },
  ] as const)(
    "retires missing IDs after $change with expired=$expired while preserving the blocker",
    ({ change, expired }) => {
      // Given an unresolved profile, real help request and immutable persisted guidance.
      const f = blockingRun();
      const before = f.snapshot();
      const { guidance: previous, worker: priorWorker } = workerC(before);
      const incident = before.incidents.find((entry) => entry.incidentId === previous.incidentId);
      assert.ok(incident);
      expect(incident).toMatchObject({ assignedTo: "support", supportStatus: "accepted" });
      expect(priorWorker.response.helpRequestedAt).not.toBeNull();
      expect(
        previous.hazardIds.every((id) => before.hazards.some((entry) => entry.hazardId === id)),
      ).toBe(true);
      const history = f.repository.guidanceHistory(previous.incidentId);
      vi.setSystemTime(
        new Date(
          expired ? Date.parse(previous.expiresAt) + 1 : Date.parse(previous.generatedAt) + 1,
        ),
      );
      expect(Date.parse(previous.expiresAt) <= Date.now()).toBe(expired);
      // When the public command changes geometry so this worker is no longer exposed.
      const after =
        change === "pose"
          ? f.command({ action: "control", pose: { position: { x: 0, y: 0 }, speedMps: 0 } })
          : f.command({ action: "equipment", presetId: "tadano-gr250n4" });
      const { worker, guidance: current } = workerC(after);
      const run = f.runtime.getRun("equipment");
      expect(assessExposure(worker.position, previous.waypoints, after.hazards)).toEqual({
        current: false,
        plannedRoute: false,
      });
      expect(
        evaluateWorkerPlan({
          map: configuration.map,
          worker,
          hazards: after.hazards,
          closedEdgeIds: after.closedEdgeIds,
          policy: run.policy,
          now: new Date().toISOString(),
        }),
      ).toMatchObject({ reasonCode: "no-exposure", hazardIds: [] });
      // Then a fresh primary retains unresolved semantics, with no retired current dependency.
      expect(current).toMatchObject({
        guidanceId: previous.guidanceId,
        incidentId: previous.incidentId,
        guidanceVersion: previous.guidanceVersion + 1,
        primaryGuidanceVersion: previous.guidanceVersion + 1,
        updateKind: "primary",
        actionCode: previous.actionCode,
        hazardType: previous.hazardType,
        priority: previous.priority,
        profileSnapshot: worker.profile,
        profileVersion: worker.profile.version,
        requestedLocale: "en",
        locale: "en",
        waypoints: [],
        destinationId: null,
        routeVersion: null,
        stepId: null,
        messageArgs: {
          reasonCode: "profile-unverified",
          assistanceRequired: true,
          geometryVersion: after.equipment.geometryVersion,
        },
      });
      expect(current.generatedAt).toBe(new Date().toISOString());
      expect(Date.parse(current.expiresAt)).toBeGreaterThan(Date.now());
      expect(after.equipment.geometryVersion).toBe(before.equipment.geometryVersion + 1);
      const updatedIncident = after.incidents.find(
        (entry) => entry.incidentId === incident.incidentId,
      );
      assert.ok(updatedIncident);
      expect(
        updatedIncident.currentGuidance.find((entry) => entry.workerId === worker.workerId),
      ).toEqual(current);
      expect(updatedIncident).toMatchObject({
        firstGuidance: incident.firstGuidance,
        status: incident.status,
        assignedTo: incident.assignedTo,
        supportStatus: incident.supportStatus,
        acknowledgedAt: incident.acknowledgedAt,
        hazardClearedAt: incident.hazardClearedAt,
        passageReopenedAt: incident.passageReopenedAt,
        closedAt: incident.closedAt,
      });
      expect(updatedIncident.hazardIds).toEqual(expect.arrayContaining(previous.hazardIds));
      expect(f.repository.guidanceHistory(incident.incidentId)).toEqual(
        expect.arrayContaining([...history]),
      );
      expect(worker.response).toMatchObject({
        ...emptyResponse(),
        helpRequestedAt: priorWorker.response.helpRequestedAt,
      });
      expect(after.closedEdgeIds).toEqual(before.closedEdgeIds);
      expect
        .soft(
          current.hazardIds.filter((id) => !after.hazards.some((entry) => entry.hazardId === id)),
        )
        .toEqual([]);
      expect
        .soft(
          updatedIncident.currentGuidance.find((entry) => entry.workerId === worker.workerId)
            ?.hazardIds,
        )
        .toEqual([]);
    },
  );
});
