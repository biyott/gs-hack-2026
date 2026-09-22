import type {
  Guidance,
  IncidentAction,
  Session,
  SimulationCommand,
  SimulationMode,
  SimulationSnapshot,
  WorkerResponse,
} from "@/contracts";
import { requireRole } from "../auth";
import type { SafetyDatabase } from "../db";
import type { RunRepository } from "../db/run-repository";
import { ApiFault } from "../http/errors";
import { applyWorkerResponse } from "../incidents";
import { SnapshotBus } from "../realtime/bus";
import { SnapshotOrder } from "../realtime/order";
import { executeCommand } from "./commands";
import type { SimulationConfiguration } from "./configuration";
import { transitionIncident } from "./incident-workflow";
import { SimulationRun } from "./run";
import { matchesReceipt } from "./runtime-receipts";
import { restoreDurableRun } from "./runtime-recovery";

export type RuntimeDependencies = Readonly<{
  configuration: SimulationConfiguration;
  repository: RunRepository;
  database: SafetyDatabase;
}>;

/** The scheduler is shared; mode clocks, scenarios, hazards and histories are separate. */
export class SimulationRuntime {
  readonly bus = new SnapshotBus();
  readonly runs = new Map<SimulationMode, SimulationRun>();
  private readonly order = new SnapshotOrder();
  private readonly persistedVersions = new Map<string, number>();
  private readonly persistedAt = new Map<SimulationMode, number>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private lastTickAt = performance.now();
  private isDisposed = false;
  onGuidance: ((guidance: Guidance, snapshot: SimulationSnapshot) => void) | null = null;
  onTick: (() => void) | null = null;

  get disposed(): boolean {
    return this.isDisposed;
  }

  constructor(readonly dependencies: RuntimeDependencies) {
    for (const mode of ["equipment", "fire-gas"] as const) {
      let run = restoreDurableRun(dependencies, mode);
      if (run) run.snapshot = this.order.next(run.snapshot);
      else {
        const scenario = dependencies.configuration.scenarios.find(
          (candidate) => candidate.id === (mode === "equipment" ? "EQ-APPROACH" : "FG-FIRE"),
        );
        if (!scenario) throw new ApiFault(500, "SCENARIO_MISSING", "Default scenario unavailable");
        run = new SimulationRun(scenario, dependencies.configuration);
        run.snapshot = this.order.next(run.snapshot);
        dependencies.repository.create(run.snapshot, "engine", run.checkpoint());
      }
      this.runs.set(mode, run);
      this.persistedVersions.set(run.snapshot.run.runId, run.snapshot.run.version);
    }
  }

  getRun(mode: SimulationMode): SimulationRun {
    const run = this.runs.get(mode);
    if (!run) throw new ApiFault(404, "RUN_MISSING", "Simulation unavailable");
    return run;
  }

  private synchronizedRun(mode: SimulationMode): SimulationRun {
    const run = this.getRun(mode);
    const persisted = this.dependencies.repository.current(mode);
    if (
      persisted &&
      (persisted.run.runId !== run.snapshot.run.runId ||
        persisted.run.version !== run.snapshot.run.version)
    ) {
      const refreshed = restoreDurableRun(this.dependencies, mode);
      if (!refreshed) throw new ApiFault(404, "RUN_MISSING", "Simulation unavailable");
      refreshed.snapshot = this.order.next(refreshed.snapshot);
      this.runs.set(mode, refreshed);
      this.persistedVersions.set(refreshed.snapshot.run.runId, refreshed.snapshot.run.version);
      return refreshed;
    }
    return run;
  }

  startScheduler(): void {
    if (this.timer || this.isDisposed) return;
    this.lastTickAt = performance.now();
    this.timer = setInterval(() => this.tick(), 100);
    this.timer.unref();
  }

  dispose(): void {
    this.isDisposed = true;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.bus.clear();
  }

  publishTransient(run: SimulationRun, snapshot: SimulationSnapshot): void {
    run.snapshot = this.order.next({
      ...snapshot,
      run: {
        ...snapshot.run,
        version: this.persistedVersions.get(snapshot.run.runId) ?? snapshot.run.version,
      },
    });
    this.bus.publish(run.snapshot);
  }

