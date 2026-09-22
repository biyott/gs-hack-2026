import { describe, expect, it } from "vitest";
import { SessionStreamRegistry } from "./session-streams";

const session = { sessionId: "session-a", deviceRole: "WORKER_1" } as const;

describe("session stream registry", () => {
  it("closes every connection exactly once when a session is invalidated repeatedly", () => {
    // Given
    const registry = new SessionStreamRegistry();
    const closed: string[] = [];
    registry.register(session, () => closed.push("first"));
    registry.register(session, () => closed.push("second"));
    // When
    registry.close(session.sessionId);
    registry.close(session.sessionId);
    // Then
    expect(closed).toEqual(["first", "second"]);
    expect(registry.count()).toBe(0);
  });

  it("removes disconnected connections when unregister is called repeatedly", () => {
    // Given
    const registry = new SessionStreamRegistry();
    const closed: string[] = [];
    const unregister = registry.register(session, () => closed.push("closed"));
    // When
    unregister();
    unregister();
    registry.close(session.sessionId);
    // Then
    expect(registry.count()).toBe(0);
    expect(closed).toEqual([]);
  });

  it("closes only the displaced device slot when a new session activates", () => {
    // Given
    const registry = new SessionStreamRegistry();
    const closed: string[] = [];
    registry.register(session, () => closed.push("replaced"));
    registry.register({ sessionId: "worker-b", deviceRole: "WORKER_2" }, () =>
      closed.push("other-worker"),
    );
    registry.register({ sessionId: "admin", deviceRole: null }, () => closed.push("admin"));
    registry.register({ ...session, sessionId: "new-session" }, () => closed.push("new-session"));
    // When
    registry.replaceDevice({ ...session, sessionId: "new-session" });
    // Then
    expect(closed).toEqual(["replaced"]);
    expect(registry.count()).toBe(3);
  });

  it("preserves independent manager connections when a manager logs in", () => {
    // Given
    const registry = new SessionStreamRegistry();
    registry.register({ sessionId: "admin", deviceRole: null }, () => {});
    // When
    registry.replaceDevice({ sessionId: "admin-new", deviceRole: null });
    // Then
    expect(registry.count()).toBe(1);
  });
});
