import assert from "node:assert/strict";
import { describe, expect, it } from "vitest";
import type { SimulationSnapshot } from "@/contracts";
import { active, cleanups } from "./runtime-test-fixtures";

describe("runtime playback for a new primary issued during pause", () => {
  it.each([false, true])("accepts a started acknowledgement with resumed=%s", (resumed) => {
    // Given
    const f = active();
    const actor = f.session("worker-a");
    f.runtime.respond(f.response("voice-started"), actor);
    const paused = f.command({ action: "pause" });
    const oldWorker = paused.workers[0];
    assert.ok(oldWorker?.currentGuidance);
    expect(oldWorker.response.voiceStatus).toBe("stop-requested");
    const updated = f.command({
      action: "profile",
      workerId: oldWorker.workerId,
      profile: { ...oldWorker.profile, version: oldWorker.profile.version + 1 },
    });
    expect(updated.run.status).toBe("paused");
    expect(updated.workers[0]?.currentGuidance?.guidanceVersion).toBe(
      oldWorker.currentGuidance.guidanceVersion + 1,
    );
    expect(updated.workers[0]?.response).toMatchObject({
      voiceStatus: "pending",
      voiceStopRequestedAt: null,
      spokenAt: null,
    });
    if (resumed) f.command({ action: "resume" });
    const before = f.snapshot();
    const publications: SimulationSnapshot[] = [];
    cleanups.push(f.runtime.bus.subscribe("equipment", (snapshot) => publications.push(snapshot)));
    // When
    const result = f.runtime.respond(f.response("voice-started"), actor);
    // Then
    expect(result.run.status).toBe(resumed ? "running" : "paused");
    expect(result.workers[0]?.response).toMatchObject({
      voiceStatus: resumed ? "playing" : "stop-requested",
      voiceStopRequestedAt: resumed ? null : new Date().toISOString(),
      spokenAt: null,
    });
    expect(result.workers[0]?.currentGuidance).toEqual(updated.workers[0]?.currentGuidance);
    expect(result.incidents[0]?.firstGuidance).toEqual(paused.incidents[0]?.firstGuidance);
    expect(f.repository.current("equipment")).toEqual(result);
    expect(publications).toEqual([result]);
    expect(result.sequence).toBeGreaterThan(before.sequence);
  });
});
