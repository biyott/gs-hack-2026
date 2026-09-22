import type { Guidance, WorkerResponse } from "@gs-safety/contracts";
import { afterEach, describe, expect, it } from "vitest";
import { guidanceFixture, snapshotWithGuidance } from "./fixtures.test-support";
import { createDatabase, type SafetyDatabase } from "./index";
import { createRunRepository } from "./run-repository";

const databases: SafetyDatabase[] = [];
afterEach(() => {
  for (const database of databases.splice(0)) database.close();
});

function fixture() {
  const database = createDatabase(":memory:");
  databases.push(database);
  const repository = createRunRepository(database);
  const primary = guidanceFixture();
  let snapshot = repository.create(snapshotWithGuidance(primary), "operator");
  function advance(guidance: Guidance) {
    snapshot = repository.commit({
      expectedVersion: snapshot.run.version,
      actorId: "operator",
      snapshot: {
        ...snapshot,
        run: { ...snapshot.run, version: snapshot.run.version + 1 },
        incidents: snapshot.incidents.map((incident) => ({
          ...incident,
          currentGuidance: [guidance],
        })),
      },
    });
    return snapshot;
  }
  const supplement: Guidance = {
    ...primary,
    guidanceVersion: 2,
    updateKind: "supplement",
    eventId: "supplement-2",
    mode: "rag-assisted",
    supplementalExplanation: "Reviewed supplemental explanation",
    evidence: [{ documentId: "DOC-1", documentVersion: "1", chunkId: "CHUNK-1" }],
  };
  advance(supplement);
  function change(response: WorkerResponse["response"] = "voice-completed") {
    const callback: WorkerResponse = {
      mode: snapshot.mode,
      runId: snapshot.run.runId,
      workerId: primary.workerId,
      requestId: `callback-${response}`,
      incidentId: primary.incidentId,
      guidanceId: primary.guidanceId,
      guidanceVersion: primary.guidanceVersion,
      response,
      occurredAt: "2026-09-21T09:00:01Z",
    };
    return {
      actorId: "worker-a",
      expectedVersion: snapshot.run.version,
      snapshot: { ...snapshot, run: { ...snapshot.run, version: snapshot.run.version + 1 } },
      response: callback,
    };
  }
  return { repository, primary, supplement, advance, change };
}

describe("persisted primary voice outcomes after a supplement", () => {
  it.each([
    "voice-started",
    "voice-completed",
    "voice-failed",
    "voice-unsupported",
  ] satisfies WorkerResponse["response"][])(
    "persists %s with its original primary version and replays it exactly",
    (kind) => {
      const f = fixture();
      const change = f.change(kind);

      const result = f.repository.commit(change);
      const replay = f.repository.commit(change);

      expect(replay).toEqual(result);
      expect(f.repository.responseReceipt(change.response)?.request.guidanceVersion).toBe(1);
      expect(result.incidents[0]?.currentGuidance[0]?.guidanceVersion).toBe(2);
      expect(result.incidents[0]?.firstGuidance).toEqual([f.primary]);
      expect(f.repository.history(result.run.runId)).toHaveLength(3);
    },
  );

  it.each([
    "received",
    "displayed",
    "understood",
    "help-requested",
    "arrived",
  ] satisfies WorkerResponse["response"][])("rejects old primary %s atomically", (kind) => {
    const f = fixture();
    const change = f.change(kind);

    expect(() => f.repository.commit(change)).toThrow("Response guidance is not current and valid");
    expect(f.repository.current("equipment")?.run.version).toBe(1);
    expect(f.repository.history(change.response.runId)).toHaveLength(2);
    expect(f.repository.responseReceipt(change.response)).toBeNull();
  });

  it("rejects an expired primary voice outcome", () => {
    const f = fixture();
    const change = f.change();
    const snapshot = {
      ...change.snapshot,
      run: { ...change.snapshot.run, updatedAt: f.primary.expiresAt },
    };

    expect(() => f.repository.commit({ ...change, snapshot })).toThrow(
      "Response guidance is not current and valid",
    );
    expect(f.repository.responseReceipt(change.response)).toBeNull();
  });

  it("rejects a voice outcome for a different guidance identifier", () => {
    const f = fixture();
    const change = f.change();

    expect(() =>
      f.repository.commit({
        ...change,
        response: { ...change.response, guidanceId: "unrelated-guidance" },
      }),
    ).toThrow("Response guidance is not current and valid");
  });

  it("rejects an old supplement version even when the primary is unchanged", () => {
    const f = fixture();
    f.advance({ ...f.supplement, guidanceVersion: 3, eventId: "supplement-3" });
    const change = f.change();

    expect(() =>
      f.repository.commit({ ...change, response: { ...change.response, guidanceVersion: 2 } }),
    ).toThrow("Response guidance is not current and valid");
  });

  it("rejects an obsolete primary after a new primary lineage becomes active", () => {
    const f = fixture();
    const primary: Guidance = {
      ...f.primary,
      guidanceVersion: 3,
      primaryGuidanceVersion: 3,
      eventId: "primary-3",
    };
    f.advance(primary);
    f.advance({ ...f.supplement, guidanceVersion: 4, primaryGuidanceVersion: 3 });

    expect(() => f.repository.commit(f.change())).toThrow(
      "Response guidance is not current and valid",
    );
  });
});
