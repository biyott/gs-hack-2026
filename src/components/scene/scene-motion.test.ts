import { describe, expect, it } from "vitest";
import type { SimulationSnapshot } from "@/contracts";
import { now, snapshot } from "@/server/incidents/test-fixtures";
import { beginSceneMotion, sampleSceneMotion } from "./scene-motion";

const wallTime = Date.parse(now);
function target(x: number, sequence = 1): SimulationSnapshot {
  const observed = new Date(wallTime + sequence * 100).toISOString();
  return {
    ...snapshot,
    sequence,
    run: { ...snapshot.run },
    equipment: { ...snapshot.equipment, position: { x, y: x }, lastObservedAt: observed },
    workers: snapshot.workers.map((worker) => ({
      ...worker,
      position: { x, y: x },
      lastObservedAt: observed,
    })),
  };
}
const initial = () => beginSceneMotion(null, target(0, 0), "map:1", 0, wallTime, true);

describe("scene display motion", () => {
  it("moves both entity types between received poses and stops at the target", () => {
    // Given
    const next = target(10);
    const motion = beginSceneMotion(initial(), next, "map:1", 100, wallTime + 100, true);
    // When
    const halfway = sampleSceneMotion(motion, 150);
    // Then
    expect(halfway.equipment.position).toEqual({ x: 5, y: 5 });
    expect(halfway.workers[0]?.position).toEqual({ x: 5, y: 5 });
    expect(sampleSceneMotion(motion, 200)).toBe(next);
    expect(sampleSceneMotion(motion, 1000)).toBe(next);
    expect(next.equipment.position.x).toBe(10);
  });

  it("retargets from the displayed position when a new sample arrives mid-frame", () => {
    // Given
    const moving = beginSceneMotion(initial(), target(10), "map:1", 100, wallTime + 100, true);
    // When
    const retargeted = beginSceneMotion(moving, target(20, 2), "map:1", 150, wallTime + 200, true);
    // Then
    expect(sampleSceneMotion(retargeted, 150).equipment.position.x).toBe(5);
    expect(sampleSceneMotion(retargeted, 200).equipment.position.x).toBe(12.5);
  });

  it("keeps latest safety metadata and unsmoothed controls while poses interpolate", () => {
    // Given
    const next = target(10);
    next.equipment.boomAngleDeg = 30;
    next.closedEdgeIds = ["NEW-CLOSED-EDGE"];
    // When
    const display = sampleSceneMotion(
      beginSceneMotion(initial(), next, "map:1", 100, wallTime + 100, true),
      150,
    );
    // Then
    expect(display.equipment.position.x).toBe(5);
    expect(display.equipment.boomAngleDeg).toBe(30);
    expect(display.equipment.lastObservedAt).toBe(next.equipment.lastObservedAt);
    expect(display.run).toBe(next.run);
    expect(display.hazards).toBe(next.hazards);
    expect(display.closedEdgeIds).toBe(next.closedEdgeIds);
    expect(display.workers[0]?.currentGuidance).toBe(next.workers[0]?.currentGuidance);
  });

  it("takes the shortest angle across north for heading and slew", () => {
    // Given
    const first = target(0, 0);
    first.equipment.headingDeg = 350;
    first.equipment.slewDeg = 10;
    const next = target(10);
    next.equipment.headingDeg = 10;
    next.equipment.slewDeg = 350;
    const previous = beginSceneMotion(null, first, "map:1", 0, wallTime, true);
    // When
    const display = sampleSceneMotion(
      beginSceneMotion(previous, next, "map:1", 100, wallTime + 100, true),
      150,
    );
    // Then
    expect(display.equipment.headingDeg % 360).toBe(0);
    expect(display.equipment.slewDeg % 360).toBe(0);
  });

  it.each([
    [
      "run",
      (value: SimulationSnapshot) => {
        value.run.runId = "different";
      },
    ],
    [
      "stream",
      (value: SimulationSnapshot) => {
        value.streamId = "different";
      },
    ],
    [
      "map",
      (value: SimulationSnapshot) => {
        value.run.mapVersion = "different";
      },
    ],
    [
      "preset",
      (value: SimulationSnapshot) => {
        value.equipment.presetId = "different";
      },
    ],
    [
      "input",
      (value: SimulationSnapshot) => {
        value.run.positionInput = "measured";
      },
    ],
    [
      "pause",
      (value: SimulationSnapshot) => {
        value.run.status = "paused";
      },
    ],
    [
      "complete",
      (value: SimulationSnapshot) => {
        value.run.status = "completed";
      },
    ],
    [
      "backwards sequence",
      (value: SimulationSnapshot) => {
        value.sequence = 0;
      },
    ],
  ] as const)("snaps all poses on a %s boundary", (_label, change) => {
    // Given
    const next = target(10);
    change(next);
    // When
    const motion = beginSceneMotion(initial(), next, "map:1", 100, wallTime + 100, true);
    // Then
    expect(sampleSceneMotion(motion, 150)).toBe(next);
    expect(motion.animating).toBe(false);
  });

  it.each(["stale", "unknown"] as const)("snaps entities whose position becomes %s", (status) => {
    // Given
    const next = target(10);
    next.equipment.positionStatus = status;
    next.workers = next.workers.map((worker) => ({ ...worker, positionStatus: status }));
    // When
    const display = sampleSceneMotion(
      beginSceneMotion(initial(), next, "map:1", 100, wallTime + 100, true),
      150,
    );
    // Then
    expect(display.equipment).toBe(next.equipment);
    expect(display.workers[0]).toBe(next.workers[0]);
  });

  it.each(["live", "unknown"] as const)("snaps %s provenance", (source) => {
    // Given
    const next = target(10);
    next.equipment.positionInputSource = source;
    next.workers = next.workers.map((worker) => ({ ...worker, positionInputSource: source }));
    // When
    const display = sampleSceneMotion(
      beginSceneMotion(initial(), next, "map:1", 100, wallTime + 100, true),
      150,
    );
    // Then
    expect(display.equipment).toBe(next.equipment);
    expect(display.workers[0]).toBe(next.workers[0]);
  });

  it("snaps manual positions and removed or newly identified workers", () => {
    // Given
    const next = target(10);
    next.equipment.positionSource = "manual";
    next.workers = next.workers.map((worker) => ({ ...worker, workerId: "NEW-WORKER" }));
    // When
    const display = sampleSceneMotion(
      beginSceneMotion(initial(), next, "map:1", 100, wallTime + 100, true),
      150,
    );
    // Then
    expect(display.equipment).toBe(next.equipment);
    expect(display.workers).toEqual(next.workers);
  });

  it.each([
    ["arrival gap", "map:1", 501, true],
    ["map or connection epoch", "map:2", 100, true],
    ["reduced motion or disconnection", "map:1", 100, false],
  ] as const)("snaps after %s", (_label, scope, time, enabled) => {
    // Given
    const next = target(10);
    // When
    const motion = beginSceneMotion(initial(), next, scope, time, wallTime + 100, enabled);
    // Then
    expect(sampleSceneMotion(motion, time + 50)).toBe(next);
  });

  it("snaps observations older than the freshness limit despite known status", () => {
    // Given
    const next = target(10);
    next.equipment.lastObservedAt = new Date(wallTime - 1000).toISOString();
    next.workers = next.workers.map((worker) => ({ ...worker, lastObservedAt: null }));
    // When
    const display = sampleSceneMotion(
      beginSceneMotion(initial(), next, "map:1", 100, wallTime + 100, true),
      150,
    );
    // Then
    expect(display.equipment).toBe(next.equipment);
    expect(display.workers[0]).toBe(next.workers[0]);
  });

  it.each([
    { tableLinked: true },
    { positionSource: "uwb" },
    { lastObservedAt: now },
    { lastObservedAt: new Date(wallTime + 1000).toISOString() },
  ] as const)("snaps equipment authority changes without stopping a valid worker", (change) => {
    // Given
    const next = target(10);
    next.equipment = { ...next.equipment, ...change };
    // When
    const display = sampleSceneMotion(
      beginSceneMotion(initial(), next, "map:1", 100, wallTime + 100, true),
      150,
    );
    // Then
    expect(display.equipment).toBe(next.equipment);
    expect(display.workers[0]?.position?.x).toBe(5);
  });
});
