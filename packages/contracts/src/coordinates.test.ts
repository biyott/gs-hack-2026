import { describe, expect, it } from "vitest";
import {
  fromThree,
  tableCmToWorld,
  tableMToWorld,
  toThree,
  worldToTableCm,
  worldToTableM,
} from "./coordinates";

const fixtures = [
  { tableM: { x: 0, y: 0 }, worldM: { x: 0, y: 0 } },
  { tableM: { x: 1.4, y: 0 }, worldM: { x: 140, y: 0 } },
  { tableM: { x: 0, y: 0.5 }, worldM: { x: 0, y: 50 } },
  { tableM: { x: 1.4, y: 0.5 }, worldM: { x: 140, y: 50 } },
  { tableM: { x: 0.1, y: 0.05 }, worldM: { x: 10, y: 5 } },
  { tableM: { x: 0.7, y: 0.05 }, worldM: { x: 70, y: 5 } },
  { tableM: { x: 1.3, y: 0.05 }, worldM: { x: 130, y: 5 } },
  { tableM: { x: 0.1, y: 0.25 }, worldM: { x: 10, y: 25 } },
  { tableM: { x: 0.7, y: 0.25 }, worldM: { x: 70, y: 25 } },
  { tableM: { x: 1.3, y: 0.25 }, worldM: { x: 130, y: 25 } },
  { tableM: { x: 0.1, y: 0.45 }, worldM: { x: 10, y: 45 } },
  { tableM: { x: 0.7, y: 0.45 }, worldM: { x: 70, y: 45 } },
  { tableM: { x: 1.3, y: 0.45 }, worldM: { x: 130, y: 45 } },
  { tableM: { x: 0.3, y: 0.25 }, worldM: { x: 30, y: 25 } },
  { tableM: { x: 0.65, y: 0.25 }, worldM: { x: 65, y: 25 } },
  { tableM: { x: 0.9, y: 0.4 }, worldM: { x: 90, y: 40 } },
] as const;

describe("table and world coordinate contract", () => {
  it.each(fixtures)(
    "converts table metres to independent world values when given $tableM",
    ({ tableM, worldM }) => {
      const actual = tableMToWorld(tableM);
      expect(Math.abs(actual.x - worldM.x)).toBeLessThanOrEqual(1e-6);
      expect(Math.abs(actual.y - worldM.y)).toBeLessThanOrEqual(1e-6);
    },
  );

  it.each(fixtures)(
    "converts world metres to independent table values when given $worldM",
    ({ tableM, worldM }) => {
      const actual = worldToTableM(worldM);
      expect(Math.abs(actual.x - tableM.x)).toBeLessThanOrEqual(1e-6);
      expect(Math.abs(actual.y - tableM.y)).toBeLessThanOrEqual(1e-6);
    },
  );

  it.each(fixtures)(
    "keeps centimetre values when converting the table point for $worldM",
    ({ worldM }) => {
      const actual = tableCmToWorld({ x: worldM.x, y: worldM.y });
      expect(actual).toEqual(worldM);
    },
  );

  it.each(fixtures)(
    "keeps metre values when converting world point $worldM to table centimetres",
    ({ worldM }) => {
      const actual = worldToTableCm(worldM);
      expect(actual).toEqual({ x: worldM.x, y: worldM.y });
    },
  );

  it.each(fixtures)(
    "roundtrips world coordinates within tolerance when given $worldM",
    ({ worldM }) => {
      const actual = tableMToWorld(worldToTableM(worldM));
      expect(Math.abs(actual.x - worldM.x)).toBeLessThanOrEqual(1e-6);
      expect(Math.abs(actual.y - worldM.y)).toBeLessThanOrEqual(1e-6);
    },
  );

  it.each(fixtures)(
    "roundtrips table coordinates within tolerance when given $tableM",
    ({ tableM }) => {
      const actual = worldToTableM(tableMToWorld(tableM));
      expect(Math.abs(actual.x - tableM.x)).toBeLessThanOrEqual(1e-6);
      expect(Math.abs(actual.y - tableM.y)).toBeLessThanOrEqual(1e-6);
    },
  );

  it("preserves signed out-of-bounds observations when converting rather than clamping", () => {
    const actual = tableMToWorld({ x: -0.00001, y: 0.50001 });
    expect(actual.x).toBeCloseTo(-0.001, 9);
    expect(actual.y).toBeCloseTo(50.001, 9);
  });
});

describe("Three.js boundary axes", () => {
  it("uses world +Y as negative Z when height is supplied separately", () => {
    const actual = toThree({ x: 30, y: 25 }, 6);
    expect(actual).toEqual([30, 6, -25]);
  });

  it("defaults to the ground plane when no height is provided", () => {
    const actual = toThree({ x: 140, y: 50 });
    expect(actual).toEqual([140, 0, -50]);
  });

  it("restores planar world coordinates when importing Three.js position", () => {
    const actual = fromThree([30, 6, -25]);
    expect(actual).toEqual({ x: 30, y: 25 });
  });
});
