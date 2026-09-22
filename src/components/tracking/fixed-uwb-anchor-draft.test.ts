import { describe, expect, it } from "vitest";
import { parseFixedUwbAnchorForm } from "./fixed-uwb-anchor-draft";

function anchorForm() {
  const form = new FormData();
  Object.entries({
    xCm: "30",
    yCm: "25",
    headingDeg: "90",
    equipmentHeightCm: "110",
    workerAHeightCm: "80",
    workerBHeightCm: "125",
  }).forEach(([key, value]) => {
    form.set(key, value);
  });
  return form;
}

describe("fixed UWB anchor form boundary", () => {
  it("accepts the right and upper table edges without floating point overflow", () => {
    // Given a fixed anchor exactly at the configured table boundary.
    const form = anchorForm();
    form.set("xCm", "140");
    form.set("yCm", "50");
    // When centimeters are converted to meters.
    const result = parseFixedUwbAnchorForm(form, "edge");
    // Then the allowed boundary is preserved exactly.
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.positionTableM).toEqual({ x: 1.4, y: 0.5 });
  });
  it("converts entered centimeters and degrees to the shared meter/radian contract", () => {
    // Given distinct positions, heading, and antenna heights.
    const form = anchorForm();
    // When the user applies this configuration.
    const result = parseFixedUwbAnchorForm(form, "note20-test");
    // Then each value retains its physical unit and worker assignment.
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual({
      version: "note20-test",
      positionTableM: { x: 0.3, y: 0.25 },
      headingRad: Math.PI / 2,
      antennaHeightM: 1.1,
      workerAntennaHeightsM: { "WORKER-A": 0.8, "WORKER-B": 1.25 },
    });
  });

  it.each([
    ["xCm", "140.1"],
    ["yCm", "50.1"],
    ["headingDeg", "181"],
    ["equipmentHeightCm", "-1"],
    ["workerAHeightCm", "301"],
    ["workerBHeightCm", "Infinity"],
    ["xCm", ""],
    ["equipmentHeightCm", "  "],
  ])("rejects invalid input %s=%s instead of generating a location", (field, value) => {
    // Given an invalid or missing physical measurement.
    const form = anchorForm();
    form.set(field, value);
    // When it crosses the form boundary.
    const result = parseFixedUwbAnchorForm(form, "note20-test");
    // Then the malformed configuration cannot be submitted.
    expect(result.success).toBe(false);
  });
});
