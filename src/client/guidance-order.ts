import type { Guidance, SimulationSnapshot } from "@/contracts";

type GuidanceVersion = Pick<Guidance, "guidanceVersion" | "primaryGuidanceVersion">;
export type GuidanceWatermarks = ReadonlyMap<string, GuidanceVersion>;

function lineage(guide: Guidance): string {
  return JSON.stringify([guide.runId, guide.workerId, guide.guidanceId]);
}

function regresses(guide: Guidance, marks: GuidanceWatermarks): boolean {
  const previous = marks.get(lineage(guide));
  return (
    previous !== undefined &&
    (guide.guidanceVersion < previous.guidanceVersion ||
      guide.primaryGuidanceVersion < previous.primaryGuidanceVersion)
  );
}

export function quarantineGuidance(
  snapshot: SimulationSnapshot,
  previous: GuidanceWatermarks,
): { snapshot: SimulationSnapshot; watermarks: GuidanceWatermarks } {
  let watermarks = previous;
  const candidates: Guidance[] = [];
  for (const worker of snapshot.workers) {
    if (worker.currentGuidance?.workerId === worker.workerId)
      candidates.push(worker.currentGuidance);
  }
  for (const incident of snapshot.incidents) {
    for (const guide of incident.currentGuidance) {
      if (
        guide.incidentId === incident.incidentId &&
        incident.runId === snapshot.run.runId &&
        snapshot.workers.some((worker) => worker.workerId === guide.workerId)
      )
        candidates.push(guide);
    }
  }
  const copies = new Map<string, GuidanceVersion>();
  const conflicts = new Set<string>();
  for (const guide of candidates) {
    const copy = copies.get(lineage(guide));
    if (
      copy &&
      (copy.guidanceVersion !== guide.guidanceVersion ||
        copy.primaryGuidanceVersion !== guide.primaryGuidanceVersion)
    )
      conflicts.add(lineage(guide));
    copies.set(lineage(guide), guide);
  }
  const observe = (guide: Guidance) => {
    if (
      conflicts.has(lineage(guide)) ||
      guide.runId !== snapshot.run.runId ||
      guide.simulationMode !== snapshot.mode ||
      guide.mapId !== snapshot.run.mapId ||
      guide.mapVersion !== snapshot.run.mapVersion ||
      regresses(guide, watermarks)
    )
      return;
    const prior = watermarks.get(lineage(guide));
    if (
      prior?.guidanceVersion === guide.guidanceVersion &&
      prior.primaryGuidanceVersion === guide.primaryGuidanceVersion
    )
      return;
    watermarks = new Map(watermarks).set(lineage(guide), {
      guidanceVersion: guide.guidanceVersion,
      primaryGuidanceVersion: guide.primaryGuidanceVersion,
    });
  };
  for (const guide of candidates) observe(guide);
  const quarantined = (guide: Guidance) =>
    conflicts.has(lineage(guide)) || regresses(guide, watermarks);
  let changed = false;
  const workers = snapshot.workers.map((worker) => {
    if (!worker.currentGuidance || !quarantined(worker.currentGuidance)) return worker;
    changed = true;
    return { ...worker, currentGuidance: null };
  });
  const incidents = snapshot.incidents.map((incident) => {
    const currentGuidance = incident.currentGuidance.filter((guide) => !quarantined(guide));
    if (currentGuidance.length === incident.currentGuidance.length) return incident;
    changed = true;
    return { ...incident, currentGuidance };
  });
  return { snapshot: changed ? { ...snapshot, workers, incidents } : snapshot, watermarks };
}
