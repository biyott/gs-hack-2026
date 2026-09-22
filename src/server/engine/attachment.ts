import type { Point, WorkerProfile } from "../../../packages/contracts/src/core";
import type { Waypoint } from "../../../packages/contracts/src/guidance";
import type { Bounds, MapEdge, MapNode } from "../../../packages/contracts/src/map";
import { type Polygon, pathIntersectsPolygon, permitsEgress } from "./geometry";
import type { RouteInput } from "./types";

export type Attachment = {
  readonly nodeId: string;
  readonly waypoints: readonly Waypoint[];
  readonly edgeIds: readonly string[];
  readonly distanceM: number;
};

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function boundsPolygon(bounds: Bounds): Polygon {
  return [
    { x: bounds.minX, y: bounds.minY },
    { x: bounds.maxX, y: bounds.minY },
    { x: bounds.maxX, y: bounds.maxY },
    { x: bounds.minX, y: bounds.maxY },
  ];
}

export function requiresAssistance(profile: WorkerProfile): boolean {
  return profile.needsAssistance !== false || profile.needsCompanion !== false;
}

export function eligibleEdge(edge: MapEdge, input: RouteInput): boolean {
  return (
    edge.enabled &&
    !input.closedEdgeIds.includes(edge.id) &&
    !input.closedEdgeIds.includes(edge.pathId) &&
    (!edge.stairs || input.profile?.canUseStairs === true) &&
    (edge.accessible || (input.profile !== null && !requiresAssistance(input.profile)))
  );
}

export function activePolygons(input: RouteInput): readonly Polygon[] {
  return input.hazards
    .filter(
      (hazard) =>
        (hazard.active ||
          hazard.sensorStatus === "stale" ||
          hazard.sensorStatus === "disconnected") &&
        hazard.floorId === input.map.floorId,
    )
    .map((hazard) => hazard.polygon);
}

function projection(point: Point, segment: readonly [Point, Point]): Point {
  const [start, end] = segment;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const squaredLength = dx * dx + dy * dy;
  const t =
    squaredLength === 0
      ? 0
      : Math.max(
          0,
          Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / squaredLength),
        );
  return { x: start.x + t * dx, y: start.y + t * dy };
}

function attachmentPath(position: Point, projected: Point, target: MapNode): readonly Waypoint[] {
  const points: Waypoint[] = [{ ...position, nodeId: "WORKER-POSITION", floorId: target.floorId }];
  if (distance(position, projected) > 1e-9)
    points.push({ ...projected, nodeId: "CORRIDOR-PROJECTION", floorId: target.floorId });
  if (distance(projected, target) > 1e-9 || points.length === 1)
    points.push({ x: target.x, y: target.y, nodeId: target.id, floorId: target.floorId });
  return points;
}

export function startAttachments(input: RouteInput): readonly Attachment[] {
  if (input.position === null) return [];
  const nodes = new Map(input.map.nodes.map((node) => [node.id, node]));
  const hazards = activePolygons(input);
  const obstacles = input.map.obstacles.map((obstacle) => boundsPolygon(obstacle.bounds));
  const attachments: Attachment[] = [];
  for (const edge of input.map.edges) {
    if (!eligibleEdge(edge, input)) continue;
    const from = nodes.get(edge.from);
    const to = nodes.get(edge.to);
    if (!from || !to) continue;
    const projected = projection(input.position, [from, to]);
    if (distance(input.position, projected) > edge.widthM / 2) continue;
    for (const target of [from, to]) {
      const waypoints = attachmentPath(input.position, projected, target);
      if (obstacles.some((polygon) => pathIntersectsPolygon(waypoints, polygon))) continue;
      const safe = hazards.every((polygon) => !pathIntersectsPolygon(waypoints, polygon));
      const egress =
        edge.initialEgress && target.id === edge.to && permitsEgress(waypoints, hazards);
      if (!safe && !egress) continue;
      const distanceM = distance(input.position, projected) + distance(projected, target);
      attachments.push({
        nodeId: target.id,
        waypoints,
        edgeIds: distanceM > 1e-9 ? [edge.id] : [],
        distanceM,
      });
    }
  }
  return attachments.sort(
    (a, b) =>
      a.distanceM - b.distanceM ||
      a.nodeId.localeCompare(b.nodeId) ||
      a.edgeIds.join().localeCompare(b.edgeIds.join()),
  );
}
