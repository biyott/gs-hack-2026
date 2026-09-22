import type { CctvState, Hazard, Incident } from "@/contracts";

type CameraContext = {
  readonly cctv: readonly CctvState[];
  readonly hazards: readonly Hazard[];
  readonly incidents: readonly Incident[];
};

export function relatedCameraId(snapshot: CameraContext, incidentId: string | null): string | null {
  const incident = snapshot.incidents.find((candidate) => candidate.incidentId === incidentId);
  if (!incident) return null;
  const hazards = snapshot.hazards.filter((hazard) => incident.hazardIds.includes(hazard.hazardId));
  for (const status of ["connected", "stale", "disconnected"] as const) {
    const camera = snapshot.cctv.find(
      (candidate) =>
        candidate.status === status &&
        hazards.some(
          (hazard) =>
            hazard.zoneId !== null &&
            hazard.floorId === candidate.floorId &&
            candidate.zoneIds.includes(hazard.zoneId),
        ),
    );
    if (camera) return camera.cameraId;
  }
  return null;
}
