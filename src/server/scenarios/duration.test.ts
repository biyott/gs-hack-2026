import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadConfiguration } from "../simulation/configuration";
import { SimulationRun } from "../simulation/run";

const configuration = loadConfiguration();

describe("short complete scenario playback", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-21T09:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  for (const scenario of configuration.scenarios) {
    for (const speed of [1, 1.5]) {
      it(`completes every event within ${9000 / speed} ms when playing ${scenario.id} at ${speed}x`, () => {
        // Given
        const run = new SimulationRun(scenario, configuration);
        if (speed === 1) run.clock.setSpeed(1);
        run.start(scenario.clockEpoch, 0);
        // When
        run.advance(9000 / speed, 0);
        // Then
        expect(run.snapshot.run).toMatchObject({ status: "completed", speed });
        expect(run.snapshot.run.virtualTimeMs).toBeLessThanOrEqual(9000);
        expect(
          run.snapshot.events
            .filter((event) => event.actorId === "scenario")
            .map((event) => event.eventId),
        ).toEqual(scenario.events.map((event) => `${run.snapshot.run.runId}:${event.id}`));
      });
    }
  }
});
