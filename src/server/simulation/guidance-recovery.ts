import type { Guidance, SimulationSnapshot, WorkerState } from "@/contracts";
import { type EngineDecision, routeWorker } from "../engine";
import type { EvaluationContext } from "./evaluate";

function fresh(observedAt: string | null, now: string, maximumAgeMs: number): boolean {
  if (observedAt === null) return false;
  const age = Date.parse(now) - Date.parse(observedAt);
  return age >= 0 && age <= maximumAgeMs;
}

export function retainNonMovementDecision(
  previous: Guidance,
  decision: EngineDecision,
  snapshot: SimulationSnapshot,
): EngineDecision | null {
  if (
    previous.actionCode !== "POSITION_UNKNOWN" &&
    previous.actionCode !== "SENSOR_UNKNOWN" &&
    previous.actionCode !== "ROUTE_UNAVAILABLE"
  )
    return null;
  const currentEquipmentContext =
    snapshot.mode === "equipment" &&
    previous.simulationMode === "equipment" &&
    previous.hazardType === "equipment" &&
    previous.actionCode === "ROUTE_UNAVAILABLE";
  const hazardIds = currentEquipmentContext
    ? previous.hazardIds.filter(
        (id) =>
          !id.startsWith(`${snapshot.equipment.id}:`) ||
          snapshot.hazards.some((hazard) => hazard.hazardId === id),
      )
    : previous.hazardIds;
  return {
    ...decision,
    actionCode: previous.actionCode,
    hazardIds,
    hazardType: previous.hazardType,
    priority: previous.priority,
    reasonCode:
      typeof previous.messageArgs["reasonCode"] === "string"
        ? previous.messageArgs["reasonCode"]
        : "recovery-unverified",
    assistanceRequired: true,
    route: null,
    destinationId: null,
  };
}

/** Recovery changes the message only; it never authorizes movement or reopens a passage. */
export function nonMovementCauseResolved(
  previous: Guidance,
  worker: WorkerState,
  snapshot: SimulationSnapshot,
  context: EvaluationContext,
): boolean {
  if (
    worker.positionStatus !== "known" ||
    worker.position === null ||
    !fresh(worker.lastObservedAt, context.now, context.policy.positionStaleAfterMs)
  )
    return false;
  switch (previous.actionCode) {
    case "POSITION_UNKNOWN":
      return (
        previous.messageArgs["reasonCode"] === "position-unknown" ||
        (previous.messageArgs["reasonCode"] === "equipment-position-unknown" &&
          snapshot.equipment.positionStatus === "known" &&
          fresh(
            snapshot.equipment.lastObservedAt,
            context.now,
            context.policy.positionStaleAfterMs,
          ))
      );
    case "SENSOR_UNKNOWN":
      return (
        previous.hazardIds.length > 0 &&
        previous.hazardIds.every((id) => {
          const hazard = snapshot.hazards.find((candidate) => candidate.hazardId === id);
          return (
            hazard?.sensorStatus === "current" &&
            fresh(hazard.observedAt, context.now, context.policy.sensorStaleAfterMs)
          );
        })
      );
    case "ROUTE_UNAVAILABLE": {
      const policies = context.policy.responses
        .filter((response) => response.hazardType === previous.hazardType)
        .sort((left, right) => right.priority - left.priority);
      const selected = policies[0];
      if (!selected || selected.strategy === "shelter") return false;
      if (
        policies.some(
          (response) =>
            response.priority === selected.priority &&
            (response.strategy !== selected.strategy ||
              [...response.destinationIds].sort().join() !==
                [...selected.destinationIds].sort().join()),
        )
      )
        return false;
      return (
        routeWorker({
          map: context.map,
          position: worker.position,
          profile: worker.profile,
          hazards: snapshot.hazards,
          closedEdgeIds: snapshot.closedEdgeIds,
          destinationIds: selected.destinationIds,
        }).kind === "valid"
      );
    }
    default:
      return false;
  }
}
