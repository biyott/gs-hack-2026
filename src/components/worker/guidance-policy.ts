import type {
  Guidance,
  SimulationSnapshot,
  SiteMap,
  WorkerResponse,
  WorkerState,
} from "@/contracts";

export type GuidanceScope = Pick<
  Guidance,
  "workerId" | "runId" | "simulationMode" | "mapId" | "mapVersion" | "floorId" | "profileVersion"
>;
type TimedGuidanceScope = GuidanceScope & Pick<Guidance, "expiresAt">;
type PrimaryIdentity = Pick<
  Guidance,
  "guidanceId" | "primaryGuidanceVersion" | "runId" | "simulationMode" | "workerId"
>;
const voiceResponses: ReadonlySet<WorkerResponse["response"]> = new Set([
  "voice-started",
  "voice-completed",
  "voice-failed",
  "voice-unsupported",
]);

export function responseGuidanceVersion(
  captured: Pick<Guidance, "guidanceVersion" | "primaryGuidanceVersion">,
  current: Pick<Guidance, "guidanceVersion">,
  response: WorkerResponse["response"],
): number | null {
  if (voiceResponses.has(response)) return captured.primaryGuidanceVersion;
  return captured.guidanceVersion === current.guidanceVersion ? captured.guidanceVersion : null;
}

export function guidanceIsCurrent(
  guidance: TimedGuidanceScope,
  scope: GuidanceScope,
  now: number,
): boolean {
  return (
    guidance.workerId === scope.workerId &&
    guidance.runId === scope.runId &&
    guidance.simulationMode === scope.simulationMode &&
    guidance.mapId === scope.mapId &&
    guidance.mapVersion === scope.mapVersion &&
    guidance.floorId === scope.floorId &&
    guidance.profileVersion === scope.profileVersion &&
    Date.parse(guidance.expiresAt) > now
  );
}

export function samePrimaryGuidance(previous: PrimaryIdentity, current: PrimaryIdentity): boolean {
  return (
    previous.guidanceId === current.guidanceId &&
    previous.primaryGuidanceVersion === current.primaryGuidanceVersion &&
    previous.runId === current.runId &&
    previous.simulationMode === current.simulationMode &&
    previous.workerId === current.workerId
  );
}

export function currentWorkerGuidance(
  snapshot: SimulationSnapshot,
  worker: WorkerState,
  map: SiteMap,
  now: number,
): Guidance | null {
  const guidance = worker.currentGuidance;
  if (!guidance || snapshot.run.mapId !== map.mapId || snapshot.run.mapVersion !== map.mapVersion)
    return null;
  const scope = {
    workerId: worker.workerId,
    runId: snapshot.run.runId,
    simulationMode: snapshot.mode,
    mapId: map.mapId,
    mapVersion: map.mapVersion,
    floorId: map.floorId,
    profileVersion: worker.profile.version,
  };
  if (!guidanceIsCurrent(guidance, scope, now)) return null;
  const incident = snapshot.incidents.find(
    (item) => item.incidentId === guidance.incidentId && item.runId === snapshot.run.runId,
  );
  const incidentGuidance = incident?.currentGuidance.find(
    (item) => item.workerId === worker.workerId,
  );
  return incident?.status !== "closed" &&
    incidentGuidance?.guidanceId === guidance.guidanceId &&
    incidentGuidance.guidanceVersion === guidance.guidanceVersion
    ? guidance
    : null;
}
