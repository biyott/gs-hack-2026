import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { type SessionRole, TrackingSnapshotSchema } from "@/contracts";
import { TrackingPanel } from "./tracking-panel";
import type { TrackingState } from "./use-tracking";

const capturedAt = "2026-09-21T09:00:00.000Z";
const tracking: TrackingState = {
  snapshot: TrackingSnapshotSchema.parse({
    schemaVersion: "1.0.1",
    calibration: null,
    camera: {
      cameraId: "CCTV-FRAME-POLICY",
      frameId: "frame-1",
      streamId: "stream-1",
      sequence: 1,
      capturedAt,
      receivedAt: capturedAt,
      processedAt: capturedAt,
      width: 640,
      height: 480,
      detectedMarkerIds: [],
      processingMs: 1,
      receiveFps: null,
      source: "synthetic",
    },
    cameraObservations: [],
    uwbObservations: [],
    updates: [],
    receivedFrames: 1,
    droppedFrames: 0,
  }),
  error: null,
  connected: true,
  now: Date.parse(capturedAt),
  refresh: () => {},
  saveCalibration: async () => {},
  saveUwbAnchor: async () => {},
};

function renderPanel(role: SessionRole) {
  return renderToStaticMarkup(createElement(TrackingPanel, { cctv: [], role, tracking }));
}

describe("tracking frame consumer policy", () => {
  it.each(["admin", "operator", "observer"] satisfies SessionRole[])(
    "renders the received frame for %s",
    (role) => {
      const html = renderPanel(role);
      expect(html).toMatch(/<img\b[^>]*src="\/api\/tracking\/frame\?/);
    },
  );

  it.each(["support", "worker", "device"] satisfies SessionRole[])(
    "omits the image and frame request URL for %s",
    (role) => {
      const html = renderPanel(role);
      expect(html).not.toMatch(/<img\b/);
      expect(html).not.toContain("/api/tracking/frame");
    },
  );

  it("preserves support metadata without exposing a frame URL", () => {
    const html = renderPanel("support");
    expect(html).toContain('<dd class="mono">CCTV-FRAME-POLICY</dd>');
    expect(html).toContain('class="camera-metadata"');
    expect(html).not.toContain("/api/tracking/frame");
  });
});
