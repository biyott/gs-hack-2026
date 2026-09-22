import { describe, expect, it } from "vitest";
import { hookRopeScale } from "./rig-math";

describe("catalog hoist geometry", () => {
  const baseline = { hookHeightM: 16.24, ropeLengthM: 18.52 };

  it("retains the exported rope length at the chosen demo pose", () => {
    expect(hookRopeScale(16.24, baseline)).toBe(1);
  });

  it("shortens the rope by the exact upward hook displacement", () => {
    const scale = hookRopeScale(20.24, baseline);
    expect(scale === null ? null : scale * 18.52).toBeCloseTo(14.52, 8);
  });

  it("returns no motion when the catalogue lacks a baseline", () => {
    expect(hookRopeScale(20, { hookHeightM: null, ropeLengthM: null })).toBeNull();
  });

  it("rejects a hook position beyond the physical rope anchor", () => {
    expect(hookRopeScale(35, baseline)).toBeNull();
  });
});
