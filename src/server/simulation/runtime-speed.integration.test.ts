import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { cleanups, fixture } from "./runtime-test-fixtures";

describe("runtime simulation speed", () => {
  it.each(["equipment", "fire-gas"] as const)(
    "advances at 1.5x when a new %s run starts",
    (mode) => {
      // Given
      const f = fixture();
      f.command({ action: "start" }, mode);
      // When
      const result = f.command({ action: "advance", deltaMs: 500 }, mode);
      // Then
      expect(result.run).toMatchObject({ virtualTimeMs: 750, speed: 1.5 });
    },
  );

  describe.each([
    {
      mode: "equipment",
      scenarioId: "EQ-ARRIVAL",
      speed: 0.5,
      otherMode: "fire-gas",
      otherSpeed: 1.2,
    },
    {
      mode: "fire-gas",
      scenarioId: "FG-NO-ROUTE",
      speed: 1.2,
      otherMode: "equipment",
      otherSpeed: 0.5,
    },
  ] as const)("$mode speed preference", ({ mode, scenarioId, speed, otherMode, otherSpeed }) => {
    it.each(["reset", "select"] as const)(
      "preserves the last selected speed when %s replaces a run",
      (action) => {
        // Given
        const f = fixture();
        f.command({ action: "speed", speed: 4 }, mode);
        f.command({ action: "speed", speed }, mode);
        f.command({ action: "speed", speed: otherSpeed }, otherMode);
        const otherRunId = f.snapshot(otherMode).run.runId;
        // When
        const result = f.command(action === "reset" ? { action } : { action, scenarioId }, mode);
        // Then
        expect(result.run).toMatchObject({ virtualTimeMs: 0, speed, status: "idle" });
        expect(f.runtime.getRun(mode).clock.snapshot().speed).toBe(speed);
        expect(f.snapshot(otherMode).run).toMatchObject({
          runId: otherRunId,
          speed: otherSpeed,
        });
      },
    );

    it.each(["reset", "select"] as const)(
      "preserves the saved speed when %s replaces a run after SQLite is reopened",
      (action) => {
        // Given
        const directory = mkdtempSync(join(tmpdir(), "gs-runtime-speed-replace-"));
        cleanups.push(() => rmSync(directory, { recursive: true, force: true }));
        const path = join(directory, "safety.sqlite");
        const original = fixture(path);
        original.command({ action: "speed", speed }, mode);
        original.command({ action: "speed", speed: otherSpeed }, otherMode);
        original.runtime.dispose();
        original.database.close();
        const restored = fixture(path);
        // When
        const result = restored.command(
          action === "reset" ? { action } : { action, scenarioId },
          mode,
        );
        // Then
        expect(result.run).toMatchObject({ virtualTimeMs: 0, speed, status: "idle" });
        expect(restored.runtime.getRun(mode).clock.snapshot().speed).toBe(speed);
        expect(restored.repository.current(mode)?.run.speed).toBe(speed);
        expect(restored.snapshot(otherMode).run.speed).toBe(otherSpeed);
      },
    );
  });

  it("applies a selected speed only to subsequent elapsed time", () => {
    // Given
    const f = fixture();
    f.command({ action: "start" });
    f.command({ action: "advance", deltaMs: 500 });
    f.command({ action: "speed", speed: 4 });
    // When
    const result = f.command({ action: "advance", deltaMs: 500 });
    // Then
    expect(result.run).toMatchObject({ virtualTimeMs: 2750, speed: 4 });
  });

  it("preserves the selected speed when SQLite is reopened", () => {
    // Given
    const directory = mkdtempSync(join(tmpdir(), "gs-runtime-speed-"));
    cleanups.push(() => rmSync(directory, { recursive: true, force: true }));
    const path = join(directory, "safety.sqlite");
    const original = fixture(path);
    original.command({ action: "speed", speed: 0.5 });
    original.command({ action: "start" });
    original.command({ action: "advance", deltaMs: 500 });
    original.runtime.dispose();
    original.database.close();
    // When
    const restored = fixture(path);
    // Then
    expect(restored.snapshot().run).toMatchObject({
      virtualTimeMs: 250,
      speed: 0.5,
      status: "paused",
    });
    expect(restored.runtime.getRun("equipment").clock.snapshot().speed).toBe(0.5);
  });
});
