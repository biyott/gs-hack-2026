import { describe, expect, it } from "vitest";
import type { Guidance, SimulationSnapshot } from "@/contracts";
import {
  guidanceFixture,
  snapshotWithGuidance as incidentSnapshot,
} from "../db/fixtures.test-support";
import { emptyResponse } from "../simulation/snapshots";
import { phaseCompleted, primaryGuidance } from "./verify-server-results";

function snapshotWithGuidance(guidance: Guidance): SimulationSnapshot {
  return {
    ...incidentSnapshot(guidance),
    workers: [
      {
        workerId: guidance.workerId,
        profile: guidance.profileSnapshot,
        position: { x: 0, y: 0 },
        positionStatus: "known",
        lastObservedAt: guidance.generatedAt,
        positionSource: "mock",
        positionInputSource: "synthetic",
        currentGuidance: guidance,
        response: emptyResponse(),
        virtual: false,
      },
    ],
  };
}

describe("publication verifier primary lineage", () => {
  it.each([1, 2])(
    "accepts only the current primary's fallback when receipt primary is %s",
    (version) => {
      // Given a replacement primary that reuses the guidance identity.
      const primary = { ...guidanceFixture(), guidanceVersion: 2, primaryGuidanceVersion: 2 };
      const initial = snapshotWithGuidance(primary);
      expect(initial.workers).toHaveLength(1);
      expect(primaryGuidance(initial)).toHaveLength(1);
      const final: SimulationSnapshot = {
        ...initial,
        events: [
          {
            eventId: "fallback",
            incidentId: primary.incidentId,
            runId: primary.runId,
            kind: "rag.fallback",
            actorId: "rag",
            occurredAt: primary.generatedAt,
            version: 1,
            detail: JSON.stringify({
              guidanceId: primary.guidanceId,
              primaryGuidanceVersion: version,
            }),
          },
        ],
      };
      // When the verifier observes a persisted fallback receipt.
      const completed = phaseCompleted(initial, final);
      // Then a previous primary's fallback cannot end the replacement phase.
      expect(completed).toBe(version === 2);
    },
  );

  it.each([1, 2])(
    "accepts only the current primary's supplement when supplement primary is %s",
    (version) => {
      // Given a replacement primary and a supplement for one primary lineage.
      const primary = { ...guidanceFixture(), guidanceVersion: 2, primaryGuidanceVersion: 2 };
      const supplement: Guidance = {
        ...primary,
        guidanceVersion: version + 1,
        primaryGuidanceVersion: version,
        updateKind: "supplement",
        mode: "rag-assisted",
        supplementalExplanation: "Reviewed fixture",
        evidence: [{ documentId: "fixture", documentVersion: "1", chunkId: "fixture:1" }],
      };
      // When the verifier observes that supplement under the same guidance identity.
      const initial = snapshotWithGuidance(primary);
      expect(initial.workers).toHaveLength(1);
      expect(primaryGuidance(initial)).toHaveLength(1);
      const completed = phaseCompleted(initial, snapshotWithGuidance(supplement));
      // Then only a supplement linked to the replacement primary ends this phase.
      expect(completed).toBe(version === 2);
    },
  );

  it("does not complete a phase whose snapshot has no worker primary", () => {
    // Given an incident-only snapshot that cannot identify a publication target.
    const initial = incidentSnapshot(guidanceFixture());
    expect(initial.workers).toHaveLength(0);
    expect(primaryGuidance(initial)).toHaveLength(0);
    // When the verifier receives the same snapshot without a primary publication.
    const completed = phaseCompleted(initial, initial);
    // Then an empty target set is incomplete rather than vacuously successful.
    expect(completed).toBe(false);
  });
});
