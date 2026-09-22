import { describe, expect, it } from "vitest";
import { ActionCodeSchema, GuidanceSchema } from "@/contracts";
import { createGuidance, GuidanceBuildError, preserveFirstGuidance } from "./guidance";
import { contextFixture, decisionFixture } from "./test-fixtures";

describe("authoritative guidance creation", () => {
  it("creates a contract-complete template record when the engine supplies a valid route", () => {
    const decision = decisionFixture();
    const context = contextFixture();
    const guidance = createGuidance(decision, context);
    expect(GuidanceSchema.safeParse(guidance).success).toBe(true);
    expect(guidance.guidanceVersion).toBe(1);
    expect(guidance.updateKind).toBe("primary");
    expect(guidance.primaryGuidanceVersion).toBe(1);
    expect(guidance.destinationId).toBe("REFUGE-01");
    expect(guidance.waypoints).toHaveLength(2);
    expect(guidance.supplementalExplanation).toBeNull();
    expect(guidance.evidence).toEqual([]);
    expect(guidance.mode).toBe("template");
  });

  it.each(ActionCodeSchema.options.filter((action) => action !== "FOLLOW_VALIDATED_ROUTE"))(
    "clears previous route metadata when the current action is %s",
    (actionCode) => {
      const previous = createGuidance(decisionFixture(), contextFixture());
      const decision = { ...decisionFixture(), actionCode };
      const guidance = createGuidance(decision, contextFixture(), previous);
      expect(guidance.waypoints).toEqual([]);
      expect(guidance.destinationId).toBeNull();
      expect(guidance.routeVersion).toBeNull();
      expect(guidance.stepId).toBeNull();
      expect(guidance.messageArgs).not.toHaveProperty("destinationId");
    },
  );

  it("keeps the same guidance when a new snapshot only changes event and timestamps", () => {
    const decision = decisionFixture();
    const previous = createGuidance(decision, contextFixture());
    const context = {
      ...contextFixture(),
      eventId: "POSITION-EVENT-02",
      generatedAt: "2026-09-21T08:41:02.000Z",
      expiresAt: "2026-09-21T08:41:32.000Z",
    };
    const guidance = createGuidance(decision, context, previous);
    expect(guidance).toBe(previous);
  });

  it("keeps the same guidance when only the current position waypoint moves on the existing route", () => {
    const decision = decisionFixture();
    if (decision.route === null) throw new GuidanceBuildError();
    const route = {
      ...decision.route,
      waypoints: [
        { nodeId: "WORKER-POSITION", floorId: "GROUND", x: 65, y: 8 },
        ...decision.route.waypoints.slice(1),
      ],
    };
    const previous = createGuidance({ ...decision, route }, contextFixture());
    const moved = {
      ...route,
      waypoints: [
        { nodeId: "WORKER-POSITION", floorId: "GROUND", x: 66, y: 8 },
        ...route.waypoints.slice(1),
      ],
    };
    const guidance = createGuidance({ ...decision, route: moved }, contextFixture(), previous);
    expect(guidance).toBe(previous);
  });

  it("increments the stable guidance lineage when the semantic action changes", () => {
    const previous = createGuidance(decisionFixture(), contextFixture());
    const decision = {
      ...decisionFixture(),
      actionCode: "ROUTE_UNAVAILABLE" as const,
      route: null,
      destinationId: null,
    };
    const guidance = createGuidance(decision, contextFixture(), previous);
    expect(guidance.guidanceId).toBe(previous.guidanceId);
    expect(guidance.guidanceVersion).toBe(2);
    expect(previous.guidanceVersion).toBe(1);
  });

  it("starts a new lineage when the run resets", () => {
    const previous = createGuidance(decisionFixture(), contextFixture());
    const context = { ...contextFixture(), runId: "RUN-02" };
    const guidance = createGuidance(decisionFixture(), context, previous);
    expect(guidance.guidanceId).not.toBe(previous.guidanceId);
    expect(guidance.guidanceVersion).toBe(1);
  });

  it("preserves an existing supplement when the authoritative primary decision is unchanged", () => {
    const primary = createGuidance(decisionFixture(), contextFixture());
    const previous = {
      ...primary,
      guidanceVersion: 2,
      updateKind: "supplement" as const,
      primaryGuidanceVersion: 1,
      mode: "rag-assisted" as const,
      supplementalExplanation: "Supplemental evidence explanation",
      evidence: [{ documentId: "EQ-001", documentVersion: "0.1.0", chunkId: "EQ-001-01" }],
    };
    const guidance = createGuidance(decisionFixture(), contextFixture(), previous);
    expect(guidance.guidanceVersion).toBe(2);
    expect(guidance.primaryGuidanceVersion).toBe(1);
    expect(guidance.updateKind).toBe("supplement");
    expect(guidance.evidence).toHaveLength(1);
  });

  it("increments beyond a supplemental envelope when the primary decision changes", () => {
    const primary = createGuidance(decisionFixture(), contextFixture());
    const previous = {
      ...primary,
      guidanceVersion: 2,
      updateKind: "supplement" as const,
      primaryGuidanceVersion: 1,
      mode: "rag-assisted" as const,
      supplementalExplanation: "Supplemental evidence explanation",
      evidence: [{ documentId: "EQ-001", documentVersion: "0.1.0", chunkId: "EQ-001-01" }],
    };
    const guidance = createGuidance(
      decisionFixture(),
      { ...contextFixture(), forceReissue: true },
      previous,
    );
    expect(guidance.guidanceVersion).toBe(3);
    expect(guidance.primaryGuidanceVersion).toBe(3);
    expect(guidance.updateKind).toBe("primary");
    expect(guidance.supplementalExplanation).toBeNull();
  });

  it("renews the version when unchanged guidance has expired", () => {
    const previous = createGuidance(decisionFixture(), contextFixture());
    const context = {
      ...contextFixture(),
      generatedAt: "2026-09-21T08:41:31.000Z",
      expiresAt: "2026-09-21T08:42:01.000Z",
    };
    const guidance = createGuidance(decisionFixture(), context, previous);
    expect(guidance.guidanceVersion).toBe(2);
    expect(guidance.generatedAt).toBe(context.generatedAt);
  });

  it("reissues when an administrator explicitly requests a new version", () => {
    const previous = createGuidance(decisionFixture(), contextFixture());
    const context = { ...contextFixture(), forceReissue: true };
    const guidance = createGuidance(decisionFixture(), context, previous);
    expect(guidance.guidanceVersion).toBe(2);
  });

  it("invalidates even a nonroute decision when equipment geometry changes", () => {
    const decision = {
      ...decisionFixture(),
      actionCode: "ROUTE_UNAVAILABLE" as const,
      route: null,
      destinationId: null,
    };
    const previous = createGuidance(decision, contextFixture());
    const context = { ...contextFixture(), messageArgs: { geometryVersion: 2 } };
    const guidance = createGuidance(decision, context, previous);
    expect(guidance.guidanceVersion).toBe(2);
  });

  it("preserves unsupported preference while sending marked English and Korean manager text", () => {
    const context = contextFixture();
    context.profile.preferredLocale = "vi-VN";
    const guidance = createGuidance(decisionFixture(), context);
    expect(guidance.requestedLocale).toBe("vi-VN");
    expect(guidance.locale).toBe("en");
    expect(guidance.fallbackLocaleUsed).toBe(true);
    expect(guidance.primaryMessage.startsWith("⚠ ")).toBe(true);
    expect(guidance.managerExplanationKo).toMatch(/[가-힣]/u);
  });

  it("preserves unknown mobility constraints when the profile is unconfirmed", () => {
    const context = contextFixture();
    context.profile.canUseStairs = null;
    context.profile.speedMps = null;
    context.profile.needsAssistance = null;
    context.profile.needsCompanion = null;
    context.profile.confirmedAt = null;
    const decision = {
      ...decisionFixture(),
      actionCode: "ROUTE_UNAVAILABLE" as const,
      route: null,
      destinationId: null,
    };
    const guidance = createGuidance(decision, context);
    expect(guidance.profileSnapshot.canUseStairs).toBeNull();
    expect(guidance.profileSnapshot.speedMps).toBeNull();
    expect(guidance.profileSnapshot.needsAssistance).toBeNull();
    expect(guidance.profileSnapshot.needsCompanion).toBeNull();
    expect(guidance.profileSnapshot.confirmedAt).toBeNull();
  });

  it("discards a stale argument destination when route guidance becomes unavailable", () => {
    const context = { ...contextFixture(), messageArgs: { destinationId: "REFUGE-OLD" } };
    const decision = {
      ...decisionFixture(),
      actionCode: "ROUTE_UNAVAILABLE" as const,
      route: null,
      destinationId: null,
    };
    const guidance = createGuidance(decision, context);
    expect(guidance.messageArgs).not.toHaveProperty("destinationId");
  });

  it("rejects route instructions when their authoritative route is absent", () => {
    const decision = { ...decisionFixture(), route: null };
    const build = () => createGuidance(decision, contextFixture());
    expect(build).toThrow(GuidanceBuildError);
  });

  it("rejects a movement route when it contains only one waypoint", () => {
    const decision = decisionFixture();
    if (decision.route === null) throw new GuidanceBuildError();
    const incomplete = {
      ...decision,
      route: { ...decision.route, waypoints: decision.route.waypoints.slice(0, 1) },
    };
    const build = () => createGuidance(incomplete, contextFixture());
    expect(build).toThrow(GuidanceBuildError);
  });

  it("returns an immutable copy without a new version when previous guidance was restored from storage", () => {
    const restored = structuredClone(createGuidance(decisionFixture(), contextFixture()));
    const guidance = createGuidance(decisionFixture(), contextFixture(), restored);
    expect(guidance.guidanceVersion).toBe(restored.guidanceVersion);
    expect(guidance.eventId).toBe(restored.eventId);
    expect(Object.isFrozen(guidance.profileSnapshot.notificationPreferences)).toBe(true);
    expect(Object.isFrozen(restored)).toBe(false);
  });

  it("detaches and freezes profile and route snapshots when inputs later change", () => {
    const context = contextFixture();
    const decision = decisionFixture();
    const guidance = createGuidance(decision, context);
    context.profile.canUseStairs = true;
    context.profile.notificationPreferences.voice = false;
    expect(guidance.profileSnapshot.canUseStairs).toBe(false);
    expect(guidance.profileSnapshot.notificationPreferences.voice).toBe(true);
    expect(Object.isFrozen(guidance)).toBe(true);
    expect(Object.isFrozen(guidance.profileSnapshot)).toBe(true);
    expect(Object.isFrozen(guidance.profileSnapshot.notificationPreferences)).toBe(true);
    expect(Object.isFrozen(guidance.waypoints[0])).toBe(true);
  });

  it("retains the actual first message and profile when later guidance is issued", () => {
    const initial = createGuidance(decisionFixture(), contextFixture());
    const changedContext = contextFixture();
    changedContext.profile.version = 2;
    changedContext.profile.preferredLocale = "en";
    const current = createGuidance(decisionFixture(), changedContext, initial);
    const first = preserveFirstGuidance(initial, current);
    expect(first.guidanceVersion).toBe(1);
    expect(first.primaryMessage).toBe(initial.primaryMessage);
    expect(first.locale).toBe("ko");
    expect(first.profileVersion).toBe(1);
    expect(Object.isFrozen(first)).toBe(true);
  });
});
