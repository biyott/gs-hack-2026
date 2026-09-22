import type { Point } from "../../../packages/contracts/src/core";
import type { Polygon } from "./geometry";

function turn(a: Point, b: Point, c: Point): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function halfHull(points: readonly Point[]): readonly Point[] {
  const hull: Point[] = [];
  for (const point of points) {
    let last = hull.at(-1);
    let penultimate = hull.at(-2);
    while (last && penultimate && turn(penultimate, last, point) <= 0) {
      hull.pop();
      last = hull.at(-1);
      penultimate = hull.at(-2);
    }
    hull.push(point);
  }
  return hull;
}

export function convexHull(points: readonly Point[]): Polygon {
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  return [...halfHull(sorted).slice(0, -1), ...halfHull([...sorted].reverse()).slice(0, -1)];
}

export function transformPolygon(polygon: Polygon, origin: Point, degrees: number): Polygon {
  const angle = (degrees * Math.PI) / 180;
  return polygon.map((point) => ({
    x: origin.x + point.x * Math.cos(angle) - point.y * Math.sin(angle),
    y: origin.y + point.x * Math.sin(angle) + point.y * Math.cos(angle),
  }));
}

export function sweepTranslation(polygon: Polygon, delta: Point): Polygon {
  return convexHull([
    ...polygon,
    ...polygon.map((point) => ({ x: point.x + delta.x, y: point.y + delta.y })),
  ]);
}

export function sweepRotation(polygon: Polygon, angles: readonly [number, number]): Polygon {
  const span = Math.max(-360, Math.min(360, angles[1] - angles[0]));
  const steps = Math.max(1, Math.ceil(Math.abs(span) / 5));
  const step = span / steps;
  const radius = Math.max(0, ...polygon.map((point) => Math.hypot(point.x, point.y)));
  const padding = radius * (1 - Math.cos((Math.abs(step) * Math.PI) / 360));
  const points = Array.from({ length: steps + 1 }, (_, index) =>
    transformPolygon(polygon, { x: 0, y: 0 }, angles[0] + index * step),
  ).flat();
  // A square Minkowski padding encloses the arc/chord sagitta between angle samples.
  return convexHull(
    points.flatMap((point) => [
      { x: point.x - padding, y: point.y - padding },
      { x: point.x + padding, y: point.y - padding },
      { x: point.x + padding, y: point.y + padding },
      { x: point.x - padding, y: point.y + padding },
    ]),
  );
}
