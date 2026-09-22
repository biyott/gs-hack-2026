import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { SimulationSnapshot } from "@/contracts";
import { active, cleanups, fixture } from "./runtime-test-fixtures";

function playing(path?: string) {
  const f = active(path);
  f.runtime.respond(f.response("voice-started"), f.session("worker-a"));
  expect(f.snapshot().workers[0]?.response).toMatchObject({
    voiceStatus: "playing",
    spokenAt: null,
  });
  return f;
}

describe("runtime playback stop requests on pause", () => {
  it("records an unconfirmed stop request only for playing workers and persists the published snapshot", () => {
    // Given
    const f = playing();
    const before = f.snapshot();
    const incident = before.incidents[0];
    assert.ok(incident);
    const history = f.repository.history(before.run.runId);
    const guidanceHistory = f.repository.guidanceHistory(incident.incidentId);
    const audits = f.repository.audits(before.run.runId);
    const publications: SimulationSnapshot[] = [];
    cleanups.push(f.runtime.bus.subscribe("equipment", (snapshot) => publications.push(snapshot)));
    // When
    const result = f.command({ action: "pause" });
    // Then
    expect(result.workers[0]?.response).toEqual({
      ...before.workers[0]?.response,
      voiceStatus: "stop-requested",
      voiceStopRequestedAt: new Date().toISOString(),
    });
    expect(result.workers[0]?.response.spokenAt).toBeNull();
    expect(result.workers.slice(1)).toEqual(
      before.workers.slice(1).map((worker) =>
        worker.currentGuidance &&
        (worker.response.voiceStatus === "pending" || worker.response.voiceStatus === "playing")
          ? {
              ...worker,
              response: {
                ...worker.response,
                voiceStatus:
                  worker.response.voiceStatus === "playing" ? "stop-requested" : "pending",
                voiceStopRequestedAt: new Date().toISOString(),
              },
            }
          : worker,
      ),
    );
    expect(result.workers[0]?.currentGuidance).toEqual(before.workers[0]?.currentGuidance);
    expect(result.incidents.map((entry) => entry.firstGuidance)).toEqual(
      before.incidents.map((entry) => entry.firstGuidance),
    );
    expect(result.run.status).toBe("paused");
    expect(result.streamId).toBe(before.streamId);
    expect(result.sequence).toBeGreaterThan(before.sequence);
    expect(f.repository.current("equipment")).toEqual(result);
    expect(publications).toEqual([result]);
    expect(f.repository.history(before.run.runId)).toEqual([...history, result]);
    expect(f.repository.guidanceHistory(incident.incidentId)).toEqual(guidanceHistory);
    expect(result.events.slice(0, before.events.length)).toEqual(before.events);
    expect(f.repository.audits(before.run.runId)).toEqual(expect.arrayContaining([...audits]));
    expect(result.events.slice(before.events.length)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "simulation.pause", actorId: "admin" }),
      ]),
    );
    expect(
      result.events
        .slice(before.events.length)
        .some(
          (event) =>
            event.kind === "worker.voice-completed" || event.kind === "worker.voice-failed",
        ),
    ).toBe(false);
  });

  it.each(["pending", "completed", "failed", "unsupported"] as const)(
    "preserves the actual %s voice state when pausing",
    (state) => {
      // Given
      const f = active();
      if (state !== "pending")
        f.runtime.respond(f.response(`voice-${state}`), f.session("worker-a"));
      const before = f.snapshot().workers[0]?.response;
      expect(before?.voiceStatus).toBe(state);
      // When
      const result = f.command({ action: "pause" });
      // Then
      expect(result.workers[0]?.response).toEqual(
        state === "pending"
          ? { ...before, voiceStopRequestedAt: new Date().toISOString() }
          : before,
      );
    },
  );

  it.each(["completed", "failed"] as const)(
    "accepts a genuine %s result after a stop request",
    (state) => {
      // Given
      const f = playing();
      const paused = f.command({ action: "pause" });
      expect(paused.workers[0]?.response.voiceStatus).toBe("stop-requested");
      // When
      const result = f.runtime.respond(f.response(`voice-${state}`), f.session("worker-a"));
      // Then
      expect(result.workers[0]?.response).toMatchObject({
        voiceStatus: state,
        spokenAt: state === "completed" ? new Date().toISOString() : null,
      });
      expect(result.workers[0]?.currentGuidance).toEqual(paused.workers[0]?.currentGuidance);
      expect(result.incidents[0]?.firstGuidance).toEqual(paused.incidents[0]?.firstGuidance);
      expect(f.repository.current("equipment")).toEqual(result);
    },
  );

  it("does not let a late started acknowledgement restore playback after pause and rapid resume", () => {
    // Given
    const f = playing();
    const delayedStart = f.response("voice-started");
    const before = f.snapshot().workers[0]?.currentGuidance;
    f.command({ action: "pause" });
    const resumed = f.command({ action: "resume" });
    expect(resumed.run.status).toBe("running");
    expect(resumed.workers[0]?.currentGuidance).toEqual(before);
    // When
    const result = f.runtime.respond(delayedStart, f.session("worker-a"));
    // Then
    expect(result.workers[0]?.response).toMatchObject({
      voiceStatus: "stop-requested",
      spokenAt: null,
    });
    expect(f.repository.current("equipment")).toEqual(result);
  });

  it("resets the stop request when a new primary guidance is issued", () => {
    // Given
    const f = playing();
    const paused = f.command({ action: "pause" });
    const worker = paused.workers[0];
    assert.ok(worker?.currentGuidance);
    expect(worker.response.voiceStatus).toBe("stop-requested");
    // When
    const result = f.command({
      action: "profile",
      workerId: worker.workerId,
      profile: { ...worker.profile, version: worker.profile.version + 1 },
    });
    // Then
    expect(result.workers[0]?.currentGuidance?.guidanceVersion).toBe(
      worker.currentGuidance.guidanceVersion + 1,
    );
    expect(result.workers[0]?.response).toMatchObject({
      voiceStatus: "pending",
      spokenAt: null,
      voiceStopRequestedAt: null,
    });
  });

  it("remembers a pause while pending before a delayed started acknowledgement and rapid resume", () => {
    // Given
    const f = active();
    const delayedStart = f.response("voice-started");
    const before = f.snapshot().workers[0]?.currentGuidance;
    expect(f.snapshot().workers[0]?.response.voiceStatus).toBe("pending");
    f.command({ action: "pause" });
    const resumed = f.command({ action: "resume" });
    expect(resumed.workers[0]?.currentGuidance).toEqual(before);
    // When
    const result = f.runtime.respond(delayedStart, f.session("worker-a"));
    // Then
    expect(result.workers[0]?.response).toMatchObject({
      voiceStatus: "stop-requested",
      spokenAt: null,
      voiceStopRequestedAt: new Date().toISOString(),
    });
    expect(f.repository.current("equipment")).toEqual(result);
  });

  it("restores a pending-primary stop marker from SQLite and rejects late playback resurrection", () => {
    // Given
    const directory = mkdtempSync(join(tmpdir(), "gs-playback-stop-"));
    cleanups.push(() => rmSync(directory, { recursive: true, force: true }));
    const databasePath = join(directory, "runtime.sqlite");
    const original = active(databasePath);
    const delayedStart = original.response("voice-started");
    const paused = original.command({ action: "pause" });
    original.runtime.dispose();
    original.database.close();
    // When
    const restored = fixture(databasePath);
    const recovered = restored.snapshot();
    restored.command({ action: "resume" });
    const result = restored.runtime.respond(delayedStart, restored.session("worker-a"));
    // Then
    expect(recovered.workers[0]?.response).toMatchObject({
      voiceStatus: "pending",
      spokenAt: null,
      voiceStopRequestedAt: new Date().toISOString(),
    });
    expect(recovered.workers[0]?.currentGuidance).toEqual(paused.workers[0]?.currentGuidance);
    expect(result.workers[0]?.response).toMatchObject({
      voiceStatus: "stop-requested",
      spokenAt: null,
      voiceStopRequestedAt: new Date().toISOString(),
    });
    expect(restored.repository.current("equipment")).toEqual(result);
  });

  it("requests stop when a running playback session is automatically paused during SQLite recovery", () => {
    // Given
    const directory = mkdtempSync(join(tmpdir(), "gs-playing-recovery-"));
    cleanups.push(() => rmSync(directory, { recursive: true, force: true }));
    const databasePath = join(directory, "runtime.sqlite");
    const original = playing(databasePath);
    const before = original.snapshot();
    const delayedStart = original.response("voice-started");
    expect(before.run.status).toBe("running");
    original.runtime.dispose();
    original.database.close();
    // When
    const restored = fixture(databasePath);
    const recovered = restored.snapshot();
    // Then
    expect(recovered.run.status).toBe("paused");
    expect(recovered.workers[0]?.response).toMatchObject({
      voiceStatus: "stop-requested",
      spokenAt: null,
      voiceStopRequestedAt: new Date().toISOString(),
    });
    expect(recovered.workers[0]?.currentGuidance).toEqual(before.workers[0]?.currentGuidance);
    expect(recovered.incidents[0]?.firstGuidance).toEqual(before.incidents[0]?.firstGuidance);
    restored.command({ action: "resume" });
    const result = restored.runtime.respond(delayedStart, restored.session("worker-a"));
    expect(result.workers[0]?.response.voiceStatus).toBe("stop-requested");
    expect(restored.repository.current("equipment")).toEqual(result);
  });
});
