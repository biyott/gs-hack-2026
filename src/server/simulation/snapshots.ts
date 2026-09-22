import { randomUUID } from "node:crypto";
import type { EquipmentState, ResponseState, SimulationSnapshot, WorkerState } from "@/contracts";
import type { ResponsePolicy, Scenario } from "../scenarios";
import type { SimulationWorld } from "./world";

export function emptyResponse(): ResponseState {
  return {
    receivedAt: null,
    displayedAt: null,
    spokenAt: null,
    understoodAt: null,
    helpRequestedAt: null,
    arrivedAt: null,
    voiceStatus: "pending",
    voiceStopRequestedAt: null,
  };
}

export function createRunSnapshot(scenario: Scenario, now: string): SimulationSnapshot {
  const equipment = scenario.initial.equipment;
  return {
    contractVersion: "1.0.0",
    streamId: "legacy",
    sequence: 0,
    mode: scenario.mode,
    run: {
      runId: randomUUID(),
      scenarioId: scenario.id,
      positionInput: "scenario",
      status: "idle",
      virtualTimeMs: 0,
      speed: 1,
      seed: scenario.seed,
      version: 0,
      mapId: scenario.mapId,
      mapVersion: scenario.mapVersion,
      startedAt: null,
      updatedAt: now,
    },
    workers: scenario.initial.workers.map((worker) => ({
      workerId: worker.workerId,
      profile: worker.profile,
      position: worker.position,
      positionSource: "mock",
      positionInputSource: "synthetic",
      positionStatus: worker.position && worker.connected ? "known" : "unknown",
      lastObservedAt: now,
      currentGuidance: null,
      response: emptyResponse(),
      virtual: worker.workerId === "WORKER-C",
    })),
    equipment: {
      id: "EQUIPMENT-A",
      presetId: equipment?.modelId ?? "sk1265-at6",
      position: equipment?.position ?? { x: 30, y: 25 },
      headingDeg: equipment?.headingDeg ?? 0,
      speedMps: equipment?.speedMps ?? 0,
      slewDeg: equipment?.slewDeg ?? 0,
      boomAngleDeg: 0,
      boomLengthM: 60,
      trolleyM: 30,
      hookHeightM: 16.24,
      geometryVersion: 1,
      positionSource: "mock",
      positionInputSource: "synthetic",
      positionStatus: "known",
      lastObservedAt: now,
      tableLinked: true,
    },
    hazards: [],
    closedEdgeIds: [],
    incidents: [],
    events: [],
    cctv: [
      {
        cameraId: "CCTV-01",
        name: "책상 시연 카메라",
        zoneIds: ["ZONE-A", "ZONE-B", "ZONE-C"],
        floorId: "GROUND",
        source: "mock",
        status: "disconnected",
        lastFrameAt: null,
        frameUrl: null,
        receivedFps: 0,
        latencyMs: null,
      },
    ],
  };
}

export type WorldObservationContext = Readonly<{
  world: SimulationWorld;
  virtualTimeMs: number;
  now: string;
  policy: ResponsePolicy;
}>;

export function observeWorld(
  snapshot: SimulationSnapshot,
  context: WorldObservationContext,
): SimulationSnapshot {
  const { world, virtualTimeMs, now, policy } = context;
  const nowMs = Date.parse(now);
  const workers = snapshot.workers.map((worker): WorkerState => {
    const source = world.state.workers.find((candidate) => candidate.workerId === worker.workerId);
    if (!source) return worker;
    if (worker.positionSource !== "mock") return { ...worker, profile: source.profile };
    const ageMs = virtualTimeMs - source.observedAtMs;
    return {
      ...worker,
      position: source.position,
      profile: source.profile,
      positionInputSource: "synthetic",
      positionStatus:
        !source.connected || source.position === null
          ? "unknown"
          : ageMs > policy.positionStaleAfterMs
            ? "stale"
            : "known",
      lastObservedAt: new Date(nowMs - Math.max(0, ageMs)).toISOString(),
    };
  });
  const source = world.state.equipment;
  let equipment: EquipmentState = snapshot.equipment;
  if (source && equipment.positionSource === "mock") {
    const ageMs = virtualTimeMs - source.observedAtMs;
    equipment = {
      ...equipment,
      position: source.position,
      headingDeg: source.headingDeg,
      speedMps: source.speedMps,
      slewDeg: source.slewDeg,
      positionInputSource: "synthetic",
      positionStatus: !source.connected
        ? "unknown"
        : ageMs > policy.positionStaleAfterMs
          ? "stale"
          : "known",
      lastObservedAt: new Date(nowMs - Math.max(0, ageMs)).toISOString(),
    };
  }
  return { ...snapshot, workers, equipment };
}
