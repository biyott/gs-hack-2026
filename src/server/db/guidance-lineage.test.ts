import type { Guidance } from "@gs-safety/contracts";
import { describe, expect, it } from "vitest";
import { guidanceFixture } from "./fixtures.test-support";
import { requireSupplementLineage } from "./guidance-lineage";

function supplementFixture(): Guidance {
  return {
    ...guidanceFixture(),
    guidanceVersion: 2,
    eventId: "event-supplement",
    updateKind: "supplement",
    mode: "rag-assisted",
    supplementalExplanation: "검토된 보조 설명",
    evidence: [{ documentId: "COMMON-001", documentVersion: "0.1.0", chunkId: "chunk-1" }],
  };
}

describe("supplement lineage", () => {
  it("accepts a supplement that preserves the referenced primary envelope", () => {
    // Given
    const primary = guidanceFixture();
    // When / Then
    expect(() => requireSupplementLineage(supplementFixture(), primary, primary)).not.toThrow();
  });

  const alterations: readonly Partial<Guidance>[] = [
    { primaryMessage: "different instruction" },
    { actionCode: "ROUTE_UNAVAILABLE" },
    { expiresAt: "2026-09-21T09:20:00Z" },
    { generatedAt: "2026-09-21T09:01:00Z" },
    { profileVersion: 2 },
    { mapVersion: "2.0" },
  ];
  it.each(alterations)(
    "rejects altered primary context %j in a supplemental version",
    (alteration) => {
      // Given
      const primary = guidanceFixture();
      const supplement = supplementFixture();
      const changed = { ...supplement, ...alteration };
      // When / Then
      expect(() => requireSupplementLineage(changed, primary, primary)).toThrowError(
        "Supplement primary context conflict",
      );
    },
  );

  it("rejects a supplement whose primary has already been superseded", () => {
    // Given
    const primary = guidanceFixture();
    const nextPrimary = { ...primary, guidanceVersion: 2, primaryGuidanceVersion: 2 };
    // When / Then
    expect(() =>
      requireSupplementLineage(
        { ...supplementFixture(), guidanceVersion: 3 },
        nextPrimary,
        primary,
      ),
    ).toThrowError("Supplement primary context conflict");
  });
});
