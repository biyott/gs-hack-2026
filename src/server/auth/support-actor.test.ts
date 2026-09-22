import { afterEach, describe, expect, it } from "vitest";
import { createDatabase, type SafetyDatabase } from "../db";
import { seedAccounts } from "./seed-accounts";
import { isSupportActor } from "./support-actor";

const databases: SafetyDatabase[] = [];

afterEach(() => {
  for (const database of databases.splice(0)) database.close();
});

function fixture() {
  const database = createDatabase(":memory:");
  databases.push(database);
  seedAccounts(database, [
    { id: "support", role: "support", workerId: null, pin: "2026" },
    { id: "admin", role: "admin", workerId: null, pin: "2026" },
  ]);
  return database;
}

describe("current support assignees", () => {
  it("accepts a currently enabled support account", () => {
    // Given
    const database = fixture();
    // When
    const allowed = isSupportActor(database, "support");
    // Then
    expect(allowed).toBe(true);
  });

  it.each(["admin", "missing"])("rejects %s as a support assignee", (actorId) => {
    // Given
    const database = fixture();
    // When
    const allowed = isSupportActor(database, actorId);
    // Then
    expect(allowed).toBe(false);
  });

  it("rejects a disabled support account", () => {
    // Given
    const database = fixture();
    database.sqlite.prepare("UPDATE accounts SET enabled = 0 WHERE id = ?").run("support");
    // When
    const allowed = isSupportActor(database, "support");
    // Then
    expect(allowed).toBe(false);
  });
});
