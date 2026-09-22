import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  EquipmentCatalogSchema,
  type EquipmentPreset,
} from "../../../packages/contracts/src/catalog";
import type { EquipmentState } from "../../../packages/contracts/src/state";
import { deriveEquipmentHazards } from "./equipment";
import { pointInPolygon } from "./geometry";

const catalog = EquipmentCatalogSchema.parse(
  JSON.parse(
    readFileSync(new URL("../../../data/equipment/catalog.json", import.meta.url), "utf8"),
  ),
);
const now = "2026-09-21T09:00:00Z";

function state(preset: EquipmentPreset): EquipmentState {
  return {
    ...preset.demoPose,
    id: "EQUIPMENT-A",
    presetId: preset.id,
    position: { x: 30, y: 25 },
    headingDeg: 0,
    speedMps: 0,
    geometryVersion: 1,
    positionSource: "mock",
    positionInputSource: "synthetic",
    tableLinked: false,
    positionStatus: "known",
    lastObservedAt: now,
  };
}

describe("six catalog geometry presets", () => {
  it("contains exactly the six fixed preset identifiers", () => {
    // Given / When
    const ids = catalog.equipment.map((preset) => preset.id).sort();
    // Then
    expect(ids).toEqual(
      [
        "sk1265-at6",
        "tadano-gr250n4",
        "liebherr-ltm1050",
        "maeda-mc305",
        "liebherr-lr1100",
        "liebherr-172ecb",
      ].sort(),
    );
  });

  for (const preset of catalog.equipment) {
    it(`derives finite separate risk parts for ${preset.id}`, () => {
      // Given
      if (preset.riskGeometry === null) throw new TypeError(`Missing risk geometry: ${preset.id}`);
      const input = {
        equipment: state(preset),
        model: preset.riskGeometry,
        predictionSeconds: 5,
        observedAt: now,
        floorId: "GROUND",
      };
      // When
      const hazards = deriveEquipmentHazards(input);
      // Then
      expect(hazards.length).toBe(preset.riskGeometry.parts.length);
      expect(new Set(hazards.map((hazard) => hazard.part))).toEqual(
        new Set(preset.riskGeometry.parts.map((part) => part.part)),
      );
      expect(
        hazards.every(
          (hazard) =>
            hazard.polygon.length >= 3 &&
            hazard.polygon.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y)),
        ),
      ).toBe(true);
      expect(preset.riskGeometry.movable).toBe(preset.controls.translation);
    });

    it(`predicts only supported translation for ${preset.id}`, () => {
      // Given
      if (preset.riskGeometry === null) throw new TypeError(`Missing risk geometry: ${preset.id}`);
      const equipment = { ...state(preset), speedMps: 2 };
      const input = {
        equipment,
        model: preset.riskGeometry,
        predictionSeconds: 5,
        observedAt: now,
        floorId: "GROUND",
      };
      const body = preset.riskGeometry.parts.find((part) => part.part === "body");
      if (!body) throw new TypeError(`Missing body: ${preset.id}`);
      const furthestX = Math.max(...body.polygon.map((point) => point.x));
      const point = { x: equipment.position.x + furthestX + 5, y: equipment.position.y };
      // When
      const hazards = deriveEquipmentHazards(input);
      // Then
      expect(
        hazards
          .filter((hazard) => hazard.part === "body")
          .some((hazard) => pointInPolygon(point, hazard.polygon)),
      ).toBe(preset.controls.translation);
    });

    it(`invalidates prior geometry identifiers after replacing ${preset.id}`, () => {
      // Given
      if (preset.riskGeometry === null) throw new TypeError(`Missing risk geometry: ${preset.id}`);
      const equipment = { ...state(preset), geometryVersion: 2 };
      // When
      const hazards = deriveEquipmentHazards({
        equipment,
        model: preset.riskGeometry,
        predictionSeconds: 5,
        observedAt: now,
        floorId: "GROUND",
      });
      // Then
      expect(
        hazards.every(
          (hazard) => hazard.geometryVersion === 2 && hazard.hazardId.includes(`:${preset.id}:2:`),
        ),
      ).toBe(true);
    });

    it(`rotates upper risk parts independently of the chassis for ${preset.id}`, () => {
      // Given
      if (preset.riskGeometry === null) throw new TypeError(`Missing risk geometry: ${preset.id}`);
      const initial = {
        equipment: state(preset),
        model: preset.riskGeometry,
        predictionSeconds: 5,
        observedAt: now,
        floorId: "GROUND",
      };
      const baseline = deriveEquipmentHazards(initial);
      // When
      const rotated = deriveEquipmentHazards({
        ...initial,
        equipment: { ...initial.equipment, slewDeg: 90 },
      });
      // Then
      expect(preset.controls.slew).toBe(true);
      for (const original of baseline) {
        const after = rotated.find((candidate) => candidate.hazardId === original.hazardId);
        if (!after) throw new TypeError(`Missing rotated part: ${original.hazardId}`);
        const upper = original.part === "tail" || original.part === "load";
        const expected = original.polygon.map((point) =>
          upper ? { x: 30 - (point.y - 25), y: 25 + (point.x - 30) } : point,
        );
        expect(expected.every((point) => pointInPolygon(point, after.polygon))).toBe(true);
      }
    });

    if (preset.controls.trolley) {
      it(`moves the load footprint with the supported trolley for ${preset.id}`, () => {
        // Given
        if (preset.riskGeometry === null || preset.demoPose.trolleyM === null)
          throw new TypeError(`Missing trolley configuration: ${preset.id}`);
        const initial = {
          equipment: state(preset),
          model: preset.riskGeometry,
          predictionSeconds: 5,
          observedAt: now,
          floorId: "GROUND",
        };
        const baseline = deriveEquipmentHazards(initial).filter((hazard) => hazard.part === "load");
        // When
        const moved = deriveEquipmentHazards({
          ...initial,
          equipment: { ...initial.equipment, trolleyM: preset.demoPose.trolleyM + 5 },
        });
        // Then
        for (const original of baseline) {
          const after = moved.find((candidate) => candidate.hazardId === original.hazardId);
          if (!after) throw new TypeError(`Missing load part: ${original.hazardId}`);
          expect(
            original.polygon.every((point) =>
              pointInPolygon({ x: point.x + 5, y: point.y }, after.polygon),
            ),
          ).toBe(true);
        }
      });
    }

    if (preset.controls.hook) {
      it(`retains the conservative ground projection during supported hoisting for ${preset.id}`, () => {
        // Given
        if (preset.riskGeometry === null || preset.demoPose.hookHeightM === null)
          throw new TypeError(`Missing hook configuration: ${preset.id}`);
        const initial = {
          equipment: state(preset),
          model: preset.riskGeometry,
          predictionSeconds: 5,
          observedAt: now,
          floorId: "GROUND",
        };
        const baseline = deriveEquipmentHazards(initial)
          .filter((hazard) => hazard.part === "load")
          .map((hazard) => hazard.polygon);
        // When
        const lifted = deriveEquipmentHazards({
          ...initial,
          equipment: { ...initial.equipment, hookHeightM: preset.demoPose.hookHeightM + 1 },
        });
        // Then
        expect(
          lifted.filter((hazard) => hazard.part === "load").map((hazard) => hazard.polygon),
        ).toEqual(baseline);
      });
    }
  }
});
