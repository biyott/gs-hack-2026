import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { evaluateSnapshot as evaluateClientSnapshot } from "@/client/snapshot-policy";
import { currentWorkerGuidance } from "@/components/worker/guidance-policy";
import type { SimulationSnapshot } from "@/contracts";
import { cleanups, expectBlockingReissue, fixture } from "./runtime-test-fixtures";

describe("runtime unresolved guidance through the public profile command", () => {
  it("reissues a current localized blocking primary consistently across storage, publication and client selection", () => {
    // Given
    const f = fixture();
    const mode = "fire-gas";
    f.command({ action: "select", scenarioId: "FG-SENSOR-STALE" }, mode);
    f.command({ action: "start" }, mode);
    f.command({ action: "advance", deltaMs: 7000 }, mode);
    const run = f.runtime.getRun(mode);
    const oldWorker = run.snapshot.workers.find((worker) => worker.workerId === "WORKER-B");
    assert.ok(oldWorker?.currentGuidance);
    const previous = oldWorker.currentGuidance;
    expect(previous).toMatchObject({
      actionCode: "SENSOR_UNKNOWN",
      locale: "en",
      messageArgs: { assistanceRequired: true },
    });
    const now = new Date().toISOString();
    f.runtime.respond(
      {
        mode,
        runId: previous.runId,
        workerId: previous.workerId,
        requestId: randomUUID(),
        incidentId: previous.incidentId,
        guidanceId: previous.guidanceId,
        guidanceVersion: previous.guidanceVersion,
        response: "help-requested",
        occurredAt: now,
      },
      f.session("worker-b"),
    );
    f.runtime.incident(f.action({ action: "acknowledge" }, mode), f.admin);
    f.runtime.incident(f.action({ action: "assign", assigneeId: "support" }, mode), f.admin);
    f.runtime.incident(f.action({ action: "accept-support" }, mode), f.session("support"));
    const before = run.snapshot;
    const incident = before.incidents.find((entry) => entry.incidentId === previous.incidentId);
    assert.ok(incident);
    expect(incident).toMatchObject({ assignedTo: "support", supportStatus: "accepted" });
    run.world = {
      ...run.world,
      state: {
        ...run.world.state,
        workers: run.world.state.workers.map((worker) =>
          worker.workerId === "WORKER-B" ? { ...worker, position: { x: 100, y: 8 } } : worker,
        ),
      },
    };
    const profile = {
      ...oldWorker.profile,
      version: oldWorker.profile.version + 1,
      preferredLocale: "ko",
      locale: "ko" as const,
      needsAssistance: false,
      needsCompanion: false,
    };
    const publications: SimulationSnapshot[] = [];
    cleanups.push(f.runtime.bus.subscribe(mode, (snapshot) => publications.push(snapshot)));
    // When
    const result = f.command({ action: "profile", workerId: oldWorker.workerId, profile }, mode);
    // Then
    const worker = result.workers.find((entry) => entry.workerId === oldWorker.workerId);
    assert.ok(worker?.currentGuidance);
    expect(worker).toMatchObject({ profile, position: { x: 100, y: 8 }, positionStatus: "known" });
    expect(result.hazards.find((hazard) => hazard.hazardId === "GAS-ZONE-B")?.sensorStatus).toBe(
      "stale",
    );
    expect(result).toEqual(f.repository.current(mode));
    expect(publications).toEqual([result]);
    expect(result.streamId).toBe(before.streamId);
    expect(result.sequence).toBeGreaterThan(before.sequence);
    expect(
      evaluateClientSnapshot(result, {
        mode,
        current: before,
        streamBaselineReady: true,
        canEstablishStream: false,
      }),
    ).toBe("accept");
    expect(currentWorkerGuidance(result, worker, run.configuration.map, Date.parse(now))).toEqual(
      worker.currentGuidance,
    );
    const currentIncident = result.incidents.find(
      (entry) => entry.incidentId === incident.incidentId,
    );
    expect(
      currentIncident?.currentGuidance.find((guidance) => guidance.workerId === worker.workerId),
    ).toEqual(worker.currentGuidance);
    expect(currentIncident).toMatchObject({
      firstGuidance: incident.firstGuidance,
      status: incident.status,
      hazardType: incident.hazardType,
      priority: incident.priority,
      acknowledgedAt: incident.acknowledgedAt,
      assignedTo: incident.assignedTo,
      supportStatus: incident.supportStatus,
      hazardClearedAt: incident.hazardClearedAt,
      passageReopenedAt: incident.passageReopenedAt,
      closedAt: incident.closedAt,
    });
    expect(result.closedEdgeIds).toEqual(before.closedEdgeIds);
    expect(worker.response.helpRequestedAt).toBe(now);
    expect(worker.response.arrivedAt).toBeNull();
    expectBlockingReissue(previous, worker, now);
  });
});
