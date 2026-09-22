import assert from "node:assert/strict";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { SimulationSnapshot } from "@/contracts";
import { SimulationRuntime } from "./runtime";
import { cleanups, fixture } from "./runtime-test-fixtures";

describe("runtime publication ordering", () => {
  it("creates a fresh UUID for each runtime while sharing it across its two modes", () => {
    // Given
    const f = fixture();
    const originalId = f.snapshot().streamId;
    // When
    const next = new SimulationRuntime(f.runtime.dependencies);
    cleanups.push(() => next.dispose());
    // Then
    expect(z.uuid().safeParse(originalId).success).toBe(true);
    expect(f.snapshot("fire-gas").streamId).toBe(originalId);
    const nextId = next.getRun("equipment").snapshot.streamId;
    expect(z.uuid().safeParse(nextId).success).toBe(true);
    expect(nextId).not.toBe(originalId);
    expect(next.getRun("fire-gas").snapshot.streamId).toBe(nextId);
  });

  it.each(["equipment", "fire-gas"] as const)(
    "orders %s transient, committed and reset publications independently",
    (mode) => {
      // Given
      vi.useFakeTimers();
      const f = fixture();
      const initial = f.snapshot(mode);
      const other = f.snapshot(mode === "equipment" ? "fire-gas" : "equipment");
      const publications: SimulationSnapshot[] = [];
      cleanups.push(f.runtime.bus.subscribe(mode, (snapshot) => publications.push(snapshot)));
      const started = f.command({ action: "start" }, mode);
      f.runtime.startScheduler();
      // When
      vi.advanceTimersByTime(200);
      const transient = f.snapshot(mode);
      const persisted = f.repository.current(mode);
      const committed = f.command({ action: "speed", speed: 2 }, mode);
      vi.advanceTimersByTime(100);
      const reset = f.command({ action: "reset" }, mode);
      // Then
      expect(transient.run.virtualTimeMs).toBe(200);
      expect(transient.run.version).toBe(started.run.version);
      expect(persisted).toEqual(started);
      expect(publications.length).toBeGreaterThanOrEqual(6);
      expect(publications).toContainEqual(committed);
      expect(publications.at(-1)).toEqual(reset);
      let previous = initial.sequence;
      for (const snapshot of publications) {
        expect(snapshot.streamId).toBe(initial.streamId);
        expect(snapshot.sequence).toBeGreaterThan(previous);
        previous = snapshot.sequence;
      }
      expect(reset.run).toMatchObject({ version: 0, virtualTimeMs: 0, status: "idle" });
      expect(reset.run.runId).not.toBe(started.run.runId);
      expect(f.snapshot(other.mode)).toEqual(other);
    },
  );

  it("returns the current reset snapshot when replaying an older mutation", () => {
    // Given
    const f = fixture();
    const request = f.request({ action: "speed", speed: 4 });
    const original = f.runtime.command(request, f.admin);
    const reset = f.command({ action: "reset" });
    const publications: SimulationSnapshot[] = [];
    cleanups.push(f.runtime.bus.subscribe("equipment", (snapshot) => publications.push(snapshot)));
    // When
    const replay = f.runtime.command(request, f.admin);
    // Then
    expect(replay).toEqual(reset);
    expect(replay.streamId).toBe(reset.streamId);
    expect(replay.sequence).toBe(reset.sequence);
    expect(original.run.version).toBeGreaterThan(reset.run.version);
    expect(f.snapshot()).toEqual(reset);
    expect(publications).toEqual([]);
    assert.notEqual(original.run.runId, reset.run.runId);
  });
});
