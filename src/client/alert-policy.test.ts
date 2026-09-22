import { afterEach, describe, expect, it, vi } from "vitest";
import type { Guidance, WorkerState } from "@/contracts";
import {
  guidanceFixture,
  snapshotWithGuidance as unboundSnapshot,
} from "../server/db/fixtures.test-support";
import { AlertLedger, type AlertObservation, alertObservations } from "./alert-policy";

const original: AlertObservation = {
  id: "incident1",
  priority: "high",
  signature: "route1",
  message: "안내",
  expiresAt: Date.parse("2026-09-21T09:10:00Z"),
};

function workerFixture(guidance: Guidance): WorkerState {
  return {
    workerId: guidance.workerId,
    profile: guidance.profileSnapshot,
    position: null,
    positionSource: "mock",
    positionInputSource: "unknown",
    positionStatus: "unknown",
    lastObservedAt: null,
    currentGuidance: guidance,
    virtual: false,
    response: {
      receivedAt: null,
      displayedAt: null,
      spokenAt: null,
      understoodAt: null,
      helpRequestedAt: null,
      arrivedAt: null,
      voiceStatus: "pending",
    },
  };
}

function snapshotWithGuidance(guidance = guidanceFixture()) {
  return { ...unboundSnapshot(guidance), workers: [workerFixture(guidance)] };
}

function helpSnapshot() {
  const guidance = guidanceFixture();
  return {
    ...snapshotWithGuidance(guidance),
    workers: [
      {
        workerId: guidance.workerId,
        profile: guidance.profileSnapshot,
        position: null,
        positionSource: "mock" as const,
        positionInputSource: "unknown" as const,
        positionStatus: "unknown" as const,
        lastObservedAt: null,
        currentGuidance: guidance,
        response: {
          receivedAt: null,
          displayedAt: null,
          spokenAt: null,
          understoodAt: null,
          helpRequestedAt: guidance.generatedAt,
          arrivedAt: null,
          voiceStatus: "pending" as const,
        },
        virtual: false,
      },
    ],
  };
}

afterEach(() => vi.useRealTimers());

