import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { SimulationMode } from "@/contracts";
import { active, cleanups, fixture } from "./runtime-test-fixtures";

function running(mode: SimulationMode) {
  const f = fixture();
  f.command({ action: "start" }, mode);
  f.command({ action: "advance", deltaMs: 1000 }, mode);
  return f;
}

describe("runtime position input selection", () => {
  it.each(["equipment", "fire-gas"] as const)("defaults %s to explicit scenario input", (mode) => {
    // Given / When
    const f = fixture();
    // Then
    expect(f.snapshot(mode).run.positionInput).toBe("scenario");
    expect(
      f.snapshot(mode).workers.every((worker) => worker.positionInputSource === "synthetic"),
    ).toBe(true);
    expect(f.snapshot(mode).equipment).toMatchObject({
      positionInputSource: "synthetic",
      positionStatus: "known",
    });
  });

  it.each(["equipment", "fire-gas"] as const)(
    "persists and audits %s input selection without changing the other mode",
    (mode) => {
      // Given
      const f = running(mode);
      const other = f.snapshot(mode === "equipment" ? "fire-gas" : "equipment");
      const otherHistory = f.repository.history(other.run.runId);
      // When
      const selected = f.command({ action: "position-input", input: "measured" }, mode);
      // Then
      expect(selected.run.positionInput).toBe("measured");
      expect(f.repository.current(mode)?.run.positionInput).toBe("measured");
      expect(f.repository.audits(selected.run.runId)).toContainEqual(
        expect.objectContaining({ kind: "simulation.position-input", actorId: "admin" }),
      );
      expect(f.snapshot(other.mode)).toEqual(other);
      expect(f.repository.history(other.run.runId)).toEqual(otherHistory);
    },
  );

  it.each(["equipment", "fire-gas"] as const)(
    "clears scenario coordinates and issues POSITION_UNKNOWN when %s has no measurements",
    (mode) => {
      // Given
      const f = running(mode);
      // When
      const selected = f.command({ action: "position-input", input: "measured" }, mode);
      // Then
      for (const worker of selected.workers) {
        expect(worker).toMatchObject({
          position: null,
          positionStatus: "unknown",
          positionInputSource: "unknown",
          lastObservedAt: null,
        });
        expect(worker.currentGuidance?.actionCode).toBe("POSITION_UNKNOWN");
      }
      expect(selected.equipment.positionStatus).toBe("unknown");
      expect(selected.equipment.positionInputSource).toBe("unknown");
    },
  );

  it("restores the latest scripted position when switching back from measured input", () => {
    // Given
    const f = active();
    f.command({ action: "position-input", input: "measured" });
    f.command({ action: "advance", deltaMs: 9000 });
    // When
    const restored = f.command({ action: "position-input", input: "scenario" });
    // Then
    expect(restored.run.positionInput).toBe("scenario");
    expect(restored.workers[0]).toMatchObject({
      position: { x: 65, y: 8 },
      positionSource: "mock",
      positionInputSource: "synthetic",
      positionStatus: "known",
    });
    expect(restored.equipment.positionStatus).toBe("known");
  });

  it("invalidates the previous primary guidance when the position source changes", () => {
    // Given
    const f = active();
    const old = f.response("understood");
    const actor = f.session("worker-a");
    const selected = f.command({ action: "position-input", input: "measured" });
    // When / Then
    expect(() => f.runtime.respond(old, actor)).toThrowError(
      expect.objectContaining({ code: "STALE_GUIDANCE" }),
    );
    expect(selected.workers[0]?.currentGuidance).toMatchObject({
      updateKind: "primary",
      actionCode: "POSITION_UNKNOWN",
    });
    expect(selected.workers[0]?.currentGuidance?.guidanceVersion).toBeGreaterThan(
      old.guidanceVersion,
    );
  });

  it("retains measured selection and unknown positions when SQLite is reopened and resumed", () => {
    // Given
    const directory = mkdtempSync(join(tmpdir(), "gs-runtime-input-"));
    cleanups.push(() => rmSync(directory, { recursive: true, force: true }));
    const path = join(directory, "safety.sqlite");
    const f = active(path);
    f.command({ action: "position-input", input: "measured" });
    f.runtime.dispose();
    f.database.close();
    const reopened = fixture(path);
    expect(reopened.snapshot().run.status).toBe("paused");
    reopened.command({ action: "resume" });
    // When
    const result = reopened.command({ action: "advance", deltaMs: 250 });
    // Then
    expect(result.run).toMatchObject({ positionInput: "measured", status: "running" });
    for (const worker of result.workers) {
      expect(worker).toMatchObject({
        position: null,
        positionStatus: "unknown",
        positionInputSource: "unknown",
      });
      expect(worker.currentGuidance?.actionCode).toBe("POSITION_UNKNOWN");
    }
    expect(result.equipment).toMatchObject({
      positionStatus: "unknown",
      positionInputSource: "unknown",
    });
    expect(reopened.snapshot("fire-gas").run.positionInput).toBe("scenario");
  });
});
