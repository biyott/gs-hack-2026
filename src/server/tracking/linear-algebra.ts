export type Point2 = { readonly x: number; readonly y: number };
export type PointCorrespondence = { readonly source: Point2; readonly target: Point2 };
export type Homography = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];
export type GeometryErrorCode =
  | "invalid_input"
  | "degenerate_calibration"
  | "point_at_infinity"
  | "invalid_height";

export class GeometryError extends Error {
  readonly name = "GeometryError";
  constructor(
    readonly code: GeometryErrorCode,
    message: string,
  ) {
    super(message);
  }
}

export function finitePoint(point: Point2): void {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    throw new GeometryError("invalid_input", "Point coordinates must be finite");
  }
}

function entry(values: readonly number[], index: number): number {
  const value = values[index];
  if (value === undefined) {
    throw new GeometryError("invalid_input", "Matrix index out of bounds");
  }
  return value;
}

export function matrix(values: readonly number[]): Homography {
  return [
    entry(values, 0),
    entry(values, 1),
    entry(values, 2),
    entry(values, 3),
    entry(values, 4),
    entry(values, 5),
    entry(values, 6),
    entry(values, 7),
    entry(values, 8),
  ];
}

export function multiply(left: Homography, right: Homography): Homography {
  return matrix(
    Array.from({ length: 9 }, (_, index) => {
      const row = Math.floor(index / 3) * 3;
      const column = index % 3;
      return (
        entry(left, row) * entry(right, column) +
        entry(left, row + 1) * entry(right, column + 3) +
        entry(left, row + 2) * entry(right, column + 6)
      );
    }),
  );
}

// Jacobi rotations mutate these small accumulators to obtain the DLT null vector.
export function nullVector(rows: readonly (readonly number[])[]): Homography {
  const gram = Array.from({ length: 81 }, (_, index) =>
    rows.reduce((sum, row) => sum + entry(row, Math.floor(index / 9)) * entry(row, index % 9), 0),
  );
  const vectors: number[] = Array.from({ length: 81 }, (_, index) =>
    Math.floor(index / 9) === index % 9 ? 1 : 0,
  );
  const norm = Math.max(...gram.map(Math.abs));
  for (let iteration = 0; iteration < 512; iteration++) {
    let p = 0;
    let q = 1;
    for (let i = 0; i < 9; i++) {
      for (let j = i + 1; j < 9; j++) {
        if (Math.abs(entry(gram, i * 9 + j)) > Math.abs(entry(gram, p * 9 + q))) {
          p = i;
          q = j;
        }
      }
    }
    const off = entry(gram, p * 9 + q);
    if (Math.abs(off) <= norm * 1e-14) break;
    const pp = entry(gram, p * 9 + p);
    const qq = entry(gram, q * 9 + q);
    const angle = 0.5 * Math.atan2(2 * off, qq - pp);
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    for (let k = 0; k < 9; k++) {
      if (k !== p && k !== q) {
        const kp = entry(gram, k * 9 + p);
        const kq = entry(gram, k * 9 + q);
        gram[k * 9 + p] = c * kp - s * kq;
        gram[p * 9 + k] = c * kp - s * kq;
        gram[k * 9 + q] = s * kp + c * kq;
        gram[q * 9 + k] = s * kp + c * kq;
      }
      const vp = entry(vectors, k * 9 + p);
      const vq = entry(vectors, k * 9 + q);
      vectors[k * 9 + p] = c * vp - s * vq;
      vectors[k * 9 + q] = s * vp + c * vq;
    }
    gram[p * 9 + p] = c * c * pp - 2 * c * s * off + s * s * qq;
    gram[q * 9 + q] = s * s * pp + 2 * c * s * off + c * c * qq;
    gram[p * 9 + q] = 0;
    gram[q * 9 + p] = 0;
  }
  const order = Array.from({ length: 9 }, (_, index) => index).sort(
    (a, b) => entry(gram, a * 10) - entry(gram, b * 10),
  );
  if (entry(gram, entry(order, 1) * 10) <= norm * 1e-10) {
    throw new GeometryError(
      "degenerate_calibration",
      "Calibration does not determine a unique homography",
    );
  }
  return matrix(Array.from({ length: 9 }, (_, row) => entry(vectors, row * 9 + entry(order, 0))));
}
