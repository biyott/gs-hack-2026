import type {
  Bounds,
  Guidance,
  Hazard,
  InputSource,
  Point,
  SimulationSnapshot,
  WorkerState,
} from "@/contracts";
import { type CameraMode, fullSiteBounds, routeIsCurrent } from "./geometry";
import type { SceneSelection } from "./scene-types";

export function visibleRoutes(snapshot: SimulationSnapshot, nowMs: number): readonly Guidance[] {
  return snapshot.workers.flatMap((worker) => {
    const guidance = worker.currentGuidance;
    if (worker.positionStatus !== "known" || !guidance || guidance.waypoints.length < 2) return [];
    const context = { ...snapshot.run, nowMs };
    return guidance.workerId === worker.workerId && routeIsCurrent(guidance, context)
      ? [guidance]
      : [];
  });
}

export function activeHazards(snapshot: SimulationSnapshot): readonly Hazard[] {
  return snapshot.hazards.filter((hazard) => hazard.active && hazard.floorId === "GROUND");
}

export function pointBounds(points: readonly Readonly<Point>[], fallback: Bounds): Bounds {
  if (points.length === 0) return fallback;
  return {
    minX: Math.min(...points.map((point) => point.x)) - 8,
    maxX: Math.max(...points.map((point) => point.x)) + 8,
    minY: Math.min(...points.map((point) => point.y)) - 8,
    maxY: Math.max(...points.map((point) => point.y)) + 8,
  };
}

export function positionInputLabel(source: InputSource): string {
  return { live: "실제 입력", synthetic: "합성 입력", unknown: "출처 미확인" }[source];
}

export function positionSourceLabel(
  position: Pick<WorkerState, "positionSource" | "positionInputSource">,
): string {
  const source = { mock: "모의", video: "영상 표식", uwb: "UWB", manual: "수동" } as const;
  return `${source[position.positionSource]} · ${positionInputLabel(position.positionInputSource)}`;
}

export function workerLabel(worker: WorkerState): string {
  const state = {
    known: "현재 위치",
    stale: "마지막 위치 · 오래됨",
    unknown: "위치 미확인",
  } as const;
  return `${worker.workerId} · ${state[worker.positionStatus]} · ${positionSourceLabel(worker)}`;
}

export function cameraBounds(
  selection: Omit<SceneSelection, "onSelectWorker">,
  mode: CameraMode,
  reachM: number,
  nowMs: number,
): Bounds {
  const { snapshot, map, selectedIncidentId, selectedWorkerId } = selection;
  const full = fullSiteBounds(snapshot.equipment.position, reachM);
  const hazards = activeHazards(snapshot);
  const selectedIncident = snapshot.incidents.find(
    (incident) => incident.incidentId === selectedIncidentId,
  );
  const worker = snapshot.workers.find((entry) => entry.workerId === selectedWorkerId);
  const relevantHazards = selectedIncident
    ? hazards.filter((hazard) => selectedIncident.hazardIds.includes(hazard.hazardId))
    : hazards;
  const affectedIds = new Set(relevantHazards.flatMap((hazard) => hazard.affectedWorkerIds));
  const riskPoints = [
    ...relevantHazards.flatMap((hazard) => hazard.polygon),
    ...snapshot.workers.flatMap((entry) =>
      affectedIds.has(entry.workerId) && entry.position && entry.positionStatus !== "unknown"
        ? [entry.position]
        : [],
    ),
    ...visibleRoutes(snapshot, nowMs)
      .filter((route) =>
        selectedIncident
          ? route.incidentId === selectedIncident.incidentId
          : affectedIds.has(route.workerId),
      )
      .flatMap((route) => route.waypoints),
  ];
  const modes: Record<CameraMode, () => Bounds> = {
    full: () => full,
    risk: () => pointBounds(riskPoints, map.bounds),
    locked: () => pointBounds(riskPoints, map.bounds),
    follow: () =>
      pointBounds(
        worker?.position && worker.positionStatus === "known" ? [worker.position] : [],
        map.bounds,
      ),
  };
  return modes[mode]();
}
