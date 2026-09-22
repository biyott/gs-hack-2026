import { randomUUID } from "node:crypto";
import type { AuditEvent, Point, SimulationSnapshot } from "@/contracts";
import type { EquipmentRiskModel } from "../engine";
import { ApiFault } from "../http/errors";
import {
  eventsBetween,
  type ResponsePolicy,
  type Scenario,
  type ScenarioEvent,
} from "../scenarios";
import type { ArrivalIntents } from "./arrival-intent";
import { rememberDestinations, restoreCheckpoint, serializeCheckpoint } from "./checkpoint";
import { SimulationClock } from "./clock";
import { equipmentRiskModel, type SimulationConfiguration } from "./configuration";
import { constrainEquipmentWorld } from "./equipment-controls";
import { evaluateSnapshot } from "./evaluate";
import { closedEdges, projectHazards } from "./hazards";
import { addClosureOwners, type ClosureOwners, relatesToIncident } from "./incident-scope";
import { restorePlaybackSnapshot } from "./playback";
import { createRunSnapshot, observeWorld } from "./snapshots";
import {
  applyWorldEvent,
  initialWorld,
  refreshMockObservations,
  type SimulationWorld,
} from "./world";

/** A run owns mutable clock/world state; other modes never share these instances. */
export class SimulationRun {
  snapshot: SimulationSnapshot;
  world: SimulationWorld;
  readonly clock: SimulationClock;
  readonly policy: ResponsePolicy;
  readonly arrivalTargets: Record<string, Point | null> = {};
  readonly arrivalIntents: ArrivalIntents = {};
  readonly closureOwners: ClosureOwners = new Map();
  equipmentCleared = false;
  private readonly checkpoints = new WeakMap<SimulationSnapshot, string>();

  constructor(
    readonly scenario: Scenario,
    readonly configuration: SimulationConfiguration,
    restored: SimulationSnapshot | null = null,
  ) {
    const policy = configuration.policies.find((candidate) => candidate.id === scenario.policyId);
    if (!policy) throw new ApiFault(500, "POLICY_MISSING", "Scenario policy unavailable");
    this.policy = policy;
    this.world = initialWorld(scenario.initial);
    addClosureOwners(
      this.closureOwners,
      scenario.initial.blockedPathIds,
      scenario.initial.hazards.filter((hazard) => hazard.active).map((hazard) => hazard.id),
    );
    this.snapshot = restored ?? createRunSnapshot(scenario, new Date().toISOString());
    const preset = configuration.equipment.find(
      (candidate) => candidate.id === this.snapshot.equipment.presetId,
    );
    if (!restored && preset)
      this.snapshot = {
        ...this.snapshot,
        equipment: { ...this.snapshot.equipment, ...preset.demoPose },
      };
    if (restored) {
      for (const batch of eventsBetween(scenario, -1, restored.run.virtualTimeMs))
        for (const event of batch.events) {
          this.world = applyWorldEvent(this.world, event);
          if (event.type === "equipment.pose") constrainEquipmentWorld(this);
          this.updateClosureOwners(event);
        }
      this.world = {
        ...this.world,
        state: {
          ...this.world.state,
          workers: this.world.state.workers.map((worker) => {
            const saved = restored.workers.find(
              (candidate) => candidate.workerId === worker.workerId,
            );
            return saved ? { ...worker, position: saved.position, profile: saved.profile } : worker;
          }),
          blockedPathIds: [
            ...new Set(
              configuration.map.edges
                .filter((edge) => restored.closedEdgeIds.includes(edge.id))
                .map((edge) => edge.pathId),
            ),
          ],
        },
      };
      this.snapshot = restorePlaybackSnapshot(restored, new Date().toISOString());
    }
    this.clock = new SimulationClock(scenario.durationMs, {
      status: this.snapshot.run.status,
      virtualTimeMs: this.snapshot.run.virtualTimeMs,
      speed: this.snapshot.run.speed,
      durationMs: scenario.durationMs,
    });
    this.rememberDestinations();
  }

  rememberDestinations(): void {
    rememberDestinations(this);
  }

  checkpoint(snapshot: SimulationSnapshot = this.snapshot): string {
    return this.checkpoints.get(snapshot) ?? serializeCheckpoint(this);
  }

  restoreCheckpoint(json: string): void {
    restoreCheckpoint(this, json);
  }

  model(): EquipmentRiskModel {
    return equipmentRiskModel(this.configuration, this.snapshot.equipment.presetId);
  }

