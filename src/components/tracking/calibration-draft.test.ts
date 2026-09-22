import { describe, expect, it } from "vitest";
import markerSheetAssignments from "../../../tools/calibration/example-calibration.json";
import { CALIBRATION_ENTITIES, parseCalibrationForm } from "./calibration-draft";

function measuredForm(): FormData {
  const form = new FormData();
  form.set("version", "measured-2026-09-21");
  form.set("cameraId", "CCTV-1");
  form.set("cameraX", "0.7");
  form.set("cameraY", "0.25");
  form.set("cameraHeight", "0.8");
  const entities = ["EQUIPMENT-A", "WORKER-A", "WORKER-B"];
  for (const [index, entity] of entities.entries()) {
    form.set(`${entity}.markerId`, String(index + 4));
    form.set(`${entity}.heightM`, "0.03");
    form.set(`${entity}.antennaHeightM`, "0.04");
    form.set(`${entity}.referenceX`, "0.01");
    form.set(`${entity}.referenceY`, "0");
    form.set(`${entity}.antennaX`, "-0.02");
    form.set(`${entity}.antennaY`, "0.01");
  }
  return form;
}

describe("calibration form boundary", () => {
  it("assigns the entity markers shipped with the printable sheet", () => {
    // Given the independently maintained printable-marker calibration fixture.
    const expected = markerSheetAssignments.markers.map(({ entityId, markerId }) => ({
      entityId,
      markerId,
    }));
    // When the uncalibrated form selects marker assignments.
    const selected = CALIBRATION_ENTITIES.map(({ entityId, markerId }) => ({ entityId, markerId }));
    // Then the default IDs refer to the entity markers the operator can print.
    expect(selected).toEqual(expected);
  });
  it("accepts measured geometry without rescaling table meters", () => {
    // Given
    const form = measuredForm();
    // When
    const result = parseCalibrationForm(form);
    // Then
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.camera?.positionTableM).toEqual({ x: 0.7, y: 0.25 });
      expect(result.data.markers[0]?.markerToAntennaM).toEqual({ x: -0.02, y: 0.01 });
    }
  });

  it("rejects an empty required measurement instead of coercing it to zero", () => {
    // Given
    const form = measuredForm();
    form.set("WORKER-A.referenceX", "  ");
    // When
    const result = parseCalibrationForm(form);
    // Then
    expect(result.success).toBe(false);
  });

  it("preserves absent camera, yaw and evaluation as null", () => {
    // Given
    const form = measuredForm();
    for (const key of ["cameraX", "cameraY", "cameraHeight"]) form.set(key, "");
    // When
    const result = parseCalibrationForm(form);
    // Then
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.camera).toBeNull();
      expect(result.data.uwbYawRad).toBeNull();
      expect(result.data.evaluationErrorM).toBeNull();
    }
  });

  it("rejects partially entered camera geometry", () => {
    // Given
    const form = measuredForm();
    form.set("cameraY", "");
    // When
    const result = parseCalibrationForm(form);
    // Then
    expect(result.success).toBe(false);
  });

  it("rejects duplicate physical marker assignments", () => {
    // Given
    const form = measuredForm();
    form.set("WORKER-A.markerId", "4");
    // When
    const result = parseCalibrationForm(form);
    // Then
    expect(result.success).toBe(false);
  });

  it("rejects a camera below a measured marker plane", () => {
    // Given
    const form = measuredForm();
    form.set("cameraHeight", "0.02");
    // When
    const result = parseCalibrationForm(form);
    // Then
    expect(result.success).toBe(false);
  });

  it("preserves explicitly measured zero yaw and evaluation error", () => {
    // Given
    const form = measuredForm();
    form.set("uwbYawRad", "0");
    form.set("evaluationErrorM", "0");
    // When
    const result = parseCalibrationForm(form);
    // Then
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.uwbYawRad).toBe(0);
      expect(result.data.evaluationErrorM).toBe(0);
    }
  });

  it.each([
    { field: "version", value: "   " },
    { field: "cameraHeight", value: "0" },
    { field: "uwbYawRad", value: "3.2" },
    { field: "evaluationErrorM", value: "-0.01" },
    { field: "WORKER-A.referenceX", value: "Infinity" },
  ])("rejects an invalid $field measurement", ({ field, value }) => {
    // Given
    const form = measuredForm();
    form.set(field, value);
    // When
    const result = parseCalibrationForm(form);
    // Then
    expect(result.success).toBe(false);
  });
});
