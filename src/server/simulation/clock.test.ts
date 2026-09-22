import { describe, expect, it } from "vitest";
import { ClockTransitionError, SimulationClock } from "./clock";

describe("deterministic simulation clock", () => {
  it("keeps independent modes and freezes paused time", () => {
    const equipment = new SimulationClock(10000);
    const fireGas = new SimulationClock(10000);
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
