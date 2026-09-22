import type { Homography, Point2, PointCorrespondence } from "./linear-algebra";
import { finitePoint, GeometryError, matrix, multiply, nullVector } from "./linear-algebra";

function normalize(points: readonly Point2[]) {
  const center = points.reduce(
    (sum, point) => ({ x: sum.x + point.x / points.length, y: sum.y + point.y / points.length }),
    { x: 0, y: 0 },
  );
  const spread = Math.sqrt(
    points.reduce(
      (sum, point) => sum + ((point.x - center.x) ** 2 + (point.y - center.y) ** 2) / points.length,
      0,
    ),
  );
  if (!Number.isFinite(spread) || spread <= 0) {
    throw new GeometryError(
      "degenerate_calibration",
      "Calibration points have no usable spatial spread",
    );
  }
  const scale = Math.SQRT2 / spread;
  const forward: Homography = [scale, 0, -scale * center.x, 0, scale, -scale * center.y, 0, 0, 1];
  const inverse: Homography = [1 / scale, 0, center.x, 0, 1 / scale, center.y, 0, 0, 1];
  return {
    points: points.map((point) => ({
      x: (point.x - center.x) * scale,
      y: (point.y - center.y) * scale,
    })),
    forward,
    inverse,
  };
}

export function solveHomography(correspondences: readonly PointCorrespondence[]): Homography {
  if (correspondences.length < 4) {
    throw new GeometryError(
      "degenerate_calibration",
      "At least four point correspondences are required",
    );
  }
  for (const { source, target } of correspondences) {
    finitePoint(source);
    finitePoint(target);
  }
  const source = normalize(correspondences.map((pair) => pair.source));
  const target = normalize(correspondences.map((pair) => pair.target));
  const rows = source.points.flatMap(({ x, y }, index) => {
    const destination = target.points[index];
    if (!destination) {
      throw new GeometryError("invalid_input", "Calibration pair is missing");
    }
    const { x: u, y: v } = destination;
    return [
      [-x, -y, -1, 0, 0, 0, u * x, u * y, u],
      [0, 0, 0, -x, -y, -1, v * x, v * y, v],
    ];
  });
  const h = nullVector(rows);
  const determinant =
    h[0] * (h[4] * h[8] - h[5] * h[7]) -
    h[1] * (h[3] * h[8] - h[5] * h[6]) +
    h[2] * (h[3] * h[7] - h[4] * h[6]);
  if (!Number.isFinite(determinant) || Math.abs(determinant) <= 1e-10) {
    throw new GeometryError(
      "degenerate_calibration",
      "Calibration maps the table onto a line or point",
    );
  }
  const denormalized = multiply(target.inverse, multiply(h, source.forward));
  const magnitude = Math.max(...denormalized.map(Math.abs));
  const result = matrix(denormalized.map((value) => value / magnitude));
  for (const pair of correspondences) {
    transformPoint(result, pair.source);
  }
  return result;
}

export function transformPoint(h: Homography, point: Point2): Point2 {
  finitePoint(point);
  if (h.some((value) => !Number.isFinite(value))) {
    throw new GeometryError("invalid_input", "Homography coefficients must be finite");
  }
  const divisor = h[6] * point.x + h[7] * point.y + h[8];
  const scale = Math.abs(h[6] * point.x) + Math.abs(h[7] * point.y) + Math.abs(h[8]);
  if (Math.abs(divisor) <= 1e-12 * scale || !Number.isFinite(divisor)) {
    throw new GeometryError("point_at_infinity", "Point lies on the projective horizon");
  }
  const result = {
    x: (h[0] * point.x + h[1] * point.y + h[2]) / divisor,
    y: (h[3] * point.x + h[4] * point.y + h[5]) / divisor,
  };
  finitePoint(result);
  return result;
}
