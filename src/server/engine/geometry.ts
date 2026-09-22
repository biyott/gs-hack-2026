import type { Point } from "../../../packages/contracts/src/core";

export type Polygon = readonly Point[];
export type Segment = readonly [Point, Point];
const EPSILON = 1e-9;

function cross(a: Point, b: Point): number {
  return a.x * b.y - a.y * b.x;
}

function subtract(a: Point, b: Point): Point {
  return { x: a.x - b.x, y: a.y - b.y };
}

function polygonEdges(polygon: Polygon): readonly Segment[] {
  const edges: Segment[] = [];
  let previous = polygon.at(-1);
  for (const point of polygon) {
    if (previous) edges.push([previous, point]);
    previous = point;
  }
  return edges;
}

function onSegment(point: Point, segment: Segment): boolean {
  const [start, end] = segment;
  const direction = subtract(end, start);
  const relative = subtract(point, start);
  const length = Math.hypot(direction.x, direction.y);
  if (length <= EPSILON) return Math.hypot(relative.x, relative.y) <= EPSILON;
  return (
    Math.abs(cross(direction, relative)) <= EPSILON * length &&
    point.x >= Math.min(start.x, end.x) - EPSILON &&
    point.x <= Math.max(start.x, end.x) + EPSILON &&
    point.y >= Math.min(start.y, end.y) - EPSILON &&
    point.y <= Math.max(start.y, end.y) + EPSILON
  );
}

export function pointInPolygon(point: Point, polygon: Polygon): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  for (const edge of polygonEdges(polygon)) {
    if (onSegment(point, edge)) return true;
    const [a, b] = edge;
    if (
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
    )
      inside = !inside;
  }
  return inside;
}

function crossingParameters(segment: Segment, edge: Segment): readonly number[] {
  const [start, end] = segment;
  const [a, b] = edge;
  const direction = subtract(end, start);
  const boundary = subtract(b, a);
  const relative = subtract(a, start);
  const denominator = cross(direction, boundary);
  const lengthSquared = direction.x ** 2 + direction.y ** 2;
  if (lengthSquared <= EPSILON ** 2) return onSegment(start, edge) ? [0] : [];
  const parallelTolerance =
    Number.EPSILON * Math.sqrt(lengthSquared) * Math.hypot(boundary.x, boundary.y);
  if (Math.abs(denominator) > parallelTolerance) {
    const t = cross(relative, boundary) / denominator;
    const u = cross(relative, direction) / denominator;
    return t >= -EPSILON && t <= 1 + EPSILON && u >= -EPSILON && u <= 1 + EPSILON
      ? [Math.min(1, Math.max(0, t))]
      : [];
  }
  if (Math.abs(cross(relative, direction)) > EPSILON * Math.sqrt(lengthSquared)) return [];
  const t1 = (relative.x * direction.x + relative.y * direction.y) / lengthSquared;
  const endRelative = subtract(b, start);
  const t2 = (endRelative.x * direction.x + endRelative.y * direction.y) / lengthSquared;
  const lower = Math.max(0, Math.min(t1, t2));
  const upper = Math.min(1, Math.max(t1, t2));
  return lower <= upper + EPSILON ? [lower, upper] : [];
}

export function segmentIntersectsPolygon(segment: Segment, polygon: Polygon): boolean {
  return (
    pointInPolygon(segment[0], polygon) ||
    pointInPolygon(segment[1], polygon) ||
    polygonEdges(polygon).some((edge) => crossingParameters(segment, edge).length > 0)
  );
}

export function pathIntersectsPolygon(path: readonly Point[], polygon: Polygon): boolean {
  let previous: Point | undefined;
  for (const point of path) {
    if (
      pointInPolygon(point, polygon) ||
      (previous && segmentIntersectsPolygon([previous, point], polygon))
    )
      return true;
    previous = point;
  }
  return false;
}

function interpolation(segment: Segment, t: number): Point {
  return {
    x: segment[0].x + t * (segment[1].x - segment[0].x),
    y: segment[0].y + t * (segment[1].y - segment[0].y),
  };
}

function exitsOnce(path: readonly Point[], polygon: Polygon): boolean {
  let exited = false;
  let previous = path[0];
  for (const point of path.slice(1)) {
    if (!previous) return false;
    const segment: Segment = [previous, point];
    const parameters = [
      ...new Set([
        0,
        1,
        ...polygonEdges(polygon).flatMap((edge) => crossingParameters(segment, edge)),
      ]),
    ].sort((a, b) => a - b);
    let prior: number | undefined;
    for (const parameter of parameters) {
      const samples = prior === undefined ? [parameter] : [(prior + parameter) / 2, parameter];
      for (const sample of samples) {
        const inside = pointInPolygon(interpolation(segment, sample), polygon);
        if (inside && exited) return false;
        if (!inside) exited = true;
      }
      prior = parameter;
    }
    previous = point;
  }
  return exited;
}

export function permitsEgress(path: readonly Point[], polygons: readonly Polygon[]): boolean {
  const start = path[0];
  const destination = path.at(-1);
  if (!start || !destination || path.length < 2) return false;
  return polygons.every((polygon) => {
    if (pointInPolygon(destination, polygon)) return false;
    return pointInPolygon(start, polygon)
      ? exitsOnce(path, polygon)
      : !pathIntersectsPolygon(path, polygon);
  });
}
