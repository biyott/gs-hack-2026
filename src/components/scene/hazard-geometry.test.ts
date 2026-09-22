import { describe, expect, it } from "vitest";
import { createHazardGeometry } from "./hazard-geometry";

describe("hazard area geometry", () => {
  it("does not construct a shape for a position-unknown hazard without a polygon", () => {
    expect(createHazardGeometry([])).toBeNull();
  });

  it("omits incomplete areas with fewer than three points", () => {
    expect(
      createHazardGeometry([
        { x: 1, y: 2 },
        { x: 3, y: 4 },
      ]),
    ).toBeNull();
  });

  it("constructs a triangulated area when positions are known", () => {
    const geometry = createHazardGeometry([
      { x: 10, y: 10 },
      { x: 20, y: 10 },
      { x: 10, y: 20 },
    ]);
    expect(geometry?.getIndex()?.count).toBe(3);
    geometry?.dispose();
  });
});
