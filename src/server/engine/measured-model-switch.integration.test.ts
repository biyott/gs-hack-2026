import { describe, expect, it } from "vitest";
import { configuration, fixture } from "../simulation/runtime-test-fixtures";

describe("measured input projection when equipment capability changes", () => {
  it("marks a movable replacement unknown when the fixed tower had no measured observations", () => {
    // Given
    const f = fixture();
    f.command({ action: "start" });
    f.command({ action: "equipment", presetId: "liebherr-172ecb" });
    const tower = f.command({ action: "position-input", input: "measured" });
    expect(tower.equipment).toMatchObject({
      positionStatus: "known",
      positionInputSource: "synthetic",
      positionSource: "mock",
    });
    // When
    const result = f.command({ action: "equipment", presetId: "sk1265-at6" });
    // Then
    expect(result.run.positionInput).toBe("measured");
    expect(result.equipment).toMatchObject({
      presetId: "sk1265-at6",
      positionStatus: "unknown",
      positionInputSource: "unknown",
      positionSource: "video",
      lastObservedAt: null,
    });
    expect(result.hazards.some((hazard) => hazard.hazardType === "position-unknown")).toBe(true);
    expect(result.hazards.some((hazard) => hazard.hazardType === "equipment")).toBe(false);
  });

  it("restores the authored fixed tower when the movable predecessor had no measured observations", () => {
    // Given
    const f = fixture();
    f.command({ action: "start" });
    const mobile = f.command({ action: "position-input", input: "measured" });
    expect(mobile.equipment).toMatchObject({
      positionStatus: "unknown",
      positionInputSource: "unknown",
      positionSource: "video",
    });
    // When
    const result = f.command({ action: "equipment", presetId: "liebherr-172ecb" });
    // Then
    expect(result.run.positionInput).toBe("measured");
    expect(result.equipment).toMatchObject({
      presetId: "liebherr-172ecb",
      position: configuration.map.metadata.craneOrigin,
      headingDeg: 0,
      speedMps: 0,
      positionStatus: "known",
      positionInputSource: "synthetic",
      positionSource: "mock",
    });
    expect(result.hazards.some((hazard) => hazard.hazardType === "position-unknown")).toBe(false);
    expect(result.hazards.some((hazard) => hazard.hazardType === "equipment")).toBe(true);
  });
});
