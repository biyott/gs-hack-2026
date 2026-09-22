import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { TrackingService } from "../src/server/tracking/service";
import example from "../tools/calibration/example-calibration.json";
import { createTrackingFixture } from "../tools/calibration/fixtures";

const timestamp = "2026-09-21T09:00:00.000Z";
const later = "2026-09-21T09:00:01.001Z";
const calibration = { ...example, cameraId: "CCTV" };
async function frame(sequence = 1) {
  return {
    cameraId: "CCTV",
    sequence,
    capturedAt: timestamp,
    source: "synthetic",
    jpegBase64: (await createTrackingFixture()).toString("base64"),
  };
}

describe("Tracking ingestion service", () => {
  it("preserves bounded device clock evidence with a corrected capture timestamp", async () => {
    // Given a device clock ahead by 500ms and a measured conservative offset.
    const service = new TrackingService();
    const captureClock = {
      deviceCapturedAt: "2026-09-21T09:00:00.500Z",
      offsetMs: -500,
      uncertaintyMs: 12,
      synchronizedAt: "2026-09-21T08:59:59.000Z",
    };
    const upload = { ...(await frame()), captureClock };
    // When the corrected frame is accepted.
    const result = await service.ingestFrame(upload, timestamp);
    // Then timing evidence remains available rather than replacing device time silently.
    expect(result.camera?.capturedAt).toBe(timestamp);
    expect(result.camera?.captureClock).toEqual(captureClock);
    expect(result.schemaVersion).toBe("1.0.1");
  });

  it("publishes actual JPEG camera measurements and retains display bytes", async () => {
    // Given a configured table and synthetic JPEG image.
    const service = new TrackingService();
    service.setCalibration(calibration);
    const upload = await frame();
    // When a complete frame is ingested.
    const result = await service.ingestFrame(upload, timestamp);
    // Then the authoritative update came from pixels and its source remains explicit.
    expect(result.updates).toHaveLength(3);
    expect(result.updates.every((item) => item.status === "valid")).toBe(true);
    expect(result.camera?.source).toBe("synthetic");
    expect(result.updates.every((item) => item.inputSource === "synthetic")).toBe(true);
    expect(service.getLatestJpeg()?.equals(Buffer.from(upload.jpegBase64, "base64"))).toBe(true);
  });

  it("preserves marker-local offset direction through a rotated JPEG camera view", async () => {
    // Given the equipment reference 3cm along marker +X and a camera image rotated 90 degrees.
    const service = new TrackingService();
    service.setCalibration({
      ...calibration,
      markers: calibration.markers.map((marker) => ({
        ...marker,
        markerToReferenceM: marker.entityId === "EQUIPMENT-A" ? { x: 0.03, y: 0 } : { x: 0, y: 0 },
      })),
    });
    const upload = await frame();
    const jpeg = await sharp(Buffer.from(upload.jpegBase64, "base64")).rotate(90).jpeg().toBuffer();
    // When marker orientation and table perspective are recovered from the rotated pixels.
    const result = await service.ingestFrame(
      { ...upload, jpegBase64: jpeg.toString("base64") },
      timestamp,
    );
    // Then the offset still follows table +X, independently of the camera's image orientation.
    const measured = result.cameraObservations.find((item) => item.entityId === "EQUIPMENT-A");
    expect(measured?.status).toBe("valid");
    expect(measured?.tablePositionM?.x).toBeCloseTo(0.33, 2);
    expect(measured?.tablePositionM?.y).toBeCloseTo(0.25, 2);
  });

  it("invalidates coordinates once no new observation has arrived for 1000ms", async () => {
    // Given a valid last image observation.
    const service = new TrackingService();
    service.setCalibration(calibration);
    await service.ingestFrame(await frame(), timestamp);
    // When reading after the stale deadline.
    const result = service.getSnapshot(later);
    // Then last observed time remains while current position becomes unavailable.
    expect(result.updates.every((item) => item.status === "stale" && item.position === null)).toBe(
      true,
    );
    expect(result.updates[0]?.lastObservedAt).toBe(timestamp);
  });

  it("rejects repeated frame sequence instead of regressing observations", async () => {
    // Given a processed frame.
    const service = new TrackingService();
    const upload = await frame();
    await service.ingestFrame(upload, timestamp);
    // When the same upload arrives again, then it is explicitly rejected.
    await expect(service.ingestFrame(upload, timestamp)).rejects.toMatchObject({
      code: "out-of-order",
    });
  });

  it("accepts a camera restart while rejecting retired streams and delayed captures", async () => {
    // Given a calibrated uploader with an established sequence.
    const service = new TrackingService();
    service.setCalibration(calibration);
    const upload = await frame(15);
    await service.ingestFrame({ ...upload, streamId: "first" }, timestamp);
    const nextTime = "2026-09-21T09:00:00.100Z";
    // When a new uploader starts at zero with a newer capture.
    const restarted = await service.ingestFrame(
      { ...upload, streamId: "second", sequence: 0, capturedAt: nextTime },
      nextTime,
    );
    // Then calibration survives and the retired uploader cannot replace the new stream.
    expect(restarted.camera?.streamId).toBe("second");
    expect(restarted.calibration).toEqual(calibration);
    await expect(
      service.ingestFrame({ ...upload, streamId: "first", sequence: 16, capturedAt: later }, later),
    ).rejects.toMatchObject({ code: "out-of-order" });
    await expect(
      service.ingestFrame({ ...upload, streamId: "third", sequence: 0 }, nextTime),
    ).rejects.toMatchObject({ code: "out-of-order" });
    await expect(
      service.ingestFrame(
        { ...upload, streamId: "third", sequence: 0, capturedAt: nextTime },
        "2026-09-21T09:00:02.000Z",
      ),
    ).rejects.toMatchObject({ code: "out-of-order" });
    expect(service.getSnapshot(nextTime).camera?.streamId).toBe("second");
  });

  it("keeps distance-only UWB separate from valid camera coordinates", async () => {
    // Given image positions and an actual sensor observation lacking angles.
    const service = new TrackingService();
    service.setCalibration(calibration);
    await service.ingestFrame(await frame(), timestamp);
    // When the UWB observation is uploaded.
    const result = service.ingestUwb(
      {
        deviceId: "equipment-phone",
        workerId: "WORKER-A",
        sequence: 1,
        capturedAt: timestamp,
        distanceM: 0.35,
        azimuthRad: null,
        elevationRad: null,
        uncertaintyM: null,
        source: "synthetic",
      },
      timestamp,
    );
    // Then UWB cannot borrow camera coordinates and measurements retain their units.
    expect(result.uwbObservations[0]).toMatchObject({
      source: "uwb",
      inputSource: "synthetic",
      status: "distance-only",
      position: null,
      tableDistanceM: 0.35,
      worldDistanceM: 35,
    });
    expect(result.updates.find((item) => item.entityId === "WORKER-A")?.source).toBe(
      "camera-marker",
    );
  });

  it("prevents a retired UWB session from resuming after a new session starts", () => {
    // Given an accepted session followed by a new native radio session.
    const service = new TrackingService();
    const upload = {
      deviceId: "equipment-phone",
      workerId: "WORKER-A",
      capturedAt: timestamp,
      sequence: 10,
      sessionEpoch: "first",
      distanceM: 0.35,
      azimuthRad: null,
      elevationRad: null,
      uncertaintyM: null,
    };
    service.ingestUwb(upload, timestamp);
    service.ingestUwb({ ...upload, sequence: 0, sessionEpoch: "second" }, timestamp);
    // When the retired session emits a later callback, then it cannot replace current state.
    expect(() => service.ingestUwb({ ...upload, capturedAt: later }, later)).toThrowError(
      "UWB sequence, capture time and active session must move forward.",
    );
  });

  it("rejects a stale first frame and preserves ordering across same-camera calibration", async () => {
    // Given a stale packet before any accepted stream.
    const service = new TrackingService();
    const upload = await frame();
    await expect(service.ingestFrame(upload, later)).rejects.toMatchObject({
      code: "out-of-order",
    });
    service.setCalibration(calibration);
    await service.ingestFrame({ ...upload, streamId: "first" }, timestamp);
    await service.ingestFrame({ ...upload, streamId: "second", sequence: 0 }, timestamp);
    // When measured calibration changes for this same camera.
    service.setCalibration({ ...calibration, version: "updated" });
    // Then old stream callbacks remain retired and an in-flight decode cannot publish old calibration.
    await expect(
      service.ingestFrame({ ...upload, streamId: "first", sequence: 2 }, timestamp),
    ).rejects.toMatchObject({ code: "out-of-order" });
    const pending = service.ingestFrame({ ...upload, streamId: "second", sequence: 1 }, timestamp);
    service.setCalibration({ ...calibration, version: "updated-again" });
    await expect(pending).rejects.toMatchObject({ code: "calibration-changed" });
    expect(service.getSnapshot(timestamp).camera).toBeNull();
  });

  it("cancels pending camera decoding when the authenticated camera session is withdrawn", async () => {
    // Given a calibrated camera with a pending real JPEG decode.
    const service = new TrackingService();
    service.setCalibration(calibration);
    service.ingestUwb(
      {
        deviceId: "equipment",
        workerId: "WORKER-A",
        capturedAt: timestamp,
        sequence: 0,
        distanceM: 0.4,
        azimuthRad: null,
        elevationRad: null,
        uncertaintyM: null,
      },
      timestamp,
    );
    const pending = service.ingestFrame(await frame(), timestamp);
    // When authentication lifecycle revokes the camera's pending publication.
    service.invalidatePendingFrames();
    // Then no frame publishes and the independent calibration/range state survives.
    await expect(pending).rejects.toMatchObject({ code: "calibration-changed" });
    const snapshot = service.getSnapshot(timestamp);
    expect(snapshot.camera).toBeNull();
    expect(snapshot.calibration).toEqual(calibration);
    expect(snapshot.uwbObservations[0]?.tableDistanceM).toBe(0.4);
  });
});
