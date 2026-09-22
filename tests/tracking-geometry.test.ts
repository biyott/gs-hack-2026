import { describe, expect, it } from "vitest";
import {
  correctHeightProjection,
  GeometryError,
  type Point2,
  rotateOffset,
  solveHomography,
  tableCentimetersToMeters,
  tableMetersToCentimeters,
  tableMetersToWorldMeters,
  transformPoint,
  worldMetersToTableMeters,
} from "../src/server/tracking/geometry";

const corners: readonly Point2[] = [
  { x: 0, y: 0 },
  { x: 1.4, y: 0 },
  { x: 1.4, y: 0.5 },
  { x: 0, y: 0.5 },
];
const grid = [0.1, 0.7, 1.3].flatMap((x) => [0.05, 0.25, 0.45].map((y) => ({ x, y })));
const evaluationPoints = [...corners, ...grid];
const cameraPoint = ({ x, y }: Point2): Point2 => ({
  x: (200 + 800 * x + 120 * y) / (1 + 0.3 * x + 0.2 * y),
  y: (100 + 40 * x + 700 * y) / (1 + 0.3 * x + 0.2 * y),
});
const expectPoint = (actual: Point2, expected: Point2): void => {
  expect(Math.abs(actual.x - expected.x)).toBeLessThanOrEqual(1e-6);
  expect(Math.abs(actual.y - expected.y)).toBeLessThanOrEqual(1e-6);
};

describe("table coordinates", () => {
  it.each(evaluationPoints)("preserves both axes at table point $x,$y", (point) => {
    // Given a measured table point and independent scale expectation.
    const expectedWorld = { x: point.x * 100, y: point.y * 100 };
    // When converting through table cm, table m, and world m.
    const world = tableMetersToWorldMeters(
      tableCentimetersToMeters(tableMetersToCentimeters(point)),
    );
    const roundtrip = worldMetersToTableMeters(world);
    // Then the axes and the exact 1:100 mapping remain intact.
    expectPoint(world, expectedWorld);
    expectPoint(roundtrip, point);
  });

  it("converts centimeters to meters when dimensions use the physical ruler", () => {
    // Given physical table dimensions in centimeters.
    const dimensions = { x: 140, y: 50 };
    // When converting to table meters.
    const converted = tableCentimetersToMeters(dimensions);
    // Then the independently measured table dimensions match.
    expectPoint(converted, { x: 1.4, y: 0.5 });
  });
});

describe("homography calibration", () => {
  it.each([{ reference: corners }, { reference: evaluationPoints }])(
    "recovers the corners and nine independent grid points",
    ({ reference }) => {
      // Given perspective camera observations of known table points.
      const correspondences = reference.map((target) => ({ source: cameraPoint(target), target }));
      // When fitting image-to-table and table-to-image transforms.
      const forward = solveHomography(correspondences);
      const backward = solveHomography(
        correspondences.map(({ source, target }) => ({ source: target, target: source })),
      );
      // Then evaluation points and their inverse roundtrip meet the frozen tolerance.
      for (const expected of evaluationPoints) {
        expectPoint(transformPoint(forward, cameraPoint(expected)), expected);
        expectPoint(transformPoint(backward, expected), cameraPoint(expected));
      }
    },
  );

  it("solves a valid homography when its bottom-right coefficient is zero", () => {
    // Given a finite projective map whose conventional fixed coefficient is zero.
    const reference = [
      { x: 1, y: 1 },
      { x: 3, y: 1 },
      { x: 3, y: 2 },
      { x: 1, y: 2 },
    ];
    const correspondences = reference.map((source) => ({
      source,
      target: { x: 1 / source.x, y: source.y / source.x },
    }));
    // When fitting that map.
    const homography = solveHomography(correspondences);
    // Then an independent interior point maps correctly.
    expectPoint(transformPoint(homography, { x: 2, y: 1.5 }), { x: 0.5, y: 0.75 });
  });

  it("uses additional correspondences when the first four are redundant", () => {
    // Given three distinct corners followed by a duplicate and the final corner.
    const reference = [...corners.slice(0, 3), { x: 0, y: 0 }, { x: 0, y: 0.5 }];
    // When fitting the complete calibration set.
    const homography = solveHomography(
      reference.map((target) => ({ source: cameraPoint(target), target })),
    );
    // Then the additional corner resolves the otherwise deficient calibration.
    expectPoint(transformPoint(homography, cameraPoint({ x: 0.7, y: 0.25 })), { x: 0.7, y: 0.25 });
  });

  it("normalizes large source offsets independently from table units", () => {
    // Given camera coordinates translated far from their original origin.
    const shiftedCamera = (point: Point2): Point2 => {
      const image = cameraPoint(point);
      return { x: image.x + 1e8, y: image.y - 2e8 };
    };
    // When calibrating those coordinates against meter-scale table points.
    const homography = solveHomography(
      corners.map((target) => ({ source: shiftedCamera(target), target })),
    );
    // Then the independent center still satisfies the frozen meter tolerance.
    expectPoint(transformPoint(homography, shiftedCamera({ x: 0.7, y: 0.25 })), {
      x: 0.7,
      y: 0.25,
    });
  });

  it.each(
    [
      corners.slice(0, 3).map((target) => ({ source: cameraPoint(target), target })),
      corners.map((target) => ({ source: { x: 1, y: 1 }, target })),
      corners.map((target, i) => ({ source: { x: i, y: 2 * i }, target })),
      corners.map((source, i) => ({ source, target: { x: i, y: 2 * i } })),
      corners.map((source) => ({ source, target: { x: 0, y: 0 } })),
      corners.map((target) => ({ source: { x: Number.NaN, y: 0 }, target })),
    ].map((correspondences) => ({ correspondences })),
  )(
    "rejects insufficient, impossible, degenerate, or nonfinite calibration",
    ({ correspondences }) => {
      // Given invalid calibration correspondences.
      // When fitting a homography.
      const fit = () => solveHomography(correspondences);
      // Then a typed failure prevents a usable calibration.
      expect(fit).toThrow(GeometryError);
    },
  );

  it("rejects an image point when it lies on the projective horizon", () => {
    // Given an invertible map with its horizon at x=1.
    const homography = [1, 0, 0, 0, 1, 0, 1, 0, -1] as const;
    // When projecting a point on that horizon.
    const project = () => transformPoint(homography, { x: 1, y: 0 });
    // Then coordinates at infinity are rejected explicitly.
    expect(project).toThrow(expect.objectContaining({ code: "point_at_infinity" }));
  });
});

