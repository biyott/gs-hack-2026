import type { SimulationSnapshot } from "../../packages/contracts/src/state";

type Check = Readonly<{ name: string; passed: boolean }>;

export function freshPositionChecks(snapshot: SimulationSnapshot): readonly Check[] {
  const workers = snapshot.workers.filter(({ workerId }) =>
    ["WORKER-A", "WORKER-B"].includes(workerId),
  );
  return [
    {
      name: "measured-camera-positions-visible",
      passed:
        snapshot.run.positionInput === "measured" &&
        workers.length === 2 &&
        workers.every(
          (worker) =>
            worker.positionStatus === "known" &&
            worker.positionSource === "video" &&
            worker.positionInputSource === "synthetic",
        ),
    },
    {
      name: "measured-equipment-visible",
      passed:
        snapshot.equipment.positionStatus === "known" &&
        snapshot.equipment.positionSource === "video" &&
        snapshot.equipment.positionInputSource === "synthetic",
    },
  ];
}

export function workerRecoveryChecks(
  before: SimulationSnapshot,
  fresh: SimulationSnapshot,
): readonly Check[] {
  const priorWorker = before.workers.find(({ workerId }) => workerId === "WORKER-B");
  const prior = priorWorker?.currentGuidance;
  const routedWorker = before.workers.find(({ workerId }) => workerId === "WORKER-A");
  const worker = fresh.workers.find(({ workerId }) => workerId === "WORKER-B");
  const guidance = worker?.currentGuidance;
  const incident = before.incidents.find(({ incidentId }) => incidentId === prior?.incidentId);
  const recovered = fresh.incidents.find(({ incidentId }) => incidentId === guidance?.incidentId);
  return [
    {
      name: "recovery-baseline-has-worker-a-route-and-worker-b-unknown",
      passed:
        routedWorker?.positionStatus === "known" &&
        routedWorker.currentGuidance?.actionCode === "FOLLOW_VALIDATED_ROUTE" &&
        routedWorker.currentGuidance.waypoints.length > 0 &&
        priorWorker?.positionStatus === "unknown" &&
        priorWorker.position === null &&
        prior?.actionCode === "POSITION_UNKNOWN",
    },
    {
      name: "fresh-worker-b-replaces-position-unknown",
      passed:
        worker?.positionStatus === "known" &&
        prior?.actionCode === "POSITION_UNKNOWN" &&
        guidance?.actionCode === "GUIDANCE_UPDATED" &&
        guidance.updateKind === "primary" &&
        guidance.guidanceVersion > prior.guidanceVersion &&
        guidance.messageArgs["reasonCode"] === "risk-context-recalculated",
    },
    {
      name: "fresh-worker-b-recovery-authorizes-no-movement",
      passed:
        guidance?.actionCode === "GUIDANCE_UPDATED" &&
        guidance.waypoints.length === 0 &&
        guidance.destinationId === null &&
        guidance.routeVersion === null &&
        guidance.stepId === null,
    },
    {
      name: "position-recovery-preserves-closed-edges",
      passed: JSON.stringify(before.closedEdgeIds) === JSON.stringify(fresh.closedEdgeIds),
    },
    {
      name: "worker-b-recovery-preserves-incident-risk-and-status",
      passed:
        incident !== undefined &&
        recovered?.incidentId === incident.incidentId &&
        recovered.hazardType === incident.hazardType &&
        recovered.priority === incident.priority &&
        recovered.status === incident.status &&
        recovered.hazardClearedAt === incident.hazardClearedAt &&
        recovered.passageReopenedAt === incident.passageReopenedAt &&
        recovered.closedAt === incident.closedAt,
    },
  ];
}

export function originalIncidentHistoryPreserved(
  original: SimulationSnapshot,
  later: readonly SimulationSnapshot[],
): boolean {
  return (
    original.incidents.length > 0 &&
    later.every((snapshot) =>
      original.incidents.every((incident) => {
        const current = snapshot.incidents.find(
          ({ incidentId }) => incidentId === incident.incidentId,
        );
        return (
          current !== undefined &&
          JSON.stringify(current.firstGuidance) === JSON.stringify(incident.firstGuidance) &&
          current.status === incident.status &&
          current.hazardClearedAt === incident.hazardClearedAt &&
          current.passageReopenedAt === incident.passageReopenedAt &&
          current.closedAt === incident.closedAt
        );
      }),
    )
  );
}