  commit(
    run: SimulationRun,
    snapshot: SimulationSnapshot,
    actorId: string,
    receipt?: SimulationCommand | IncidentAction | WorkerResponse,
  ): SimulationSnapshot {
    const expectedVersion = this.persistedVersions.get(snapshot.run.runId) ?? snapshot.run.version;
    const previous = this.dependencies.repository.get(snapshot.run.runId);
    const next = this.order.next({
      ...snapshot,
      run: { ...snapshot.run, version: expectedVersion + 1, updatedAt: new Date().toISOString() },
    });
    const stored = this.dependencies.repository.commit({
      snapshot: next,
      expectedVersion,
      actorId,
      runtimeStateJson: run.checkpoint(snapshot),
      ...(receipt && "response" in receipt
        ? { response: receipt }
        : receipt
          ? { request: receipt }
          : {}),
    });
    run.snapshot = stored;
    this.persistedVersions.set(stored.run.runId, stored.run.version);
    this.persistedAt.set(stored.mode, performance.now());
    this.bus.publish(stored);
    for (const worker of stored.workers) {
      const guidance = worker.currentGuidance;
      const old = previous?.workers.find(
        (candidate) => candidate.workerId === worker.workerId,
      )?.currentGuidance;
      if (
        guidance &&
        guidance.updateKind === "primary" &&
        (old?.guidanceId !== guidance.guidanceId ||
          old.guidanceVersion !== guidance.guidanceVersion)
      )
        this.onGuidance?.(guidance, stored);
    }
    return stored;
  }

  private tick(): void {
    const now = performance.now();
    const elapsed = now - this.lastTickAt;
    this.lastTickAt = now;
    this.onTick?.();
    for (const [mode, run] of this.runs) {
      if (run.snapshot.run.status !== "running") continue;
      const beforeEvents = run.snapshot.events.length;
      const snapshots = run.advance(elapsed, this.bus.count(mode));
      for (const snapshot of snapshots) {
        const changed =
          snapshot.events.length !== beforeEvents || snapshot.run.status === "completed";
        if (changed || now - (this.persistedAt.get(mode) ?? 0) >= 1000)
          this.commit(run, snapshot, "engine");
        else this.publishTransient(run, snapshot);
      }
    }
  }

  command(command: SimulationCommand, session: Session): SimulationSnapshot {
    requireRole(session, ["admin", "operator"]);
    const run = this.synchronizedRun(command.mode);
    const replay = this.dependencies.repository.findRequestReceipt(command.mode, command.requestId);
    if (matchesReceipt(replay, command, session)) return run.snapshot;
    if (command.expectedVersion !== run.snapshot.run.version)
      throw new ApiFault(
        409,
        "VERSION_CONFLICT",
        "Refresh the latest snapshot before changing state",
      );
    if (command.action === "reset" || command.action === "select") {
      const scenarioId = command.action === "select" ? command.scenarioId : run.scenario.id;
      const scenario = this.dependencies.configuration.scenarios.find(
        (candidate) => candidate.id === scenarioId && candidate.mode === command.mode,
      );
      if (!scenario)
        throw new ApiFault(400, "SCENARIO_MISMATCH", "Scenario does not belong to this mode");
      const next = new SimulationRun(
        command.action === "select" && command.seed !== undefined
          ? { ...scenario, seed: command.seed }
          : scenario,
        this.dependencies.configuration,
      );
      next.clock.setSpeed(run.snapshot.run.speed);
      next.snapshot = this.order.next({
        ...next.snapshot,
        run: { ...next.snapshot.run, speed: run.snapshot.run.speed },
      });
      next.snapshot = this.dependencies.repository.replace(
        next.snapshot,
        {
          runId: run.snapshot.run.runId,
          version: run.snapshot.run.version,
          request: command,
          runtimeStateJson: next.checkpoint(),
        },
        session.actorId,
      );
      this.runs.set(command.mode, next);
      this.persistedVersions.set(next.snapshot.run.runId, 0);
      this.bus.publish(next.snapshot);
      return next.snapshot;
    }
    const snapshots = executeCommand(run, command, {
      session,
      recipients: this.bus.count(command.mode),
    });
    if (snapshots.length === 0) return this.commit(run, run.snapshot, session.actorId, command);
    for (const [index, snapshot] of snapshots.entries())
      this.commit(
        run,
        snapshot,
        session.actorId,
        index === snapshots.length - 1 ? command : undefined,
      );
    return run.snapshot;
  }

  incident(action: IncidentAction, session: Session): SimulationSnapshot {
    const run = this.synchronizedRun(action.mode);
    const replay = this.dependencies.repository.findRequestReceipt(action.mode, action.requestId);
    if (matchesReceipt(replay, action, session)) return run.snapshot;
    transitionIncident(
      run,
      action,
      session,
      this.dependencies.database,
      this.bus.count(action.mode),
    );
    return this.commit(run, run.snapshot, session.actorId, action);
  }

  respond(response: WorkerResponse, session: Session): SimulationSnapshot {
    const run = this.synchronizedRun(response.mode);
    const replay = this.dependencies.repository.responseReceipt(response);
    if (matchesReceipt(replay, response, session)) return run.snapshot;
    const outcome = applyWorkerResponse(run.snapshot, response, {
      session,
      now: new Date().toISOString(),
      arrivalTargets: run.arrivalTargets,
      arrivalToleranceM: run.policy.arrivalToleranceM,
    });
    return this.commit(run, outcome.snapshot, session.actorId, response);
  }
}
