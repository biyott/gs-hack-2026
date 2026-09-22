import { describe, expect, it } from "vitest";
import type { Guidance, Hazard, SimulationSnapshot } from "@/contracts";
import { guidanceFixture, runFixture } from "../db/fixtures.test-support";
import { permitsEgress } from "../engine/geometry";
import { emptyResponse } from "../simulation/snapshots";
import { guidanceApplicability } from "./rag-applicability";

const beforeAt = "2026-09-21T09:00:00.000Z";
const currentAt = "2026-09-21T09:00:01.000Z";
const rectangle = (right: number) => [
  { x: -1, y: -1 },
  { x: right, y: -1 },
  { x: right, y: 1 },
  { x: -1, y: 1 },
];

function snapshot(guidance: Guidance, version: number): SimulationSnapshot {
  const base = runFixture(guidance.simulationMode);
  return {
    ...base,
    run: {
      ...base.run,
      runId: guidance.runId,
      mapId: guidance.mapId,
      mapVersion: guidance.mapVersion,
      version,
      updatedAt: guidance.generatedAt,
    },
    workers: [
      {
        workerId: guidance.workerId,
        profile: guidance.profileSnapshot,
        position: { x: 0, y: 0 },
        positionStatus: "known",
        lastObservedAt: guidance.generatedAt,
        positionSource: "mock",
        positionInputSource: "synthetic",
        currentGuidance: guidance,
        response: emptyResponse(),
        virtual: false,
      },
    ],
  };
}

function transition(mode: "equipment" | "fire-gas" = "fire-gas") {
  const old: Guidance = {
    ...guidanceFixture(),
    simulationMode: mode,
    runId: `run-${mode}`,
    actionCode: "FOLLOW_VALIDATED_ROUTE",
    hazardType: mode === "fire-gas" ? "fire" : "equipment",
    hazardIds: ["fire-1"],
    generatedAt: beforeAt,
    expiresAt: "2026-09-21T09:01:00.000Z",
    destinationId: "A",
    routeVersion: 1,
    stepId: "A",
    waypoints: [
      { x: 0, y: 0, nodeId: "WORKER-POSITION", floorId: "F1" },
      { x: 10, y: 0, nodeId: "A", floorId: "F1" },
    ],
  };
  const current: Guidance = {
    ...old,
    guidanceVersion: 2,
    primaryGuidanceVersion: 2,
    generatedAt: currentAt,
    eventId: "event-2",
    destinationId: "B",
    routeVersion: 2,
    stepId: "TURN",
    waypoints: [
      { x: 0, y: 0, nodeId: "WORKER-POSITION", floorId: "F1" },
      { x: 0, y: 3, nodeId: "TURN", floorId: "F1" },
      { x: 10, y: 3, nodeId: "B", floorId: "F1" },
    ],
  };
  const fire: Hazard = {
    hazardId: "fire-1",
    hazardType: "fire",
    priority: "critical",
    active: true,
    floorId: "F1",
    source: "mock",
    observedAt: beforeAt,
    sensorStatus: "current",
    polygon: rectangle(1),
    affectedWorkerIds: [],
    reason: "fixture",
    zoneId: "ZONE-A",
    substanceId: null,
  };
  const before = { ...snapshot(old, 1), hazards: mode === "fire-gas" ? [fire] : [] };
  const after = {
    ...snapshot(current, 2),
    hazards:
      mode === "fire-gas" ? [{ ...fire, observedAt: currentAt, polygon: rectangle(11) }] : [],
  };
  return { old, current, before, after };
}

const facts = (current: Guidance, history: readonly SimulationSnapshot[]) =>
  guidanceApplicability(current, history, 5000);

