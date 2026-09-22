import { describe, expect, it } from "vitest";
import type { Calibration, UwbUpload } from "../packages/contracts/src/tracking";
import type { MarkerPose } from "../src/server/tracking/types";
import { deriveUwbObservation } from "../src/server/tracking/uwb";

const receivedAt = "2026-09-21T09:00:01.000Z";
const capturedAt = "2026-09-21T09:00:00.500Z";
const calibration: Calibration = {
  version: "test-1",
  cameraId: "camera-1",
  camera: null,
  uwbYawRad: 0,
  evaluationErrorM: null,
  markers: (["EQUIPMENT-A", "WORKER-A", "WORKER-B"] as const).map((entityId, i) => ({
    markerId: i + 4,
    entityId,
    heightM: 0.1,
    antennaHeightM: 0.1,
    markerToReferenceM: { x: 0, y: 0 },
    markerToAntennaM: { x: 0, y: 0 },
  })) satisfies Calibration["markers"],
};
const equipmentPose: MarkerPose = {
  entityId: "EQUIPMENT-A",
  markerId: 4,
  centerTableM: { x: 0.1, y: 0.1 },
  antennaTableM: { x: 0.2, y: 0.1 },
  headingRad: 0,
  observedAt: capturedAt,
};
const workerPose: MarkerPose = {
  entityId: "WORKER-A",
  markerId: 5,
  centerTableM: { x: 8, y: 9 },
  antennaTableM: { x: 8, y: 9 },
  headingRad: Math.PI / 2,
  observedAt: capturedAt,
};
const input: UwbUpload = {
  deviceId: "controller",
  workerId: "WORKER-A",
  capturedAt,
  sequence: 1,
  distanceM: 0.5,
  azimuthRad: 0,
  elevationRad: null,
  uncertaintyM: null,
};
const context = { calibration, poses: [equipmentPose, workerPose], receivedAt };

