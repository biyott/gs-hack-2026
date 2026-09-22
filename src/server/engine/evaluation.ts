import type { HazardType, Point, Priority } from "../../../packages/contracts/src/core";
import type { Hazard } from "../../../packages/contracts/src/state";
import { requiresAssistance } from "./attachment";
import { pathIntersectsPolygon, pointInPolygon } from "./geometry";
import { routeWorker } from "./routing";
import type { EngineDecision, Exposure, WorkerPlanInput } from "./types";

const PRIORITY_WEIGHT = { critical: 4, high: 3, medium: 2, low: 1 } as const;

function unreachable(value: never): never {
  throw new TypeError(`Unsupported engine variant: ${value}`);
}

export function assessExposure(
  position: Point | null,
  plannedRoute: readonly Point[],
  hazards: readonly Hazard[],
): Exposure {
  return {
    current:
      position !== null &&
      hazards.some((hazard) => hazard.active && pointInPolygon(position, hazard.polygon)),
    plannedRoute: hazards.some(
      (hazard) => hazard.active && pathIntersectsPolygon(plannedRoute, hazard.polygon),
    ),
  };
}

function knownPosition(input: WorkerPlanInput): boolean {
  switch (input.worker.positionStatus) {
    case "known": {
      const age =
        input.worker.lastObservedAt === null
          ? Infinity
          : Date.parse(input.now) - Date.parse(input.worker.lastObservedAt);
      return input.worker.position !== null && age >= 0 && age <= input.policy.positionStaleAfterMs;
    }
    case "unknown":
    case "stale":
      return false;
    default:
      return unreachable(input.worker.positionStatus);
  }
}

function sensorUnknown(hazard: Hazard, input: WorkerPlanInput): boolean {
  switch (hazard.sensorStatus) {
    case "current": {
      const age = Date.parse(input.now) - Date.parse(hazard.observedAt);
      return age < 0 || age > input.policy.sensorStaleAfterMs;
    }
    case "disconnected":
    case "stale":
      return true;
    case "not-applicable":
      return false;
    default:
      return unreachable(hazard.sensorStatus);
  }
}

function highestPriority(hazards: readonly Hazard[]): Priority {
  return (
    [...hazards].sort((a, b) => PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority])[0]
      ?.priority ?? "low"
  );
}

export function evaluateWorkerPlan(input: WorkerPlanInput): EngineDecision {
  const plannedRoute = input.plannedRoute ?? input.worker.currentGuidance?.waypoints ?? [];
  const active = input.hazards
    .filter(
      (hazard) =>
        (hazard.active || sensorUnknown(hazard, input)) && hazard.floorId === input.map.floorId,
    )
    .map((hazard) => ({ ...hazard, active: true }));
  const affected = active.filter((hazard) => {
    const exposure = assessExposure(input.worker.position, plannedRoute, [hazard]);
    return (
      exposure.current ||
      exposure.plannedRoute ||
      hazard.affectedWorkerIds.includes(input.worker.workerId)
    );
  });
  const types = new Set(affected.map((hazard) => hazard.hazardType));
  if (types.has("fire") && types.has("gas")) types.add("combined");
  const responses = input.policy.responses
    .filter((response) => types.has(response.hazardType))
    .sort((a, b) => b.priority - a.priority || a.hazardType.localeCompare(b.hazardType));
  const selected = responses[0];
  const hazardType: HazardType = types.has("combined")
    ? "combined"
    : (selected?.hazardType ?? affected[0]?.hazardType ?? "position-unknown");
  const base: EngineDecision = {
    actionCode: "ALERT_HAZARD",
    hazardIds: affected.map((hazard) => hazard.hazardId).sort(),
    hazardType,
    priority: highestPriority(affected),
    route: null,
    destinationId: null,
    assistanceRequired:
      input.worker.profile.confirmedAt === null || requiresAssistance(input.worker.profile),
    reasonCode: "no-exposure",
    exposure: assessExposure(input.worker.position, plannedRoute, affected),
  };
  if (!knownPosition(input))
    return {
      ...base,
      actionCode: "POSITION_UNKNOWN",
      hazardType: "position-unknown",
      assistanceRequired: true,
      reasonCode: "position-unknown",
    };
  if (types.has("position-unknown"))
    return {
      ...base,
      actionCode: "POSITION_UNKNOWN",
      hazardType: "position-unknown",
      assistanceRequired: true,
      reasonCode: "equipment-position-unknown",
    };
  if (types.has("sensor-unknown") || affected.some((hazard) => sensorUnknown(hazard, input))) {
    return {
      ...base,
      actionCode: "SENSOR_UNKNOWN",
      assistanceRequired: true,
      reasonCode: "sensor-unknown",
    };
  }
  if (affected.length === 0) {
    return input.closedEdgeIds.length > 0
      ? { ...base, actionCode: "AWAIT_REOPEN_AUTHORIZATION", reasonCode: "passage-awaiting-reopen" }
      : base;
  }
  if (!selected)
    return {
      ...base,
      actionCode: "ROUTE_UNAVAILABLE",
      assistanceRequired: true,
      reasonCode: "policy-unavailable",
    };
  const conflicts = responses.some(
    (response) =>
      response.priority === selected.priority &&
      (response.strategy !== selected.strategy ||
        [...response.destinationIds].sort().join() !== [...selected.destinationIds].sort().join()),
  );
  if (conflicts)
    return {
      ...base,
      actionCode: "ROUTE_UNAVAILABLE",
      assistanceRequired: true,
      reasonCode: "policy-conflict",
    };
  switch (selected.strategy) {
    case "shelter":
      return { ...base, actionCode: "SHELTER_PER_SCENARIO", reasonCode: "scenario-shelter" };
    case "evacuate":
    case "designated-space": {
      const route = routeWorker({
        map: input.map,
        position: input.worker.position,
        profile: input.worker.profile,
        hazards: active,
        closedEdgeIds: input.closedEdgeIds,
        destinationIds: selected.destinationIds,
      });
      switch (route.kind) {
        case "unavailable":
          return {
            ...base,
            actionCode: "ROUTE_UNAVAILABLE",
            assistanceRequired: true,
            reasonCode: route.reason,
          };
        case "valid":
          return {
            ...base,
            actionCode: "FOLLOW_VALIDATED_ROUTE",
            route,
            destinationId: route.destinationId,
            assistanceRequired: route.assistanceRequired,
            reasonCode: selected.strategy,
          };
        default:
          return unreachable(route);
      }
    }
    default:
      return unreachable(selected.strategy);
  }
}
