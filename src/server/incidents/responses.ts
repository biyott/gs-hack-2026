import type {
  AuditEvent,
  Point,
  ResponseState,
  SimulationSnapshot,
  WorkerResponse,
} from "@/contracts";
import { requireWorker } from "../auth/authorize";
import { currentIncident, recordIncident, requireLiveSession } from "./state";
import {
  assertNever,
  type IncidentOutcome,
  IncidentTransitionError,
  type WorkerResponseContext,
} from "./types";

const primaryVoiceResponses: ReadonlySet<WorkerResponse["response"]> = new Set([
  "voice-started",
  "voice-completed",
  "voice-failed",
  "voice-unsupported",
]);

export function applyWorkerResponse(
  snapshot: SimulationSnapshot,
  response: WorkerResponse,
  context: WorkerResponseContext,
): IncidentOutcome {
  requireWorker(context.session, response.workerId);
  requireLiveSession(context);
  if (response.mode !== snapshot.mode || response.runId !== snapshot.run.runId) {
    throw new IncidentTransitionError("STALE_GUIDANCE", "Response belongs to another mode or run");
  }
  const incident = currentIncident(snapshot, response.incidentId);
  const worker = snapshot.workers.find((candidate) => candidate.workerId === response.workerId);
  if (worker === undefined) throw new IncidentTransitionError("NOT_FOUND", "Worker was not found");
  const guidance = worker.currentGuidance;
  if (guidance === null)
    throw new IncidentTransitionError("STALE_GUIDANCE", "Worker has no current guidance");
  const versionMatches =
    guidance.guidanceVersion === response.guidanceVersion ||
    (guidance.updateKind === "supplement" &&
      guidance.primaryGuidanceVersion === response.guidanceVersion &&
      primaryVoiceResponses.has(response.response));
  if (
    guidance.guidanceId !== response.guidanceId ||
    !versionMatches ||
    guidance.workerId !== worker.workerId ||
    guidance.incidentId !== incident.incidentId ||
    guidance.runId !== snapshot.run.runId ||
    guidance.simulationMode !== snapshot.mode ||
    guidance.mapId !== snapshot.run.mapId ||
    guidance.mapVersion !== snapshot.run.mapVersion ||
    guidance.profileVersion !== worker.profile.version ||
    Date.parse(guidance.expiresAt) <= Date.parse(context.now)
  ) {
    throw new IncidentTransitionError(
      "STALE_GUIDANCE",
      "Response does not reference current valid guidance",
    );
  }
  const current = incident.currentGuidance.find(
    (candidate) => candidate.workerId === worker.workerId,
  );
  if (
    current?.guidanceId !== guidance.guidanceId ||
    current.guidanceVersion !== guidance.guidanceVersion
  ) {
    throw new IncidentTransitionError("STALE_GUIDANCE", "Incident guidance has changed");
  }
  let state: ResponseState;
  let updatedIncident = incident;
  switch (response.response) {
    case "received":
      state = { ...worker.response, receivedAt: worker.response.receivedAt ?? response.occurredAt };
      break;
    case "displayed":
      state = {
        ...worker.response,
        displayedAt: worker.response.displayedAt ?? response.occurredAt,
      };
      break;
    case "voice-started":
      state = worker.response;
      if (state.voiceStatus === "pending" || state.voiceStatus === "playing") {
        const stopRequested =
          state.voiceStopRequestedAt != null || snapshot.run.status !== "running";
        state = stopRequested
          ? {
              ...state,
              voiceStatus: "stop-requested",
              voiceStopRequestedAt: state.voiceStopRequestedAt ?? context.now,
            }
          : { ...state, voiceStatus: "playing" };
      }
      break;
    case "voice-completed":
      state = {
        ...worker.response,
        spokenAt: worker.response.spokenAt ?? response.occurredAt,
        voiceStatus: "completed",
      };
      break;
    case "voice-failed":
      state = { ...worker.response, voiceStatus: "failed" };
      break;
    case "voice-unsupported":
      state = { ...worker.response, voiceStatus: "unsupported" };
      break;
    case "understood":
      state = {
        ...worker.response,
        understoodAt: worker.response.understoodAt ?? response.occurredAt,
      };
      break;
    case "help-requested":
      state = {
        ...worker.response,
        helpRequestedAt: worker.response.helpRequestedAt ?? response.occurredAt,
      };
      updatedIncident = {
        ...incident,
        supportStatus: incident.supportStatus === "none" ? "requested" : incident.supportStatus,
      };
      break;
    case "arrived": {
      let target: Point | null | undefined;
      switch (guidance.actionCode) {
        case "FOLLOW_VALIDATED_ROUTE":
          target = guidance.waypoints.at(-1);
          break;
        case "CONFIRM_ARRIVAL":
          target = context.arrivalTargets[worker.workerId];
          break;
        case "ALERT_HAZARD":
        case "GUIDANCE_UPDATED":
        case "ROUTE_UNAVAILABLE":
        case "POSITION_UNKNOWN":
        case "SENSOR_UNKNOWN":
        case "REQUEST_ASSISTANCE":
        case "SHELTER_PER_SCENARIO":
        case "CONFIRM_UNDERSTANDING":
        case "AWAIT_REOPEN_AUTHORIZATION":
          target = null;
          break;
        default:
          return assertNever(guidance.actionCode);
      }
      if (
        target === null ||
        target === undefined ||
        worker.positionStatus !== "known" ||
        worker.position === null ||
        Math.hypot(worker.position.x - target.x, worker.position.y - target.y) >
          context.arrivalToleranceM
      ) {
        throw new IncidentTransitionError(
          "ARRIVAL_UNVERIFIED",
          "Current worker position does not confirm arrival at the current destination",
        );
      }
      state = { ...worker.response, arrivedAt: worker.response.arrivedAt ?? response.occurredAt };
      break;
    }
    default:
      return assertNever(response.response);
  }
  const event: AuditEvent = {
    eventId: JSON.stringify(["worker", snapshot.run.runId, response.workerId, response.requestId]),
    incidentId: incident.incidentId,
    runId: snapshot.run.runId,
    kind: `worker.${response.response}`,
    actorId: context.session.actorId,
    occurredAt: context.now,
    version: incident.version + 1,
    detail: JSON.stringify({
      requestId: response.requestId,
      workerId: response.workerId,
      guidanceId: response.guidanceId,
      guidanceVersion: response.guidanceVersion,
      responseAt: response.occurredAt,
      detail: response.detail,
    }),
  };
  const workers = snapshot.workers.map((candidate) =>
    candidate.workerId === worker.workerId ? { ...worker, response: state } : candidate,
  );
  return {
    snapshot: recordIncident({ ...snapshot, workers }, updatedIncident, event),
    refreshWorkerIds: [],
  };
}