describe("expiry-aware alert observations", () => {
  it("omits incident guidance at the exact expiry boundary", () => {
    const guidance = guidanceFixture();
    vi.useFakeTimers().setSystemTime(Date.parse(guidance.expiresAt));
    const observations = alertObservations(snapshotWithGuidance(guidance));
    expect(observations).toEqual([]);
  });

  it("uses the server observation time when the local clock lags", () => {
    const guidance = guidanceFixture();
    const snapshot = snapshotWithGuidance(guidance);
    vi.useFakeTimers().setSystemTime(Date.parse(guidance.generatedAt));
    const observations = alertObservations({
      ...snapshot,
      run: { ...snapshot.run, updatedAt: guidance.expiresAt },
    });
    expect(observations).toEqual([]);
  });

  it("retains a live guidance alert until the last millisecond before expiry", () => {
    const guidance = guidanceFixture();
    vi.useFakeTimers().setSystemTime(Date.parse(guidance.expiresAt) - 1);
    const observations = alertObservations(snapshotWithGuidance(guidance));
    expect(observations).toHaveLength(1);
    expect(observations[0]).toHaveProperty("expiresAt", Date.parse(guidance.expiresAt));
  });

  it("does not call an expired member's disappearance a changed primary", () => {
    const guidance = guidanceFixture();
    const later = { ...guidance, workerId: "WORKER-B", expiresAt: "2026-09-21T09:20:00Z" };
    const base = snapshotWithGuidance(guidance);
    const snapshot = {
      ...base,
      workers: [...base.workers, workerFixture(later)],
      incidents: base.incidents.map((incident) => ({
        ...incident,
        currentGuidance: [guidance, later],
      })),
    };
    vi.useFakeTimers().setSystemTime(Date.parse(guidance.generatedAt));
    const ledger = new AlertLedger();
    ledger.update("scope", alertObservations(snapshot));
    vi.setSystemTime(Date.parse(guidance.expiresAt));
    const observations = alertObservations(snapshot);
    expect(observations[0]?.message).toContain("1명");
    expect(ledger.update("scope", observations)).toEqual([]);
  });

  it("does not announce a changed expired member alongside unchanged live guidance", () => {
    const expired = guidanceFixture();
    const live = { ...expired, workerId: "WORKER-B", expiresAt: "2026-09-21T09:20:00Z" };
    const base = snapshotWithGuidance(expired);
    const snapshot = {
      ...base,
      workers: [...base.workers, workerFixture(live)],
      incidents: base.incidents.map((incident) => ({
        ...incident,
        currentGuidance: [expired, live],
      })),
    };
    vi.useFakeTimers().setSystemTime(Date.parse(expired.generatedAt));
    const ledger = new AlertLedger();
    ledger.update("scope", alertObservations(snapshot));
    vi.setSystemTime(Date.parse(expired.expiresAt));
    const changed = {
      ...snapshot,
      incidents: snapshot.incidents.map((incident) => ({
        ...incident,
        currentGuidance: [{ ...expired, guidanceVersion: 2, primaryGuidanceVersion: 2 }, live],
      })),
    };
    expect(ledger.update("scope", alertObservations(changed))).toEqual([]);
  });

  it("omits expired guidance from a queued help request without clearing its response", () => {
    const guidance = guidanceFixture();
    const snapshot = helpSnapshot();
    vi.useFakeTimers().setSystemTime(Date.parse(guidance.expiresAt));
    const observations = alertObservations(snapshot);
    expect(observations).toEqual([]);
    expect(snapshot.workers[0]?.response.helpRequestedAt).toBe(guidance.generatedAt);
  });

  it.each(["assigned", "accepted", "completed"] as const)(
    "omits the assign-support instruction once support is %s",
    (supportStatus) => {
      const base = helpSnapshot();
      vi.useFakeTimers().setSystemTime(Date.parse(base.run.updatedAt));
      const snapshot = {
        ...base,
        incidents: base.incidents.map((incident) => ({ ...incident, supportStatus })),
      };
      const observations = alertObservations(snapshot);
      expect(observations.some((item) => item.id.includes(":help:"))).toBe(false);
      expect(snapshot.workers[0]?.response.helpRequestedAt).toBeTruthy();
    },
  );
});

describe("alert ledger", () => {
  it("does not replay a reconnect snapshot or repeat position-only updates", () => {
    const ledger = new AlertLedger();
    expect(ledger.update("run1", [original])).toEqual([]);
    expect(ledger.update("run1", [original])).toEqual([]);
  });
  it("announces new incident and changed route once without supplement duplicates", () => {
    const ledger = new AlertLedger();
    ledger.update("run1", []);
    expect(ledger.update("run1", [original])[0]?.reason).toBe("new");
    expect(ledger.update("run1", [{ ...original, signature: "route2" }])[0]?.reason).toBe(
      "changed",
    );
    expect(ledger.update("run1", [{ ...original, signature: "route2" }])).toEqual([]);
  });
  it("silently baselines a reconnected stream even when guidance changed while offline", () => {
    const ledger = new AlertLedger();
    ledger.update("stream1/run1/connection1", [original]);
    expect(
      ledger.update("stream1/run1/connection2", [{ ...original, signature: "route2" }]),
    ).toEqual([]);
    expect(
      ledger.update("stream1/run1/connection2", [{ ...original, signature: "route3" }])[0]?.reason,
    ).toBe("changed");
  });
  it("prioritizes escalation and treats new run snapshot as a silent baseline", () => {
    const ledger = new AlertLedger();
    ledger.update("run1", [original]);
    expect(ledger.update("run1", [{ ...original, priority: "critical" }])[0]?.reason).toBe(
      "escalated",
    );
    expect(ledger.update("run2", [original])).toEqual([]);
  });
});
