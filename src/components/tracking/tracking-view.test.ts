import { describe, expect, it } from "vitest";
import type { CameraFrame, CctvState, PositionObservation } from "@/contracts";
import { cameraFrameUrl, cameraView, observationCoordinates } from "./tracking-view";

const time = "2026-09-21T09:00:00.000Z";
const camera: CctvState = {
  cameraId: "CCTV-A",
  name: "Table camera",
  zoneIds: ["TABLE"],
  floorId: "GROUND",
  source: "mock",
  status: "connected",
  lastFrameAt: time,
  frameUrl: null,
  receivedFps: 12,
  latencyMs: null,
};
const frame: CameraFrame = {
  cameraId: "CCTV-A",
  frameId: "frame-1",
  sequence: 1,
  capturedAt: time,
  receivedAt: time,
  processedAt: time,
  width: 640,
  height: 480,
  detectedMarkerIds: [],
  processingMs: 3,
  receiveFps: 12,
  source: "synthetic",
};
const observation: PositionObservation = {
  entityId: "WORKER-A",
  source: "uwb",
  inputSource: "unknown",
  status: "distance-only",
  position: { x: 30, y: 25, z: 0 },
  tablePositionM: { x: 0.3, y: 0.25 },
  tablePositionCm: { x: 30, y: 25 },
  lastObservedAt: time,
  receivedAt: time,
  ageMs: 0,
  uncertaintyTableM: null,
  uncertaintyWorldM: null,
  error: null,
};

describe("tracking view safety boundaries", () => {
  it("distinguishes uploader streams when camera, frame ID, and sequence are reused", () => {
    const first = new URL(cameraFrameUrl({ ...frame, streamId: "stream-a" }), "http://localhost");
    const restarted = new URL(
      cameraFrameUrl({ ...frame, streamId: "stream-b" }),
      "http://localhost",
    );
    const legacy = new URL(cameraFrameUrl(frame), "http://localhost");
    expect(first.href).not.toBe(restarted.href);
    expect(first.searchParams.get("streamId")).toBe("stream-a");
    expect(restarted.searchParams.get("streamId")).toBe("stream-b");
    expect(legacy.searchParams.get("streamId")).toBe("default");
    expect(restarted.searchParams.get("cameraId")).toBe(frame.cameraId);
    expect(restarted.searchParams.get("frameId")).toBe(frame.frameId);
    expect(restarted.searchParams.get("sequence")).toBe(String(frame.sequence));
  });

  it("requests a new image when a device reuses a frame ID with a newer sequence", () => {
    // Given consecutive frames with a repeated device-provided identifier.
    const nextFrame = { ...frame, sequence: frame.sequence + 1 };
    // When their authenticated image request URLs are selected.
    const urls = [cameraFrameUrl(frame), cameraFrameUrl(nextFrame)];
    // Then the browser fetches the new observation instead of retaining the previous image.
    expect(urls[0]).not.toBe(urls[1]);
  });
  it("hides a frame when the selected incident camera has another ID", () => {
    // Given a fresh global frame and another camera selected by incident coverage.
    const selectedCamera = { ...camera, cameraId: "RELATED" };
    // When selecting that camera's view.
    const view = cameraView([camera, selectedCamera], frame, Date.parse(time), true, "RELATED");
    // Then unrelated image pixels and their telemetry are absent.
    expect(view).toMatchObject({ frame: null, metadata: selectedCamera, ageMs: null });
  });
  it("waits for the first frame when the registered camera is connected", () => {
    // Given a connected camera which has not produced a first frame.
    // When tracking telemetry is reachable.
    const view = cameraView([camera], null, Date.parse(time), true);
    // Then the view waits without claiming a disconnect.
    expect(view.state).toBe("awaiting");
  });
  it("keeps a synthetic frame synthetic when camera metadata says connected", () => {
    // Given a synthetic frame on a configured camera.
    // When the view derives source and availability.
    const view = cameraView([camera], frame, Date.parse(time), true);
    // Then source is retained rather than presented as live.
    expect(view).toMatchObject({ state: "receiving", source: "synthetic", metadata: camera });
  });

  it("marks old received frames stale without a new server response", () => {
    // Given a camera whose last received frame is older than the tracking freshness window.
    // When local time advances.
    const view = cameraView([camera], frame, Date.parse(time) + 1001, true);
    // Then the retained image cannot look current.
    expect(view.state).toBe("stale");
  });

  it("does not borrow metadata from another camera", () => {
    // Given a frame from an unregistered camera.
    // When a different camera is configured.
    const view = cameraView([camera], { ...frame, cameraId: "OTHER" }, Date.parse(time), true);
    // Then the view leaves the camera name, zone, and floor unknown.
    expect(view.metadata).toBeNull();
  });

  it("shows disconnected when the tracking request fails", () => {
    // Given a previously fresh image.
    // When the tracking connection fails.
    const view = cameraView([camera], frame, Date.parse(time), false);
    // Then the image is not presented as a current receiving stream.
    expect(view.state).toBe("disconnected");
  });

  it("suppresses XY for distance-only observations even if an upstream payload has coordinates", () => {
    // Given an observation explicitly marked distance-only.
    // When coordinates are selected for display.
    const coordinates = observationCoordinates(observation);
    // Then no point is implied by ranging distance.
    expect(coordinates).toEqual({ table: null, world: null });
  });
});
