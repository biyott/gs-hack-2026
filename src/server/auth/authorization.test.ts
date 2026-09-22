import { afterEach, describe, expect, it } from "vitest";
import { createDatabase, type SafetyDatabase } from "../db";
import { requireRole, requireWorker } from "./authorize";
import { seedAccounts } from "./seed-accounts";
import { createAuthService } from "./sessions";
import type { LoginCredentials } from "./types";

const databases: SafetyDatabase[] = [];

afterEach(() => {
  for (const database of databases.splice(0)) database.close();
});

function fixture() {
  const database = createDatabase(":memory:");
  databases.push(database);
  seedAccounts(database, [
    { id: "worker-a", role: "worker", workerId: "WORKER-A", deviceRole: "WORKER_1", pin: "2026" },
    { id: "equipment", role: "device", workerId: null, deviceRole: "EQUIPMENT", pin: "2026" },
  ]);
  return { database, auth: createAuthService(database) };
}

describe("server-derived identity", () => {
  it.each([
    { actorId: "worker-a", role: "admin", accessCode: "2026" },
    { actorId: "worker-a", role: "worker", accessCode: "2026", workerId: "WORKER-B" },
    { actorId: "worker-a", role: "worker", accessCode: "2026", deviceRole: "WORKER_2" },
    { actorId: "equipment", role: "device", accessCode: "2026", deviceRole: "CCTV" },
    { actorId: "worker-a", role: "worker" },
  ] satisfies LoginCredentials[])(
    "denies a forged binding or missing credential: %j",
    (credentials) => {
      // Given
      const { auth, database } = fixture();
      // When / Then
      expect(() => auth.login(credentials)).toThrowError(
        expect.objectContaining({ code: "INVALID_CREDENTIALS" }),
      );
      expect(database.sqlite.prepare("SELECT count(*) AS count FROM sessions").get()).toEqual({
        count: 0,
      });
    },
  );

  it("returns the stored device binding when a device authenticates", () => {
    // Given
    const { auth } = fixture();
    // When
    const issued = auth.login({ actorId: "equipment", role: "device", accessCode: "2026" });
    // Then
    expect(auth.authenticate(issued.token)).toMatchObject({
      role: "device",
      deviceRole: "EQUIPMENT",
      workerId: null,
    });
  });

  it("denies cross-worker responses despite a valid session", () => {
    // Given
    const { auth } = fixture();
    const { session } = auth.login({ actorId: "worker-a", role: "worker", accessCode: "2026" });
    // When / Then
    expect(() => requireWorker(session, "WORKER-B")).toThrowError(
      expect.objectContaining({ code: "FORBIDDEN" }),
    );
  });

  it("permits the authenticated worker's own responses", () => {
    // Given
    const { auth } = fixture();
    const { session } = auth.login({ actorId: "worker-a", role: "worker", accessCode: "2026" });
    // When / Then
    expect(() => requireWorker(session, "WORKER-A")).not.toThrow();
  });

  it("denies privileged actions for a worker", () => {
    // Given
    const { auth } = fixture();
    const { session } = auth.login({ actorId: "worker-a", role: "worker", accessCode: "2026" });
    // When / Then
    expect(() => requireRole(session, ["admin"])).toThrowError(
      expect.objectContaining({ code: "FORBIDDEN" }),
    );
  });

  it("requires authentication before checking a worker binding", () => {
    // Given / When / Then
    expect(() => requireWorker(null, "WORKER-A")).toThrowError(
      expect.objectContaining({ code: "UNAUTHENTICATED" }),
    );
  });
});