  evaluate(
    now: string,
    connectedRecipients = 0,
    forceWorkerIds: readonly string[] = [],
  ): SimulationSnapshot {
    this.world = refreshMockObservations(this.world, this.snapshot.run.virtualTimeMs);
    let snapshot = observeWorld(this.snapshot, {
      world: this.world,
      virtualTimeMs: this.snapshot.run.virtualTimeMs,
      now,
      policy: this.policy,
    });
    snapshot = { ...snapshot, closedEdgeIds: closedEdges(this.world, this.configuration.map) };
    snapshot = {
      ...snapshot,
      hazards: projectHazards(snapshot, {
        world: this.world,
        map: this.configuration.map,
        policy: this.policy,
        model: this.model(),
        now,
        equipmentCleared: this.equipmentCleared,
      }),
    };
    snapshot = {
      ...snapshot,
      incidents: snapshot.incidents.map((incident) =>
        incident.status === "active" &&
        !snapshot.hazards.some(
          (hazard) => hazard.active && relatesToIncident(incident, [hazard.hazardId]),
        )
          ? { ...incident, status: "cleared", hazardClearedAt: now, version: incident.version + 1 }
          : incident,
      ),
    };
    this.snapshot = evaluateSnapshot(snapshot, {
      map: this.configuration.map,
      policy: this.policy,
      now,
      arrivalTargets: this.arrivalTargets,
      arrivalIntents: this.arrivalIntents,
      forceWorkerIds,
      connectedRecipients,
    });
    this.rememberDestinations();
    this.checkpoints.set(this.snapshot, this.checkpoint());
    return this.snapshot;
  }

  applyEvents(events: readonly ScenarioEvent[], now: string): void {
    const audit: AuditEvent[] = [];
    for (const event of events) {
      this.world = applyWorldEvent(this.world, event);
      if (event.type === "equipment.pose") constrainEquipmentWorld(this);
      this.updateClosureOwners(event);
      if (event.type === "equipment.pose") {
        this.equipmentCleared = false;
        this.snapshot = {
          ...this.snapshot,
          equipment: {
            ...this.snapshot.equipment,
            geometryVersion: this.snapshot.equipment.geometryVersion + 1,
          },
        };
      }
      audit.push({
        eventId: `${this.snapshot.run.runId}:${event.id}`,
        incidentId: null,
        runId: this.snapshot.run.runId,
        kind: `scenario.${event.type}`,
        actorId: "scenario",
        occurredAt: now,
        detail: JSON.stringify(event),
        version: this.snapshot.run.version,
      });
    }
    this.snapshot = { ...this.snapshot, events: [...this.snapshot.events, ...audit] };
  }

  private updateClosureOwners(event: ScenarioEvent): void {
    if (event.type === "route.block")
      addClosureOwners(
        this.closureOwners,
        event.pathIds,
        this.scenario.mode === "equipment"
          ? ["EQUIPMENT-A"]
          : this.world.state.hazards.filter((hazard) => hazard.active).map((hazard) => hazard.id),
      );
    if (event.type === "route.reopen")
      for (const pathId of event.pathIds) this.closureOwners.delete(pathId);
  }

  start(now: string, recipients: number): SimulationSnapshot {
    this.clock.start();
    this.snapshot = {
      ...this.snapshot,
      run: { ...this.snapshot.run, startedAt: now, status: "running", updatedAt: now },
    };
    for (const batch of eventsBetween(this.scenario, -1, 0)) this.applyEvents(batch.events, now);
    return this.evaluate(now, recipients);
  }

  advance(elapsedMs: number, recipients: number): SimulationSnapshot[] {
    const beforeMs = this.snapshot.run.virtualTimeMs;
    const clock = this.clock.advance(elapsedMs);
    if (clock.virtualTimeMs === beforeMs) return [];
    const snapshots: SimulationSnapshot[] = [];
    for (const batch of eventsBetween(this.scenario, beforeMs, clock.virtualTimeMs)) {
      const now = new Date().toISOString();
      this.snapshot = {
        ...this.snapshot,
        run: { ...this.snapshot.run, virtualTimeMs: batch.atMs, updatedAt: now },
      };
      this.applyEvents(batch.events, now);
      snapshots.push(this.evaluate(now, recipients));
    }
    const now = new Date().toISOString();
    this.snapshot = {
      ...this.snapshot,
      run: {
        ...this.snapshot.run,
        virtualTimeMs: clock.virtualTimeMs,
        status: clock.status,
        speed: clock.speed,
        updatedAt: now,
      },
    };
    snapshots.push(this.evaluate(now, recipients));
    return snapshots;
  }

  audit(kind: string, actorId: string, detail: string): void {
    const event: AuditEvent = {
      eventId: randomUUID(),
      incidentId: null,
      runId: this.snapshot.run.runId,
      kind,
      actorId,
      occurredAt: new Date().toISOString(),
      detail,
      version: this.snapshot.run.version,
    };
    this.snapshot = { ...this.snapshot, events: [...this.snapshot.events, event] };
  }
}
