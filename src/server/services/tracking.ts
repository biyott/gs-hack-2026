import { isDeepStrictEqual } from "node:util";
import type { Session, UwbParticipantRole, UwbPreparedRegistration } from "@/contracts";
import { ApiFault } from "../http/errors";
import { UwbPairingService } from "../tracking/pairing";
import { TrackingService } from "../tracking/service";

export type TrackingServices = Readonly<{
  tracking: TrackingService;
  pairing: UwbPairingService;
}>;

declare global {
  var gsSafetyTrackingServices: TrackingServices | undefined;
  var gsSafetyUwbSessionOwners: Map<UwbParticipantRole, string> | undefined;
  var gsSafetyUwbGenerations: Map<string, UwbPreparedRegistration> | undefined;
  var gsSafetyCctvSessionOwner: string | undefined;
  var gsSafetyUwbLatestSessions: Map<UwbParticipantRole, string> | undefined;
}

export function getTrackingServices(): TrackingServices {
  globalThis.gsSafetyTrackingServices ??= {
    tracking: new TrackingService(),
    pairing: new UwbPairingService(),
  };
  return globalThis.gsSafetyTrackingServices;
}

function owners(): Map<UwbParticipantRole, string> {
  globalThis.gsSafetyUwbSessionOwners ??= new Map();
  return globalThis.gsSafetyUwbSessionOwners;
}

function participantRole(session: Session): UwbParticipantRole | null {
  switch (session.deviceRole) {
    case "EQUIPMENT":
    case "WORKER_1":
    case "WORKER_2":
      return session.deviceRole;
    case "CCTV":
    case null:
      return null;
    default: {
      const exhaustive: never = session.deviceRole;
      return exhaustive;
    }
  }
}

export function activateTrackingSession(session: Session): void {
  if (session.deviceRole === "CCTV") {
    if (globalThis.gsSafetyCctvSessionOwner !== session.sessionId)
      getTrackingServices().tracking.invalidatePendingFrames();
    globalThis.gsSafetyCctvSessionOwner = session.sessionId;
    return;
  }
  const role = participantRole(session);
  if (role === null) return;
  globalThis.gsSafetyUwbLatestSessions ??= new Map();
  const previousSession = globalThis.gsSafetyUwbLatestSessions.get(role);
  if (previousSession !== undefined && previousSession !== session.sessionId)
    globalThis.gsSafetyUwbGenerations?.delete(previousSession);
  globalThis.gsSafetyUwbLatestSessions.set(role, session.sessionId);
  const owner = owners().get(role);
  if (owner !== undefined && owner !== session.sessionId) {
    getTrackingServices().pairing.unregister(role);
    owners().clear();
  }
}

export function invalidateTrackingSession(session: Session, generation?: number): void {
  if (session.deviceRole === "CCTV") {
    if (globalThis.gsSafetyCctvSessionOwner === session.sessionId) {
      getTrackingServices().tracking.invalidatePendingFrames();
      globalThis.gsSafetyCctvSessionOwner = undefined;
    }
    return;
  }
  if (
    generation !== undefined &&
    globalThis.gsSafetyUwbGenerations?.get(session.sessionId)?.generation !== generation
  )
    throw new ApiFault(
      409,
      "UWB_GENERATION_STALE",
      "Cleanup must match the current native preparation generation",
    );
  const role = participantRole(session);
  if (generation === undefined) {
    globalThis.gsSafetyUwbGenerations?.delete(session.sessionId);
    if (role !== null && globalThis.gsSafetyUwbLatestSessions?.get(role) === session.sessionId)
      globalThis.gsSafetyUwbLatestSessions.delete(role);
  }
  if (role !== null && owners().get(role) === session.sessionId) {
    getTrackingServices().pairing.unregister(role);
    owners().clear();
  }
}

export function registerUwbParticipant(session: Session, registration: UwbPreparedRegistration) {
  globalThis.gsSafetyUwbGenerations ??= new Map();
  const previousRegistration = globalThis.gsSafetyUwbGenerations.get(session.sessionId);
  if (
    previousRegistration !== undefined &&
    (registration.generation < previousRegistration.generation ||
      (registration.generation === previousRegistration.generation &&
        !isDeepStrictEqual(registration, previousRegistration)))
  )
    throw new ApiFault(
      409,
      "UWB_GENERATION_STALE",
      "Native preparation generation must not move backwards",
    );
  activateTrackingSession(session);
  const pairing = getTrackingServices().pairing;
  const previous = pairing.prepare();
  const result = pairing.register(registration);
  if (previous.status === "ready" && result.status !== "ready") owners().clear();
  owners().set(registration.role, session.sessionId);
  globalThis.gsSafetyUwbGenerations.set(session.sessionId, registration);
  return result;
}

export function participantConfig(session: Session, role: UwbParticipantRole) {
  if (owners().get(role) !== session.sessionId)
    throw new ApiFault(
      409,
      "UWB_PREPARATION_REQUIRED",
      "Prepare this authenticated device session before requesting UWB credentials",
    );
  return getTrackingServices().pairing.getConfig(role);
}

export function unregisterUwbParticipant(session: Session, generation: number | undefined) {
  const role = participantRole(session);
  if (role !== null && owners().get(role) === session.sessionId) {
    if (generation === undefined)
      throw new ApiFault(
        409,
        "UWB_GENERATION_REQUIRED",
        "Native cleanup requires its preparation generation",
      );
    invalidateTrackingSession(session, generation);
  }
  return getTrackingServices().pairing.prepare();
}
