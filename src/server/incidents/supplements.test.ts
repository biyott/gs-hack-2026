import { describe, expect, it } from "vitest";
import type { Guidance, WorkerResponse } from "@/contracts";
import { applyWorkerResponse, IncidentTransitionError } from "./index";
import { guidance, incident, now, response, snapshot, workerContext } from "./test-fixtures";

const supplement: Guidance = {
  ...guidance,
  guidanceVersion: 2,
  updateKind: "supplement",
  primaryGuidanceVersion: 1,
  mode: "rag-assisted",
  supplementalExplanation: "Reviewed supplemental explanation",
  evidence: [{ documentId: "DOC-A", documentVersion: "1", chunkId: "CHUNK-A" }],
};
const augmented = {
  ...snapshot,
  workers: snapshot.workers.map((worker) => ({ ...worker, currentGuidance: supplement })),
  incidents: [{ ...incident, currentGuidance: [supplement] }],
};

describe("supplemental guidance voice lineage", () => {
  it.each([
    "voice-started",
    "voice-completed",
    "voice-failed",
    "voice-unsupported",
  ] satisfies WorkerResponse["response"][])(
    "accepts %s for unchanged primary speech when a supplement is current",
    (kind) => {
      // Given
      const command = response(kind);
      // When
      const outcome = applyWorkerResponse(augmented, command, workerContext);
      // Then
      expect(outcome.snapshot.events[0]?.kind).toBe(`worker.${kind}`);
      expect(outcome.snapshot.incidents[0]?.firstGuidance).toEqual(incident.firstGuidance);
    },
  );

  it.each([
    "received",
    "displayed",
    "understood",
    "help-requested",
    "arrived",
  ] satisfies WorkerResponse["response"][])(
    "rejects %s for an older envelope when a supplement is current",
    (kind) => {
      // Given / When / Then
      expect(() => applyWorkerResponse(augmented, response(kind), workerContext)).toThrow(
        IncidentTransitionError,
      );
    },
  );

  it("accepts receipt for the current envelope when a supplement is displayed", () => {
    // Given
    const command = { ...response("received"), guidanceVersion: 2 };
    // When
    const outcome = applyWorkerResponse(augmented, command, workerContext);
    // Then
    expect(outcome.snapshot.workers[0]?.response.receivedAt).toBe(now);
  });

  it("rejects an unrelated old primary voice callback when the primary action has changed", () => {
    // Given
    const newer = { ...supplement, guidanceVersion: 4, primaryGuidanceVersion: 3 };
    const state = {
      ...snapshot,
      workers: snapshot.workers.map((worker) => ({ ...worker, currentGuidance: newer })),
      incidents: [{ ...incident, currentGuidance: [newer] }],
    };
    // When / Then
    expect(() => applyWorkerResponse(state, response("voice-completed"), workerContext)).toThrow(
      IncidentTransitionError,
    );
  });

  it("rejects primary speech completion when the supplemented primary has expired", () => {
    // Given
    const context = { ...workerContext, now: supplement.expiresAt };
    // When / Then
    expect(() => applyWorkerResponse(augmented, response("voice-completed"), context)).toThrow(
      IncidentTransitionError,
    );
  });
});
