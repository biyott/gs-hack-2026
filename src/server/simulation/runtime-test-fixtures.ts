import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, expect, vi } from "vitest";
import {
  type Guidance,
  type IncidentAction,
  IncidentActionSchema,
  type Session,
  type SimulationCommand,
  SimulationCommandSchema,
  type SimulationMode,
  type SimulationSnapshot,
  type WorkerResponse,
  type WorkerState,
} from "@/contracts";
import { createAuthService, defaultDemoAccounts, seedAccounts } from "../auth";
import { createDatabase } from "../db";
import { createRunRepository } from "../db/run-repository";
import { loadConfiguration, type SimulationConfiguration } from "./configuration";
import { SimulationRuntime } from "./runtime";
export const configuration = loadConfiguration();
export const cleanups: (() => void)[] = [];
type CommandInput = SimulationCommand extends infer C
  ? C extends SimulationCommand
    ? Omit<C, "mode" | "expectedVersion" | "requestId">
    : never
  : never;

export function fixture(path = ":memory:", config: SimulationConfiguration = configuration) {
  const database = createDatabase(path);
  seedAccounts(database, defaultDemoAccounts({ GS_DEMO_PIN: "2026" }));
  const repository = createRunRepository(database);
  const runtime = new SimulationRuntime({ configuration: config, database, repository });
  const auth = createAuthService(database);
  const session = (actorId: string): Session => {
    const account = defaultDemoAccounts({ GS_DEMO_PIN: "2026" }).find(
      (entry) => entry.id === actorId,
    );
    assert.ok(account);
    return auth.login({ actorId, role: account.role, accessCode: "2026" }).session;
  };
  const admin = session("admin");
  const snapshot = (mode: SimulationMode = "equipment") => runtime.getRun(mode).snapshot;
  const request = (input: CommandInput, mode: SimulationMode = "equipment") =>
    SimulationCommandSchema.parse({
      ...input,
      mode,
      expectedVersion: snapshot(mode).run.version,
      requestId: randomUUID(),
    });
  const command = (input: CommandInput, mode: SimulationMode = "equipment") =>
    runtime.command(request(input, mode), admin);
  const action = (
    input: Pick<IncidentAction, "action" | "assigneeId">,
    mode: SimulationMode = "equipment",
  ) => {
    const current = snapshot(mode);
    const incident = current.incidents[0];
    assert.ok(incident);
    return IncidentActionSchema.parse({
      ...input,
      mode,
      incidentId: incident.incidentId,
      expectedVersion: current.run.version,
      expectedIncidentVersion: incident.version,
      requestId: randomUUID(),
    });
  };
  const incident = (input: Pick<IncidentAction, "action" | "assigneeId">, actor = admin) =>
    runtime.incident(action(input), actor);
  const response = (kind: WorkerResponse["response"], workerId = "WORKER-A"): WorkerResponse => {
    const guidance = snapshot().workers.find(
      (worker) => worker.workerId === workerId,
    )?.currentGuidance;
    assert.ok(guidance);
    return {
      mode: "equipment",
      runId: guidance.runId,
      workerId,
      requestId: randomUUID(),
      incidentId: guidance.incidentId,
      guidanceId: guidance.guidanceId,
      guidanceVersion: guidance.guidanceVersion,
      response: kind,
      occurredAt: new Date().toISOString(),
    };
  };
  cleanups.push(() => {
    runtime.dispose();
    if (database.sqlite.open) database.close();
  });
  return {
    database,
    repository,
    runtime,
    session,
    admin,
    snapshot,
    request,
    command,
    action,
    incident,
    response,
  };
}

export function active(path = ":memory:") {
  const context = fixture(path);
  context.command({ action: "start" });
  context.command({ action: "advance", deltaMs: 1000 });
  return context;
}

export function expectBlockingReissue(previous: Guidance, worker: WorkerState, now: string) {
  const current = worker.currentGuidance;
  assert.ok(current);
  expect(current).toMatchObject({
    guidanceId: previous.guidanceId,
    incidentId: previous.incidentId,
    guidanceVersion: previous.guidanceVersion + 1,
    primaryGuidanceVersion: previous.guidanceVersion + 1,
    updateKind: "primary",
    actionCode: previous.actionCode,
    hazardIds: previous.hazardIds,
    hazardType: previous.hazardType,
    priority: previous.priority,
    messageArgs: {
      reasonCode: previous.messageArgs["reasonCode"],
      assistanceRequired: true,
    },
    profileVersion: worker.profile.version,
    profileSnapshot: worker.profile,
    locale: worker.profile.preferredLocale,
    waypoints: [],
    destinationId: null,
    routeVersion: null,
    stepId: null,
  });
  expect(current.eventId).not.toBe(previous.eventId);
  expect(current.generatedAt).toBe(now);
  expect(Date.parse(current.expiresAt)).toBeGreaterThan(Date.parse(now));
  return current;
}

export function normalized(snapshot: SimulationSnapshot) {
  return {
    mode: snapshot.mode,
    scenario: snapshot.run.scenarioId,
    time: snapshot.run.virtualTimeMs,
    seed: snapshot.run.seed,
    status: snapshot.run.status,
    speed: snapshot.run.speed,
    equipment: snapshot.equipment,
    hazards: snapshot.hazards,
    closedEdges: snapshot.closedEdgeIds,
    workers: snapshot.workers.map((worker) => ({
      workerId: worker.workerId,
      position: worker.position,
      profile: worker.profile,
      response: worker.response,
      guidance: worker.currentGuidance && {
        action: worker.currentGuidance.actionCode,
        hazardIds: worker.currentGuidance.hazardIds,
        version: worker.currentGuidance.guidanceVersion,
        routeVersion: worker.currentGuidance.routeVersion,
        waypoints: worker.currentGuidance.waypoints,
        destination: worker.currentGuidance.destinationId,
        args: worker.currentGuidance.messageArgs,
      },
    })),
    events: snapshot.events
      .filter((event) => event.kind.startsWith("scenario."))
      .map((event) => ({ kind: event.kind, detail: event.detail })),
    incidents: snapshot.incidents.map((incident) => ({
      status: incident.status,
      hazardIds: incident.hazardIds,
      priority: incident.priority,
    })),
  };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-09-21T09:00:00Z"));
});
afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  vi.useRealTimers();
});
