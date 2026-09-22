import assert from "node:assert/strict";
import { describe, expect, it, vi } from "vitest";
import { GET as latestFrame } from "../../../../app/api/tracking/frame/route";
import calibration from "../../../../tools/calibration/example-calibration.json";
import { createTrackingFixture } from "../../../../tools/calibration/fixtures";
import { refreshTrackingAge, synchronizeTracking } from "../../simulation/tracking";
import { getTrackingServices } from "../tracking";
import { request, runtimeFixture } from "./fixtures";

const frame = {
  cameraId: "CCTV",
  streamId: "current-stream",
  frameId: "current-frame",
  sequence: 8,
  capturedAt: "2026-01-01T00:00:00.000Z",
  source: "synthetic",
} as const;

async function ingestFixture() {
  const tracking = getTrackingServices().tracking;
  tracking.setCalibration(calibration);
  const jpeg = await createTrackingFixture();
  const snapshot = await tracking.ingestFrame({ ...frame, jpegBase64: jpeg.toString("base64") });
  return { jpeg, snapshot };
}

function frameQuery(): URLSearchParams {
  return new URLSearchParams({
    cameraId: frame.cameraId,
    streamId: frame.streamId,
    frameId: frame.frameId,
    sequence: String(frame.sequence),
  });
}

describe("camera frame identity guard", () => {
  it.each([
    ["cameraId", "another-camera"],
    ["streamId", "retired-stream"],
    ["sequence", "7"],
    ["frameId", "previous-frame"],
  ])("rejects a superseded %s instead of serving another JPEG", async (field, value) => {
    // Given a stored JPEG and a request differing in exactly one identity field.
    await ingestFixture();
    const query = frameQuery();
    query.set(field, value);
    // When a reader requests the superseded identity.
    const response = latestFrame(request("observer", `/api/tracking/frame?${query}`));
    // Then the route refuses to substitute the latest image.
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: { code: "FRAME_SUPERSEDED" } });
  });

  it("returns the exact JPEG and identity headers when all frame guards match", async () => {
    // Given a decoded JPEG with its complete camera and stream identity.
    const { jpeg } = await ingestFixture();
    // When a reader requests that exact frame.
    const response = latestFrame(request("observer", `/api/tracking/frame?${frameQuery()}`));
    // Then bytes and headers identify the same uncached image.
    expect(response.status).toBe(200);
    expect(Object.fromEntries(response.headers)).toMatchObject({
      "content-type": "image/jpeg",
      "cache-control": "no-store",
      "x-frame-camera-id": frame.cameraId,
      "x-frame-stream-id": frame.streamId,
      "x-frame-sequence": "8",
      "x-frame-id": frame.frameId,
    });
    expect(Buffer.from(await response.arrayBuffer())).toEqual(jpeg);
  });
});

