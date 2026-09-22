import type { Point } from "./core";
import type { Bounds } from "./map";

export function containsPoint(bounds: Bounds, point: Readonly<Point>): boolean {
  return (
    point.x >= bounds.minX &&
    point.x <= bounds.maxX &&
    point.y >= bounds.minY &&
    point.y <= bounds.maxY
  );
}

export function containsBounds(outer: Bounds, inner: Bounds): boolean {
  return (
    containsPoint(outer, { x: inner.minX, y: inner.minY }) &&
    containsPoint(outer, { x: inner.maxX, y: inner.maxY })
  );
}

export function segmentIntersectsBounds(
  from: Readonly<Point>,
  to: Readonly<Point>,
  bounds: Bounds,
): boolean {
  let entry = 0;
  let exit = 1;
  for (const [origin, destination, minimum, maximum] of [
    [from.x, to.x, bounds.minX, bounds.maxX],
    [from.y, to.y, bounds.minY, bounds.maxY],
  ] as const) {
    const delta = destination - origin;
    if (delta === 0) {
      if (origin < minimum || origin > maximum) return false;
      continue;
    }
    const first = (minimum - origin) / delta;
    const second = (maximum - origin) / delta;
    entry = Math.max(entry, Math.min(first, second));
    exit = Math.min(exit, Math.max(first, second));
    if (entry > exit) return false;
  }
  return true;
}
