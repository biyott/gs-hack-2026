import type { Guidance, Incident, Priority, SimulationSnapshot, WorkerState } from "@/contracts";

export type AlertObservation = {
  readonly id: string;
  readonly priority: Priority;
  readonly signature: string;
  readonly message: string;
  readonly expiresAt: number;
  readonly primaryLineages?: Readonly<Record<string, string>>;
};
export type Announcement = AlertObservation & { readonly reason: "new" | "changed" | "escalated" };
const rank: Readonly<Record<Priority, number>> = { critical: 4, high: 3, medium: 2, low: 1 };

function guidanceIsEligible(
  guide: Guidance,
  snapshot: SimulationSnapshot,
  incident: Incident,
  worker: WorkerState | undefined,
  now: number,
): boolean {
  return (
    worker !== undefined &&
    guide.workerId === worker.workerId &&
    guide.profileVersion === worker.profile.version &&
    guide.incidentId === incident.incidentId &&
    incident.runId === snapshot.run.runId &&
    guide.runId === snapshot.run.runId &&
    guide.simulationMode === snapshot.mode &&
    guide.mapId === snapshot.run.mapId &&
    guide.mapVersion === snapshot.run.mapVersion &&
    Date.parse(guide.expiresAt) > now
  );
}

export class AlertLedger {
  private runId: string | null = null;
  private seen = new Map<string, AlertObservation>();

  update(runId: string, observations: readonly AlertObservation[]): readonly Announcement[] {
    const baseline = this.runId === null || this.runId !== runId;
    this.runId = runId;
    if (baseline) {
      this.seen = new Map(observations.map((item) => [item.id, item]));
      return [];
    }
    const announcements: Announcement[] = [];
    for (const observation of observations) {
      const previous = this.seen.get(observation.id);
      this.seen.set(observation.id, {
        ...observation,
        ...(observation.primaryLineages && {
          primaryLineages: { ...previous?.primaryLineages, ...observation.primaryLineages },
        }),
      });
      if (!previous) announcements.push({ ...observation, reason: "new" });
      else if (rank[observation.priority] > rank[previous.priority])
        announcements.push({ ...observation, reason: "escalated" });
      else if (
        previous.signature !== observation.signature &&
        (!observation.primaryLineages ||
          Object.entries(observation.primaryLineages).some(
            ([workerId, lineage]) => previous.primaryLineages?.[workerId] !== lineage,
          ))
      )
        announcements.push({ ...observation, reason: "changed" });
    }
    return announcements.sort((a, b) => rank[b.priority] - rank[a.priority]);
  }
}

export function alertObservations(
  snapshot: SimulationSnapshot,
  now = Date.now(),
): readonly AlertObservation[] {
  const observedNow = Math.max(now, Date.parse(snapshot.run.updatedAt));
  const incidents = snapshot.incidents
    .filter((incident) => incident.status === "active")
    .flatMap((incident) => {
      const guidance = incident.currentGuidance.filter((item) =>
        guidanceIsEligible(
          item,
          snapshot,
          incident,
          snapshot.workers.find((worker) => worker.workerId === item.workerId),
          observedNow,
        ),
      );
      if (guidance.length === 0) return [];
      return [
        {
          id: incident.incidentId,
          priority: incident.priority,
          signature: JSON.stringify(
            guidance.map((item) => [item.workerId, item.guidanceId, item.primaryGuidanceVersion]),
          ),
          primaryLineages: Object.fromEntries(
            guidance.map((item) => [
              item.workerId,
              JSON.stringify([item.guidanceId, item.primaryGuidanceVersion]),
            ]),
          ),
          expiresAt: Math.min(...guidance.map((item) => Date.parse(item.expiresAt))),
          message: `현장 위험 안내. ${guidance.length}명에게 ${guidance.some((item) => item.actionCode === "ROUTE_UNAVAILABLE") ? "경로 없음과 지원 요청" : "현재 행동"} 안내를 전송했습니다. 작업자 대응을 확인하세요.`,
        },
      ];
    });
  const help = snapshot.workers.flatMap((worker) => {
    const guide = worker.currentGuidance;
    if (!worker.response.helpRequestedAt || !guide) return [];
    const eligible = snapshot.incidents.some(
      (incident) =>
        guidanceIsEligible(guide, snapshot, incident, worker, observedNow) &&
        incident.currentGuidance.some(
          (current) =>
            current.workerId === worker.workerId &&
            current.guidanceId === guide.guidanceId &&
            current.guidanceVersion === guide.guidanceVersion,
        ) &&
        incident.status !== "closed" &&
        (incident.supportStatus === "none" || incident.supportStatus === "requested"),
    );
    return eligible
      ? [
          {
            id: `${guide.incidentId}:help:${worker.workerId}`,
            priority: "critical" as const,
            signature: worker.response.helpRequestedAt,
            expiresAt: Date.parse(guide.expiresAt),
            message: `${worker.workerId} 작업자가 도움을 요청했습니다. 지원 담당자를 배정해 주세요.`,
          },
        ]
      : [];
  });
  return [...incidents, ...help];
}
