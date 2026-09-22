import { describe, expect, it } from "vitest";
import { positionSourceLabel } from "./scene-data";

describe("position provenance", () => {
  it("keeps a synthetic UWB input distinct from a live measurement", () => {
    expect(positionSourceLabel({ positionSource: "uwb", positionInputSource: "synthetic" })).toBe(
      "UWB · 합성 입력",
    );
  });
  it("does not infer a live source from the video technique", () => {
    expect(positionSourceLabel({ positionSource: "video", positionInputSource: "unknown" })).toBe(
      "영상 표식 · 출처 미확인",
    );
  });
});
