import type { Incident, Priority } from "@/contracts";
import type { CameraMode } from "./geometry";

type CameraIncident = Readonly<Pick<Incident, "incidentId" | "priority" | "status">> & {
  readonly hazardIds: readonly string[];
};
export type CameraNotice = {
  readonly incidentId: string;
  readonly priority: Priority;
  readonly frame: boolean;
};
const ranks: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
export type CameraEventMemory = { readonly scope: string; readonly keys: readonly string[] };

export function cameraScopeKey(streamId: string, runId: string): string {
  return JSON.stringify([streamId, runId]);
}

export function cameraEventTransition(
  memory: CameraEventMemory,
  scope: string,
  incidents: readonly CameraIncident[],
  mode: CameraMode,
) {
  const scopeChanged = memory.scope !== scope;
  const keys = scopeChanged ? [] : memory.keys;
  return {
    scopeChanged,
    event: cameraEventDecision(keys, incidents, scopeChanged ? "full" : mode),
    memory: {
      scope,
      keys: [
        ...new Set([
          ...keys,
          ...incidents.filter((incident) => incident.status === "active").map(incidentCameraKey),
        ]),
      ],
    },
  };
}

export function prioritizeCameraNotice(
  current: CameraNotice | null,
  incoming: CameraNotice,
): CameraNotice {
  if (!current || current.frame || incoming.frame) return incoming;
  const order =
    ranks[current.priority] - ranks[incoming.priority] ||
    current.incidentId.localeCompare(incoming.incidentId);
  return order <= 0 ? current : incoming;
}

export function cameraEventDecision(
  seen: readonly string[],
  incidents: readonly CameraIncident[],
  mode: CameraMode,
): CameraNotice | null {
  const incident = incidents
    .filter((entry) => entry.status === "active" && !seen.includes(incidentCameraKey(entry)))
    .sort(
      (a, b) => ranks[a.priority] - ranks[b.priority] || a.incidentId.localeCompare(b.incidentId),
    )[0];
  if (!incident) return null;
  return {
    incidentId: incident.incidentId,
    priority: incident.priority,
    frame: mode === "full" || mode === "risk",
  };
}

export function incidentCameraKey(incident: CameraIncident): string {
  return `${incident.incidentId}:${[...incident.hazardIds].sort().join("|")}`;
}
