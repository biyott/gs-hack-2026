import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { SimulationCommandSchema } from "@/contracts";
import { SimulationRuntime } from "./runtime";
import { active, cleanups, fixture, normalized } from "./runtime-test-fixtures";

describe("runtime with real SQLite and scenario catalog", () => {
  it.each(["reset", "select"] as const)(
    "replays %s exactly once when the same request is retried",
    (action) => {
      // Given
      const f = active();
      const request = f.request(
        action === "reset" ? { action } : { action, scenarioId: "EQ-ARRIVAL" },
      );
      const first = f.runtime.command(request, f.admin);
      // When
      const replay = f.runtime.command(request, f.admin);
      // Then
      expect(replay).toEqual(first);
      expect(f.snapshot().run.runId).toBe(first.run.runId);
    },
  );

  it("replays a clock command without adding another history record", () => {
    // Given
    const f = fixture();
    const request = f.request({ action: "speed", speed: 4 });
    const first = f.runtime.command(request, f.admin);
    const history = f.repository.history(first.run.runId);
    // When
    const replay = f.runtime.command(request, f.admin);
    // Then
    expect(replay).toEqual(first);
    expect(f.repository.history(first.run.runId)).toEqual(history);
  });

  it("replays incident mutation exactly once when the same request is retried", () => {
    // Given
    const f = active();
    const request = f.action({ action: "acknowledge" });
    const first = f.runtime.incident(request, f.admin);
    // When
    const replay = f.runtime.incident(request, f.admin);
    // Then
    expect(replay).toEqual(first);
    expect(f.repository.history(first.run.runId).at(-1)).toEqual(first);
  });

  it("synchronizes the losing runtime to the winner when a competing version wins", () => {
    // Given
    const f = fixture();
    const contender = new SimulationRuntime(f.runtime.dependencies);
    cleanups.push(() => contender.dispose());
    const before = contender.getRun("equipment").snapshot;
    const winner = f.command({ action: "speed", speed: 2 });
    const history = f.repository.history(winner.run.runId);
    const audits = f.repository.audits(winner.run.runId);
    const requestId = randomUUID();
    // When / Then
    expect(() =>
      contender.command(
        SimulationCommandSchema.parse({
          action: "speed",
          speed: 4,
          mode: "equipment",
          expectedVersion: before.run.version,
          requestId,
        }),
        f.admin,
      ),
    ).toThrowError(expect.objectContaining({ code: "VERSION_CONFLICT" }));
    expect(contender.getRun("equipment").snapshot).toEqual({
      ...winner,
      streamId: before.streamId,
      sequence: expect.any(Number),
    });
    expect(contender.getRun("equipment").snapshot.sequence).toBeGreaterThan(before.sequence);
    expect(contender.getRun("equipment").clock.snapshot().speed).toBe(2);
    expect(f.repository.current("equipment")?.run.speed).toBe(2);
    expect(f.repository.history(winner.run.runId)).toEqual(history);
    expect(f.repository.audits(winner.run.runId)).toEqual(audits);
    expect(f.repository.findRequestReceipt("equipment", requestId)).toBeNull();
  });

  it.each(["equipment", "fire-gas"] as const)(
    "keeps the other mode independent when %s is advanced",
    (mode) => {
      // Given
      const f = fixture();
      const other = f.snapshot(mode === "equipment" ? "fire-gas" : "equipment");
      f.command({ action: "start" }, mode);
      // When
      const advanced = f.command({ action: "advance", deltaMs: 3000 }, mode);
      // Then
      expect(advanced.run).toMatchObject({ virtualTimeMs: 4500, status: "running", speed: 1.5 });
      expect(advanced.incidents.length).toBeGreaterThan(0);
      expect(f.snapshot(other.mode)).toEqual(other);
      expect(f.repository.history(other.run.runId)).toEqual([other]);
    },
  );

  it.each(["equipment", "fire-gas"] as const)(
    "repeats the same normalized %s result across three new runs",
    (mode) => {
      // Given / When
      const results = Array.from({ length: 3 }, () => {
        const f = fixture();
        f.command({ action: "start" }, mode);
        f.command({ action: "advance", deltaMs: 6000 }, mode);
        return normalized(f.snapshot(mode));
      });
      // Then
      expect(results[0]).toEqual(results[1]);
      expect(results[1]).toEqual(results[2]);
    },
  );

  it.each([false, true])(
    "advances only resumed clocks at selected speed when resumed=%s",
    (resumed) => {
      // Given
      const f = active();
      f.command({ action: "pause" });
      f.command({ action: "speed", speed: 4 });
      if (resumed) f.command({ action: "resume" });
      // When
      const result = f.command({ action: "advance", deltaMs: 1000 });
      // Then
      expect(result.run).toMatchObject({
        virtualTimeMs: resumed ? 5500 : 1500,
        status: resumed ? "running" : "paused",
        speed: 4,
      });
    },
  );

  it("rejects old guidance when resetting to a new run", () => {
    // Given
    const f = active();
    const old = f.response("understood");
    const worker = f.session("worker-a");
    const reset = f.command({ action: "reset" });
    // When / Then
    expect(() => f.runtime.respond(old, worker)).toThrowError(
      expect.objectContaining({ code: "STALE_GUIDANCE" }),
    );
    expect(reset.run.runId).not.toBe(old.runId);
    expect(reset).toMatchObject({
      incidents: [],
      events: [],
      run: { status: "idle", virtualTimeMs: 0 },
    });
    expect(f.repository.get(old.runId)?.incidents.length).toBeGreaterThan(0);
  });

  it("rejects the second command when two commands share an expected version", () => {
    // Given
    const f = fixture();
    const stale = f.request({ action: "speed", speed: 4 });
    const first = f.command({ action: "speed", speed: 2 });
    const history = f.repository.history(first.run.runId);
    // When / Then
    expect(() => f.runtime.command(stale, f.admin)).toThrowError(
      expect.objectContaining({ code: "VERSION_CONFLICT" }),
    );
    expect(f.snapshot()).toEqual(first);
    expect(f.repository.history(first.run.runId)).toEqual(history);
  });
});
