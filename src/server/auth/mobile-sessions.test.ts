import { afterEach, describe, expect, it } from "vitest";
import { createDatabase, type SafetyDatabase } from "../db";
import { defaultDemoAccounts } from "./config";
import { seedAccounts } from "./seed-accounts";
import { createAuthService } from "./sessions";
import type { LoginCredentials } from "./types";

const databases: SafetyDatabase[] = [];
const mobileCredentials = [
  { actorId: "worker-a", role: "worker", accessCode: "2026" },
  { actorId: "worker-b", role: "worker", accessCode: "2026" },
  { actorId: "equipment", role: "device", accessCode: "2026" },
  { actorId: "cctv", role: "device", accessCode: "2026" },
] as const satisfies readonly LoginCredentials[];

afterEach(() => {
  for (const database of databases.splice(0)) database.close();
});

function fixture() {
  const database = createDatabase(":memory:");
  databases.push(database);
  seedAccounts(database, defaultDemoAccounts({ NODE_ENV: "test" }));
  return { database, auth: createAuthService(database) };
}

describe("one live session per mobile role", () => {
  it.each(mobileCredentials)(
    "replaces the old session when $actorId logs in again",
    (credentials) => {
      // Given
      const { auth } = fixture();
      const previous = auth.login(credentials);
      // When
      const current = auth.login(credentials);
      // Then
      expect(auth.authenticate(previous.token)).toBeNull();
      expect(auth.authenticate(current.token)).toEqual(current.session);
    },
  );

  it("keeps two administrator sessions valid", () => {
    // Given
    const { auth } = fixture();
    const credentials = { actorId: "admin", role: "admin", accessCode: "2026" } as const;
    const previous = auth.login(credentials);
    // When
    const current = auth.login(credentials);
    // Then
    expect(auth.authenticate(previous.token)).toEqual(previous.session);
    expect(auth.authenticate(current.token)).toEqual(current.session);
  });

  it("leaves other mobile role sessions valid when a slot is replaced", () => {
    // Given
    const { auth } = fixture();
    const worker = auth.login({ actorId: "worker-b", role: "worker", accessCode: "2026" });
    auth.login({ actorId: "worker-a", role: "worker", accessCode: "2026" });
    // When
    auth.login({ actorId: "worker-a", role: "worker", accessCode: "2026" });
    // Then
    expect(auth.authenticate(worker.token)).toEqual(worker.session);
  });

  it("replaces a shared device slot even when a different account claims it", () => {
    // Given
    const { database, auth } = fixture();
    const previous = auth.login({ actorId: "equipment", role: "device", accessCode: "2026" });
    seedAccounts(database, [
      {
        id: "equipment-replacement",
        role: "device",
        workerId: null,
        deviceRole: "EQUIPMENT",
        pin: "2026",
      },
    ]);
    // When
    const current = auth.login({
      actorId: "equipment-replacement",
      role: "device",
      accessCode: "2026",
    });
    // Then
    expect(auth.authenticate(previous.token)).toBeNull();
    expect(auth.authenticate(current.token)).toEqual(current.session);
  });

  it("preserves the prior slot if insertion of the new session fails", () => {
    // Given
    const { database, auth } = fixture();
    const credentials = { actorId: "cctv", role: "device", accessCode: "2026" } as const;
    const previous = auth.login(credentials);
    database.sqlite.exec(`CREATE TRIGGER fail_session BEFORE INSERT ON sessions
      BEGIN SELECT RAISE(ABORT, 'injected session insert failure'); END`);
    // When / Then
    expect(() => auth.login(credentials)).toThrowError("injected session insert failure");
    expect(auth.authenticate(previous.token)).toEqual(previous.session);
  });
});