describe("QD008 authoritative applicability transition", () => {
  it("recognizes actual fire invalidation of the old permissible egress path across a new incident", () => {
    const { old, current, before, after } = transition();
    const next = {
      ...current,
      guidanceId: "new-fire-guidance",
      incidentId: "new-fire-incident",
      guidanceVersion: 1,
      primaryGuidanceVersion: 1,
    };
    const replacement = {
      ...after,
      workers: after.workers.map((worker) => ({ ...worker, currentGuidance: next })),
    };
    expect(
      permitsEgress(
        old.waypoints,
        before.hazards.map((hazard) => hazard.polygon),
      ),
    ).toBe(true);
    expect(
      permitsEgress(
        old.waypoints,
        after.hazards.map((hazard) => hazard.polygon),
      ),
    ).toBe(false);
    expect(
      permitsEgress(
        next.waypoints,
        after.hazards.map((hazard) => hazard.polygon),
      ),
    ).toBe(true);
    expect(facts(next, [before, replacement])).toEqual({
      fireInvalidatedPreviousRoute: true,
      equipmentDirectionChanged: false,
    });
  });

  it.each([
    "unchanged fire",
    "expired route",
    "stale sensor",
    "future sensor",
    "irrelevant fire",
    "unsafe replacement",
  ] as const)("rejects %s as causal fire evidence", (cause) => {
    const { old, current, before, after } = transition();
    const prior =
      cause === "expired route"
        ? {
            ...before,
            workers: before.workers.map((worker) => ({
              ...worker,
              currentGuidance: { ...old, expiresAt: currentAt },
            })),
          }
        : before;
    const latest =
      cause === "unsafe replacement" ? { ...current, waypoints: old.waypoints } : current;
    const changed = {
      ...after,
      closedEdgeIds: ["CLOSED-BY-ROUTE-BLOCK"],
      workers: after.workers.map((worker) => ({ ...worker, currentGuidance: latest })),
      hazards: after.hazards.map((hazard) => ({
        ...hazard,
        ...(cause === "unchanged fire" ? { polygon: rectangle(1) } : {}),
        ...(cause === "stale sensor" ? { observedAt: "2026-09-21T08:59:50.000Z" } : {}),
        ...(cause === "future sensor" ? { observedAt: "2026-09-21T09:00:02.000Z" } : {}),
        ...(cause === "irrelevant fire" ? { hazardId: "other-fire" } : {}),
      })),
    };
    expect(facts(latest, [prior, changed]).fireInvalidatedPreviousRoute).toBe(false);
  });

  it("anchors the first primary appearance through later ACK and supplement snapshots", () => {
    const { current, before, after } = transition();
    const supplement: Guidance = {
      ...current,
      guidanceVersion: 3,
      updateKind: "supplement",
      mode: "rag-assisted",
      supplementalExplanation: "evidence",
      evidence: [{ documentId: "d", documentVersion: "1", chunkId: "c" }],
    };
    const later = {
      ...after,
      run: { ...after.run, version: 3, updatedAt: "2026-09-21T09:03:00.000Z" },
    };
    const supplemental = {
      ...later,
      run: { ...later.run, version: 4 },
      workers: later.workers.map((worker) => ({ ...worker, currentGuidance: supplement })),
    };
    expect(
      facts(supplement, [before, after, later, supplemental]).fireInvalidatedPreviousRoute,
    ).toBe(true);
  });

  it("rejects a projection route whose omitted graph-node identity makes attachment ambiguous", () => {
    const { old, current, before, after } = transition();
    const ambiguous = {
      ...old,
      waypoints: [
        { x: 0, y: 0, nodeId: "WORKER-POSITION", floorId: "F1" },
        { x: 2, y: 0, nodeId: "CORRIDOR-PROJECTION", floorId: "F1" },
        { x: 10, y: 0, nodeId: "A", floorId: "F1" },
      ],
    };
    const prior = {
      ...before,
      workers: before.workers.map((worker) => ({ ...worker, currentGuidance: ambiguous })),
    };
    expect(facts(current, [prior, after]).fireInvalidatedPreviousRoute).toBe(false);
  });

  it("fails closed for missing, duplicate-worker, or mismatched immediate predecessor context", () => {
    const { current, before, after } = transition();
    expect(facts(current, [after]).fireInvalidatedPreviousRoute).toBe(false);
    expect(
      facts(current, [before, { ...after, workers: [...after.workers, ...after.workers] }])
        .fireInvalidatedPreviousRoute,
    ).toBe(false);
    const foreign = { ...before, run: { ...before.run, mapVersion: "foreign" } };
    expect(facts(current, [before, foreign, after]).fireInvalidatedPreviousRoute).toBe(false);
  });

  it.each(["headingDeg", "slewDeg"] as const)(
    "recognizes a real %s change on the new primary's transition",
    (field) => {
      const { current, before, after } = transition("equipment");
      expect(
        facts(current, [before, { ...after, equipment: { ...after.equipment, [field]: 5 } }]),
      ).toEqual({ fireInvalidatedPreviousRoute: false, equipmentDirectionChanged: true });
    },
  );

  it.each(["geometry only", "model switch", "unknown position", "wrapped heading"] as const)(
    "does not infer direction from %s",
    (cause) => {
      const { current, before, after } = transition("equipment");
      const equipment = {
        ...after.equipment,
        geometryVersion: 2,
        ...(cause === "model switch" ? { presetId: "other-model", headingDeg: 5 } : {}),
        ...(cause === "unknown position"
          ? { positionStatus: "unknown" as const, headingDeg: 5 }
          : {}),
        ...(cause === "wrapped heading" ? { headingDeg: 360 } : {}),
      };
      expect(facts(current, [before, { ...after, equipment }]).equipmentDirectionChanged).toBe(
        false,
      );
    },
  );

  it("does not borrow a later movement or an older matching snapshot across missing context", () => {
    const { current, before, after } = transition("equipment");
    const later = {
      ...after,
      run: { ...after.run, version: 3 },
      equipment: { ...after.equipment, headingDeg: 5 },
    };
    expect(facts(current, [before, after, later]).equipmentDirectionChanged).toBe(false);
    expect(facts(current, [{ ...before, workers: [] }, later]).equipmentDirectionChanged).toBe(
      false,
    );
  });
});
