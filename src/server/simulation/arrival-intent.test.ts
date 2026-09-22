import assert from "node:assert/strict";
import { describe, expect, it } from "vitest";
import type { ActionCode, Guidance, SimulationSnapshot } from "@/contracts";
import type { EngineDecision } from "../engine";
import { applyArrivalIntent, currentArrivalIntent, rememberArrivalIntents } from "./arrival-intent";
import type { EvaluationContext } from "./evaluate";
import { fixture } from "./runtime-test-fixtures";

function arrivalCase() {
  const f = fixture();
  f.command({ action: "select", scenarioId: "EQ-ARRIVAL" });
  f.command({ action: "start" });
  f.command({ action: "advance", deltaMs: 32_000 });
  const run = f.runtime.getRun("equipment");
  const snapshot = run.snapshot;
  const worker = snapshot.workers[0];
  const intent = worker && run.arrivalIntents[worker.workerId];
  assert.ok(worker?.currentGuidance && intent);
  expect(worker.currentGuidance.actionCode).toBe("CONFIRM_ARRIVAL");
  const context: EvaluationContext = {
    map: run.configuration.map,
    policy: run.policy,
    now: new Date().toISOString(),
    arrivalTargets: run.arrivalTargets,
    arrivalIntents: run.arrivalIntents,
    forceWorkerIds: [],
    connectedRecipients: 0,
  };
  const decision: EngineDecision = {
    actionCode: "ALERT_HAZARD",
    hazardIds: [],
    hazardType: "position-unknown",
    priority: "low",
    route: null,
    destinationId: null,
    assistanceRequired: false,
    reasonCode: "no-exposure",
    exposure: { current: false, plannedRoute: false },
  };
  return { run, snapshot, worker, intent, context, decision };
}

function withGuidance(snapshot: SimulationSnapshot, guidance: Guidance): SimulationSnapshot {
  return {
    ...snapshot,
    workers: snapshot.workers.map((worker) =>
      worker.workerId === guidance.workerId ? { ...worker, currentGuidance: guidance } : worker,
    ),
    incidents: snapshot.incidents.map((incident) =>
      incident.incidentId === guidance.incidentId
        ? {
            ...incident,
            currentGuidance: incident.currentGuidance.map((current) =>
              current.workerId === guidance.workerId ? guidance : current,
            ),
          }
        : incident,
    ),
  };
}

