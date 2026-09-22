import assert from "node:assert/strict";
import type { Guidance, SimulationSnapshot } from "@/contracts";
import { type Polygon, pathIntersectsPolygon, permitsEgress } from "../engine/geometry";

export function primaryGuidance(snapshot: SimulationSnapshot): Guidance[] {
  return snapshot.workers.flatMap((worker) =>
    worker.currentGuidance?.updateKind === "primary" ? [worker.currentGuidance] : [],
  );
}

export function proveRouteReplacement(prior: SimulationSnapshot, current: SimulationSnapshot) {
  const replacement = primaryGuidance(current).find((guidance) => guidance.workerId === "WORKER-A");
  const previous = prior.workers.find(
    (worker) => worker.workerId === replacement?.workerId,
  )?.currentGuidance;
  assert.ok(previous && replacement);
  assert.equal(previous.runId, replacement.runId);
  assert.equal(previous.actionCode, "FOLLOW_VALIDATED_ROUTE");
  assert.equal(replacement.actionCode, "FOLLOW_VALIDATED_ROUTE");
  assert.ok(
    ["evacuate", "designated-space"].includes(String(replacement.messageArgs["reasonCode"])),
  );
  assert.notDeepEqual(previous.waypoints, replacement.waypoints);
  const priorFire = prior.hazards.filter(
    (hazard) =>
      hazard.active && hazard.hazardType === "fire" && previous.hazardIds.includes(hazard.hazardId),
  );
  const currentFire = current.hazards.filter(
    (hazard) =>
      hazard.active &&
      hazard.hazardType === "fire" &&
      replacement.hazardIds.includes(hazard.hazardId),
  );
  assert.ok(priorFire.length > 0 && currentFire.length > 0);
  assert.equal(
    routePermitted(
      previous,
      priorFire.map((hazard) => hazard.polygon),
    ),
    true,
  );
  assert.equal(
    routePermitted(
      previous,
      currentFire.map((hazard) => hazard.polygon),
    ),
    false,
  );
  assert.equal(
    routePermitted(
      replacement,
      currentFire.map((hazard) => hazard.polygon),
    ),
    true,
  );
  const newlyClosedEdges = current.closedEdgeIds.filter(
    (edge) => !prior.closedEdgeIds.includes(edge),
  );
  assert.ok(newlyClosedEdges.length > 0);
  return {
    workerId: replacement.workerId,
    priorSnapshotVersion: prior.run.version,
    replacementSnapshotVersion: current.run.version,
    priorGuidance: previous,
    replacementGuidance: replacement,
    priorFire,
    currentFire,
    newlyClosedEdges,
    previousRoutePermittedBefore: true,
    previousRoutePermittedAfter: false,
    replacementRoutePermitted: true,
  };
}

function routePermitted(guidance: Guidance, polygons: readonly Polygon[]): boolean {
  const path = guidance.waypoints;
  const attachmentEnd = path.findIndex(
    (point, index) =>
      index > 0 && point.nodeId !== "WORKER-POSITION" && point.nodeId !== "CORRIDOR-PROJECTION",
  );
  return (
    path[0]?.nodeId === "WORKER-POSITION" &&
    attachmentEnd > 0 &&
    permitsEgress(path.slice(0, attachmentEnd + 1), polygons) &&
    polygons.every((polygon) => !pathIntersectsPolygon(path.slice(attachmentEnd), polygon))
  );
}
