import assert from "node:assert/strict";
import { afterEach } from "vitest";
import type { Session } from "@/contracts";
import { GET as events } from "../../../app/api/events/route";
import { createAuthService, defaultDemoAccounts, seedAccounts } from "../auth";
import { createDatabase } from "../db";
import { createRunRepository } from "../db/run-repository";
import { loadConfiguration } from "../simulation/configuration";
import { SimulationRuntime } from "../simulation/runtime";

const cleanups: (() => void)[] = [];
const configuration = loadConfiguration();

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  globalThis.gsSafetyDatabaseServices = undefined;
  globalThis.gsSafetyRuntimeServices = undefined;
  globalThis.gsSafetyTrackingServices = undefined;
  globalThis.gsSafetyUwbSessionOwners = undefined;
  globalThis.gsSafetyUwbGenerations = undefined;
  globalThis.gsSafetySessionStreams = undefined;
});

export function fixture() {
  const database = createDatabase(":memory:");
  seedAccounts(database, defaultDemoAccounts({ GS_DEMO_PIN: "2026" }));
  const auth = createAuthService(database);
  const runs = createRunRepository(database);
  const runtime = new SimulationRuntime({ database, repository: runs, configuration });
  globalThis.gsSafetyDatabaseServices = { database, auth, runs };
  globalThis.gsSafetyRuntimeServices = {
    runtime,
    rag: { status: "failed", detail: "test-disabled" },
  };
  cleanups.push(() => {
    runtime.dispose();
    database.close();
  });
  const login = (actorId = "worker-a", role: Session["role"] = "worker") =>
    auth.login({ actorId, role, accessCode: "2026" }).session;
  return { database, auth, runtime, login };
}

export function openStream(session: Session) {
  const controller = new AbortController();
  cleanups.push(() => controller.abort());
  const response = events(
    new Request("http://localhost/api/events?mode=equipment", {
      headers: { authorization: `Bearer ${session.token}` },
      signal: controller.signal,
    }),
  );
  assert.ok(response.body);
  return { controller, response, reader: response.body.getReader() };
}

export function loginRequest(
  actorId = "worker-a",
  role: Session["role"] = "worker",
  previous?: Session,
) {
  return new Request("http://localhost/api/session", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      ...(previous ? { cookie: `gs_safety_session=${previous.token}` } : {}),
    },
    body: JSON.stringify({ actorId, role, accessCode: "2026" }),
  });
}
