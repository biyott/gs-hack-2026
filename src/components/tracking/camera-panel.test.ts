import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { CameraFrame } from "@/contracts";
import { CameraPanel } from "./camera-panel";

const capturedAt = "2026-09-21T09:00:00.000Z";
const frame: CameraFrame = {
  cameraId: "CCTV-01",
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
};

function renderCamera(canViewFrame: boolean) {
  return renderToStaticMarkup(
    createElement(CameraPanel, {
      cameras: [],
      frame,
      connected: true,
      canViewFrame,
      now: Date.parse(capturedAt) + 1_001,
      receivedFrames: 1,
      droppedFrames: 0,
    }),
  );
}

describe("camera safety phrase grouping", () => {
  it("keeps the stale-frame negative instruction together without changing its text", () => {
    const html = renderCamera(true);
    const caption = html.match(/<figcaption>(.*?)<\/figcaption>/s)?.[1] ?? "";
    expect(caption.replace(/<[^>]*>/g, "")).toBe(
      "이전 수신 프레임 — 현재 위치 판단에 사용하지 마세요.",
    );
    expect(caption).toContain('<span class="keep-phrase">사용하지 마세요.</span>');
  });

  it.each([true, false])(
    "preserves the synthetic disclaimer and groups its negation when image permission is %s",
    (canViewFrame) => {
      const html = renderCamera(canViewFrame);
      expect(html.replace(/<[^>]*>/g, "")).toContain(
        "검증용 합성 영상입니다. 실제 휴대폰 카메라 연결 또는 현장 실측 증거가 아닙니다.",
      );
      expect(html).toContain('<span class="keep-phrase">증거가 아닙니다.</span>');
    },
  );
});
