import { describe, expect, it } from "vitest";
import type { UwbUpload } from "../packages/contracts/src/tracking";
import type { UwbFixedAnchor } from "../packages/contracts/src/uwb-anchor";
import { deriveUwbObservation, type UwbContext } from "../src/server/tracking/uwb";

const receivedAt = "2026-09-22T09:00:00.500Z";
const input: UwbUpload = {
  deviceId: "fixed-note20",
  workerId: "WORKER-A",
  source: "live",
  capturedAt: "2026-09-22T09:00:00.000Z",
  sequence: 1,
  distanceM: 0.5,
  azimuthRad: 0,
  elevationRad: null,
  uncertaintyM: 0.02,
};
const anchor: UwbFixedAnchor = {
  version: "measured-1",
  positionTableM: { x: 0.3, y: 0.25 },
  headingRad: 0,
  antennaHeightM: 0.1,
  workerAntennaHeightsM: { "WORKER-A": 0.1, "WORKER-B": 0.1 },
};
const context: UwbContext = { calibration: null, poses: [], receivedAt, uwbAnchor: anchor };

describe("fixed UWB antenna reference", () => {
  it("projects a live worker antenna without camera calibration or marker poses", () => {
    // Given a surveyed fixed controller and actual radio distance and bearing.
    // When projecting with no camera state.
    const result = deriveUwbObservation(input, context);
    // Then coordinates and uncertainty come from radio input relative to the explicit reference.
    expect(result).toMatchObject({
      status: "valid",
      inputSource: "live",
      rangeInputSource: "live",
      referenceSource: "fixed-anchor",
      position: { x: 80, y: 25, z: 0 },
      tablePositionM: { x: 0.8, y: 0.25 },
      uncertaintyWorldM: 2,
    });
  });

  it.each([
    { headingRad: 0, azimuthRad: Math.PI / 2, x: 0.3, y: -0.25 },
    { headingRad: 0, azimuthRad: -Math.PI / 2, x: 0.3, y: 0.75 },
    { headingRad: Math.PI / 2, azimuthRad: 0, x: 0.3, y: 0.75 },
    { headingRad: -Math.PI / 2, azimuthRad: 0, x: 0.3, y: -0.25 },
    { headingRad: Math.PI, azimuthRad: 0, x: -0.2, y: 0.25 },
  ])("rotates clockwise radio bearing with fixed heading $headingRad/$azimuthRad", (sample) => {
    // Given independent surveyed heading and clockwise sensor bearing.
    // When converting the antenna vector to table axes.
    const result = deriveUwbObservation(
      { ...input, azimuthRad: sample.azimuthRad },
      { ...context, uwbAnchor: { ...anchor, headingRad: sample.headingRad } },
    );
    // Then positions follow the configured axes, including measured points outside the table.
    expect(result.tablePositionM).toEqual({
      x: expect.closeTo(sample.x, 9),
      y: expect.closeTo(sample.y, 9),
    });
  });

  it.each([
    { elevationRad: null, workerHeight: 0.4, x: 0.7 },
    { elevationRad: Math.PI / 3, workerHeight: 0.1, x: 0.55 },
  ])("removes vertical separation with elevation $elevationRad", (sample) => {
    // Given a slant range and either surveyed antenna heights or measured elevation.
    // When resolving the planar antenna displacement.
    const result = deriveUwbObservation(
      { ...input, elevationRad: sample.elevationRad },
      {
        ...context,
        uwbAnchor: {
          ...anchor,
          workerAntennaHeightsM: { "WORKER-A": sample.workerHeight, "WORKER-B": 0.1 },
        },
      },
    );
    // Then the raw range stays intact and XY uses its horizontal component.
    expect(result.tableDistanceM).toBe(0.5);
    expect(result.tablePositionM?.x).toBeCloseTo(sample.x, 9);
  });

  it.each([
    { values: { azimuthRad: null }, status: "distance-only" },
    { values: { distanceM: null }, status: "invalid" },
    { values: { capturedAt: "2026-09-22T08:59:59.000Z" }, status: "stale" },
    { values: { capturedAt: "2026-09-22T09:00:01.000Z" }, status: "invalid" },
  ])("keeps unavailable input fail-closed as $status", ({ values, status }) => {
    // Given incomplete or untimely radio input with a valid configured reference.
    // When projecting the observation.
    const result = deriveUwbObservation({ ...input, ...values }, context);
    // Then a reference alone cannot fabricate an observation.
    expect(result).toMatchObject({ status, position: null, tablePositionM: null });
  });

  it("rejects impossible vertical geometry without fabricating coordinates", () => {
    // Given a 0.5m range shorter than the 0.9m surveyed vertical separation.
    // When projecting a range without measured elevation.
    const result = deriveUwbObservation(input, {
      ...context,
      uwbAnchor: { ...anchor, workerAntennaHeightsM: { "WORKER-A": 1, "WORKER-B": 0.1 } },
    });
    // Then impossible geometry stays unavailable.
    expect(result).toMatchObject({ status: "invalid", position: null });
  });

  it.each(["live", "synthetic", undefined] as const)("preserves radio provenance %s", (source) => {
    // Given the source classification of the radio report.
    // When projecting against the manual reference.
    const result = deriveUwbObservation({ ...input, source }, context);
    // Then configuration does not relabel synthetic or unknown ranges as live.
    expect(result.inputSource).toBe(source ?? "unknown");
    expect(result.rangeInputSource).toBe(source ?? "unknown");
  });
});
