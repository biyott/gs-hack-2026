import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { EquipmentCatalogSchema } from "../../../packages/contracts/src/catalog";
import type { EquipmentState } from "../../../packages/contracts/src/state";
import { deriveEquipmentHazards } from "./equipment";

const catalog = EquipmentCatalogSchema.parse(
  JSON.parse(
    readFileSync(new URL("../../../data/equipment/catalog.json", import.meta.url), "utf8"),
  ),
);
const now = "2026-09-21T09:00:00Z";
const configurations = [
  {
    id: "tadano-gr250n4",
    lengths: [18, 24],
    angles: [35, 65],
    hooks: [3, 10],
    offset: -1.1,
    halfWidth: 0.36,
    telescopes: true,
  },
  {
    id: "liebherr-ltm1050",
    lengths: [24, 30],
    angles: [35, 65],
    hooks: [3, 10],
    offset: -1.8,
    halfWidth: 0.36,
    telescopes: true,
  },
  {
    id: "maeda-mc305",
    lengths: [8, 10.6],
    angles: [30, 75],
    hooks: [1, 4.5],
    offset: 0,
    halfWidth: 0.25,
    telescopes: true,
  },
  {
    id: "liebherr-lr1100",
    lengths: [32, 32],
    angles: [45, 70],
    hooks: [2, 22],
    offset: 1.2,
    halfWidth: 0.45,
    telescopes: false,
  },
] as const;
const rotations = [
  { heading: 0, slew: 0, axis: "x" },
  { heading: 30, slew: 60, axis: "y" },
] as const;

describe("catalog 1.0.1 boom control extrema", () => {
  it("anchors liebherr-lr1100 load to the manufacturer EN p8 boom-pivot datum", () => {
    // Given: LR8503.02.03 EN v01.092022 p8 labels the forward pivot offset 1200 mm.
    const preset = catalog.equipment.find((entry) => entry.id === "liebherr-lr1100");
    const loads = preset?.riskGeometry?.parts.filter((part) => part.part === "load") ?? [];
    const load = loads[0];
    if (!preset || !load) throw new TypeError("Missing LR1100 load geometry");
    // When
    const xs = load.polygon.map((point) => point.x);
    const ys = load.polygon.map((point) => point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    // Then: the same slew-origin frame needs no compensating reference translation.
    expect(loads).toHaveLength(1);
    expect(preset.slewOrigin).toEqual({ x: 0, y: 0, z: 0 });
    expect(load.frame).toBe("hook");
    expect((minX + maxX) / 2).toBeCloseTo(1.2, 8);
    expect((minY + maxY) / 2).toBeCloseTo(0, 8);
    expect(maxX - minX).toBeCloseTo(0.9, 8);
    expect(maxY - minY).toBeCloseTo(0.9, 8);
  });

  for (const configuration of configurations) {
    const preset = catalog.equipment.find((entry) => entry.id === configuration.id);
    if (!preset?.riskGeometry) throw new TypeError(`Missing geometry: ${configuration.id}`);
    const model = preset.riskGeometry;

    it(`preserves the declared control ranges for ${configuration.id}`, () => {
      // Given / When
      const controls = preset.controls;
      // Then
      expect(controls).toMatchObject({
        boomAngle: true,
        boomLength: configuration.telescopes,
        hook: true,
        trolley: false,
      });
      expect(preset.movementLimits).toMatchObject({
        boomLengthM: configuration.lengths,
        boomAngleDeg: configuration.angles,
        hookHeightM: configuration.hooks,
      });
    });

    for (const length of new Set(configuration.lengths)) {
      for (const angle of configuration.angles) {
        for (const hook of configuration.hooks) {
          for (const rotation of rotations) {
            it(`projects ${configuration.id} length ${length} angle ${angle} hook ${hook} on ${rotation.axis}`, () => {
              // Given
              const equipment: EquipmentState = {
                ...preset.demoPose,
                id: "EQUIPMENT-A",
                presetId: preset.id,
                position: { x: 30, y: 25 },
                headingDeg: rotation.heading,
                slewDeg: rotation.slew,
                speedMps: 0,
                geometryVersion: 7,
                boomLengthM: length,
                boomAngleDeg: angle,
                hookHeightM: hook,
                trolleyM: null,
                positionSource: "mock",
                positionInputSource: "synthetic",
                tableLinked: false,
                positionStatus: "known",
                lastObservedAt: now,
              };
              const projectedRadius =
                configuration.offset + length * Math.cos((angle * Math.PI) / 180);
              const centerX = rotation.axis === "x" ? 30 + projectedRadius : 30;
              const centerY = rotation.axis === "y" ? 25 + projectedRadius : 25;
              // When
              const hazards = deriveEquipmentHazards({
                equipment,
                model,
                predictionSeconds: 5,
                observedAt: now,
                floorId: "GROUND",
              });
              // Then
              const load = hazards.find((entry) => entry.part === "load");
              if (!load) throw new TypeError(`Missing load hazard: ${preset.id}`);
              expect(Math.min(...load.polygon.map((point) => point.x))).toBeCloseTo(
                centerX - configuration.halfWidth,
                8,
              );
              expect(Math.max(...load.polygon.map((point) => point.x))).toBeCloseTo(
                centerX + configuration.halfWidth,
                8,
              );
              expect(Math.min(...load.polygon.map((point) => point.y))).toBeCloseTo(
                centerY - configuration.halfWidth,
                8,
              );
              expect(Math.max(...load.polygon.map((point) => point.y))).toBeCloseTo(
                centerY + configuration.halfWidth,
                8,
              );
              expect(load.geometryVersion).toBe(7);
            });
          }
        }
      }
    }
  }
});
