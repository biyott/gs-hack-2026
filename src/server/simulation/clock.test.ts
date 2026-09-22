import { describe, expect, it } from "vitest";
import { ClockTransitionError, SimulationClock } from "./clock";

describe("deterministic simulation clock", () => {
  it("advances at 1.5x real time when no initial speed is supplied", () => {
    // Given
    const clock = new SimulationClock(10000);
    clock.start();
    // When
    const result = clock.advance(500);
    // Then
    expect(result).toMatchObject({ virtualTimeMs: 750, speed: 1.5 });
  });

  it("preserves an explicit speed when a clock is restored", () => {
    // Given
    const clock = new SimulationClock(10000, {
      status: "running",
      virtualTimeMs: 1000,
      speed: 0.5,
      durationMs: 10000,
    });
    // When
    const result = clock.advance(500);
    // Then
    expect(result).toMatchObject({ virtualTimeMs: 1250, speed: 0.5 });
  });

  it("keeps independent modes and freezes paused time", () => {
    const equipment = new SimulationClock(10000);
    const fireGas = new SimulationClock(10000);
    equipment.setSpeed(1);
    fireGas.setSpeed(1);
    equipment.start();
    fireGas.start();
    equipment.advance(500);
    equipment.pause();
    equipment.advance(5000);
    fireGas.advance(2000);
    expect(equipment.snapshot().virtualTimeMs).toBe(500);
    expect(fireGas.snapshot().virtualTimeMs).toBe(2000);
    equipment.resume();
    equipment.setSpeed(2);
    expect(equipment.advance(500).virtualTimeMs).toBe(1500);
  });

  it("clamps completion and refuses invalid transition or nonfinite input", () => {
    const clock = new SimulationClock(1000);
    expect(() => clock.pause()).toThrow(ClockTransitionError);
    expect(() => clock.setSpeed(Number.NaN)).toThrow(ClockTransitionError);
    clock.start();
    expect(clock.advance(2000)).toMatchObject({ status: "completed", virtualTimeMs: 1000 });
    expect(clock.advance(2000).virtualTimeMs).toBe(1000);
    expect(() => clock.resume()).toThrow(ClockTransitionError);
  });

  it("produces the same virtual result for equivalent elapsed durations", () => {
    const first = new SimulationClock(10000);
    const second = new SimulationClock(10000);
    first.start();
    second.start();
    first.setSpeed(0.5);
    second.setSpeed(0.5);
    for (let step = 0; step < 100; step += 1) first.advance(10);
    second.advance(1000);
    expect(first.snapshot()).toEqual(second.snapshot());
  });
});
