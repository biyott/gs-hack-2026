export type ClockState = Readonly<{
  status: "idle" | "running" | "paused" | "completed";
  virtualTimeMs: number;
  speed: number;
  durationMs: number;
}>;

export const DEFAULT_SIMULATION_SPEED = 1.5;

export class ClockTransitionError extends Error {
  constructor(readonly reason: "invalid-transition" | "invalid-time" | "invalid-speed") {
    super(reason);
    this.name = "ClockTransitionError";
  }
}

/** Virtual time advances only from the supplied monotonic duration. */
export class SimulationClock {
  private state: ClockState;

  constructor(durationMs: number, initial?: ClockState) {
    if (!Number.isFinite(durationMs) || durationMs <= 0)
      throw new ClockTransitionError("invalid-time");
    this.state = initial ?? {
      status: "idle",
      virtualTimeMs: 0,
      speed: DEFAULT_SIMULATION_SPEED,
      durationMs,
    };
  }

  snapshot(): ClockState {
    return { ...this.state };
  }

  start(): void {
    if (this.state.status !== "idle") throw new ClockTransitionError("invalid-transition");
    this.state = { ...this.state, status: "running" };
  }

  pause(): void {
    if (this.state.status !== "running") throw new ClockTransitionError("invalid-transition");
    this.state = { ...this.state, status: "paused" };
  }

  resume(): void {
    if (this.state.status !== "paused") throw new ClockTransitionError("invalid-transition");
    this.state = { ...this.state, status: "running" };
  }

  setSpeed(speed: number): void {
    if (!Number.isFinite(speed) || speed <= 0 || speed > 16)
      throw new ClockTransitionError("invalid-speed");
    this.state = { ...this.state, speed };
  }

  advance(elapsedRealMs: number): ClockState {
    if (!Number.isFinite(elapsedRealMs) || elapsedRealMs < 0)
      throw new ClockTransitionError("invalid-time");
    if (this.state.status !== "running") return this.snapshot();
    const virtualTimeMs = Math.min(
      this.state.durationMs,
      this.state.virtualTimeMs + elapsedRealMs * this.state.speed,
    );
    this.state = {
      ...this.state,
      virtualTimeMs,
      status: virtualTimeMs === this.state.durationMs ? "completed" : "running",
    };
    return this.snapshot();
  }
}
