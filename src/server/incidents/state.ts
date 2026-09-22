import type { AuditEvent, Incident, SimulationSnapshot } from "@/contracts";
import { AuthenticationError } from "../auth/types";
import { type IncidentContext, IncidentTransitionError } from "./types";

export function requireLiveSession(context: IncidentContext): void {
  if (Date.parse(context.session.expiresAt) <= Date.parse(context.now)) {
    throw new AuthenticationError("UNAUTHENTICATED", "Session expired");
  }
}

export function currentIncident(snapshot: SimulationSnapshot, incidentId: string): Incident {
  const incident = snapshot.incidents.find((candidate) => candidate.incidentId === incidentId);
  if (incident === undefined)
    throw new IncidentTransitionError("NOT_FOUND", "Incident was not found");
  if (incident.runId !== snapshot.run.runId)
    throw new IncidentTransitionError("CONFLICT", "Incident belongs to an older run");
  if (incident.status === "closed")
    throw new IncidentTransitionError("INVALID_TRANSITION", "Incident is closed");
  return incident;
}

export function recordIncident(
  snapshot: SimulationSnapshot,
  incident: Incident,
  event: AuditEvent,
): SimulationSnapshot {
  const updated = { ...incident, version: incident.version + 1, audit: [...incident.audit, event] };
  return {
    ...snapshot,
    incidents: snapshot.incidents.map((candidate) =>
      candidate.incidentId === incident.incidentId ? updated : candidate,
    ),
    events: [...snapshot.events, event],
  };
}
