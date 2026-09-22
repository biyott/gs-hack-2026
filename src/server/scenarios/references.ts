import type { ScenarioInitialState } from "./entities";
import type { ScenarioEvent } from "./events";

export type ReferenceIssue = {
  readonly path: readonly (string | number)[];
  readonly message: string;
};

export function referenceIssues(scenario: {
  readonly initial: ScenarioInitialState;
  readonly events: readonly ScenarioEvent[];
}): readonly ReferenceIssue[] {
  const workerIds = new Set(scenario.initial.workers.map((worker) => worker.workerId));
  const sourceIds = new Set([
    ...workerIds,
    ...scenario.initial.sensors.map((sensor) => sensor.sensorId),
  ]);
  if (scenario.initial.equipment !== null) sourceIds.add(scenario.initial.equipment.equipmentId);
  const hazardIds = new Set(scenario.initial.hazards.map((hazard) => hazard.id));
  const issues: ReferenceIssue[] = [];
  scenario.events.forEach((event, index) => {
    const checkWorker = (workerId: string) => {
      if (!workerIds.has(workerId))
        issues.push({ path: ["events", index], message: `Unknown worker ${workerId}` });
    };
    switch (event.type) {
      case "worker.position":
        checkWorker(event.workerId);
        break;
      case "worker.profile":
        checkWorker(event.profile.workerId);
        break;
      case "source.connection":
        if (!sourceIds.has(event.entityId))
          issues.push({ path: ["events", index], message: `Unknown source ${event.entityId}` });
        break;
      case "sensor.reading":
        sourceIds.add(event.sensor.sensorId);
        break;
      case "hazard.upsert":
        hazardIds.add(event.hazard.id);
        break;
      case "hazard.clear":
        if (!hazardIds.has(event.hazardId))
          issues.push({ path: ["events", index], message: `Unknown hazard ${event.hazardId}` });
        break;
      case "equipment.pose":
      case "route.block":
      case "route.reopen":
        break;
      default:
        assertNever(event);
    }
  });
  return issues;
}

class ScenarioReferenceError extends Error {
  override readonly name = "ScenarioReferenceError";
}

function assertNever(event: never): never {
  throw new ScenarioReferenceError(`Unrecognized event ${String(event)}`);
}
