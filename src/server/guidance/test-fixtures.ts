import type { WorkerProfile } from "@/contracts";
import type { EngineDecision } from "../engine";
import type { GuidanceContext } from "./guidance";

export function profileFixture(): WorkerProfile {
  return {
    workerId: "WORKER-A",
    version: 1,
    preferredLocale: "ko",
    locale: "ko",
    canUseStairs: false,
    speedMps: { min: 0.5, max: 1 },
    needsAssistance: true,
    needsCompanion: true,
    notificationPreferences: { voice: true, vibration: true },
    confirmedAt: "2026-09-21T08:00:00.000Z",
  };
}

export function contextFixture(): GuidanceContext {
  return {
    incidentId: "INCIDENT-01",
    eventId: "EVENT-01",
    runId: "RUN-01",
    simulationMode: "equipment",
    mapId: "SITE-CONSTRUCTION-01",
    mapVersion: "1.0.0",
    floorId: "GROUND",
    profile: profileFixture(),
    routeVersion: 1,
    stepId: "NODE-01",
    generatedAt: "2026-09-21T08:41:01.000Z",
    expiresAt: "2026-09-21T08:41:31.000Z",
    messageArgs: { geometryVersion: 1 },
  };
}

export function decisionFixture(): EngineDecision {
  return {
    actionCode: "FOLLOW_VALIDATED_ROUTE",
    hazardIds: ["HAZARD-01"],
    hazardType: "equipment",
    priority: "high",
    route: {
      kind: "valid",
      waypoints: [
        { nodeId: "NODE-01", floorId: "GROUND", x: 65, y: 8 },
        { nodeId: "REFUGE-01", floorId: "GROUND", x: 125, y: 8 },
      ],
      edgeIds: ["EDGE-01"],
      destinationId: "REFUGE-01",
      distanceM: 60,
      estimatedSeconds: 60,
      assistanceRequired: true,
    },
    destinationId: "REFUGE-01",
    assistanceRequired: true,
    reasonCode: "EQUIPMENT_EXPOSURE",
    exposure: { current: true, plannedRoute: false },
  };
}