describe("camera aging without another upload", () => {
  it("expires measured workers and equipment and blocks route guidance after 1001ms", async () => {
    // Given translating equipment in a measured run with fresh calibrated JPEG positions.
    const runtime = runtimeFixture();
    const run = runtime.getRun("equipment");
    const preset = run.configuration.equipment.find((candidate) => candidate.controls.translation);
    assert.ok(preset);
    run.snapshot = {
      ...run.snapshot,
      equipment: { ...run.snapshot.equipment, ...preset.demoPose, presetId: preset.id },
      run: { ...run.snapshot.run, status: "running", positionInput: "measured" },
    };
    const { snapshot } = await ingestFixture();
    expect(snapshot.updates).toHaveLength(3);
    expect(snapshot.updates.every((observation) => observation.status === "valid")).toBe(true);
    synchronizeTracking(snapshot);
    expect(run.snapshot.equipment.positionStatus).toBe("known");
    expect(run.snapshot.workers.every((worker) => worker.positionStatus === "known")).toBe(true);
    const equipmentPosition = run.snapshot.equipment.position;
    // When the clock advances beyond the observation window without any new frame POST.
    vi.setSystemTime(new Date(Date.parse(frame.capturedAt) + 1001));
    refreshTrackingAge();
    // Then freshness expires and the safety engine cannot keep navigable guidance.
    expect(run.snapshot.equipment).toMatchObject({
      position: { x: equipmentPosition.x, y: equipmentPosition.y },
      positionStatus: "stale",
      positionSource: "video",
      positionInputSource: "synthetic",
      lastObservedAt: frame.capturedAt,
    });
    for (const worker of run.snapshot.workers) {
      expect(worker).toMatchObject({
        position: null,
        positionStatus: "stale",
        positionSource: "video",
        positionInputSource: "synthetic",
        lastObservedAt: frame.capturedAt,
        currentGuidance: {
          actionCode: "POSITION_UNKNOWN",
          routeVersion: null,
          destinationId: null,
          waypoints: [],
        },
      });
    }
    expect(run.snapshot.cctv.every((camera) => camera.status === "stale")).toBe(true);
    expect(getTrackingServices().tracking.getSnapshot().receivedFrames).toBe(1);
  });

  it("leaves idle publication sequences unchanged on repeated stale refreshes", async () => {
    // Given idle translating equipment whose measured JPEG positions expired once.
    const runtime = runtimeFixture();
    const run = runtime.getRun("equipment");
    const preset = run.configuration.equipment.find((candidate) => candidate.controls.translation);
    assert.ok(preset);
    run.snapshot = {
      ...run.snapshot,
      equipment: { ...run.snapshot.equipment, ...preset.demoPose, presetId: preset.id },
      run: { ...run.snapshot.run, positionInput: "measured" },
    };
    synchronizeTracking((await ingestFixture()).snapshot);
    vi.setSystemTime(new Date(Date.parse(frame.capturedAt) + 1001));
    refreshTrackingAge();
    expect(run.snapshot.equipment.positionStatus).toBe("stale");
    const sequences = [...runtime.runs.values()].map((entry) => entry.snapshot.sequence);
    // When the idle scheduler checks an already-stale frame again without another upload.
    vi.setSystemTime(new Date(Date.parse(frame.capturedAt) + 2002));
    refreshTrackingAge();
    refreshTrackingAge();
    // Then no duplicate snapshot is published or safety workflow started.
    expect([...runtime.runs.values()].map((entry) => entry.snapshot.sequence)).toEqual(sequences);
    expect(run.snapshot.run.status).toBe("idle");
    expect(run.snapshot.incidents).toEqual([]);
    expect(run.snapshot.workers.every((worker) => worker.currentGuidance === null)).toBe(true);
  });

  it("ignores stale equipment observations when a fixed preset retains its authored origin", async () => {
    // Given measured workers and a fixed origin after the first camera aging transition.
    const runtime = runtimeFixture();
    const run = runtime.getRun("equipment");
    const preset = run.configuration.equipment.find(
      (candidate) => candidate.controls.translation === false,
    );
    assert.ok(preset);
    run.snapshot = {
      ...run.snapshot,
      equipment: { ...run.snapshot.equipment, ...preset.demoPose, presetId: preset.id },
      run: { ...run.snapshot.run, positionInput: "measured" },
    };
    const authoredPosition = run.snapshot.equipment.position;
    synchronizeTracking((await ingestFixture()).snapshot);
    vi.setSystemTime(new Date(Date.parse(frame.capturedAt) + 1001));
    refreshTrackingAge();
    expect(run.snapshot.workers.every((worker) => worker.positionStatus === "stale")).toBe(true);
    expect(run.snapshot.cctv[0]?.status).toBe("stale");
    expect(
      getTrackingServices()
        .tracking.getSnapshot()
        .updates.find((entry) => entry.entityId === "EQUIPMENT-A"),
    ).toMatchObject({ status: "stale" });
    const sequences = [...runtime.runs.values()].map((entry) => entry.snapshot.sequence);
    // When later scheduler checks encounter that ignored stale equipment measurement.
    vi.setSystemTime(new Date(Date.parse(frame.capturedAt) + 2002));
    refreshTrackingAge();
    refreshTrackingAge();
    // Then the fixed origin stays known without publishing duplicate snapshots.
    expect(run.snapshot.equipment).toMatchObject({
      position: authoredPosition,
      positionStatus: "known",
      positionSource: "mock",
      positionInputSource: "synthetic",
    });
    expect([...runtime.runs.values()].map((entry) => entry.snapshot.sequence)).toEqual(sequences);
  });
});
