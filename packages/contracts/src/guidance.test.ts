import { describe, expect, it } from "vitest";
import { GuidanceSchema } from "./guidance";

const profile = {
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
const guidance = {
  incidentId: "incident-1",
  eventId: "event-1",
  runId: "run-1",
  workerId: "WORKER-A",
  guidanceId: "guide-1",
  guidanceVersion: 1,
  updateKind: "primary",
  primaryGuidanceVersion: 1,
  simulationMode: "equipment",
  hazardIds: ["hazard-1"],
  hazardType: "equipment",
  priority: "high",
  actionCode: "FOLLOW_VALIDATED_ROUTE",
  routeVersion: 1,
  stepId: "step-1",
  mapId: "SITE-CONSTRUCTION-01",
  mapVersion: "1.0.0",
  floorId: "GROUND",
  waypoints: [
    { nodeId: "START", x: 65, y: 25, floorId: "GROUND" },
    { nodeId: "REFUGE-01", x: 125, y: 8, floorId: "GROUND" },
  ],
  destinationId: "REFUGE-01",
  profileVersion: 1,
  profileSnapshot: profile,
  locale: "ko",
  requestedLocale: "ko",
  fallbackLocaleUsed: false,
  templateCatalogVersion: "1.0.0",
  messageKey: "FOLLOW_VALIDATED_ROUTE",
  primaryMessageKey: "FOLLOW_VALIDATED_ROUTE",
  messageArgs: {},
  primaryMessage: "표시된 경로를 따라 이동하세요.",
  managerExplanationKo: "검증된 경로 안내",
  supplementalExplanation: null,
  evidence: [],
  mode: "template",
  generatedAt: "2026-09-21T09:00:00Z",
  expiresAt: "2026-09-21T09:01:00Z",
};

describe("guidance contract", () => {
  it("preserves all source fields in valid movement guidance", () => {
    expect(GuidanceSchema.parse(guidance)).toEqual(guidance);
  });
  it("rejects conflicting message aliases and profile versions", () => {
    expect(
      GuidanceSchema.safeParse({ ...guidance, primaryMessageKey: "POSITION_UNKNOWN" }).success,
    ).toBe(false);
    expect(GuidanceSchema.safeParse({ ...guidance, profileVersion: 2 }).success).toBe(false);
  });
  it.each([
    "POSITION_UNKNOWN",
    "ROUTE_UNAVAILABLE",
    "SENSOR_UNKNOWN",
    "SHELTER_PER_SCENARIO",
    "AWAIT_REOPEN_AUTHORIZATION",
  ])("clears route for %s", (actionCode) => {
    expect(GuidanceSchema.safeParse({ ...guidance, actionCode }).success).toBe(false);
    expect(
      GuidanceSchema.safeParse({
        ...guidance,
        actionCode,
        waypoints: [],
        destinationId: null,
        routeVersion: null,
        stepId: null,
      }).success,
    ).toBe(true);
  });
  it("requires actual route geometry for validated movement", () => {
    expect(
      GuidanceSchema.safeParse({
        ...guidance,
        waypoints: [],
        destinationId: null,
        routeVersion: null,
        stepId: null,
      }).success,
    ).toBe(false);
  });
  it("rejects expired-at-generation envelopes", () => {
    expect(GuidanceSchema.safeParse({ ...guidance, expiresAt: guidance.generatedAt }).success).toBe(
      false,
    );
  });
  it("requires supplements to preserve explicit prior primary lineage", () => {
    const supplement = {
      ...guidance,
      guidanceVersion: 2,
      updateKind: "supplement",
      mode: "rag-assisted",
      supplementalExplanation: "보조 설명",
      evidence: [{ documentId: "EQ-001", documentVersion: "0.1.0", chunkId: "EQ-001:procedure" }],
    };
    expect(GuidanceSchema.safeParse(supplement).success).toBe(true);
    expect(GuidanceSchema.safeParse({ ...supplement, primaryGuidanceVersion: 2 }).success).toBe(
      false,
    );
    expect(GuidanceSchema.safeParse({ ...supplement, evidence: [] }).success).toBe(false);
  });
  it("preserves explicitly unknown capabilities", () => {
    const unknown = {
      ...profile,
      preferredLocale: null,
      canUseStairs: null,
      speedMps: null,
      needsAssistance: null,
      needsCompanion: null,
      confirmedAt: null,
    };
    expect(
      GuidanceSchema.parse({ ...guidance, profileSnapshot: unknown }).profileSnapshot.canUseStairs,
    ).toBeNull();
  });
});
