import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PositionObservationSchema, UwbObservationSchema } from "@/contracts";
import { CameraObservationTable, UwbObservationTable } from "./observation-table";

const sample = {
  entityId: "WORKER-A",
  source: "uwb",
  status: "distance-only",
  position: null,
  tablePositionM: null,
  tablePositionCm: null,
  lastObservedAt: null,
  receivedAt: "2026-09-21T09:00:00.000Z",
  ageMs: null,
  uncertaintyTableM: null,
  uncertaintyWorldM: null,
  error: null,
};

describe("tracking observation provenance", () => {
  it.each([
    ["live", "실제 입력 / LIVE"],
    ["synthetic", "합성 입력 / SYNTHETIC"],
    ["unknown", "입력 출처 미확인 / Unknown"],
  ])(
    "labels camera position input %s independently from its tracking method",
    (inputSource, label) => {
      const observation = PositionObservationSchema.parse({
        ...sample,
        source: "camera-marker",
        inputSource,
      });
      const html = renderToStaticMarkup(
        createElement(CameraObservationTable, { observations: [observation], now: 0 }),
      );
      expect(html).toContain("관측 방식");
      expect(html).toContain("카메라 마커");
      expect(html).toContain("위치 입력 출처");
      expect(html).toContain(label);
    },
  );

  it("shows live range input separately from a position using a synthetic anchor", () => {
    const observation = UwbObservationSchema.parse({
      ...sample,
      inputSource: "synthetic",
      rangeInputSource: "live",
      tableDistanceM: 0.5,
      worldDistanceM: 50,
      azimuthRad: null,
      elevationRad: null,
    });
    const html = renderToStaticMarkup(
      createElement(UwbObservationTable, { observations: [observation], now: 0 }),
    );
    expect(html).toContain("거리 입력 출처");
    expect(html).toContain("합성 입력 / SYNTHETIC");
    expect(html).toContain("실제 입력 / LIVE");
    expect(html).toContain("0.500 m");
    expect(html).toContain("미확인 / Unknown");
  });

  it("does not imply live hardware for a legacy UWB payload without provenance", () => {
    const observation = UwbObservationSchema.parse({
      ...sample,
      tableDistanceM: null,
      worldDistanceM: null,
      azimuthRad: null,
      elevationRad: null,
    });
    const html = renderToStaticMarkup(
      createElement(UwbObservationTable, { observations: [observation], now: 0 }),
    );
    expect(html.match(/입력 출처 미확인 \/ Unknown/g)).toHaveLength(2);
    expect(html).not.toContain("실제 입력 / LIVE");
  });
});
