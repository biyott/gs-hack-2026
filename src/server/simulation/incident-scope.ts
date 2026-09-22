import type { Incident } from "@/contracts";

export function signalId(hazardId: string): string {
  return hazardId.startsWith("EQUIPMENT-A:") ? "EQUIPMENT-A" : hazardId;
}

export function relatesToIncident(incident: Incident, hazardIds: readonly string[]): boolean {
  const signals = new Set(incident.hazardIds.map(signalId));
  return hazardIds.some((hazardId) => signals.has(signalId(hazardId)));
}

export type ClosureOwners = Map<string, Set<string>>;

export function addClosureOwners(
  owners: ClosureOwners,
  pathIds: readonly string[],
  hazardIds: readonly string[],
): void {
  for (const pathId of pathIds) {
    const existing = owners.get(pathId) ?? new Set<string>();
    for (const hazardId of hazardIds) existing.add(signalId(hazardId));
    owners.set(pathId, existing);
  }
}

export function releaseIncidentClosures(owners: ClosureOwners, incident: Incident): string[] {
  const signals = new Set(incident.hazardIds.map(signalId));
  const released: string[] = [];
  for (const [pathId, controllingSignals] of owners) {
    for (const signal of signals) controllingSignals.delete(signal);
    if (controllingSignals.size === 0) {
      owners.delete(pathId);
      released.push(pathId);
    }
  }
  return released;
}
