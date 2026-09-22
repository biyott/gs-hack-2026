import { z } from "zod";
import {
  type Guidance,
  type Point,
  PointSchema,
  type SimulationSnapshot,
  type WorkerState,
} from "@/contracts";
import { type EngineDecision, routeWorker } from "../engine";
import type { EvaluationContext } from "./evaluate";
import { retainNonMovementDecision } from "./guidance-recovery";

export const ArrivalIntentSchema = z.object({
  runId: z.string(),
  incidentId: z.string(),
  guidanceId: z.string(),
  mapId: z.string(),
  mapVersion: z.string(),
  destinationId: z.string(),
  target: PointSchema,
});

export type ArrivalIntent = z.infer<typeof ArrivalIntentSchema>;
export type ArrivalIntents = Record<string, ArrivalIntent>;

export function unexposedPassageRestriction(decision: EngineDecision): boolean {
  return (
    decision.actionCode === "AWAIT_REOPEN_AUTHORIZATION" &&
    decision.reasonCode === "passage-awaiting-reopen" &&
    decision.hazardIds.length === 0 &&
    !decision.exposure.current &&
    !decision.exposure.plannedRoute &&
    decision.route === null &&
    decision.destinationId === null
  );
}

function samePoint(left: Point | null | undefined, right: Point): boolean {
  return left?.x === right.x && left.y === right.y;
}

function boundIntent(guidance: Guidance, target: Point, destinationId: string): ArrivalIntent {
  return {
    runId: guidance.runId,
    incidentId: guidance.incidentId,
    guidanceId: guidance.guidanceId,
    mapId: guidance.mapId,
    mapVersion: guidance.mapVersion,
    destinationId,
    target: { x: target.x, y: target.y },
  };
}

export function currentArrivalIntent(
  intent: ArrivalIntent | undefined,
  worker: WorkerState,
  snapshot: SimulationSnapshot,
  latestTarget: Point | null | undefined,
): ArrivalIntent | null {
  const guidance = worker.currentGuidance;
  if (
    !intent ||
    !guidance ||
    guidance.workerId !== worker.workerId ||
    intent.runId !== snapshot.run.runId ||
    intent.runId !== guidance.runId ||
    intent.incidentId !== guidance.incidentId ||
    intent.guidanceId !== guidance.guidanceId ||
    intent.mapId !== snapshot.run.mapId ||
    intent.mapId !== guidance.mapId ||
    intent.mapVersion !== snapshot.run.mapVersion ||
    intent.mapVersion !== guidance.mapVersion ||
    !samePoint(latestTarget, intent.target)
  )
    return null;
  const incident = snapshot.incidents.find((entry) => entry.incidentId === intent.incidentId);
  return incident &&
    incident.runId === snapshot.run.runId &&
    incident.status !== "closed" &&
    incident.currentGuidance.some(
      (entry) =>
        entry.workerId === worker.workerId &&
        entry.guidanceId === guidance.guidanceId &&
        entry.guidanceVersion === guidance.guidanceVersion,
    )
    ? intent
    : null;
}

export function rememberArrivalIntents(
  snapshot: SimulationSnapshot,
  targets: Readonly<Record<string, Point | null>>,
  intents: ArrivalIntents,
): void {
  for (const worker of snapshot.workers) {
    const guidance = worker.currentGuidance;
    const target = guidance?.waypoints.at(-1);
    const candidate =
      guidance?.actionCode === "FOLLOW_VALIDATED_ROUTE" && target && guidance.destinationId
        ? boundIntent(guidance, target, guidance.destinationId)
        : intents[worker.workerId];
    const valid = currentArrivalIntent(candidate, worker, snapshot, targets[worker.workerId]);
    if (valid) intents[worker.workerId] = valid;
    else delete intents[worker.workerId];
  }
}

/** Legacy confirmation can be recovered only from the exact restored target, never first history. */
export function restoreLegacyArrivalIntents(
  snapshot: SimulationSnapshot,
  targets: Readonly<Record<string, Point | null>>,
  intents: ArrivalIntents,
  context: Pick<EvaluationContext, "map">,
): void {
  for (const worker of snapshot.workers) {
    const guidance = worker.currentGuidance;
    const target = targets[worker.workerId];
    if (guidance?.actionCode !== "CONFIRM_ARRIVAL" || !target) continue;
    const destinations = context.map.nodes.filter((node) => samePoint(node, target));
    const destination = destinations.length === 1 ? destinations[0] : undefined;
    if (destination) intents[worker.workerId] = boundIntent(guidance, target, destination.id);
  }
  rememberArrivalIntents(snapshot, targets, intents);
}

export function applyArrivalIntent(
  decision: EngineDecision,
  worker: WorkerState,
  snapshot: SimulationSnapshot,
  context: EvaluationContext,
  recovered: boolean,
  selectedIncidentId: string | null,
): EngineDecision {
  const previous = worker.currentGuidance;
  const intent = currentArrivalIntent(
    context.arrivalIntents[worker.workerId],
    worker,
    snapshot,
    context.arrivalTargets[worker.workerId],
  );
  const age =
    worker.lastObservedAt === null
      ? Infinity
      : Date.parse(context.now) - Date.parse(worker.lastObservedAt);
  if (
    !previous ||
    !intent ||
    selectedIncidentId !== intent.incidentId ||
    worker.positionStatus !== "known" ||
    !worker.position ||
    age < 0 ||
    age > context.policy.positionStaleAfterMs ||
    !Number.isFinite(age)
  )
    return decision;
  const noExposure = decision.reasonCode === "no-exposure";
  const passageRestriction = unexposedPassageRestriction(decision);
  const authoritativeTarget =
    decision.actionCode === "FOLLOW_VALIDATED_ROUTE" &&
    decision.destinationId === intent.destinationId &&
    samePoint(decision.route?.waypoints.at(-1), intent.target);
  if ((!noExposure && !authoritativeTarget && !passageRestriction) || decision.exposure.current)
    return decision;
  const priorBlocker =
    previous.actionCode === "POSITION_UNKNOWN" ||
    previous.actionCode === "SENSOR_UNKNOWN" ||
    previous.actionCode === "ROUTE_UNAVAILABLE";
  if (priorBlocker && !recovered) {
    if (passageRestriction)
      return retainNonMovementDecision(previous, decision, snapshot) ?? decision;
    if (noExposure) return decision;
  }
  const arrived =
    Math.hypot(worker.position.x - intent.target.x, worker.position.y - intent.target.y) <=
    context.policy.arrivalToleranceM;
  if (arrived) {
    if (passageRestriction) {
      const route = routeWorker({
        map: context.map,
        position: worker.position,
        profile: worker.profile,
        hazards: snapshot.hazards,
        closedEdgeIds: snapshot.closedEdgeIds,
        destinationIds: [intent.destinationId],
      });
      if (
        route.kind !== "valid" ||
        route.destinationId !== intent.destinationId ||
        !samePoint(route.waypoints.at(-1), intent.target)
      )
        return decision;
    }
    return {
      ...decision,
      actionCode: "CONFIRM_ARRIVAL",
      hazardType: decision.hazardIds.length === 0 ? previous.hazardType : decision.hazardType,
      route: null,
      destinationId: null,
      reasonCode: "destination-reached",
    };
  }
  if (noExposure && previous.actionCode === "CONFIRM_ARRIVAL")
    return {
      ...decision,
      actionCode: "GUIDANCE_UPDATED",
      hazardType: previous.hazardType,
      route: null,
      destinationId: null,
      reasonCode: "risk-context-recalculated",
    };
  return decision;
}
