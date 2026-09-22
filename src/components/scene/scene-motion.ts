import type { EquipmentState, Point, SimulationSnapshot, WorkerState } from "@/contracts";

export const SCENE_MOTION_DURATION_MS = 100;
export const SCENE_MOTION_MAX_GAP_MS = 500;

export type SceneMotion = {
  readonly from: SimulationSnapshot;
  readonly target: SimulationSnapshot;
  readonly scope: string;
  readonly startedAtMs: number;
  readonly wallTimeMs: number;
  readonly animating: boolean;
};

function identity(snapshot: SimulationSnapshot): string {
  return JSON.stringify([
    snapshot.streamId,
    snapshot.mode,
    snapshot.run.runId,
    snapshot.run.scenarioId,
    snapshot.run.mapId,
    snapshot.run.mapVersion,
    snapshot.run.positionInput,
    snapshot.equipment.id,
    snapshot.equipment.presetId,
  ]);
}

type PositionState = Pick<
  WorkerState,
  "position" | "positionStatus" | "positionSource" | "positionInputSource" | "lastObservedAt"
>;

function fresh(entity: PositionState, wallTimeMs: number): boolean {
  if (entity.lastObservedAt === null) return false;
  const age = wallTimeMs - Date.parse(entity.lastObservedAt);
  return (
    entity.position !== null &&
    entity.positionStatus === "known" &&
    entity.positionInputSource === "synthetic" &&
    entity.positionSource !== "manual" &&
    age >= 0 &&
    age <= SCENE_MOTION_MAX_GAP_MS
  );
}

function eligible(from: PositionState, to: PositionState, wallTimeMs: number): boolean {
  return (
    fresh(from, wallTimeMs) &&
    fresh(to, wallTimeMs) &&
    from.positionSource === to.positionSource &&
    from.lastObservedAt !== null &&
    to.lastObservedAt !== null &&
    Date.parse(to.lastObservedAt) > Date.parse(from.lastObservedAt)
  );
}

function point(from: Point, to: Point, progress: number): Point {
  return { x: from.x + (to.x - from.x) * progress, y: from.y + (to.y - from.y) * progress };
}

function angle(from: number, to: number, progress: number): number {
  const delta = ((((to - from + 540) % 360) + 360) % 360) - 180;
  return from + delta * progress;
}

function equipmentPose(from: EquipmentState, to: EquipmentState, progress: number, now: number) {
  if (!eligible(from, to, now) || from.tableLinked !== to.tableLinked) return to;
  if (
    from.position.x === to.position.x &&
    from.position.y === to.position.y &&
    from.headingDeg === to.headingDeg &&
    from.slewDeg === to.slewDeg
  )
    return to;
  return {
    ...to,
    position: point(from.position, to.position, progress),
    headingDeg: angle(from.headingDeg, to.headingDeg, progress),
    slewDeg: angle(from.slewDeg, to.slewDeg, progress),
  };
}

function blend(from: SimulationSnapshot, to: SimulationSnapshot, progress: number, now: number) {
  const equipment = equipmentPose(from.equipment, to.equipment, progress, now);
  const previousWorkers = new Map(from.workers.map((worker) => [worker.workerId, worker]));
  const workers = to.workers.map((worker) => {
    const previous = previousWorkers.get(worker.workerId);
    if (!previous?.position || !worker.position || !eligible(previous, worker, now)) return worker;
    if (previous.position.x === worker.position.x && previous.position.y === worker.position.y)
      return worker;
    return { ...worker, position: point(previous.position, worker.position, progress) };
  });
  return equipment === to.equipment &&
    workers.every((worker, index) => worker === to.workers[index])
    ? to
    : { ...to, equipment, workers };
}

export function beginSceneMotion(
  previous: SceneMotion | null,
  target: SimulationSnapshot,
  scope: string,
  startedAtMs: number,
  wallTimeMs: number,
  enabled: boolean,
): SceneMotion {
  const continuous =
    enabled &&
    previous !== null &&
    previous.scope === scope &&
    identity(previous.target) === identity(target) &&
    target.run.status === "running" &&
    previous.target.run.status === "running" &&
    target.run.positionInput === "scenario" &&
    target.sequence > previous.target.sequence &&
    target.run.virtualTimeMs >= previous.target.run.virtualTimeMs &&
    startedAtMs >= previous.startedAtMs &&
    startedAtMs - previous.startedAtMs <= SCENE_MOTION_MAX_GAP_MS;
  const from = continuous ? sampleSceneMotion(previous, startedAtMs) : target;
  const animating = from !== target && blend(from, target, 0, wallTimeMs) !== target;
  return { from, target, scope, startedAtMs, wallTimeMs, animating };
}

export function sampleSceneMotion(motion: SceneMotion, nowMs: number): SimulationSnapshot {
  const elapsed = Math.max(0, nowMs - motion.startedAtMs);
  if (!motion.animating || elapsed >= SCENE_MOTION_DURATION_MS) return motion.target;
  return blend(
    motion.from,
    motion.target,
    elapsed / SCENE_MOTION_DURATION_MS,
    motion.wallTimeMs + elapsed,
  );
}
