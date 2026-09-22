import type { ScenarioEvent, ScenarioInitialState } from "../scenarios";

export type SimulationWorld = Readonly<{
  state: ScenarioInitialState;
  frozenSourceIds: ReadonlySet<string>;
}>;

export function initialWorld(state: ScenarioInitialState): SimulationWorld {
  return { state: structuredClone(state), frozenSourceIds: new Set() };
}

function unreachable(value: never): never {
  throw new WorldEventError(`Unsupported scenario event: ${String(value)}`);
}

export class WorldEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorldEventError";
  }
}

export function applyWorldEvent(world: SimulationWorld, event: ScenarioEvent): SimulationWorld {
  const state = world.state;
  const frozenSourceIds = new Set(world.frozenSourceIds);
  switch (event.type) {
    case "equipment.pose": {
      if (state.equipment === null)
        throw new WorldEventError("Equipment event in a fire-gas world");
      const observedAtMs =
        "observedAtMs" in event && typeof event.observedAtMs === "number"
          ? event.observedAtMs
          : event.atMs;
      if (observedAtMs < event.atMs) frozenSourceIds.add("EQUIPMENT-A");
      else frozenSourceIds.delete("EQUIPMENT-A");
      return {
        frozenSourceIds,
        state: {
          ...state,
          equipment: {
            ...state.equipment,
            position: event.position,
            headingDeg: event.headingDeg,
            speedMps: event.speedMps,
            slewDeg: event.slewDeg,
            observedAtMs,
            connected: true,
          },
        },
      };
    }
    case "worker.position": {
      const observedAtMs =
        "observedAtMs" in event && typeof event.observedAtMs === "number"
          ? event.observedAtMs
          : event.atMs;
      if (observedAtMs < event.atMs) frozenSourceIds.add(event.workerId);
      else frozenSourceIds.delete(event.workerId);
      return {
        frozenSourceIds,
        state: {
          ...state,
          workers: state.workers.map((worker) =>
            worker.workerId === event.workerId
              ? { ...worker, position: event.position, observedAtMs, connected: true }
              : worker,
          ),
        },
      };
    }
    case "worker.profile":
      return {
        ...world,
        state: {
          ...state,
          workers: state.workers.map((worker) =>
            worker.workerId === event.profile.workerId
              ? { ...worker, profile: event.profile }
              : worker,
          ),
        },
      };
    case "source.connection": {
      if (event.connected) frozenSourceIds.delete(event.entityId);
      return {
        frozenSourceIds,
        state: {
          ...state,
          equipment:
            state.equipment?.equipmentId === event.entityId
              ? {
                  ...state.equipment,
                  connected: event.connected,
                  observedAtMs: event.connected ? event.atMs : state.equipment.observedAtMs,
                }
              : state.equipment,
          workers: state.workers.map((worker) =>
            worker.workerId === event.entityId
              ? {
                  ...worker,
                  connected: event.connected,
                  observedAtMs: event.connected ? event.atMs : worker.observedAtMs,
                }
              : worker,
          ),
          sensors: state.sensors.map((sensor) =>
            sensor.sensorId === event.entityId ? { ...sensor, connected: event.connected } : sensor,
          ),
        },
      };
    }
    case "sensor.reading":
      return {
        ...world,
        state: {
          ...state,
          sensors: [
            ...state.sensors.filter((sensor) => sensor.sensorId !== event.sensor.sensorId),
            event.sensor,
          ],
        },
      };
    case "hazard.upsert":
      return {
        ...world,
        state: {
          ...state,
          hazards: [
            ...state.hazards.filter((hazard) => hazard.id !== event.hazard.id),
            event.hazard,
          ],
        },
      };
    case "hazard.clear":
      return {
        ...world,
        state: {
          ...state,
          hazards: state.hazards.map((hazard) =>
            hazard.id === event.hazardId ? { ...hazard, active: false } : hazard,
          ),
        },
      };
    case "route.block":
      return {
        ...world,
        state: {
          ...state,
          blockedPathIds: [...new Set([...state.blockedPathIds, ...event.pathIds])],
        },
      };
    case "route.reopen":
      return {
        ...world,
        state: {
          ...state,
          blockedPathIds: state.blockedPathIds.filter((pathId) => !event.pathIds.includes(pathId)),
        },
      };
    default:
      return unreachable(event);
  }
}

/** Connected mock streams observe their stationary pose; stale injections stay frozen. */
export function refreshMockObservations(
  world: SimulationWorld,
  virtualTimeMs: number,
): SimulationWorld {
  const observedAtMs = Math.floor(virtualTimeMs);
  return {
    ...world,
    state: {
      ...world.state,
      equipment:
        world.state.equipment?.connected && !world.frozenSourceIds.has("EQUIPMENT-A")
          ? { ...world.state.equipment, observedAtMs }
          : world.state.equipment,
      workers: world.state.workers.map((worker) =>
        worker.connected && !world.frozenSourceIds.has(worker.workerId)
          ? { ...worker, observedAtMs }
          : worker,
      ),
    },
  };
}
