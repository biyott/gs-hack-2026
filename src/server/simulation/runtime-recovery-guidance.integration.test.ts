import assert from "node:assert/strict";
import { describe, expect, it } from "vitest";
import { SimulationSnapshotSchema } from "@/contracts";
import { active, fixture } from "./runtime-test-fixtures";

function recoveredMeasuredPosition(withSupport = false) {
  const f = active();
  f.command({ action: "position-input", input: "measured" });
  const run = f.runtime.getRun("equipment");
  if (withSupport) {
    f.runtime.respond(f.response("help-requested", "WORKER-B"), f.session("worker-b"));
    f.incident({ action: "acknowledge" });
    f.incident({ action: "assign", assigneeId: "support" });
    f.incident({ action: "accept-support" }, f.session("support"));
  }
  const previous = run.snapshot.workers.find(
    (worker) => worker.workerId === "WORKER-B",
  )?.currentGuidance;
  assert.ok(previous);
  expect(previous.actionCode).toBe("POSITION_UNKNOWN");
  const now = new Date().toISOString();
  run.snapshot = SimulationSnapshotSchema.parse({
    ...run.snapshot,
    equipment: {
      ...run.snapshot.equipment,
      position: { x: 30, y: 25 },
      positionSource: "video",
      positionInputSource: "synthetic",
      positionStatus: "known",
      lastObservedAt: now,
    },
    workers: run.snapshot.workers.map((worker) =>
      worker.workerId === "WORKER-B"
        ? {
            ...worker,
            position: { x: 90, y: 40 },
            positionSource: "video",
            positionInputSource: "synthetic",
            positionStatus: "known",
            lastObservedAt: now,
          }
        : worker,
    ),
  });
  return { run, previous, now };
}

function arrivalScenario() {
  const f = fixture();
  f.command({ action: "select", scenarioId: "EQ-ARRIVAL" });
  f.command({ action: "speed", speed: 1 });
  f.command({ action: "start" });
  const routeCheckpoint = f.runtime
    .getRun("equipment")
    .scenario.expectedResults.find(
      (expected) => expected.kind === "guidance" && expected.workerId === "WORKER-A",
    );
  assert.ok(routeCheckpoint);
  f.command({ action: "advance", deltaMs: routeCheckpoint.atMs });
  expect(f.snapshot().workers[0]?.currentGuidance?.actionCode).toBe("FOLLOW_VALIDATED_ROUTE");
  return f;
}

