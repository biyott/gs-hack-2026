import type { Guidance, Hazard, SimulationSnapshot, Waypoint } from "@/contracts";
import { type Polygon, pathIntersectsPolygon, permitsEgress } from "../engine/geometry";

const noFacts = { fireInvalidatedPreviousRoute: false, equipmentDirectionChanged: false };

function sameContext(snapshot: SimulationSnapshot, guidance: Guidance): boolean {
  return (
    snapshot.run.runId === guidance.runId &&
    snapshot.mode === guidance.simulationMode &&
    snapshot.run.mapId === guidance.mapId &&
    snapshot.run.mapVersion === guidance.mapVersion
  );
}

function workerGuidance(snapshot: SimulationSnapshot, workerId: string): Guidance | null {
  const workers = snapshot.workers.filter((worker) => worker.workerId === workerId);
  return workers.length === 1 ? (workers[0]?.currentGuidance ?? null) : null;
}

function samePrimary(left: Guidance, right: Guidance): boolean {
  return (
    left.guidanceId === right.guidanceId &&
    left.primaryGuidanceVersion === right.primaryGuidanceVersion
  );
}

function fresh(hazard: Hazard, at: number, staleAfterMs: number): boolean {
  const age = at - Date.parse(hazard.observedAt);
  return hazard.sensorStatus === "current" && age >= 0 && age <= staleAfterMs;
}

function permissible(path: readonly Waypoint[], polygons: readonly Polygon[]): boolean {
  if (path.length < 2 || path[0]?.nodeId !== "WORKER-POSITION") return false;
  const attachmentEnd = path.findIndex(
    (point, index) =>
      index > 0 && point.nodeId !== "WORKER-POSITION" && point.nodeId !== "CORRIDOR-PROJECTION",
  );
  return (
    attachmentEnd > 0 &&
    permitsEgress(path.slice(0, attachmentEnd + 1), polygons) &&
    polygons.every((polygon) => !pathIntersectsPolygon(path.slice(attachmentEnd), polygon))
  );
}

function routeKey(guidance: Guidance): string {
  return JSON.stringify(
    guidance.waypoints.map(({ x, y, nodeId, floorId }) => [x, y, nodeId, floorId]),
  );
}

function fireChanged(
  previous: Guidance,
  current: Guidance,
  before: SimulationSnapshot,
  after: SimulationSnapshot,
  at: number,
  staleAfterMs: number,
): boolean {
  if (
    current.simulationMode !== "fire-gas" ||
    previous.actionCode !== "FOLLOW_VALIDATED_ROUTE" ||
    current.actionCode !== "FOLLOW_VALIDATED_ROUTE" ||
    Date.parse(previous.expiresAt) <= at ||
    !previous.destinationId ||
    !current.destinationId ||
    routeKey(previous) === routeKey(current)
  )
    return false;
  if (
    [...previous.waypoints, ...current.waypoints].some(
      (point) => point.floorId !== current.floorId || point.nodeId === "CORRIDOR-PROJECTION",
    )
  )
    return false;
  const relevant = (hazard: Hazard) =>
    hazard.hazardType === "fire" && hazard.floorId === current.floorId;
  const priorFires = before.hazards.filter((hazard) => relevant(hazard) && hazard.active);
  const fires = after.hazards.filter((hazard) => relevant(hazard) && hazard.active);
  const causal = fires.filter(
    (hazard) => current.hazardIds.includes(hazard.hazardId) && fresh(hazard, at, staleAfterMs),
  );
  const beforeAt = Date.parse(before.run.updatedAt);
  if (!causal.length || priorFires.some((hazard) => !fresh(hazard, beforeAt, staleAfterMs)))
    return false;
  return (
    permissible(
      previous.waypoints,
      priorFires.map((hazard) => hazard.polygon),
    ) &&
    !permissible(
      previous.waypoints,
      causal.map((hazard) => hazard.polygon),
    ) &&
    permissible(
      current.waypoints,
      fires.map((hazard) => hazard.polygon),
    )
  );
}

export function guidanceApplicability(
  guidance: Guidance,
  history: readonly SimulationSnapshot[],
  sensorStaleAfterMs: number,
): { fireInvalidatedPreviousRoute: boolean; equipmentDirectionChanged: boolean } {
  const index = history.findIndex((snapshot) =>
    snapshot.workers.some(
      (worker) =>
        worker.workerId === guidance.workerId &&
        worker.currentGuidance &&
        samePrimary(worker.currentGuidance, guidance),
    ),
  );
  const after = history[index];
  const before = history[index - 1];
  if (
    !before ||
    !after ||
    !sameContext(before, guidance) ||
    !sameContext(after, guidance) ||
    before.run.version >= after.run.version ||
    history.filter(
      (snapshot) =>
        snapshot.run.runId === after.run.runId && snapshot.run.version === after.run.version,
    ).length !== 1
  )
    return { ...noFacts };
  const previous = workerGuidance(before, guidance.workerId);
  const current = workerGuidance(after, guidance.workerId);
  if (
    !previous ||
    !current ||
    !samePrimary(current, guidance) ||
    samePrimary(previous, current) ||
    current.updateKind !== "primary" ||
    current.guidanceVersion !== current.primaryGuidanceVersion ||
    previous.floorId !== guidance.floorId ||
    current.floorId !== guidance.floorId ||
    !sameContext(before, previous) ||
    !sameContext(after, current)
  )
    return { ...noFacts };
  const at = Date.parse(current.generatedAt);
  if (
    !Number.isFinite(at) ||
    at < Date.parse(previous.generatedAt) ||
    !Number.isFinite(sensorStaleAfterMs) ||
    sensorStaleAfterMs < 0
  )
    return { ...noFacts };
  const oldEquipment = before.equipment;
  const equipment = after.equipment;
  const heading = (value: number) => ((value % 360) + 360) % 360;
  return {
    fireInvalidatedPreviousRoute: fireChanged(
      previous,
      current,
      before,
      after,
      at,
      sensorStaleAfterMs,
    ),
    equipmentDirectionChanged:
      guidance.simulationMode === "equipment" &&
      oldEquipment.id === equipment.id &&
      oldEquipment.presetId === equipment.presetId &&
      oldEquipment.positionStatus === "known" &&
      equipment.positionStatus === "known" &&
      (heading(oldEquipment.headingDeg) !== heading(equipment.headingDeg) ||
        oldEquipment.slewDeg !== equipment.slewDeg),
  };
}
