import type { IncidentAction, Session } from "@/contracts";
import { isSupportActor } from "../auth";
import type { SafetyDatabase } from "../db";
import { ApiFault } from "../http/errors";
import { applyIncidentAction } from "../incidents";
import { releaseIncidentClosures } from "./incident-scope";
import type { SimulationRun } from "./run";

export function transitionIncident(
  run: SimulationRun,
  action: IncidentAction,
  session: Session,
  database: SafetyDatabase,
  connectedSubscriptions: number,
): void {
  if (
    action.action === "assign" &&
    (!action.assigneeId || !isSupportActor(database, action.assigneeId))
  )
    throw new ApiFault(400, "ASSIGNEE_INVALID", "Assign an enabled support identity");
  const outcome = applyIncidentAction(run.snapshot, action, {
    session,
    now: new Date().toISOString(),
  });
  run.snapshot = outcome.snapshot;
  const incident = run.snapshot.incidents.find(
    (candidate) => candidate.incidentId === action.incidentId,
  );
  if (action.action === "clear-hazard") {
    if (run.snapshot.mode === "equipment") run.equipmentCleared = true;
    run.world = {
      ...run.world,
      state: {
        ...run.world.state,
        hazards: run.world.state.hazards.map((hazard) =>
          incident?.hazardIds.includes(hazard.id) ? { ...hazard, active: false } : hazard,
        ),
      },
    };
  }
  if (action.action === "reopen-passage" && incident) {
    const released = releaseIncidentClosures(run.closureOwners, incident);
    run.world = {
      ...run.world,
      state: {
        ...run.world.state,
        blockedPathIds: run.world.state.blockedPathIds.filter(
          (pathId) => !released.includes(pathId),
        ),
      },
    };
  }
  if (action.action === "close")
    run.snapshot = {
      ...run.snapshot,
      workers: run.snapshot.workers.map((worker) =>
        worker.currentGuidance?.incidentId === action.incidentId
          ? { ...worker, currentGuidance: null }
          : worker,
      ),
    };
  else if (outcome.refreshWorkerIds.length)
    run.evaluate(new Date().toISOString(), connectedSubscriptions, outcome.refreshWorkerIds);
}
