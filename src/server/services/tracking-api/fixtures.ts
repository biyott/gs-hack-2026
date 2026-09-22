import assert from "node:assert/strict";
import { afterEach, beforeEach, vi } from "vitest";
import type { UwbParticipantRole } from "@/contracts";
import { UwbParticipantConfigSchema, UwbPreparedRegistrationSchema } from "@/contracts";
import { createAuthService, defaultDemoAccounts, seedAccounts } from "../../auth";
import { createDatabase } from "../../db";
import { createRunRepository } from "../../db/run-repository";
import { authenticatedSession } from "../../http/context";
import { loadConfiguration } from "../../simulation/configuration";
import { SimulationRuntime } from "../../simulation/runtime";
import { getDatabaseServices } from "../database";
import { getTrackingServices, registerUwbParticipant } from "../tracking";

const accounts = defaultDemoAccounts({ GS_DEMO_PIN: "2026" });
const addresses = { EQUIPMENT: "AA:00", WORKER_1: "AA:01", WORKER_2: "AA:02" } as const;
const tokens = new Map<string, string>();

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  const database = createDatabase(":memory:");
  seedAccounts(database, accounts);
  globalThis.gsSafetyDatabaseServices = {
    database,
    auth: createAuthService(database),
    runs: createRunRepository(database),
  };
  globalThis.gsSafetyTrackingServices = undefined;
  tokens.clear();
  globalThis.gsSafetyUwbLatestSessions = undefined;
  globalThis.gsSafetyCctvSessionOwner = undefined;
  globalThis.gsSafetyUwbGenerations = undefined;
  globalThis.gsSafetyUwbSessionOwners = undefined;
});

afterEach(() => {
  globalThis.gsSafetyRuntimeServices?.runtime.dispose();
  globalThis.gsSafetyRuntimeServices = undefined;
  globalThis.gsSafetyDatabaseServices?.database.close();
  globalThis.gsSafetyDatabaseServices = undefined;
  globalThis.gsSafetyTrackingServices = undefined;
  vi.useRealTimers();
  globalThis.gsSafetyUwbLatestSessions = undefined;
  globalThis.gsSafetyCctvSessionOwner = undefined;
  globalThis.gsSafetyUwbGenerations = undefined;
  globalThis.gsSafetyUwbSessionOwners = undefined;
});

export function request(actorId: string | null, path: string, body?: unknown): Request {
  const headers = new Headers();
  if (actorId !== null) {
    const account = accounts.find((entry) => entry.id === actorId);
    assert.ok(account);
    let token = tokens.get(actorId);
    if (token === undefined) {
      token = getDatabaseServices().auth.login({
        actorId,
        role: account.role,
        accessCode: "2026",
      }).token;
      tokens.set(actorId, token);
    }
    headers.set("authorization", `Bearer ${token}`);
  }
  if (body === undefined) return new Request(`http://localhost${path}`, { headers });
  headers.set("content-type", "application/json");
  return new Request(`http://localhost${path}`, {
    headers,
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function registration(role: UwbParticipantRole) {
  return UwbPreparedRegistrationSchema.parse({
    role,
    deviceId: role,
    generation: 1,
    localAddress: addresses[role],
    channel: role === "EQUIPMENT" ? 9 : null,
    preambleIndex: role === "EQUIPMENT" ? 10 : null,
    capabilities: {
      distanceSupported: true,
      azimuthSupported: true,
      elevationSupported: true,
      backgroundSupported: false,
      supportedConfigIds: [2, 5],
      supportedChannels: [5, 9],
      supportedUpdateRates: [1, 2, 3],
      supportedSlotDurations: [1, 2],
      minRangingInterval: 100,
    },
  });
}

export function runtimeFixture(): SimulationRuntime {
  const { database, runs } = getDatabaseServices();
  const runtime = new SimulationRuntime({
    database,
    repository: runs,
    configuration: loadConfiguration(),
  });
  globalThis.gsSafetyRuntimeServices = {
    runtime,
    rag: { status: "failed", detail: "Local route test" },
  };
  return runtime;
}

export function preparePairing(): string {
  const pairing = getTrackingServices().pairing;
  const participants = [
    { role: "EQUIPMENT", actor: "equipment" },
    { role: "WORKER_1", actor: "worker-a" },
    { role: "WORKER_2", actor: "worker-b" },
  ] as const;
  for (const participant of participants)
    registerUwbParticipant(
      authenticatedSession(request(participant.actor, "/api/uwb/prepare")),
      registration(participant.role),
    );
  return UwbParticipantConfigSchema.parse(pairing.getConfig("EQUIPMENT")).config.sessionEpoch;
}