describe("UWB measurement observations", () => {
  it.each([Math.PI / 2, -Math.PI / 2])(
    "projects raw clockwise azimuth %s with height correction",
    (azimuthRad) => {
      // Given an upright sensor and 0.3m slant range with 0.24m vertical antenna separation.
      const markers = calibration.markers.map((marker) => ({
        ...marker,
        antennaHeightM: marker.entityId === "WORKER-A" ? 0.34 : 0.1,
      }));
      const pose = { ...equipmentPose, antennaTableM: { x: 0.7, y: 0.25 } };
      // When native clockwise radians enter the counterclockwise table plane.
      const result = deriveUwbObservation(
        { ...input, distanceM: 0.3, azimuthRad },
        {
          ...context,
          calibration: { ...calibration, markers },
          poses: [pose],
        },
      );
      // Then a positive bearing turns toward table -Y while the raw angle stays unchanged.
      expect(result.tablePositionM).toEqual({
        x: expect.closeTo(0.7, 9),
        y: expect.closeTo(0.25 - Math.sign(azimuthRad) * 0.18, 9),
      });
      expect(result.azimuthRad).toBe(azimuthRad);
    },
  );

  it("preserves live raw range provenance while marking a synthetic camera origin", () => {
    // Given a live UWB range anchored to an explicitly synthetic equipment image pose.
    const result = deriveUwbObservation(
      { ...input, source: "live" },
      { ...context, poses: [{ ...equipmentPose, inputSource: "synthetic" }] },
    );
    // Then derived coordinates cannot claim the authenticity of the radio input alone.
    expect(result).toMatchObject({
      status: "valid",
      inputSource: "synthetic",
      rangeInputSource: "live",
    });
  });

  it("keeps distance-only data separate from known worker camera coordinates", () => {
    // Given a range without azimuth and available camera coordinates.
    const distanceOnly = { ...input, azimuthRad: null };
    // When deriving the UWB observation.
    const result = deriveUwbObservation(distanceOnly, context);
    // Then the range survives without invented coordinates or precision.
    expect(result).toMatchObject({
      source: "uwb",
      status: "distance-only",
      position: null,
      tablePositionM: null,
      tablePositionCm: null,
      tableDistanceM: 0.5,
      worldDistanceM: 50,
      azimuthRad: null,
      elevationRad: null,
      uncertaintyTableM: null,
      uncertaintyWorldM: null,
    });
  });

  it("preserves missing range as invalid even when all angles are available", () => {
    // Given an angular report without its range.
    const anglesOnly = { ...input, distanceM: null, elevationRad: 0 };
    // When deriving the observation.
    const result = deriveUwbObservation(anglesOnly, context);
    // Then no coordinate or distance is manufactured.
    expect(result).toMatchObject({
      status: "invalid",
      position: null,
      tableDistanceM: null,
      worldDistanceM: null,
    });
  });

  it("accepts zero range and zero angles as actual measurements", () => {
    // Given explicitly measured zeros.
    const zero = { ...input, distanceM: 0, elevationRad: 0 };
    // When deriving coordinates.
    const result = deriveUwbObservation(zero, context);
    // Then a zero range places the worker reference at the equipment antenna.
    expect(result).toMatchObject({
      status: "valid",
      tableDistanceM: 0,
      worldDistanceM: 0,
      position: { x: 20, y: 10, z: 0 },
    });
  });

  it.each([null, { ...calibration, uwbYawRad: null }])(
    "requires explicit yaw calibration",
    (value) => {
      // Given absent calibration or an explicitly unknown sensor yaw.
      // When deriving coordinates.
      const result = deriveUwbObservation(input, { ...context, calibration: value });
      // Then zero yaw is never assumed.
      expect(result).toMatchObject({ status: "uncalibrated", position: null });
    },
  );

  it("maps table meters into world meters at exactly 100:1", () => {
    // Given a half-meter range from the observed equipment antenna.
    // When deriving the worker position.
    const result = deriveUwbObservation({ ...input, uncertaintyM: 0.02 }, context);
    // Then range, position and uncertainty use their stated units.
    expect(result).toMatchObject({
      status: "valid",
      tableDistanceM: 0.5,
      worldDistanceM: 50,
      tablePositionM: { x: expect.closeTo(0.7), y: 0.1 },
      tablePositionCm: { x: expect.closeTo(70), y: 10 },
      position: { x: expect.closeTo(70), y: 10, z: 0 },
      uncertaintyTableM: 0.02,
      uncertaintyWorldM: 2,
    });
  });

  it("follows a translated equipment antenna instead of its marker or old origin", () => {
    // Given an equipment antenna moved 0.4 m right and 0.1 m up.
    const moved = { ...equipmentPose, antennaTableM: { x: 0.6, y: 0.2 } };
    // When projecting the same radio measurement.
    const result = deriveUwbObservation(input, { ...context, poses: [moved, workerPose] });
    // Then the world position includes the external camera translation.
    expect(result.position).toEqual({ x: expect.closeTo(110), y: 20, z: 0 });
  });

  it("adds the calibrated sensor yaw to the current equipment heading", () => {
    // Given 30-degree equipment rotation, 30-degree yaw offset and 30-degree clockwise azimuth.
    const poses = [{ ...equipmentPose, headingRad: Math.PI / 6 }, workerPose];
    const calibrated = { ...calibration, uwbYawRad: Math.PI / 6 };
    // When translating the sensor bearing into table axes.
    const result = deriveUwbObservation(
      { ...input, azimuthRad: Math.PI / 6 },
      { ...context, calibration: calibrated, poses },
    );
    // Then heading plus yaw minus raw azimuth gives a 30-degree counterclockwise table bearing.
    expect(result.position).toEqual({
      x: expect.closeTo(20 + 50 * Math.cos(Math.PI / 6), 9),
      y: expect.closeTo(35, 9),
      z: 0,
    });
  });

  it("uses antenna heights to remove vertical separation from a slant range", () => {
    // Given a 3-4-5 triangle between calibrated antenna heights.
    const markers = calibration.markers.map((marker) => ({
      ...marker,
      antennaHeightM: marker.entityId === "WORKER-A" ? 0.4 : 0.1,
    }));
    // When elevation is unavailable.
    const result = deriveUwbObservation(input, {
      ...context,
      calibration: { ...calibration, markers },
    });
    // Then only the 0.4 m planar component affects XY; raw range remains 0.5 m.
    expect(result).toMatchObject({
      tableDistanceM: 0.5,
      worldDistanceM: 50,
      position: { x: expect.closeTo(60), y: 10, z: 0 },
    });
  });

  it("uses measured elevation for the horizontal projection", () => {
    // Given a measured 60-degree elevation and half-meter slant range.
    const elevated = { ...input, elevationRad: Math.PI / 3 };
    // When calculating the planar observation.
    const result = deriveUwbObservation(elevated, context);
    // Then the horizontal radius is 0.25 m while the raw range stays intact.
    expect(result).toMatchObject({
      tableDistanceM: 0.5,
      worldDistanceM: 50,
      position: { x: expect.closeTo(45), y: 10, z: 0 },
    });
  });

  it("rejects a slant range shorter than calibrated vertical separation", () => {
    // Given a 0.5 m range and 0.6 m vertical antenna separation.
    const markers = calibration.markers.map((marker) => ({
      ...marker,
      antennaHeightM: marker.entityId === "WORKER-A" ? 0.7 : 0.1,
    }));
    // When deriving a planar radius.
    const result = deriveUwbObservation(input, {
      ...context,
      calibration: { ...calibration, markers },
    });
    // Then impossible geometry cannot yield a valid position.
    expect(result).toMatchObject({ status: "invalid", position: null, tableDistanceM: 0.5 });
  });

  it("rotates the worker antenna-to-reference correction using fresh worker heading", () => {
    // Given different worker marker offsets and a quarter-turn worker heading.
    const markers = calibration.markers.map((marker) =>
      marker.entityId === "WORKER-A"
        ? {
            ...marker,
            markerToAntennaM: { x: 0.03, y: 0.02 },
            markerToReferenceM: { x: 0.13, y: 0.07 },
          }
        : marker,
    );
    // When converting the radio antenna position to the worker reference.
    const result = deriveUwbObservation(input, {
      ...context,
      calibration: { ...calibration, markers },
    });
    // Then the rotated (-0.05, +0.10) m delta corrects the radio observation.
    expect(result.position).toEqual({ x: expect.closeTo(65), y: expect.closeTo(20), z: 0 });
  });

  it("does not require worker heading for an exactly zero antenna-to-reference delta", () => {
    // Given equal nonzero marker-to-antenna and marker-to-reference offsets.
    const markers = calibration.markers.map((marker) => ({
      ...marker,
      markerToAntennaM: { x: 0.1, y: 0.1 },
      markerToReferenceM: { x: 0.1, y: 0.1 },
    }));
    // When the worker camera pose is absent.
    const result = deriveUwbObservation(input, {
      ...context,
      calibration: { ...calibration, markers },
      poses: [equipmentPose],
    });
    // Then the antenna itself is the target reference and remains observable.
    expect(result).toMatchObject({
      status: "valid",
      position: { x: expect.closeTo(70), y: 10, z: 0 },
    });
  });

  it.each(["EQUIPMENT-A", "WORKER-A"])("rejects stale required %s camera pose", (entityId) => {
    // Given a nonzero worker offset and a required pose older than 1000 ms.
    const markers = calibration.markers.map((marker) => ({
      ...marker,
      markerToReferenceM: { x: 0.1, y: 0 },
    }));
    const poses = context.poses.map((pose) =>
      pose.entityId === entityId ? { ...pose, observedAt: "2026-09-21T08:59:59.999Z" } : pose,
    );
    // When deriving the current radio observation.
    const result = deriveUwbObservation(input, {
      ...context,
      calibration: { ...calibration, markers },
      poses,
    });
    // Then stale external evidence cannot authorize fresh XY.
    expect(result).toMatchObject({ status: "stale", position: null });
  });

  it.each(["EQUIPMENT-A", "WORKER-A"])("requires a missing %s camera pose", (entityId) => {
    // Given a nonzero worker offset and a missing required camera pose.
    const markers = calibration.markers.map((marker) => ({
      ...marker,
      markerToReferenceM: { x: 0.1, y: 0 },
    }));
    const poses = context.poses.filter((pose) => pose.entityId !== entityId);
    // When deriving the current radio observation.
    const result = deriveUwbObservation(input, {
      ...context,
      calibration: { ...calibration, markers },
      poses,
    });
    // Then missing origin or heading stays uncalibrated.
    expect(result).toMatchObject({ status: "uncalibrated", position: null });
  });

  it("requires a camera pose belonging to the current calibrated marker", () => {
    // Given a fresh equipment pose from a different marker assignment.
    const poses = [{ ...equipmentPose, markerId: 42 }, workerPose];
    // When deriving using the current calibration.
    const result = deriveUwbObservation(input, { ...context, poses });
    // Then an old marker assignment cannot become the current antenna origin.
    expect(result).toMatchObject({ status: "uncalibrated", position: null });
  });

  it("accepts a required camera pose at exactly the freshness boundary", () => {
    // Given an equipment pose exactly 1000 ms old.
    const poses = [{ ...equipmentPose, observedAt: "2026-09-21T09:00:00.000Z" }, workerPose];
    // When deriving current radio coordinates.
    const result = deriveUwbObservation(input, { ...context, poses });
    // Then the inclusive freshness boundary permits the measured origin.
    expect(result.status).toBe("valid");
  });

  it("rejects a required camera pose dated after receipt", () => {
    // Given an equipment pose with an impossible negative observation age.
    const poses = [{ ...equipmentPose, observedAt: "2026-09-21T09:00:02.000Z" }, workerPose];
    // When deriving current radio coordinates.
    const result = deriveUwbObservation(input, { ...context, poses });
    // Then that pose cannot authorize a valid antenna origin.
    expect(result).toMatchObject({ status: "invalid", position: null });
  });

  it.each([
    { timestamp: "2026-09-21T09:00:00.000Z", status: "valid", ageMs: 1000 },
    { timestamp: "2026-09-21T08:59:59.999Z", status: "stale", ageMs: 1001 },
  ])("reports $status at upload age $ageMs ms", ({ timestamp, status, ageMs }) => {
    // Given a measurement at the freshness boundary.
    const dated = { ...input, capturedAt: timestamp };
    // When deriving at an injected receipt time.
    const result = deriveUwbObservation(dated, context);
    // Then the frozen 1000 ms limit is inclusive and the timestamps survive.
    expect(result).toMatchObject({ status, ageMs, lastObservedAt: timestamp, receivedAt });
    if (status === "stale") expect(result.position).toBeNull();
  });

  it("rejects an upload captured after its receipt timestamp", () => {
    // Given a future timestamp instead of a measurable positive age.
    const future = { ...input, capturedAt: "2026-09-21T09:00:02.000Z" };
    // When deriving at the earlier receipt time.
    const result = deriveUwbObservation(future, context);
    // Then the temporal inconsistency cannot authorize a current position.
    expect(result).toMatchObject({ status: "invalid", position: null });
  });
});
