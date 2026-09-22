import type { WorkerProfile } from "../../../packages/contracts/src/core";
import type { MapEdge, MapNode } from "../../../packages/contracts/src/map";
import type { Hazard } from "../../../packages/contracts/src/state";
import type { RouteInput, RoutingGraph } from "./types";

export const confirmedProfile: WorkerProfile = {
  workerId: "WORKER-A",
  version: 1,
  preferredLocale: "ko",
  locale: "ko",
  canUseStairs: true,
  speedMps: { min: 0.8, max: 1.4 },
  needsAssistance: false,
  needsCompanion: false,
  notificationPreferences: { voice: true, vibration: true },
  confirmedAt: "2026-09-21T09:00:00Z",
};

function node(id: string, coordinates: readonly [number, number]): MapNode {
  return { id, x: coordinates[0], y: coordinates[1], kind: "junction", floorId: "GROUND" };
}

function edge(id: string, ends: readonly [string, string], extras: Partial<MapEdge> = {}): MapEdge {
  return {
    id,
    from: ends[0],
    to: ends[1],
    pathId: "PATH-A",
    widthM: 0.2,
    stairs: false,
    accessible: true,
    enabled: true,
    initialEgress: false,
    ...extras,
  };
}

export const graph: RoutingGraph = {
  floorId: "GROUND",
  obstacles: [],
  nodes: [
    node("START", [0, 0]),
    node("A", [4, 0]),
    node("B", [0, 4]),
    node("REFUGE-01", [8, 0]),
    node("REFUGE-02", [8, 4]),
  ],
  edges: [
    edge("STAIRS", ["START", "A"], { stairs: true, accessible: false, initialEgress: true }),
    edge("LEVEL", ["START", "B"], { initialEgress: true }),
    edge("SHORT", ["A", "REFUGE-01"]),
    edge("LONG", ["B", "REFUGE-02"]),
    edge("LINK", ["REFUGE-02", "REFUGE-01"]),
  ],
};

export const routeInput: RouteInput = {
  map: graph,
  position: { x: 0, y: 0 },
  profile: confirmedProfile,
  hazards: [],
  closedEdgeIds: [],
  destinationIds: ["REFUGE-01"],
};

export function hazard(polygon: Hazard["polygon"], overrides: Partial<Hazard> = {}): Hazard {
  return {
    hazardId: "HAZARD-1",
    hazardType: "fire",
    priority: "high",
    polygon,
    active: true,
    floorId: "GROUND",
    source: "mock",
    observedAt: "2026-09-21T09:00:00Z",
    sensorStatus: "current",
    affectedWorkerIds: [],
    zoneId: null,
    substanceId: null,
    reason: "fixture",
    ...overrides,
  };
}
