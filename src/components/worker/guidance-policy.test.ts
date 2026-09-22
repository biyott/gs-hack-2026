import { describe, expect, it } from "vitest";
import type { Guidance } from "@/contracts";
import {
  type GuidanceScope,
  guidanceIsCurrent,
  responseGuidanceVersion,
  samePrimaryGuidance,
} from "./guidance-policy";

const scope: GuidanceScope = {
  workerId: "WORKER-A",
  runId: "RUN-1",
  simulationMode: "equipment",
  mapId: "SITE-CONSTRUCTION-01",
  mapVersion: "1.0.0",
  floorId: "GROUND",
  profileVersion: 1,
};
const guidance = { ...scope, expiresAt: "2026-09-21T09:01:00Z" };
const now = Date.parse("2026-09-21T09:00:00Z");

describe("worker guidance visibility", () => {
  it("allows guidance when every identity and expiry matches", () => {
    // Given a guide matching the current worker and map.
    // When its identity and deadline are evaluated.
    const current = guidanceIsCurrent(guidance, scope, now);
    // Then the worker can see the guide.
    expect(current).toBe(true);
  });
  it.each([
    { workerId: "WORKER-B" },
    { runId: "RUN-OLD" },
    { simulationMode: "fire-gas" },
    { mapId: "OTHER-MAP" },
    { mapVersion: "2.0.0" },
    { floorId: "OTHER-FLOOR" },
    { profileVersion: 2 },
  ] satisfies Partial<GuidanceScope>[])(
    "rejects guidance when its scope differs: %j",
    (mismatch) => {
      // Given a guide belonging to another current context.
      const stale = { ...guidance, ...mismatch };
      // When the current worker considers that guide.
      const current = guidanceIsCurrent(stale, scope, now);
      // Then it remains hidden.
      expect(current).toBe(false);
    },
  );
  it("rejects guidance exactly at its expiry without another server event", () => {
    // Given a guide whose expiry has just been reached.
    const deadline = Date.parse(guidance.expiresAt);
    // When the local clock reaches the deadline.
    const current = guidanceIsCurrent(guidance, scope, deadline);
    // Then its instructions and route are no longer current.
    expect(current).toBe(false);
  });
});

const primary: Pick<
  Guidance,
  "guidanceId" | "primaryGuidanceVersion" | "runId" | "simulationMode" | "workerId"
> = {
  guidanceId: "GUIDE-1",
  primaryGuidanceVersion: 1,
  runId: "RUN-1",
  simulationMode: "equipment",
  workerId: "WORKER-A",
};

describe("worker speech response identity", () => {
  it("keeps the same primary identity when supplemental metadata changes", () => {
    // Given a supplement retaining the primary lineage.
    const supplemented = { ...primary, guidanceVersion: 2, updateKind: "supplement" };
    // When a captured speech callback resolves its destination.
    const matches = samePrimaryGuidance(primary, supplemented);
    // Then it can report against the current supplement version.
    expect(matches).toBe(true);
  });
  it.each([
    { primaryGuidanceVersion: 2 },
    { runId: "RUN-2" },
    { simulationMode: "fire-gas" },
    { guidanceId: "GUIDE-2" },
    { workerId: "WORKER-B" },
  ] satisfies Partial<typeof primary>[])(
    "rejects an old speech callback when primary identity changes: %j",
    (change) => {
      // Given a newer guide with a different primary identity.
      const replaced = { ...primary, ...change };
      // When an old speech callback attempts to report.
      const matches = samePrimaryGuidance(primary, replaced);
      // Then the old callback cannot update the new guide.
      expect(matches).toBe(false);
    },
  );
});

describe("worker response version binding", () => {
  const captured = { guidanceVersion: 1, primaryGuidanceVersion: 1 };
  const supplement = { guidanceVersion: 2, primaryGuidanceVersion: 1 };
  it.each(["received", "displayed", "understood", "help-requested", "arrived"] as const)(
    "rejects %s from an older visible version after a supplement arrives",
    (response) => {
      // Given a receipt or action captured before a supplement appeared.
      // When the queued response is bound to the latest state.
      const version = responseGuidanceVersion(captured, supplement, response);
      // Then it must not assert interaction with the unseen supplement.
      expect(version).toBeNull();
    },
  );
  it("reports the exact primary audio version after supplemental metadata changes", () => {
    // Given speech that actually began from primary version 1.
    // When completion arrives while supplemental version 2 is current.
    const version = responseGuidanceVersion(captured, supplement, "voice-completed");
    // Then the original primary version is preserved in the audit.
    expect(version).toBe(1);
  });
  it("accepts a display receipt after that exact supplement is rendered", () => {
    // Given the current supplement has been rendered.
    // When its own display callback reports.
    const version = responseGuidanceVersion(supplement, supplement, "displayed");
    // Then the reported version is the displayed version.
    expect(version).toBe(2);
  });
});
