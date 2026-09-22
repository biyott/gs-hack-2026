import { afterEach, describe, expect, it } from "vitest";
import { createDatabase, type SafetyDatabase } from "../db";
import { seedAccounts } from "./seed-accounts";
import { createAuthService } from "./sessions";
import type { DemoAccount } from "./types";

const databases: SafetyDatabase[] = [];
const worker = {
  id: "worker-a",
  role: "worker",
  workerId: "WORKER-A",
  deviceRole: "WORKER_1",
  pin: "A-23456",
} as const satisfies DemoAccount;

afterEach(() => {
  for (const database of databases.splice(0)) database.close();
});

function fixture() {
  const database = createDatabase(":memory:");
  databases.push(database);
  seedAccounts(database, [worker]);
  const auth = createAuthService(database);
  const issued = auth.login({ actorId: worker.id, role: worker.role, accessCode: worker.pin });
  return { database, auth, issued };
}

describe("account provisioning", () => {
  it("uses distinct salted hashes when two accounts share a PIN", () => {
    // Given
    const { database } = fixture();
    // When
    seedAccounts(database, [{ ...worker, id: "worker-b", workerId: "WORKER-B" }]);
    // Then
    const rows = database.sqlite.prepare("SELECT pin_hash FROM accounts ORDER BY id").all();
    expect(rows).toHaveLength(2);
    expect(rows[0]).not.toEqual(rows[1]);
    expect(JSON.stringify(rows)).not.toContain(worker.pin);
  });

  it("preserves sessions and stored hashes when seed input is unchanged", () => {
    // Given
    const { database, auth, issued } = fixture();
    const before = database.sqlite.prepare("SELECT * FROM accounts").all();
    // When
    seedAccounts(database, [worker]);
    // Then
    expect(database.sqlite.prepare("SELECT * FROM accounts").all()).toEqual(before);
    expect(auth.authenticate(issued.token)?.workerId).toBe("WORKER-A");
  });

  it.each([
    { ...worker, pin: "C-55555" },
    { ...worker, workerId: "WORKER-B" },
    { ...worker, deviceRole: "WORKER_2" },
    { ...worker, role: "observer", workerId: null, deviceRole: null },
  ] satisfies DemoAccount[])(
    "revokes issued sessions when authorization changes: %j",
    (account) => {
      // Given
      const { auth, database, issued } = fixture();
      // When
      seedAccounts(database, [account]);
      // Then
      expect(auth.authenticate(issued.token)).toBeNull();
    },
  );

  it("keeps disabled accounts disabled when seeding again", () => {
    // Given
    const { database, auth } = fixture();
    database.sqlite.prepare("UPDATE accounts SET enabled = 0").run();
    // When
    seedAccounts(database, [worker]);
    // Then
    expect(() =>
      auth.login({ actorId: worker.id, role: worker.role, accessCode: worker.pin }),
    ).toThrowError(expect.objectContaining({ code: "INVALID_CREDENTIALS" }));
  });

  it("rejects duplicate account IDs before writing any accounts", () => {
    // Given
    const { database } = fixture();
    const accounts = [
      { ...worker, id: "duplicate" },
      { ...worker, id: "duplicate" },
    ];
    // When / Then
    expect(() => seedAccounts(database, accounts)).toThrowError(
      expect.objectContaining({ code: "INVALID_CONFIGURATION" }),
    );
    expect(database.sqlite.prepare("SELECT id FROM accounts").all()).toEqual([{ id: worker.id }]);
  });

  it.each([
    { ...worker, id: "bad", workerId: null },
    { ...worker, id: "bad", deviceRole: "CCTV" },
    { ...worker, id: "bad", role: "device", deviceRole: "EQUIPMENT" },
    { ...worker, id: "bad", role: "device", workerId: null, deviceRole: null },
    { ...worker, id: "bad", role: "admin" },
  ] satisfies DemoAccount[])("rejects inconsistent authorization bindings: %j", (account) => {
    // Given
    const { database } = fixture();
    // When / Then
    expect(() => seedAccounts(database, [account])).toThrowError(
      expect.objectContaining({ code: "INVALID_CONFIGURATION" }),
    );
    expect(database.sqlite.prepare("SELECT id FROM accounts").all()).toEqual([{ id: worker.id }]);
  });

  it("accepts the new PIN after credentials are rotated", () => {
    // Given
    const { database, auth } = fixture();
    seedAccounts(database, [{ ...worker, pin: "C-55555" }]);
    // When
    const session = auth.login({ actorId: worker.id, role: worker.role, accessCode: "C-55555" });
    // Then
    expect(session.session.actorId).toBe(worker.id);
  });

  it("rejects the old PIN after credentials are rotated", () => {
    // Given
    const { database, auth } = fixture();
    seedAccounts(database, [{ ...worker, pin: "C-55555" }]);
    // When / Then
    expect(() =>
      auth.login({ actorId: worker.id, role: worker.role, accessCode: worker.pin }),
    ).toThrowError(expect.objectContaining({ code: "INVALID_CREDENTIALS" }));
  });
});
