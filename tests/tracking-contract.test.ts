import { describe, expect, it } from "vitest";
import {
  CalibrationSchema,
  FrameUploadSchema,
  UwbUploadSchema,
} from "../packages/contracts/src/tracking";
import calibration from "../tools/calibration/example-calibration.json";

describe("Tracking input contracts", () => {
  it("rejects a claimed clock correction that disagrees with capture time", () => {
    // Given a declared 500ms offset but an unadjusted timestamp.
    const input = {
      cameraId: "CCTV",
      capturedAt: "2026-09-21T09:00:00.000Z",
      sequence: 1,
      jpegBase64: "/9j/",
      captureClock: {
        deviceCapturedAt: "2026-09-21T09:00:00.000Z",
        offsetMs: -500,
        uncertaintyMs: 10,
        synchronizedAt: "2026-09-21T08:59:59.000Z",
      },
    };
    // When the timing evidence crosses the server boundary, then it is inconsistent.
    expect(FrameUploadSchema.safeParse(input).success).toBe(false);
  });

  it("rejects duplicate entity assignments in physical calibration", () => {
    // Given one physical identity assigned to multiple different markers.
    const input = {
      ...calibration,
      markers: calibration.markers.map((item) => ({ ...item, entityId: "WORKER-A" })),
    };
    // When the configuration crosses the boundary, then ambiguous identities are rejected.
    expect(CalibrationSchema.safeParse(input).success).toBe(false);
  });

  it("rejects a camera located below the marker plane", () => {
    // Given a 5cm-high camera and 10cm-high phone markers.
    const input = {
      ...calibration,
      camera: { positionTableM: { x: 0.7, y: 0.25 }, heightM: 0.05 },
      markers: calibration.markers.map((item) => ({ ...item, heightM: 0.1 })),
    };
    // When calibration is parsed, then impossible projection geometry is rejected.
    expect(CalibrationSchema.safeParse(input).success).toBe(false);
  });

  it("preserves unavailable UWB quantities as null", () => {
    // Given an actual sensor report with unavailable angles and range.
    const input = {
      workerId: "WORKER-A",
      deviceId: "equipment-phone",
      capturedAt: "2026-09-21T09:00:00.000Z",
      sequence: 1,
      distanceM: null,
      azimuthRad: null,
      elevationRad: null,
      uncertaintyM: null,
    };
    // When the sensor message is parsed.
    const result = UwbUploadSchema.parse(input);
    // Then no range or angle is filled in by the boundary.
    expect([result.distanceM, result.azimuthRad, result.elevationRad]).toEqual([null, null, null]);
  });

  it("rejects a frame upload without a monotonic sequence", () => {
    // Given image content without a frame identity sequence.
    const input = { cameraId: "CCTV", capturedAt: "2026-09-21T09:00:00.000Z", jpegBase64: "/9j/" };
    // When the upload is parsed, then it cannot enter ordered tracking state.
    expect(FrameUploadSchema.safeParse(input).success).toBe(false);
  });
});
