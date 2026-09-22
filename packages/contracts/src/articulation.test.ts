import { describe, expect, it } from "vitest";
import { EquipmentArticulationSchema } from "./articulation";

const rig = {
  boom: {
    pivotNode: "BOOM",
    axis: "z",
    angleSign: 1,
    tipNode: "TIP",
    segments: [{ node: "STAGE-1", axis: "x", lengthShare: 1 / 3 }],
  },
  hook: { node: "HOOK", tipNode: "TIP" },
  links: [
    {
      node: "ROPE",
      fromNode: "TIP",
      toNode: "HOOK",
      startFraction: 0,
      endFraction: 1,
      axis: "y",
      restLengthM: 1,
      origin: "start",
    },
  ],
};

describe("equipment articulation boundary", () => {
  it("preserves verified local axes and dimensional ratios", () => {
    expect(EquipmentArticulationSchema.parse(rig)).toEqual(rig);
  });
  it("rejects reversed anchor fractions", () => {
    expect(
      EquipmentArticulationSchema.safeParse({
        ...rig,
        links: rig.links.map((link) => ({ ...link, startFraction: 1, endFraction: 0 })),
      }).success,
    ).toBe(false);
  });
  it("rejects undefined mechanical axes and negative expansion", () => {
    expect(
      EquipmentArticulationSchema.safeParse({ ...rig, boom: { ...rig.boom, axis: "y" } }).success,
    ).toBe(false);
    expect(
      EquipmentArticulationSchema.safeParse({
        ...rig,
        boom: { ...rig.boom, segments: [{ node: "STAGE-1", axis: "x", lengthShare: -1 }] },
      }).success,
    ).toBe(false);
  });
});
