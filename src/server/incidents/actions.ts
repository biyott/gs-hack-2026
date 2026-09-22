import type {
  AuditEvent,
  Incident,
  IncidentAction,
  SessionRole,
  SimulationSnapshot,
} from "@/contracts";
import { requireRole } from "../auth/authorize";
import { AuthenticationError } from "../auth/types";
import { currentIncident, recordIncident, requireLiveSession } from "./state";
import {
  assertNever,
  type IncidentContext,
  type IncidentOutcome,
  IncidentTransitionError,
} from "./types";

const actionRoles = {
  acknowledge: ["admin", "operator"],
  assign: ["admin", "operator"],
  "accept-support": ["support"],
  "complete-support": ["support"],
  "field-check": ["admin", "operator"],
  "follow-up": ["admin", "operator"],
  "clear-hazard": ["admin"],
  "reopen-passage": ["admin"],
  close: ["admin"],
} as const satisfies Record<IncidentAction["action"], readonly SessionRole[]>;

export function applyIncidentAction(
  snapshot: SimulationSnapshot,
  action: IncidentAction,
  context: IncidentContext,
): IncidentOutcome {
  requireRole(context.session, actionRoles[action.action]);
  requireLiveSession(context);
  if (action.mode !== snapshot.mode)
    throw new IncidentTransitionError("MODE_MISMATCH", "Action belongs to another simulation mode");
  if (action.expectedVersion !== snapshot.run.version) {
    throw new IncidentTransitionError("CONFLICT", "Snapshot changed", snapshot.run.version);
  }
  const incident = currentIncident(snapshot, action.incidentId);
  if (action.expectedIncidentVersion !== incident.version) {
    throw new IncidentTransitionError("CONFLICT", "Incident changed", incident.version);
  }
  let updated: Incident;
  let refreshWorkerIds: readonly string[] = [];
  let hazards = snapshot.hazards;
  switch (action.action) {
    case "acknowledge":
      updated = { ...incident, acknowledgedAt: incident.acknowledgedAt ?? context.now };
      break;
    case "assign": {
      const assigneeId = action.assigneeId?.trim();
      if (!assigneeId)
        throw new IncidentTransitionError(
          "INVALID_TRANSITION",
          "An assignment requires a support actor",
        );
      updated = { ...incident, assignedTo: assigneeId, supportStatus: "assigned" };
      break;
    }
    case "accept-support":
    case "complete-support": {
      if (incident.assignedTo !== context.session.actorId)
        throw new AuthenticationError("FORBIDDEN", "Support is assigned to another actor");
      const requiredStatus = action.action === "accept-support" ? "assigned" : "accepted";
      if (incident.supportStatus !== requiredStatus)
        throw new IncidentTransitionError(
          "INVALID_TRANSITION",
          `Support must be ${requiredStatus}`,
        );
      updated = {
        ...incident,
        supportStatus: action.action === "accept-support" ? "accepted" : "completed",
      };
      break;
    }
    case "field-check":
      updated = incident;
      break;
    case "follow-up":
      updated = incident;
      refreshWorkerIds = [
        ...new Set(incident.currentGuidance.map((guidance) => guidance.workerId)),
      ];
      break;
    case "clear-hazard":
      if (incident.status !== "active")
        throw new IncidentTransitionError("INVALID_TRANSITION", "Hazard is already cleared");
      updated = { ...incident, status: "cleared", hazardClearedAt: context.now };
      hazards = snapshot.hazards.map((hazard) =>
        incident.hazardIds.includes(hazard.hazardId) ? { ...hazard, active: false } : hazard,
      );
      refreshWorkerIds = [
        ...new Set(incident.currentGuidance.map((guidance) => guidance.workerId)),
      ];
      break;
    case "reopen-passage":
      if (
        incident.status !== "cleared" ||
        incident.hazardClearedAt === null ||
        incident.passageReopenedAt !== null
      ) {
        throw new IncidentTransitionError(
          "INVALID_TRANSITION",
          "Reopening requires a cleared hazard and a closed passage",
        );
      }
      updated = { ...incident, passageReopenedAt: context.now };
      refreshWorkerIds = [
        ...new Set(incident.currentGuidance.map((guidance) => guidance.workerId)),
      ];
      break;
    case "close":
      if (
        incident.status !== "cleared" ||
        incident.hazardClearedAt === null ||
        incident.passageReopenedAt === null
      ) {
        throw new IncidentTransitionError(
          "INVALID_TRANSITION",
          "Closing requires separate hazard clearance and reopening approval",
        );
      }
      updated = { ...incident, status: "closed", closedAt: context.now };
      break;
    default:
      return assertNever(action.action);
  }
  const event: AuditEvent = {
    eventId: JSON.stringify(["incident", snapshot.run.runId, action.requestId]),
    incidentId: incident.incidentId,
    runId: snapshot.run.runId,
    kind: `incident.${action.action}`,
    actorId: context.session.actorId,
    occurredAt: context.now,
    version: incident.version + 1,
    detail: JSON.stringify({
      requestId: action.requestId,
      assigneeId: action.assigneeId,
      note: action.note,
    }),
  };
  return { snapshot: recordIncident({ ...snapshot, hazards }, updated, event), refreshWorkerIds };
}
