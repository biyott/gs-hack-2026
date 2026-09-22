import { describe, expect, it } from "vitest";
import type { WorkerState } from "../../../packages/contracts/src/state";
import type { ResponsePolicy } from "../scenarios/policy";
import { evaluateWorkerPlan } from "./evaluation";
import { confirmedProfile, graph, hazard } from "./fixtures.test-support";
import type { WorkerPlanInput } from "./types";

const worker: WorkerState = {
  workerId: "WORKER-A",
  profile: confirmedProfile,
  position: { x: 0, y: 0 },
  positionSource: "mock",
  positionInputSource: "synthetic",
  positionStatus: "known",
  lastObservedAt: "2026-09-21T09:00:00Z",
  currentGuidance: null,
  virtual: true,
  response: {
    receivedAt: null,
    displayedAt: null,
    spokenAt: null,
    understoodAt: null,
    helpRequestedAt: null,
    arrivedAt: null,
    voiceStatus: "pending",
  },
};
const policy: ResponsePolicy = {
  id: "POLICY-FIXTURE",
  version: "1.0.0",
  mode: "fire-gas",
  synthetic: true,
  positionStaleAfterMs: 5000,
  sensorStaleAfterMs: 5000,
  equipmentPredictionSeconds: 5,
  arrivalToleranceM: 2,
  requireExplicitReopen: true,
  gasAlarm: { materialId: "DEMO-GAS-X", minimumValue: 1, unit: "demo-index" },
  responses: [
    { hazardType: "fire", priority: 10, strategy: "evacuate", destinationIds: ["REFUGE-01"] },
    { hazardType: "gas", priority: 20, strategy: "shelter", destinationIds: [] },
    { hazardType: "combined", priority: 30, strategy: "evacuate", destinationIds: ["REFUGE-02"] },
  ],
};
const exposed = hazard([
  { x: -1, y: -1 },
  { x: 1, y: -1 },
  { x: 1, y: 1 },
  { x: -1, y: 1 },
]);
const input: WorkerPlanInput = {
  map: graph,
  worker,
  policy,
  hazards: [exposed],
  closedEdgeIds: [],
  now: "2026-09-21T09:00:00Z",
};

describe("authoritative response policies", () => {
  it("evacuates an exposed start through validated initial egress", () => {
    // Given / When
    const result = evaluateWorkerPlan(input);
    // Then
    expect(result).toMatchObject({
      actionCode: "FOLLOW_VALIDATED_ROUTE",
      destinationId: "REFUGE-01",
      route: { edgeIds: ["STAIRS", "SHORT"] },
    });
  });

  it("provides explicit no-route support instead of inventing shelter", () => {
    // Given
    const next = { ...input, closedEdgeIds: ["SHORT", "LINK"] };
    // When
    const result = evaluateWorkerPlan(next);
    // Then
    expect(result).toMatchObject({
      actionCode: "ROUTE_UNAVAILABLE",
      route: null,
      destinationId: null,
      assistanceRequired: true,
    });
  });

  it("clears route and destination under an explicit shelter policy", () => {
    // Given
    const next = { ...input, hazards: [{ ...exposed, hazardType: "gas" as const }] };
    // When
    const result = evaluateWorkerPlan(next);
    // Then
    expect(result).toMatchObject({
      actionCode: "SHELTER_PER_SCENARIO",
      route: null,
      destinationId: null,
    });
  });

  it("uses configured combined priority independently of hazard input order", () => {
    // Given
    const gas = { ...exposed, hazardId: "GAS", hazardType: "gas" as const };
    const next = { ...input, hazards: [gas, exposed] };
    // When
    const result = evaluateWorkerPlan(next);
    // Then
    expect(result).toMatchObject({
      hazardType: "combined",
      actionCode: "FOLLOW_VALIDATED_ROUTE",
      destinationId: "REFUGE-02",
      hazardIds: ["GAS", "HAZARD-1"],
    });
  });

  it("refuses equal-priority conflicting response policies", () => {
    // Given
    const next = {
      ...input,
      hazards: [exposed, { ...exposed, hazardId: "GAS", hazardType: "gas" as const }],
      policy: {
        ...policy,
        responses: policy.responses.map((response) => ({ ...response, priority: 10 })),
      },
    };
    // When
    const result = evaluateWorkerPlan(next);
    // Then
    expect(result).toMatchObject({
      actionCode: "ROUTE_UNAVAILABLE",
      reasonCode: "policy-conflict",
      route: null,
    });
  });

  it("does not treat an expired sensor measurement as current", () => {
    // Given
    const next = { ...input, hazards: [{ ...exposed, observedAt: "2026-09-21T08:59:00Z" }] };
    // When
    const result = evaluateWorkerPlan(next);
    // Then
    expect(result).toMatchObject({
      actionCode: "SENSOR_UNKNOWN",
      route: null,
      assistanceRequired: true,
    });
  });

  it("does not route through an inactive area whose all-clear measurement is stale", () => {
    // Given
    const unknown = hazard(
      [
        { x: 3, y: -1 },
        { x: 6, y: -1 },
        { x: 6, y: 1 },
        { x: 3, y: 1 },
      ],
      { hazardId: "GAS-UNKNOWN", hazardType: "gas", active: false, sensorStatus: "stale" },
    );
    // When
    const result = evaluateWorkerPlan({ ...input, hazards: [exposed, unknown] });
    // Then
    expect(result).toMatchObject({
      actionCode: "FOLLOW_VALIDATED_ROUTE",
      route: { edgeIds: ["LEVEL", "LONG", "LINK"] },
    });
  });

  it("does not create a route from a stale worker position", () => {
    // Given
    const next = { ...input, worker: { ...worker, positionStatus: "stale" as const } };
    // When
    const result = evaluateWorkerPlan(next);
    // Then
    expect(result).toMatchObject({ actionCode: "POSITION_UNKNOWN", route: null });
  });

  it("invalidates routing when equipment position is unknown despite a known worker position", () => {
    // Given
    const unknown = hazard([], {
      hazardType: "position-unknown",
      sensorStatus: "not-applicable",
      affectedWorkerIds: [worker.workerId],
    });
    // When
    const result = evaluateWorkerPlan({ ...input, hazards: [unknown] });
    // Then
    expect(result).toMatchObject({
      actionCode: "POSITION_UNKNOWN",
      reasonCode: "equipment-position-unknown",
      route: null,
      assistanceRequired: true,
    });
  });

  it("retains a separate reopening action after hazard clearance", () => {
    // Given
    const next = { ...input, hazards: [{ ...exposed, active: false }], closedEdgeIds: ["SHORT"] };
    // When
    const result = evaluateWorkerPlan(next);
    // Then
    expect(result).toMatchObject({
      actionCode: "AWAIT_REOPEN_AUTHORIZATION",
      route: null,
      destinationId: null,
    });
  });

  it("finds planned-route exposure when the current position is outside", () => {
    // Given
    const danger = hazard([
      { x: 1, y: -1 },
      { x: 3, y: -1 },
      { x: 3, y: 1 },
      { x: 1, y: 1 },
    ]);
    const next = {
      ...input,
      hazards: [danger],
      plannedRoute: [
        { x: 0, y: 0 },
        { x: 8, y: 0 },
      ],
    };
    // When
    const result = evaluateWorkerPlan(next);
    // Then
    expect(result).toMatchObject({
      actionCode: "FOLLOW_VALIDATED_ROUTE",
      exposure: { current: false, plannedRoute: true },
      route: { edgeIds: ["LEVEL", "LONG", "LINK"] },
    });
  });
});
