import { describe, expect, it } from "vitest";
import { loadPolicies, loadScenario, loadScenarios, ScenarioDataError } from "./loader";
import { ScenarioSchema } from "./schema";

function fixture(id: string) {
  const scenario = loadScenario(id);
  if (scenario === undefined) throw new ScenarioDataError(id, "Test fixture missing");
  return scenario;
}

describe("scenario fixtures", () => {
  it("loads six equipment and eight fire-gas scenarios when reading the real data bundle", () => {
    // Given / When
    const scenarios = loadScenarios();
    // Then
    expect(scenarios.filter((scenario) => scenario.mode === "equipment")).toHaveLength(6);
    expect(scenarios.filter((scenario) => scenario.mode === "fire-gas")).toHaveLength(8);
  });

  it("preserves exact initial map positions and reviewed profiles when loading every scenario", () => {
    // Given / When
    const scenarios = loadScenarios();
    // Then
    for (const scenario of scenarios) {
      expect(
        scenario.initial.workers.find((worker) => worker.workerId === "WORKER-A"),
      ).toMatchObject({
        position: { x: 65, y: 25 },
        source: "mock",
        profile: { locale: "ko", canUseStairs: true, speedMps: { min: 0.8, max: 1.4 } },
      });
      expect(
        scenario.initial.workers.find((worker) => worker.workerId === "WORKER-B"),
      ).toMatchObject({
        position: { x: 90, y: 40 },
        source: "mock",
        profile: { locale: "en", canUseStairs: false, needsAssistance: true, needsCompanion: true },
      });
    }
  });

  it("keeps hazard clear and authorized route reopening at distinct times", () => {
    // Given / When
    const scenario = fixture("FG-CLEAR-REOPEN");
    // Then
    expect(scenario.events.find((event) => event.type === "hazard.clear")?.atMs).toBe(4500);
    expect(scenario.events.find((event) => event.type === "route.reopen")?.atMs).toBe(7500);
    expect(scenario.expectedResults).toContainEqual(
      expect.objectContaining({ atMs: 4500, kind: "blocked-paths", pathIds: ["PATH-B"] }),
    );
  });

  it("leaves a stale interval before disconnection when replaying the sensor-loss fixture", () => {
    // Given / When
    const scenario = fixture("FG-SENSOR-STALE");
    // Then
    const gasReadings = scenario.events.filter(
      (event) => event.type === "sensor.reading" && event.sensor.sensorId === "SENSOR-GAS-B",
    );
    expect(gasReadings.map((event) => event.atMs)).toEqual([500, 8000]);
    expect(
      scenario.events.find((event) => event.type === "source.connection" && !event.connected)?.atMs,
    ).toBe(7000);
  });

  it("retains unknown capability fields instead of interpreting them as unrestricted", () => {
    // Given / When
    const unknown = fixture("EQ-PROFILE-ROUTES").initial.workers.find(
      (worker) => worker.workerId === "WORKER-C",
    );
    // Then
    expect(unknown?.profile).toMatchObject({
      preferredLocale: null,
      canUseStairs: null,
      speedMps: null,
      needsAssistance: null,
      needsCompanion: null,
      confirmedAt: null,
    });
  });

  it("keeps compound priority independent of event order when loading response policies", () => {
    // Given / When
    const policies = loadPolicies().filter((policy) => policy.mode === "fire-gas");
    // Then
    for (const policy of policies) {
      const combined = policy.responses.find((response) => response.hazardType === "combined");
      expect(combined?.priority).toBe(100);
      expect(
        policy.responses
          .filter((response) => response.hazardType !== "combined")
          .every((response) => response.priority < 100),
      ).toBe(true);
    }
  });
});

describe("scenario boundary parsing", () => {
  it("rejects duplicate event identifiers when loading an ambiguous replay", () => {
    // Given
    const scenario = fixture("EQ-APPROACH");
    const first = scenario.events[0];
    // When
    const result = ScenarioSchema.safeParse({ ...scenario, events: [first, first] });
    // Then
    expect(result.success).toBe(false);
  });

  it("rejects a sensor event when parsing equipment mode", () => {
    // Given
    const scenario = fixture("EQ-APPROACH");
    const sensorEvent = fixture("FG-FIRE").events.find((event) => event.type === "sensor.reading");
    // When
    const result = ScenarioSchema.safeParse({ ...scenario, events: [sensorEvent] });
    // Then
    expect(result.success).toBe(false);
  });

  it("rejects an unknown worker event rather than silently applying it to nobody", () => {
    // Given
    const scenario = fixture("EQ-APPROACH");
    // When
    const result = ScenarioSchema.safeParse({
      ...scenario,
      events: [
        {
          id: "unknown",
          atMs: 1,
          type: "worker.position",
          workerId: "WORKER-MISSING",
          position: { x: 10, y: 10 },
        },
      ],
    });
    // Then
    expect(result.success).toBe(false);
  });

  it("rejects an observation timestamp from the future", () => {
    // Given
    const scenario = fixture("EQ-APPROACH");
    // When
    const result = ScenarioSchema.safeParse({
      ...scenario,
      events: [
        {
          id: "future",
          atMs: 1,
          type: "worker.position",
          workerId: "WORKER-A",
          position: { x: 10, y: 10 },
          observedAtMs: 2,
        },
      ],
    });
    // Then
    expect(result.success).toBe(false);
  });
});
