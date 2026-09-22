import assert from "node:assert/strict";
import { describe, expect, it } from "vitest";
import type { Guidance } from "@/contracts";
import { active } from "../simulation/runtime-test-fixtures";

describe("primary voice receipt persistence after a supplement", () => {
  it("persists completed primary speech when a current supplement retains its primary lineage", () => {
    // Given
    const f = active();
    const callback = f.response("voice-completed");
    const run = f.runtime.getRun("equipment");
    const primary = run.snapshot.workers.find(
      (worker) => worker.workerId === "WORKER-A",
    )?.currentGuidance;
    assert.ok(primary);
    const supplement: Guidance = {
      ...primary,
      guidanceVersion: primary.guidanceVersion + 1,
      primaryGuidanceVersion: primary.guidanceVersion,
      updateKind: "supplement",
      eventId: "supplement-voice-regression",
      mode: "rag-assisted",
      supplementalExplanation: "Supplemental fixture",
      evidence: [{ documentId: "DOC-FIXTURE", documentVersion: "1", chunkId: "CHUNK-FIXTURE" }],
    };
    f.runtime.commit(
      run,
      {
        ...run.snapshot,
        workers: run.snapshot.workers.map((worker) =>
          worker.workerId === "WORKER-A" ? { ...worker, currentGuidance: supplement } : worker,
        ),
        incidents: run.snapshot.incidents.map((incident) => ({
          ...incident,
          currentGuidance: incident.currentGuidance.map((current) =>
            current.guidanceId === primary.guidanceId ? supplement : current,
          ),
        })),
      },
      "rag",
    );
    // When
    const snapshot = f.runtime.respond(callback, f.session("worker-a"));
    // Then
    expect(
      snapshot.workers.find((worker) => worker.workerId === "WORKER-A")?.response.voiceStatus,
    ).toBe("completed");
    expect(f.repository.responseReceipt(callback)?.request.guidanceVersion).toBe(
      primary.guidanceVersion,
    );
  });
});
