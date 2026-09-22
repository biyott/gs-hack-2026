import assert from "node:assert/strict";
import { describe, expect, it } from "vitest";
import { ScenarioSchema } from "../scenarios";
import { configuration, fixture } from "./runtime-test-fixtures";

function separateHazards() {
  const base = configuration.scenarios.find((scenario) => scenario.id === "FG-FIRE");
  assert.ok(base);
  const first = base.events.find((event) => event.type === "hazard.upsert");
  assert.ok(first?.type === "hazard.upsert");
  const fireSensor = base.initial.sensors.find((sensor) => sensor.hazardType === "fire");
  assert.ok(fireSensor);
  const scenario = ScenarioSchema.parse({
    ...base,
    initial: {
      ...base.initial,
      sensors: [
        ...base.initial.sensors,
        { ...fireSensor, sensorId: "SENSOR-FIRE-C", zoneId: "ZONE-C" },
      ],
    },
    events: [
      { ...first, id: "hazard-a", atMs: 1000 },
      { id: "close-b", type: "route.block", atMs: 1500, pathIds: ["PATH-B"] },
      {
        ...first,
        id: "hazard-b",
        atMs: 2000,
        hazard: {
          ...first.hazard,
          id: "FIRE-ZONE-C",
          zoneId: "ZONE-C",
          polygon: [
            { x: 87, y: 37 },
            { x: 94, y: 37 },
            { x: 94, y: 44 },
            { x: 87, y: 44 },
          ],
        },
      },
      { id: "close-c", type: "route.block", atMs: 2500, pathIds: ["PATH-C"] },
    ],
  });
  const f = fixture(":memory:", {
    ...configuration,
    scenarios: configuration.scenarios.map((entry) => (entry.id === base.id ? scenario : entry)),
  });
  f.command({ action: "start" }, "fire-gas");
  f.command({ action: "advance", deltaMs: 2500 }, "fire-gas");
  return f;
}

describe("runtime independent incidents", () => {
  it("creates two incidents when distinct hazards expose different workers", () => {
    // Given / When
    const f = separateHazards();
    // Then
    expect(f.snapshot("fire-gas").incidents.map((incident) => incident.hazardIds)).toEqual([
      ["FIRE-ZONE-B"],
      ["FIRE-ZONE-C"],
    ]);
    expect(
      new Set(f.snapshot("fire-gas").workers.map((worker) => worker.currentGuidance?.incidentId))
        .size,
    ).toBe(2);
  });

  it("leaves the second hazard active when the first incident is cleared", () => {
    // Given
    const f = separateHazards();
    // When
    const result = f.runtime.incident(f.action({ action: "clear-hazard" }, "fire-gas"), f.admin);
    // Then
    expect(
      result.hazards.map((hazard) => ({ id: hazard.hazardId, active: hazard.active })),
    ).toEqual([
      { id: "FIRE-ZONE-B", active: false },
      { id: "FIRE-ZONE-C", active: true },
    ]);
    expect(result.incidents.map((incident) => incident.status)).toEqual(["cleared", "active"]);
  });

  it("preserves another hazard's path closure when reopening the first incident", () => {
    // Given
    const f = separateHazards();
    f.runtime.incident(f.action({ action: "clear-hazard" }, "fire-gas"), f.admin);
    // When
    const result = f.runtime.incident(f.action({ action: "reopen-passage" }, "fire-gas"), f.admin);
    // Then
    expect([...result.closedEdgeIds].sort()).toEqual(
      configuration.map.edges
        .filter((edge) => edge.pathId === "PATH-C")
        .map((edge) => edge.id)
        .sort(),
    );
    expect(result.hazards.find((hazard) => hazard.hazardId === "FIRE-ZONE-C")?.active).toBe(true);
  });
});
