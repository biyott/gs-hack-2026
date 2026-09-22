import {
  type Attachment,
  activePolygons,
  boundsPolygon,
  distance,
  eligibleEdge,
  requiresAssistance,
  startAttachments,
} from "./attachment";
import { pointInPolygon, segmentIntersectsPolygon } from "./geometry";
import type { RouteFailure, RouteInput, RouteResult, ValidRoute } from "./types";

function unavailable(reason: RouteFailure): RouteResult {
  return { kind: "unavailable", reason, assistanceRequired: true };
}

export function routeWorker(input: RouteInput): RouteResult {
  if (!input.profile || input.profile.confirmedAt === null)
    return unavailable("profile-unverified");
  if (input.position === null) return unavailable("position-unknown");
  const polygons = [
    ...activePolygons(input),
    ...input.map.obstacles.map((obstacle) => boundsPolygon(obstacle.bounds)),
  ];
  const nodes = new Map(input.map.nodes.map((node) => [node.id, node]));
  const destinations = new Set(
    input.destinationIds.filter((id) => {
      const node = nodes.get(id);
      return node && !polygons.some((polygon) => pointInPolygon(node, polygon));
    }),
  );
  if (destinations.size === 0) return unavailable("no-valid-destination");
  const attachments = startAttachments(input);
  if (attachments.length === 0) return unavailable("no-safe-attachment");
  const best = new Map<string, Attachment>();
  for (const attachment of attachments) {
    if (!best.has(attachment.nodeId)) best.set(attachment.nodeId, attachment);
  }
  const settled = new Set<string>();
  while (true) {
    const current = [...best.values()]
      .filter((entry) => !settled.has(entry.nodeId))
      .sort((a, b) => a.distanceM - b.distanceM || a.nodeId.localeCompare(b.nodeId))[0];
    if (!current) return unavailable("no-path");
    if (destinations.has(current.nodeId)) {
      const speed = input.profile.speedMps?.min;
      return {
        kind: "valid",
        waypoints: current.waypoints,
        edgeIds: current.edgeIds,
        destinationId: current.nodeId,
        distanceM: current.distanceM,
        estimatedSeconds: speed && speed > 0 ? current.distanceM / speed : null,
        assistanceRequired: requiresAssistance(input.profile),
      } satisfies ValidRoute;
    }
    settled.add(current.nodeId);
    const node = nodes.get(current.nodeId);
    if (!node) continue;
    for (const edge of [...input.map.edges].sort((a, b) => a.id.localeCompare(b.id))) {
      if (!eligibleEdge(edge, input)) continue;
      const neighborId = edge.from === node.id ? edge.to : edge.to === node.id ? edge.from : null;
      if (neighborId === null || settled.has(neighborId)) continue;
      const neighbor = nodes.get(neighborId);
      if (
        !neighbor ||
        polygons.some((polygon) => segmentIntersectsPolygon([node, neighbor], polygon))
      )
        continue;
      const distanceM = current.distanceM + distance(node, neighbor);
      const previous = best.get(neighborId);
      if (previous && previous.distanceM <= distanceM) continue;
      best.set(neighborId, {
        nodeId: neighborId,
        distanceM,
        edgeIds: [...current.edgeIds, edge.id],
        waypoints: [
          ...current.waypoints,
          { x: neighbor.x, y: neighbor.y, nodeId: neighbor.id, floorId: neighbor.floorId },
        ],
      });
    }
  }
}
