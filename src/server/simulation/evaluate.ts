import { randomUUID } from "node:crypto";
import type {
  AuditEvent,
  Guidance,
  Incident,
  Point,
  SimulationSnapshot,
  SiteMap,
} from "@/contracts";
import { type EngineDecision, evaluateWorkerPlan } from "../engine";
import { createGuidance } from "../guidance";
import type { ResponsePolicy } from "../scenarios";
import {
  type ArrivalIntents,
  applyArrivalIntent,
  unexposedPassageRestriction,
} from "./arrival-intent";
import { nonMovementCauseResolved, retainNonMovementDecision } from "./guidance-recovery";
import { relatesToIncident } from "./incident-scope";
import { emptyResponse } from "./snapshots";

export type EvaluationContext = Readonly<{
  map: SiteMap;
  policy: ResponsePolicy;
  now: string;
  arrivalTargets: Readonly<Record<string, Point | null>>;
  arrivalIntents: Readonly<ArrivalIntents>;
  forceWorkerIds: readonly string[];
  connectedRecipients: number;
}>;

function newIncident(snapshot: SimulationSnapshot, decision: EngineDecision): Incident {
  return {
    incidentId: randomUUID(),
    runId: snapshot.run.runId,
    version: 1,
    hazardIds: [...decision.hazardIds],
    hazardType: decision.hazardType,
    priority: decision.priority,
    status: "active",
    acknowledgedAt: null,
    assignedTo: null,
    supportStatus: "none",
    hazardClearedAt: null,
    passageReopenedAt: null,
    closedAt: null,
    firstGuidance: [],
    currentGuidance: [],
    audit: [],
  };
}

function routeIdentity(waypoints: Guidance["waypoints"]): string {
  return JSON.stringify(
    waypoints.map((point, index) =>
      index === 0 ? { nodeId: point.nodeId, floorId: point.floorId } : point,
    ),
  );
}

function decisionIncident(
  incidents: readonly Incident[],
  decision: EngineDecision,
  previous: Guidance | null,
): Incident | undefined {
  return [...incidents]
    .reverse()
    .find(
      (candidate) =>
        candidate.status !== "closed" &&
        (relatesToIncident(candidate, decision.hazardIds) ||
          (decision.hazardIds.length === 0 && candidate.incidentId === previous?.incidentId)),
    );
}

export function evaluateSnapshot(
  snapshot: SimulationSnapshot,
  context: EvaluationContext,
): SimulationSnapshot {
  const events = [...snapshot.events];
  const incidents = [...snapshot.incidents];
  const workers = snapshot.workers.map((worker) => {
    const previous = worker.currentGuidance;
    let decision = evaluateWorkerPlan({
      map: context.map,
      worker,
      hazards: snapshot.hazards,
      closedEdgeIds: snapshot.closedEdgeIds,
      policy: context.policy,
      now: context.now,
      plannedRoute: previous?.waypoints ?? [],
    });
    if (decision.reasonCode === "passage-awaiting-reopen" && previous === null) return worker;
    const recovered =
      (decision.reasonCode === "no-exposure" || unexposedPassageRestriction(decision)) &&
      previous !== null &&
      nonMovementCauseResolved(previous, worker, snapshot, context);
    decision = applyArrivalIntent(
      decision,
      worker,
      snapshot,
      context,
      recovered,
      decisionIncident(incidents, decision, previous)?.incidentId ?? null,
    );
    if (
      decision.reasonCode === "no-exposure" &&
      !recovered &&
      !context.forceWorkerIds.includes(worker.workerId)
    )
      return worker;
    if (decision.reasonCode === "no-exposure" && previous)
      decision = (!recovered && retainNonMovementDecision(previous, decision, snapshot)) || {
        ...decision,
        actionCode: "GUIDANCE_UPDATED",
        hazardType: previous.hazardType,
        reasonCode: "risk-context-recalculated",
      };
    if (decision.reasonCode === "no-exposure") return worker;
    let incident = decisionIncident(incidents, decision, previous);
    if (!incident) {
      incident = newIncident(snapshot, decision);
      incidents.push(incident);
    }
    const matchingRoute =
      previous?.destinationId === decision.destinationId &&
      routeIdentity(previous.waypoints) === routeIdentity([...(decision.route?.waypoints ?? [])]);
    const routeVersion = decision.route
      ? matchingRoute && previous?.routeVersion
        ? previous.routeVersion
        : (previous?.routeVersion ?? 0) + 1
      : null;
    const guidance = createGuidance(
      decision,
      {
        incidentId: incident.incidentId,
        eventId: randomUUID(),
        runId: snapshot.run.runId,
        simulationMode: snapshot.mode,
        mapId: snapshot.run.mapId,
        mapVersion: snapshot.run.mapVersion,
        floorId: context.map.floorId,
        routeVersion,
        stepId: decision.route?.waypoints[1]?.nodeId ?? null,
        generatedAt: context.now,
        expiresAt: new Date(Date.parse(context.now) + 60_000).toISOString(),
        profile: worker.profile,
        messageArgs: {
          geometryVersion: snapshot.equipment.geometryVersion,
          policyVersion: context.policy.version,
        },
        forceReissue: context.forceWorkerIds.includes(worker.workerId),
      },
      previous,
    );
    if (
      guidance.guidanceId === previous?.guidanceId &&
      guidance.guidanceVersion === previous.guidanceVersion
    )
      return worker;
    const audit: AuditEvent[] = ["guidance.generated", "guidance.transmission-attempt"].map(
      (kind) => ({
        eventId: randomUUID(),
        incidentId: incident?.incidentId ?? null,
        runId: snapshot.run.runId,
        kind,
        actorId: "engine",
        occurredAt: context.now,
        detail: JSON.stringify({
          workerId: worker.workerId,
          guidanceId: guidance.guidanceId,
          guidanceVersion: guidance.guidanceVersion,
          transport: "sse",
          connectedSubscriptions: context.connectedRecipients,
        }),
        version: incident?.version ?? 1,
      }),
    );
    incident = {
      ...incident,
      version: incident.version + 1,
      hazardIds: [...new Set([...incident.hazardIds, ...guidance.hazardIds])],
      hazardType: guidance.hazardIds.length === 0 ? incident.hazardType : guidance.hazardType,
      priority: guidance.hazardIds.length === 0 ? incident.priority : guidance.priority,
      firstGuidance: incident.firstGuidance.some((first) => first.workerId === worker.workerId)
        ? incident.firstGuidance
        : [...incident.firstGuidance, guidance],
      currentGuidance: [
        ...incident.currentGuidance.filter((current) => current.workerId !== worker.workerId),
        guidance,
      ],
      audit: [...incident.audit, ...audit],
    };
    const index = incidents.findIndex((candidate) => candidate.incidentId === incident?.incidentId);
    if (index >= 0) incidents[index] = incident;
    events.push(...audit);
    return {
      ...worker,
      currentGuidance: guidance,
      response: {
        ...emptyResponse(),
        helpRequestedAt:
          previous?.incidentId === guidance.incidentId ? worker.response.helpRequestedAt : null,
      },
    };
  });
  const hazards = snapshot.hazards.map((hazard) => ({
    ...hazard,
    affectedWorkerIds: workers
      .filter((worker) => worker.currentGuidance?.hazardIds.includes(hazard.hazardId))
      .map((worker) => worker.workerId),
  }));
  return { ...snapshot, workers, hazards, incidents, events };
}