describe("runtime guidance after position recovery", () => {
  it("replaces unknown-position guidance with a non-route primary update after safe measured recovery", () => {
    // Given
    const { run, previous, now } = recoveredMeasuredPosition();
    // When
    const result = run.evaluate(now);
    // Then
    const worker = result.workers.find((entry) => entry.workerId === "WORKER-B");
    expect(worker).toMatchObject({ position: { x: 90, y: 40 }, positionStatus: "known" });
    expect(worker?.currentGuidance).toMatchObject({
      actionCode: "GUIDANCE_UPDATED",
      updateKind: "primary",
      messageArgs: { reasonCode: "risk-context-recalculated" },
      waypoints: [],
      destinationId: null,
      routeVersion: null,
      stepId: null,
    });
    expect(worker?.currentGuidance?.guidanceVersion).toBeGreaterThan(previous.guidanceVersion);
  });

  it("does not regenerate guidance or audits when recovered position facts repeat", () => {
    // Given
    const { run, now } = recoveredMeasuredPosition();
    const first = run.evaluate(now);
    // When
    const repeated = run.evaluate(new Date(Date.parse(now) + 100).toISOString());
    // Then
    expect(
      repeated.workers.find((worker) => worker.workerId === "WORKER-B")?.currentGuidance,
    ).toEqual(first.workers.find((worker) => worker.workerId === "WORKER-B")?.currentGuidance);
    expect(repeated.events).toEqual(first.events);
    expect(repeated.incidents).toEqual(first.incidents);
  });

  it("preserves incident identity, first guidance and requested assistance during recovery", () => {
    // Given
    const { run, previous, now } = recoveredMeasuredPosition(true);
    const before = run.snapshot;
    const incident = before.incidents.find((entry) => entry.incidentId === previous.incidentId);
    assert.ok(incident);
    const helpRequestedAt = before.workers.find((worker) => worker.workerId === "WORKER-B")
      ?.response.helpRequestedAt;
    expect(helpRequestedAt).toEqual(expect.any(String));
    expect(incident).toMatchObject({ assignedTo: "support", supportStatus: "accepted" });
    // When
    const result = run.evaluate(now);
    // Then
    expect(result.workers.find((worker) => worker.workerId === "WORKER-B")).toMatchObject({
      currentGuidance: { actionCode: "GUIDANCE_UPDATED", incidentId: incident.incidentId },
      response: { helpRequestedAt, arrivedAt: null },
    });
    expect(
      result.incidents.find((entry) => entry.incidentId === incident.incidentId),
    ).toMatchObject({
      firstGuidance: incident.firstGuidance,
      hazardType: incident.hazardType,
      priority: incident.priority,
      status: incident.status,
      acknowledgedAt: incident.acknowledgedAt,
      assignedTo: incident.assignedTo,
      supportStatus: incident.supportStatus,
      hazardClearedAt: incident.hazardClearedAt,
      passageReopenedAt: incident.passageReopenedAt,
      closedAt: incident.closedAt,
    });
    expect(result.closedEdgeIds).toEqual(before.closedEdgeIds);
  });

  it.each(["worker", "equipment"] as const)(
    "keeps uncertainty when recovered %s observations are stale",
    (source) => {
      // Given
      const { run, now } = recoveredMeasuredPosition();
      const stale = new Date(Date.parse(now) - run.policy.positionStaleAfterMs - 1).toISOString();
      run.snapshot = {
        ...run.snapshot,
        equipment:
          source === "equipment"
            ? { ...run.snapshot.equipment, positionStatus: "stale", lastObservedAt: stale }
            : run.snapshot.equipment,
        workers: run.snapshot.workers.map((worker) =>
          source === "worker" && worker.workerId === "WORKER-B"
            ? { ...worker, lastObservedAt: stale }
            : worker,
        ),
      };
      // When
      const result = run.evaluate(now);
      // Then
      expect(
        result.workers.find((worker) => worker.workerId === "WORKER-B")?.currentGuidance,
      ).toMatchObject({
        actionCode: "POSITION_UNKNOWN",
        waypoints: [],
      });
    },
  );

  it("retains passage closure and waits for authorization after a hazard clears", () => {
    // Given
    const f = fixture();
    f.command({ action: "select", scenarioId: "FG-CLEAR-REOPEN" }, "fire-gas");
    f.command({ action: "speed", speed: 1 }, "fire-gas");
    f.command({ action: "start" }, "fire-gas");
    const before = f.command({ action: "advance", deltaMs: 1000 }, "fire-gas");
    expect(before.closedEdgeIds.length).toBeGreaterThan(0);
    const hazardClear = f.runtime
      .getRun("fire-gas")
      .scenario.events.find((event) => event.type === "hazard.clear");
    assert.ok(hazardClear);
    // When
    const result = f.command(
      { action: "advance", deltaMs: hazardClear.atMs - before.run.virtualTimeMs },
      "fire-gas",
    );
    // Then
    expect(result.workers[0]?.currentGuidance).toMatchObject({
      actionCode: "AWAIT_REOPEN_AUTHORIZATION",
      waypoints: [],
      destinationId: null,
    });
    expect(result.closedEdgeIds).toEqual(before.closedEdgeIds);
    expect(result.incidents[0]?.passageReopenedAt).toBeNull();
    expect(result.incidents[0]?.firstGuidance).toEqual(before.incidents[0]?.firstGuidance);
  });

  it.each(["fresh", "stale"] as const)(
    "requires a %s equipment observation to resolve equipment uncertainty",
    (age) => {
      // Given
      const { run, now } = recoveredMeasuredPosition();
      run.snapshot = {
        ...run.snapshot,
        equipment: { ...run.snapshot.equipment, positionStatus: "unknown" },
      };
      run.evaluate(now);
      const previous = run.snapshot.workers.find(
        (worker) => worker.workerId === "WORKER-B",
      )?.currentGuidance;
      expect(previous).toMatchObject({
        actionCode: "POSITION_UNKNOWN",
        messageArgs: { reasonCode: "equipment-position-unknown" },
      });
      run.snapshot = {
        ...run.snapshot,
        equipment: {
          ...run.snapshot.equipment,
          positionStatus: "known",
          lastObservedAt:
            age === "fresh"
              ? now
              : new Date(Date.parse(now) - run.policy.positionStaleAfterMs - 1).toISOString(),
        },
      };
      // When
      const result = run.evaluate(now);
      // Then
      const guidance = result.workers.find(
        (worker) => worker.workerId === "WORKER-B",
      )?.currentGuidance;
      if (age === "fresh") {
        expect(guidance).toMatchObject({
          actionCode: "GUIDANCE_UPDATED",
          waypoints: [],
          destinationId: null,
        });
      } else {
        expect(guidance).toEqual(previous);
      }
    },
  );

  it.each(["EQ-ARRIVAL-002", "EQ-ARRIVAL-003"])(
    "preserves a validated route during safe progress at %s",
    (eventId) => {
      // Given
      const f = arrivalScenario();
      const progress = f.runtime
        .getRun("equipment")
        .scenario.events.find((event) => event.id === eventId);
      assert.ok(progress);
      // When
      const result = f.command({
        action: "advance",
        deltaMs: progress.atMs - f.snapshot().run.virtualTimeMs,
      });
      // Then
      const guidance = result.workers[0]?.currentGuidance;
      expect(guidance).toMatchObject({
        actionCode: "FOLLOW_VALIDATED_ROUTE",
        destinationId: "REFUGE-01",
      });
      expect(guidance?.waypoints.length).toBeGreaterThan(1);
      expect(result.workers[0]?.response.arrivedAt).toBeNull();
    },
  );

  it("changes the preserved route to arrival confirmation when the destination is reached", () => {
    // Given
    const f = arrivalScenario();
    const arrival = f.runtime
      .getRun("equipment")
      .scenario.expectedResults.find(
        (expected) => expected.kind === "arrival" && expected.workerId === "WORKER-A",
      );
    assert.ok(arrival);
    // When
    const result = f.command({
      action: "advance",
      deltaMs: arrival.atMs - f.snapshot().run.virtualTimeMs,
    });
    // Then
    expect(result.workers[0]?.currentGuidance).toMatchObject({
      actionCode: "CONFIRM_ARRIVAL",
      waypoints: [],
    });
    expect(result.workers[0]?.response.arrivedAt).toBeNull();
  });
});
