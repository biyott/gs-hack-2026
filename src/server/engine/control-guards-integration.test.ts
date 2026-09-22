import { describe, expect, it } from "vitest";
import { fixture } from "../simulation/runtime-test-fixtures";

const extrema = [
  { id: "tadano-gr250n4", angle: 35, length: 18, hook: 3 },
  { id: "tadano-gr250n4", angle: 65, length: 24, hook: 10 },
  { id: "liebherr-ltm1050", angle: 35, length: 24, hook: 3 },
  { id: "liebherr-ltm1050", angle: 65, length: 30, hook: 10 },
  { id: "maeda-mc305", angle: 30, length: 8, hook: 1 },
  { id: "maeda-mc305", angle: 75, length: 10.6, hook: 4.5 },
  { id: "liebherr-lr1100", angle: 45, length: null, hook: 2 },
  { id: "liebherr-lr1100", angle: 70, length: null, hook: 22 },
] as const;

describe("catalog 1.0.1 authoritative control guards", () => {
  for (const endpoint of extrema) {
    it(`accepts ${endpoint.id} angle ${endpoint.angle} hook ${endpoint.hook} and regenerates hazards`, () => {
      // Given
      const f = fixture();
      const before = f.command({ action: "equipment", presetId: endpoint.id });
      const pose = {
        boomAngleDeg: endpoint.angle,
        hookHeightM: endpoint.hook,
        ...(endpoint.length === null ? {} : { boomLengthM: endpoint.length }),
      };
      // When
      const after = f.command({ action: "control", pose });
      // Then
      expect(after.equipment).toMatchObject({
        ...pose,
        geometryVersion: before.equipment.geometryVersion + 1,
      });
      expect(after.hazards.length).toBeGreaterThan(0);
      expect(
        after.hazards.every((hazard) =>
          hazard.hazardId.includes(`:${endpoint.id}:${after.equipment.geometryVersion}:`),
        ),
      ).toBe(true);
    });
  }

  it.each([{ position: { x: 31, y: 25 } }, { headingDeg: 1 }, { speedMps: 1 }])(
    "rejects unsupported fixed tower chassis control %j before mutating state",
    (pose) => {
      // Given
      const f = fixture();
      const before = f.command({ action: "equipment", presetId: "liebherr-172ecb" });
      // When / Then
      expect(() => f.command({ action: "control", pose })).toThrowError(
        expect.objectContaining({ code: "UNSUPPORTED_CONTROL" }),
      );
      expect(f.snapshot()).toEqual(before);
    },
  );

  it.each([31, 32, 33])(
    "rejects unsupported LR boom length command %s and retains fixed 32m",
    (boomLengthM) => {
      // Given
      const f = fixture();
      const before = f.command({ action: "equipment", presetId: "liebherr-lr1100" });
      // When / Then
      expect(() => f.command({ action: "control", pose: { boomLengthM } })).toThrowError(
        expect.objectContaining({ code: "UNSUPPORTED_CONTROL" }),
      );
      expect(f.snapshot()).toEqual(before);
      expect(f.snapshot().equipment.boomLengthM).toBe(32);
    },
  );
});
