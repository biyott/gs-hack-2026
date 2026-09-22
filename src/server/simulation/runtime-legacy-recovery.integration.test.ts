import assert from "node:assert/strict";
import { describe, expect, it } from "vitest";
import { SimulationRun } from "./run";
import { configuration, fixture } from "./runtime-test-fixtures";

describe("runtime snapshot-only legacy recovery", () => {
  it("reopens restored path closures when the later scenario event authorizes reopening", () => {
    // Given
    const f = fixture();
    f.command({ action: "select", scenarioId: "FG-CLEAR-REOPEN" }, "fire-gas");
    f.command({ action: "start" }, "fire-gas");
    const saved = f.command({ action: "advance", deltaMs: 1000 }, "fire-gas");
    expect(saved.closedEdgeIds.length).toBeGreaterThan(0);
    const scenario = configuration.scenarios.find((entry) => entry.id === "FG-CLEAR-REOPEN");
    assert.ok(scenario);
    const legacy = new SimulationRun(scenario, configuration, structuredClone(saved));
    legacy.clock.resume();
    const uninterrupted = f.command({ action: "advance", deltaMs: 19000 }, "fire-gas");
    expect(uninterrupted.closedEdgeIds).toEqual([]);
    // When
    legacy.advance(19000, 0);
    // Then
    expect(legacy.snapshot.closedEdgeIds).toEqual(uninterrupted.closedEdgeIds);
    expect(legacy.world.state.blockedPathIds).toEqual([]);
  });
});