describe("QD004 private arrival eligibility boundaries", () => {
  it.each(["runId", "incidentId", "guidanceId", "mapId", "mapVersion"] as const)(
    "rejects another %s lineage",
    (field) => {
      const { intent, worker, snapshot } = arrivalCase();
      expect(
        currentArrivalIntent({ ...intent, [field]: "other" }, worker, snapshot, intent.target),
      ).toBeNull();
    },
  );

  it("discards closed-incident eligibility and never reconstructs it from a route-less update", () => {
    const { intent, worker, snapshot, run } = arrivalCase();
    const closed = {
      ...snapshot,
      incidents: snapshot.incidents.map((incident) => ({ ...incident, status: "closed" as const })),
    };
    rememberArrivalIntents(closed, run.arrivalTargets, run.arrivalIntents);
    expect(run.arrivalIntents[worker.workerId]).toBeUndefined();
    assert.ok(worker.currentGuidance);
    const updated = withGuidance(snapshot, {
      ...worker.currentGuidance,
      actionCode: "GUIDANCE_UPDATED",
    });
    rememberArrivalIntents(updated, run.arrivalTargets, run.arrivalIntents);
    expect(run.arrivalIntents[worker.workerId]).toBeUndefined();
    expect(currentArrivalIntent(intent, worker, snapshot, { x: 125, y: 42 })).toBeNull();
  });

  it("keeps the same private binding across supplemental envelope versions", () => {
    const { intent, worker, snapshot } = arrivalCase();
    assert.ok(worker.currentGuidance);
    const guidance: Guidance = {
      ...worker.currentGuidance,
      updateKind: "supplement",
      mode: "rag-assisted",
      guidanceVersion: worker.currentGuidance.guidanceVersion + 1,
      primaryGuidanceVersion: worker.currentGuidance.guidanceVersion,
      supplementalExplanation: "Reviewed explanation",
      evidence: [{ documentId: "d", documentVersion: "1", chunkId: "c" }],
    };
    const supplemented = withGuidance(snapshot, guidance);
    expect(
      currentArrivalIntent(
        intent,
        { ...worker, currentGuidance: guidance },
        supplemented,
        intent.target,
      ),
    ).toEqual(intent);
  });

  it.each(["missing", "stale", "future", "unknown"] as const)(
    "does not confirm using a %s worker observation",
    (observation) => {
      const { worker, snapshot, context, decision } = arrivalCase();
      const modified = {
        ...worker,
        positionStatus: observation === "unknown" ? ("unknown" as const) : ("known" as const),
        lastObservedAt:
          observation === "missing"
            ? null
            : new Date(
                Date.parse(context.now) +
                  (observation === "future" ? 1 : -context.policy.positionStaleAfterMs - 1),
              ).toISOString(),
      };
      expect(
        applyArrivalIntent(
          decision,
          modified,
          snapshot,
          context,
          false,
          worker.currentGuidance?.incidentId ?? null,
        ),
      ).toBe(decision);
    },
  );

  it.each<ActionCode>([
    "POSITION_UNKNOWN",
    "SENSOR_UNKNOWN",
    "ROUTE_UNAVAILABLE",
    "AWAIT_REOPEN_AUTHORIZATION",
    "SHELTER_PER_SCENARIO",
  ])("does not override current engine %s", (actionCode) => {
    const { worker, snapshot, context, decision } = arrivalCase();
    const blocking = { ...decision, actionCode, reasonCode: "authoritative-current-blocker" };
    expect(
      applyArrivalIntent(
        blocking,
        worker,
        snapshot,
        context,
        true,
        worker.currentGuidance?.incidentId ?? null,
      ),
    ).toBe(blocking);
  });

  it.each<ActionCode>(["POSITION_UNKNOWN", "SENSOR_UNKNOWN", "ROUTE_UNAVAILABLE"])(
    "requires verified resolution of previous %s before return",
    (actionCode) => {
      const { worker, snapshot, context, decision } = arrivalCase();
      assert.ok(worker.currentGuidance);
      const guidance = { ...worker.currentGuidance, actionCode };
      const modified = { ...worker, currentGuidance: guidance };
      const previousBlocker = withGuidance(snapshot, guidance);
      expect(
        applyArrivalIntent(
          decision,
          modified,
          previousBlocker,
          context,
          false,
          guidance.incidentId,
        ),
      ).toBe(decision);
      expect(
        applyArrivalIntent(decision, modified, previousBlocker, context, true, guidance.incidentId)
          .actionCode,
      ).toBe("CONFIRM_ARRIVAL");
    },
  );

  it("retains an authoritative new route to a different destination and replaces the private target", () => {
    const { worker, snapshot, context, decision, run, intent } = arrivalCase();
    const target = { x: 125, y: 42, nodeId: "REFUGE-02", floorId: "GROUND" };
    const route = {
      kind: "valid" as const,
      waypoints: [{ ...intent.target, nodeId: "WORKER-POSITION", floorId: "GROUND" }, target],
      edgeIds: [],
      destinationId: "REFUGE-02",
      distanceM: 34,
      estimatedSeconds: 34,
      assistanceRequired: false,
    };
    const reroute: EngineDecision = {
      ...decision,
      actionCode: "FOLLOW_VALIDATED_ROUTE",
      reasonCode: "designated-space",
      route,
      destinationId: route.destinationId,
    };
    expect(
      applyArrivalIntent(
        reroute,
        worker,
        snapshot,
        context,
        true,
        worker.currentGuidance?.incidentId ?? null,
      ),
    ).toBe(reroute);
    assert.ok(worker.currentGuidance);
    const guidance = {
      ...worker.currentGuidance,
      actionCode: "FOLLOW_VALIDATED_ROUTE" as const,
      waypoints: route.waypoints,
      destinationId: route.destinationId,
      routeVersion: 2,
      stepId: target.nodeId,
    };
    const rerouted = withGuidance(snapshot, guidance);
    run.arrivalTargets[worker.workerId] = target;
    rememberArrivalIntents(rerouted, run.arrivalTargets, run.arrivalIntents);
    expect(run.arrivalIntents[worker.workerId]).toMatchObject({
      target: { x: 125, y: 42 },
      destinationId: "REFUGE-02",
    });
  });
});
