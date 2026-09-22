import type { Point, SimulationSnapshot } from "@/contracts";
import type { ScenarioEvent, ScenarioInitialState } from "../scenarios";
import { constrainEquipmentWorld } from "./equipment-controls";
import type { SimulationRun } from "./run";

type PoseEvent = Extract<ScenarioEvent, { type: "equipment.pose" | "worker.position" }>;

function nextPoses(events: readonly ScenarioEvent[], afterMs: number) {
  const targets = new Map<string, PoseEvent | null>();
  for (const event of events) {
    if (event.atMs <= afterMs) continue;
    switch (event.type) {
      case "equipment.pose":
        if (!targets.has("EQUIPMENT-A")) targets.set("EQUIPMENT-A", event);
        break;
      case "worker.position":
        if (!targets.has(event.workerId)) targets.set(event.workerId, event);
        break;
      case "source.connection":
        if (!targets.has(event.entityId)) targets.set(event.entityId, null);
        break;
      case "worker.profile":
      case "sensor.reading":
      case "hazard.upsert":
      case "hazard.clear":
      case "route.block":
      case "route.reopen":
        break;
      default: {
        const exhaustive: never = event;
        return exhaustive;
      }
    }
  }
  return targets;
}

function pointBetween(from: Point, to: Point, fraction: number): Point {
  return { x: from.x + (to.x - from.x) * fraction, y: from.y + (to.y - from.y) * fraction };
}

function angleBetween(from: number, to: number, fraction: number): number {
  const delta = ((((to - from) % 360) + 540) % 360) - 180;
  return from + delta * fraction;
}

/** Move synthetic poses toward their next observation without crossing source gaps. */
export function advanceScenarioMotion(run: SimulationRun, throughMs: number): void {
  const beforeMs = run.snapshot.run.virtualTimeMs;
  if (run.snapshot.run.positionInput !== "scenario" || throughMs <= beforeMs) return;
  const targets = nextPoses(run.scenario.events, beforeMs);
  const fraction = (target: PoseEvent) => (throughMs - beforeMs) / (target.atMs - beforeMs);
  const isFresh = (target: PoseEvent) =>
    target.observedAtMs === undefined || target.observedAtMs === target.atMs;
  const { state, frozenSourceIds } = run.world;
  const equipment = state.equipment;
  const target = targets.get("EQUIPMENT-A");
  run.world = {
    ...run.world,
    state: {
      ...state,
      equipment:
        equipment?.connected &&
        run.snapshot.equipment.positionSource === "mock" &&
        !frozenSourceIds.has("EQUIPMENT-A") &&
        target?.type === "equipment.pose" &&
        isFresh(target)
          ? {
              ...equipment,
              position: pointBetween(equipment.position, target.position, fraction(target)),
              headingDeg: angleBetween(equipment.headingDeg, target.headingDeg, fraction(target)),
              slewDeg: angleBetween(equipment.slewDeg, target.slewDeg, fraction(target)),
            }
          : equipment,
      workers: state.workers.map((worker) => {
        const target = targets.get(worker.workerId);
        if (
          !worker.connected ||
          worker.position === null ||
          frozenSourceIds.has(worker.workerId) ||
          run.snapshot.workers.find((entry) => entry.workerId === worker.workerId)
            ?.positionSource !== "mock" ||
          target?.type !== "worker.position" ||
          target.position === null ||
          !isFresh(target)
        )
          return worker;
        return {
          ...worker,
          position: pointBetween(worker.position, target.position, fraction(target)),
        };
      }),
    },
  };
  constrainEquipmentWorld(run);
}

export function restoreScenarioPoses(
  state: ScenarioInitialState,
  saved: SimulationSnapshot,
): ScenarioInitialState {
  return {
    ...state,
    equipment:
      state.equipment && saved.equipment.positionSource === "mock"
        ? {
            ...state.equipment,
            position: saved.equipment.position,
            headingDeg: saved.equipment.headingDeg,
            speedMps: saved.equipment.speedMps,
            slewDeg: saved.equipment.slewDeg,
          }
        : state.equipment,
    workers: state.workers.map((worker) => {
      const source = saved.workers.find((entry) => entry.workerId === worker.workerId);
      return source ? { ...worker, position: source.position, profile: source.profile } : worker;
    }),
  };
}
