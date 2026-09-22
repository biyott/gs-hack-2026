import { createHash } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { createDatabase, type SafetyDatabase } from "../db";
import { seedAccounts } from "./seed-accounts";
import { createAuthService } from "./sessions";

const databases: SafetyDatabase[] = [];

afterEach(() => {
  for (const database of databases.splice(0)) database.close();
});

function fixture() {
  const database = createDatabase(":memory:");
  databases.push(database);
  seedAccounts(database, [
    { id: "worker-a", role: "worker", workerId: "WORKER-A", pin: "A-23456" },
    { id: "admin", role: "admin", workerId: null, pin: "B-98765" },
  ]);
  let now = Date.parse("2026-09-21T09:00:00Z");
  const auth = createAuthService(database, { now: () => now, sessionTtlMs: 60_000 });
  return {
    database,
    auth,
    advance: (milliseconds: number) => {
      now += milliseconds;
    },
  };
}

describe("opaque authenticated sessions", () => {
  it("stores only a token hash when a valid account logs in", () => {
    // Given
    const { database, auth } = fixture();
    // When
    const session = auth.login({ actorId: "worker-a", role: "worker", accessCode: "A-23456" });
    // Then
    expect(session.session.workerId).toBe("WORKER-A");
    expect(session.token.length).toBeGreaterThanOrEqual(40);
    const stored = database.sqlite.prepare("SELECT token_hash FROM sessions").all();
    expect(JSON.stringify(stored)).not.toContain(session.token);
    expect(auth.authenticate(session.token)?.actorId).toBe("worker-a");
  });

  it("rejects the wrong PIN without issuing a session", () => {
    // Given
    const { database, auth } = fixture();
    // When / Then
    expect(() =>
      auth.login({ actorId: "admin", role: "admin", accessCode: "A-23456" }),
    ).toThrowError("Invalid credentials");
    expect(database.sqlite.prepare("SELECT count(*) AS count FROM sessions").get()).toEqual({
      count: 0,
    });
  });

  it("denies a session at its exact expiry boundary", () => {
    // Given
    const { auth, advance } = fixture();
    const session = auth.login({ actorId: "worker-a", role: "worker", accessCode: "A-23456" });
    advance(60_000);
    // When
    const user = auth.authenticate(session.token);
    // Then
    expect(user).toBeNull();
  });

  it("accepts a session immediately before its expiry boundary", () => {
    // Given
    const { auth, advance } = fixture();
    const issued = auth.login({ actorId: "worker-a", role: "worker", accessCode: "A-23456" });
    advance(59_999);
    // When
    const session = auth.authenticate(issued.token);
    // Then
    expect(session).toEqual(issued.session);
  });

  it("rejects the stored token digest as a bearer credential", () => {
    // Given
    const { auth } = fixture();
    const issued = auth.login({ actorId: "worker-a", role: "worker", accessCode: "A-23456" });
    const digest = createHash("sha256").update(issued.token).digest("hex");
    // When
    const session = auth.authenticate(digest);
    // Then
    expect(session).toBeNull();
  });

  it("issues independent sessions when the same account logs in twice", () => {
    // Given
    const { auth } = fixture();
    const original = auth.login({ actorId: "worker-a", role: "worker", accessCode: "A-23456" });
    // When
    const second = auth.login({ actorId: "worker-a", role: "worker", accessCode: "A-23456" });
    // Then
    expect(second.token).not.toBe(original.token);
    expect(second.session.sessionId).not.toBe(original.session.sessionId);
  });

  it("leaves another session valid when one session logs out", () => {
    // Given
    const { auth } = fixture();
    const original = auth.login({ actorId: "worker-a", role: "worker", accessCode: "A-23456" });
    const second = auth.login({ actorId: "worker-a", role: "worker", accessCode: "A-23456" });
    // When
    auth.logout(original.token);
    // Then
    expect(auth.authenticate(second.token)).toEqual(second.session);
  });

  it.each(["", "unknown-token", "x".repeat(43)])(
    "rejects unknown bearer credentials %s",
    (token) => {
      // Given
      const { auth } = fixture();
      // When
      const session = auth.authenticate(token);
      // Then
      expect(session).toBeNull();
    },
  );

  it("revokes a live session when logout is requested", () => {
    // Given
    const { auth } = fixture();
    const session = auth.login({ actorId: "worker-a", role: "worker", accessCode: "A-23456" });
    // When
    auth.logout(session.token);
    // Then
    expect(auth.authenticate(session.token)).toBeNull();
  });

  it("uses current account authorization when an account is disabled", () => {
    // Given
    const { database, auth } = fixture();
    const session = auth.login({ actorId: "admin", role: "admin", accessCode: "B-98765" });
    database.sqlite.prepare("UPDATE accounts SET enabled = 0 WHERE id = ?").run("admin");
    // When
    const user = auth.authenticate(session.token);
    // Then
    expect(user).toBeNull();
  });
});