describe("height and center correction", () => {
  it("preserves a finite height interpolation when input subtraction would overflow", () => {
    // Given finite points on opposite sides of the numeric range.
    const camera = { cameraXY: { x: 1e308, y: 0 }, cameraHeightM: 1, markerHeightM: 0.5 };
    // When interpolating at half the camera height.
    const corrected = correctHeightProjection({ x: -1e308, y: 0 }, camera);
    // Then the midpoint remains the finite origin.
    expectPoint(corrected, { x: 0, y: 0 });
  });

  it.each([
    { markerHeightM: 0, expected: { x: 1.2, y: 0.45 } },
    { markerHeightM: 0.3, expected: { x: 1.1, y: 0.41 } },
  ])(
    "corrects the plane projection at marker height $markerHeightM",
    ({ markerHeightM, expected }) => {
      // Given a camera 1.5 m above the table and an apparent plane point.
      const camera = { cameraXY: { x: 0.7, y: 0.25 }, cameraHeightM: 1.5, markerHeightM };
      // When removing the height-induced perspective displacement.
      const corrected = correctHeightProjection({ x: 1.2, y: 0.45 }, camera);
      // Then the point contracts toward the camera's table projection.
      expectPoint(corrected, expected);
    },
  );

  it.each([
    { cameraHeightM: 0, markerHeightM: 0 },
    { cameraHeightM: 1, markerHeightM: -0.1 },
    { cameraHeightM: 1, markerHeightM: 1 },
    { cameraHeightM: 1, markerHeightM: 1.1 },
    { cameraHeightM: Number.NaN, markerHeightM: 0 },
  ])("rejects an impossible camera/marker height relation", (heights) => {
    // Given a marker outside the valid camera-to-table volume.
    const camera = { ...heights, cameraXY: { x: 0, y: 0 } };
    // When attempting the correction.
    const correct = () => correctHeightProjection({ x: 1, y: 1 }, camera);
    // Then the calibration fails with a typed height error.
    expect(correct).toThrow(expect.objectContaining({ code: "invalid_height" }));
  });

  it("rotates a local marker-to-center offset with counterclockwise heading", () => {
    // Given a local offset and a quarter-turn table heading in radians.
    const offset = { x: 0.1, y: 0.2 };
    // When rotating that offset into table axes.
    const rotated = rotateOffset(offset, Math.PI / 2);
    // Then its signed axes follow the right-handed rotation.
    expectPoint(rotated, { x: -0.2, y: 0.1 });
  });

  it("rejects an offset rotation when its result exceeds the numeric range", () => {
    // Given finite offset components whose rotated length cannot be represented.
    const offset = { x: 1.7e308, y: 1.7e308 };
    // When rotating to place their combined length on one axis.
    const rotate = () => rotateOffset(offset, Math.PI / 4);
    // Then a typed failure prevents publishing infinite coordinates.
    expect(rotate).toThrow(expect.objectContaining({ code: "invalid_input" }));
  });
});
