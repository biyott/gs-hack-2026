import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiErrorSchema, type SessionRole, TrackingSnapshotSchema } from "@/contracts";
import { GET } from "../../../../app/api/tracking/route";
import { createAuthService, defaultDemoAccounts, seedAccounts } from "../../auth";
import { createDatabase } from "../../db";
import { createRunRepository } from "../../db/run-repository";
import { getDatabaseServices } from "../database";
import { getTrackingServices } from "../tracking";

const capturedAt = "2026-01-01T00:00:00.000Z";
const consoleRoles = ["admin", "operator", "support", "observer"] as const;
const deviceAccounts = [
  { actorId: "worker-a", role: "worker" },
  { actorId: "worker-b", role: "worker" },
  { actorId: "equipment", role: "device" },
  { actorId: "cctv", role: "device" },
] as const;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(capturedAt));
  const database = createDatabase(":memory:");
  seedAccounts(database, defaultDemoAccounts({ GS_DEMO_PIN: "2026" }));
  globalThis.gsSafetyDatabaseServices = {
    database,
    auth: createAuthService(database),
    runs: createRunRepository(database),
  };
  globalThis.gsSafetyTrackingServices = undefined;
  for (const sample of [
    { workerId: "WORKER-A", distanceM: 0.31 },
    { workerId: "WORKER-B", distanceM: 0.77 },
  ] as const) {
    getTrackingServices().tracking.ingestUwb({
      ...sample,
      deviceId: "isolated-range-fixture",
      source: "synthetic",
      capturedAt,
      sequence: 1,
      azimuthRad: null,
      elevationRad: null,
      uncertaintyM: null,
    });
  }
});

afterEach(() => {
  globalThis.gsSafetyDatabaseServices?.database.close();
  globalThis.gsSafetyDatabaseServices = undefined;
  globalThis.gsSafetyTrackingServices = undefined;
  vi.useRealTimers();
});

function authenticatedRequest(actorId: string, role: SessionRole, query = ""): Request {
  const issued = getDatabaseServices().auth.login({ actorId, role, accessCode: "2026" });
  return new Request(`http://localhost/api/tracking${query}`, {
    headers: { authorization: `Bearer ${issued.token}` },
  });
}

describe("SEC-01 tracking read authorization", () => {
  it.each(consoleRoles)("preserves both raw ranges and nullable positions for %s", async (role) => {
    // Given two distinct workers' actual range-only observations and a console credential.
    const request = authenticatedRequest(role, role);
    // When the console requests the tracking snapshot.
    const response = GET(request);
    // Then the complete contract retains both workers without inventing coordinates.
    expect(response.status).toBe(200);
    const snapshot = TrackingSnapshotSchema.parse(await response.json());
    expect(
      snapshot.uwbObservations.map(({ entityId, tableDistanceM, position }) => ({
        entityId,
        tableDistanceM,
        position,
      })),
    ).toEqual([
      { entityId: "WORKER-A", tableDistanceM: 0.31, position: null },
      { entityId: "WORKER-B", tableDistanceM: 0.77, position: null },
    ]);
    expect(snapshot.updates.map(({ entityId, position }) => ({ entityId, position }))).toEqual([
      { entityId: "WORKER-A", position: null },
      { entityId: "WORKER-B", position: null },
    ]);
  });

  it.each(deviceAccounts)(
    "denies $actorId without returning tracking fields",
    async ({ actorId, role }) => {
      // Given a worker or equipment/CCTV credential and populated cross-worker range data.
      const request = authenticatedRequest(actorId, role);
      // When the non-console client requests global tracking state.
      const response = GET(request);
      // Then only the forbidden error contract is returned, with no tracking payload.
      expect(response.status).toBe(403);
      const error = ApiErrorSchema.strict().parse(await response.json());
      expect(error.error.code).toBe("FORBIDDEN");
    },
  );

  it("does not let a caller-selected worker or console role elevate a worker credential", async () => {
    // Given WORKER-A's credential and query parameters asking for WORKER-B as an observer.
    const request = authenticatedRequest("worker-a", "worker", "?workerId=WORKER-B&role=observer");
    // When the worker requests the global tracking endpoint with forged selectors.
    const response = GET(request);
    // Then authorization remains bound to the authenticated role.
    expect(response.status).toBe(403);
    const error = ApiErrorSchema.strict().parse(await response.json());
    expect(error.error.code).toBe("FORBIDDEN");
  });

  it("rejects an unauthenticated tracking read", async () => {
    // Given a populated tracking service and no credential.
    const request = new Request("http://localhost/api/tracking");
    // When requesting tracking state.
    const response = GET(request);
    // Then no tracking payload is exposed without authentication.
    expect(response.status).toBe(401);
    const error = ApiErrorSchema.strict().parse(await response.json());
    expect(error.error.code).toBe("UNAUTHENTICATED");
  });
});
