import { describe, expect, it } from "vitest";
import type { EquipmentState } from "../../../packages/contracts/src/state";
import { deriveEquipmentHazards, type EquipmentRiskModel } from "./equipment";
import { pointInPolygon } from "./geometry";

const equipment: EquipmentState = {
  id: "EQUIPMENT-A",
  presetId: "fixture",
  position: { x: 0, y: 0 },
  headingDeg: 0,
  speedMps: 2,
  slewDeg: 0,
  boomAngleDeg: 0,
  boomLengthM: 10,
  trolleyM: 10,
  hookHeightM: 5,
  geometryVersion: 1,
  positionSource: "mock",
  positionInputSource: "synthetic",
  tableLinked: false,
  positionStatus: "known",
  lastObservedAt: "2026-09-21T09:00:00Z",
};
const body = [
  { x: -1, y: -1 },
  { x: 1, y: -1 },
  { x: 1, y: 1 },
  { x: -1, y: 1 },
];
const model: EquipmentRiskModel = {
  presetId: "fixture",
  movable: true,
  parts: [{ part: "body", frame: "chassis", polygon: body }],
};
const input = {
  equipment,
  model,
  predictionSeconds: 5,
  observedAt: "2026-09-21T09:00:00Z",
  floorId: "GROUND",
};

describe("equipment risk geometry", () => {
  it("sweeps the entire body over predicted linear movement", () => {
    // Given / When
    const hazards = deriveEquipmentHazards(input);
    // Then
    expect(hazards.some((hazard) => pointInPolygon({ x: 10.5, y: 0.5 }, hazard.polygon))).toBe(
      true,
    );
  });

  it("changes the swept corridor with heading", () => {
    // Given
    const next = { ...input, equipment: { ...equipment, headingDeg: 90 } };
    // When
    const hazards = deriveEquipmentHazards(next);
    // Then
    expect(hazards.some((hazard) => pointInPolygon({ x: 0, y: 10 }, hazard.polygon))).toBe(true);
    expect(hazards.some((hazard) => pointInPolygon({ x: 10, y: 0 }, hazard.polygon))).toBe(false);
  });

  it("retains stationary body geometry without translating a fixed tower", () => {
    // Given
    const next = { ...input, model: { ...model, movable: false } };
    // When
    const hazards = deriveEquipmentHazards(next);
    // Then
    expect(hazards.some((hazard) => pointInPolygon({ x: 0, y: 0 }, hazard.polygon))).toBe(true);
    expect(hazards.some((hazard) => pointInPolygon({ x: 10, y: 0 }, hazard.polygon))).toBe(false);
  });

  it("covers the arc between current and planned load rotation", () => {
    // Given
    const next = {
      ...input,
      equipment: { ...equipment, speedMps: 0 },
      plannedSlewDeg: 90,
      model: { ...model, parts: [{ part: "load", frame: "hook", polygon: body }] },
    } satisfies Parameters<typeof deriveEquipmentHazards>[0];
    // When
    const hazards = deriveEquipmentHazards(next);
    // Then
    expect(
      hazards.some((hazard) =>
        pointInPolygon({ x: Math.sqrt(50), y: Math.sqrt(50) }, hazard.polygon),
      ),
    ).toBe(true);
  });

  it("rejects geometry from a replaced equipment preset", () => {
    // Given
    const next = {
      ...input,
      equipment: { ...equipment, presetId: "replacement", geometryVersion: 2 },
    };
    // When / Then
    expect(() => deriveEquipmentHazards(next)).toThrow();
  });
});
