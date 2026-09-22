import assert from "node:assert/strict";
import { describe, expect, it } from "vitest";
import { configuration, fixture } from "./runtime-test-fixtures";

function measuredProfileRun() {
  const f = fixture();
  f.command({ action: "select", scenarioId: "EQ-PROFILE-ROUTES" });
  f.command({ action: "position-input", input: "measured" });
  f.command({ action: "start" });
  f.command({ action: "advance", deltaMs: 1000 });
  return f;
}

describe("runtime profile events with measured positions", () => {
  it("applies the new profile to the snapshot and primary guidance without restoring scenario coordinates", () => {
    // Given
    const f = measuredProfileRun();
    const scenario = configuration.scenarios.find((entry) => entry.id === "EQ-PROFILE-ROUTES");
    const event = scenario?.events.find((entry) => entry.type === "worker.profile");
    assert.ok(event?.type === "worker.profile");
    // When
    const result = f.command({ action: "advance", deltaMs: 7000 });
    // Then
    const worker = result.workers.find((entry) => entry.workerId === event.profile.workerId);
    expect(worker?.profile).toEqual(event.profile);
    expect(worker).toMatchObject({
      position: null,
      positionStatus: "unknown",
      positionInputSource: "unknown",
    });
    expect(worker?.currentGuidance).toMatchObject({
      profileVersion: event.profile.version,
      profileSnapshot: event.profile,
      updateKind: "primary",
      actionCode: "POSITION_UNKNOWN",
    });
    expect(
      f.repository
        .current("equipment")
        ?.workers.find((entry) => entry.workerId === event.profile.workerId)?.profile,
    ).toEqual(event.profile);
  });

  it("rejects a response to an older profile after the scenario changes the measured worker's profile", () => {
    // Given
    const f = measuredProfileRun();
    const old = f.response("understood");
    const actor = f.session("worker-a");
    const current = f.command({ action: "advance", deltaMs: 7000 });
    // When / Then
    expect(() => f.runtime.respond(old, actor)).toThrowError(
      expect.objectContaining({ code: "STALE_GUIDANCE" }),
    );
    expect(f.snapshot()).toEqual(current);
  });
});
