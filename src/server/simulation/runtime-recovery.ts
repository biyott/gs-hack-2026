import type { SimulationMode, SimulationSnapshot } from "@/contracts";
import type { SafetyDatabase } from "../db";
import { PersistenceError } from "../db/errors";
import type { RunRepository } from "../db/run-repository";
import { ApiFault } from "../http/errors";
import type { SimulationConfiguration } from "./configuration";
import { SimulationRun } from "./run";

type RecoveryDependencies = Readonly<{
  configuration: SimulationConfiguration;
  repository: RunRepository;
  database: SafetyDatabase;
}>;

type StoredRun = Readonly<{
  snapshot: SimulationSnapshot;
  checkpoint: string | null;
}>;

function readStoredRun(dependencies: RecoveryDependencies, mode: SimulationMode): StoredRun | null {
  return dependencies.database.sqlite.transaction(() => {
    const snapshot = dependencies.repository.current(mode);
    return snapshot
      ? { snapshot, checkpoint: dependencies.repository.runtimeState(snapshot.run.runId) }
      : null;
  })();
}

function reconstructRun(dependencies: RecoveryDependencies, stored: StoredRun): SimulationRun {
  const scenario = dependencies.configuration.scenarios.find(
    (candidate) => candidate.id === stored.snapshot.run.scenarioId,
  );
  if (!scenario) throw new ApiFault(500, "SCENARIO_MISSING", "Stored scenario unavailable");
  const run = new SimulationRun(scenario, dependencies.configuration, stored.snapshot);
  if (stored.checkpoint !== null) {
    for (const workerId of Object.keys(run.arrivalTargets)) delete run.arrivalTargets[workerId];
    run.restoreCheckpoint(stored.checkpoint);
  }
  return run;
}

function recoveryChanged(before: SimulationSnapshot, after: SimulationSnapshot): boolean {
  return (
    before.run.status !== after.run.status ||
    after.workers.some((worker) => {
      const previous = before.workers.find((entry) => entry.workerId === worker.workerId);
      return (
        previous !== undefined &&
        (previous.response.voiceStatus !== worker.response.voiceStatus ||
          previous.response.voiceStopRequestedAt !== worker.response.voiceStopRequestedAt)
      );
    })
  );
}

export function restoreDurableRun(
  dependencies: RecoveryDependencies,
  mode: SimulationMode,
): SimulationRun | null {
  const stored = readStoredRun(dependencies, mode);
  if (stored === null) return null;
  const run = reconstructRun(dependencies, stored);
  if (!recoveryChanged(stored.snapshot, run.snapshot)) return run;
  try {
    run.snapshot = dependencies.repository.commit({
      snapshot: {
        ...run.snapshot,
        run: {
          ...run.snapshot.run,
          version: stored.snapshot.run.version + 1,
          updatedAt: new Date().toISOString(),
        },
      },
      expectedVersion: stored.snapshot.run.version,
      actorId: "engine",
      runtimeStateJson: stored.checkpoint ?? run.checkpoint(),
    });
    return run;
  } catch (error) {
    if (!(error instanceof PersistenceError) || error.code !== "CONFLICT") throw error;
    const winner = readStoredRun(dependencies, mode);
    if (
      winner === null ||
      (winner.snapshot.run.runId === stored.snapshot.run.runId &&
        winner.snapshot.run.version === stored.snapshot.run.version)
    )
      throw error;
    const authoritative = reconstructRun(dependencies, winner);
    authoritative.snapshot = winner.snapshot;
    if (winner.snapshot.run.status === "running") authoritative.clock.resume();
    return authoritative;
  }
}
