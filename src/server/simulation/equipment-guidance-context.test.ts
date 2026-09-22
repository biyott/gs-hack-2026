import assert from "node:assert/strict";
import { describe, expect, it } from "vitest";
import type { Guidance, SimulationSnapshot, WorkerState } from "@/contracts";
import { guidanceFixture, runFixture } from "../db/fixtures.test-support";
import { hazard } from "../engine/fixtures.test-support";
import { decisionFixture } from "../guidance/test-fixtures";
import { nonMovementCauseResolved, retainNonMovementDecision } from "./guidance-recovery";
import { configuration } from "./runtime-test-fixtures";
import { emptyResponse } from "./snapshots";

const missingId = "EQUIPMENT-A:retired:2:load:6";
const presentId = "EQUIPMENT-A:retired:2:body:0";
function retainedFixture() {
  const snapshot = {
    ...runFixture(),
    hazards: [hazard([], { hazardId: presentId, hazardType: "equipment", active: false })],
  };
  const previous: Guidance = {
    ...guidanceFixture(),
    actionCode: "ROUTE_UNAVAILABLE",
    hazardIds: [missingId, presentId, "OTHER:missing", "EQUIPMENT-AB:missing"],
    messageArgs: { reasonCode: "profile-unverified", assistanceRequired: true },
  };
  const decision = {
    ...decisionFixture(),
    hazardIds: [],
    route: null,
    destinationId: null,
    reasonCode: "no-exposure",
    exposure: { current: false, plannedRoute: false },
  };
  return { snapshot, previous, decision };
}

describe("QD009 exact retained-cause guard", () => {
  it("preserves present inactive and unrelated IDs when only a namespaced ID is absent", () => {
    // Given
    const { snapshot, previous, decision } = retainedFixture();
    // When
    const retained = retainNonMovementDecision(previous, decision, snapshot);
    // Then
    expect(retained).toMatchObject({
      hazardIds: [presentId, "OTHER:missing", "EQUIPMENT-AB:missing"],
      actionCode: "ROUTE_UNAVAILABLE",
      hazardType: previous.hazardType,
      priority: previous.priority,
      reasonCode: "profile-unverified",
      assistanceRequired: true,
      route: null,
      destinationId: null,
    });
    expect(previous.hazardIds).toContain(missingId);
  });

  it.each([
    "snapshot-mode",
    "guidance-mode",
    "fire",
    "gas",
    "combined",
    "SENSOR_UNKNOWN",
    "POSITION_UNKNOWN",
  ] as const)("leaves the cause set unchanged for %s", (guard) => {
    // Given
    const { snapshot, previous, decision } = retainedFixture();
    const prior: Guidance = {
      ...previous,
      ...(guard === "guidance-mode" ? { simulationMode: "fire-gas" } : {}),
      ...(guard === "fire" || guard === "gas" || guard === "combined" ? { hazardType: guard } : {}),
      ...(guard === "SENSOR_UNKNOWN" || guard === "POSITION_UNKNOWN" ? { actionCode: guard } : {}),
    };
    // When
    const retained = retainNonMovementDecision(
      prior,
      decision,
      guard === "snapshot-mode" ? { ...snapshot, mode: "fire-gas" } : snapshot,
    );
    // Then
    expect(retained?.hazardIds).toEqual(previous.hazardIds);
    expect(retained?.actionCode).toBe(prior.actionCode);
  });

  it("does not turn missing sensor causes into resolved recovery", () => {
    // Given
    const { snapshot: base, previous, decision } = retainedFixture();
    const snapshot: SimulationSnapshot = {
      ...base,
      mode: "fire-gas",
      hazards: [hazard([], { hazardId: "FIRE-present", observedAt: base.run.updatedAt })],
    };
    const prior: Guidance = {
      ...previous,
      simulationMode: "fire-gas",
      hazardType: "combined",
      actionCode: "SENSOR_UNKNOWN",
      hazardIds: ["FIRE-present", "GAS-missing"],
    };
    const worker: WorkerState = {
      workerId: prior.workerId,
      profile: prior.profileSnapshot,
      position: { x: 65, y: 25 },
      positionStatus: "known",
      positionSource: "mock",
      positionInputSource: "synthetic",
      lastObservedAt: snapshot.run.updatedAt,
      currentGuidance: prior,
      response: emptyResponse(),
      virtual: false,
    };
    const policy = configuration.policies.find((entry) => entry.id === "POLICY-FG-EVACUATE");
    assert.ok(policy);
    // When
    const retained = retainNonMovementDecision(prior, decision, snapshot);
    assert.ok(retained);
    const retainedGuidance: Guidance = { ...prior, hazardIds: [...retained.hazardIds] };
    const context = {
      map: configuration.map,
      policy,
      now: snapshot.run.updatedAt,
      arrivalTargets: {},
      arrivalIntents: {},
      forceWorkerIds: [prior.workerId],
      connectedRecipients: 0,
    };
    const resolved = nonMovementCauseResolved(retainedGuidance, worker, snapshot, context);
    // Then
    expect(retained.hazardIds).toEqual(["FIRE-present", "GAS-missing"]);
    expect(resolved).toBe(false);
    expect(
      nonMovementCauseResolved(
        { ...retainedGuidance, hazardIds: ["FIRE-present"] },
        worker,
        snapshot,
        context,
      ),
    ).toBe(true);
  });

  it("keeps an unrelated action outside blocker retention", () => {
    // Given
    const { snapshot, previous, decision } = retainedFixture();
    // When / Then
    expect(
      retainNonMovementDecision({ ...previous, actionCode: "ALERT_HAZARD" }, decision, snapshot),
    ).toBeNull();
  });
});
