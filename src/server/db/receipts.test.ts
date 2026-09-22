import type { SimulationCommand, WorkerResponse } from "@gs-safety/contracts";
import { afterEach, describe, expect, it } from "vitest";
import { runFixture, snapshotWithGuidance } from "./fixtures.test-support";
import { createDatabase, type SafetyDatabase } from "./index";
import { createRunRepository } from "./run-repository";

const databases: SafetyDatabase[] = [];
afterEach(() => {
  for (const database of databases.splice(0)) database.close();
});

function fixture() {
  const database = createDatabase(":memory:");
  databases.push(database);
  return createRunRepository(database);
}

describe("atomic reset and idempotency", () => {
  it("finds a reset receipt after the active run identifier has changed", () => {
    // Given
    const repository = fixture();
    const initial = repository.create(runFixture(), "operator");
    const replacement = { ...initial, run: { ...initial.run, runId: "after-reset" } };
    const request: SimulationCommand = {
      mode: "equipment",
      action: "reset",
      expectedVersion: 0,
      requestId: "reset-1",
    };
    repository.replace(replacement, { runId: initial.run.runId, version: 0, request }, "operator");
    // When
    const receipt = repository.findRequestReceipt("equipment", "reset-1");
    // Then
    expect(receipt?.snapshot.run.runId).toBe("after-reset");
    expect(receipt?.actorId).toBe("operator");
  });

  it("rejects a control request attached to another simulation mode", () => {
    // Given
    const repository = fixture();
    const initial = repository.create(runFixture(), "operator");
    const request: SimulationCommand = {
      mode: "fire-gas",
      action: "start",
      expectedVersion: 0,
      requestId: "wrong-mode",
    };
    const snapshot = { ...initial, run: { ...initial.run, version: 1 } };
    // When / Then
    expect(() =>
      repository.commit({ snapshot, expectedVersion: 0, actorId: "operator", request }),
    ).toThrowError("Request mode mismatch");
    expect(repository.current("equipment")?.run.version).toBe(0);
  });

  it("preserves prior history when replacing the active run", () => {
    // Given
    const repository = fixture();
    const initial = repository.create(runFixture(), "operator");
    const replacement = { ...initial, run: { ...initial.run, runId: "run-new" } };
    // When
    repository.replace(replacement, { runId: initial.run.runId, version: 0 }, "operator");
    // Then
    expect(repository.current("equipment")?.run.runId).toBe("run-new");
    expect(repository.history(initial.run.runId)).toHaveLength(1);
  });

  it("rejects a reset from a stale run reference", () => {
    // Given
    const repository = fixture();
    const initial = repository.create(runFixture(), "operator");
    const replacement = { ...initial, run: { ...initial.run, runId: "run-new" } };
    repository.replace(replacement, { runId: initial.run.runId, version: 0 }, "operator");
    // When / Then
    expect(() =>
      repository.replace(
        { ...replacement, run: { ...replacement.run, runId: "stale-reset" } },
        { runId: initial.run.runId, version: 0 },
        "operator",
      ),
    ).toThrowError("Run version conflict");
  });

  it("replays an exact worker response without adding another state transition", () => {
    // Given
    const repository = fixture();
    const initial = repository.create(snapshotWithGuidance(), "operator");
    const response: WorkerResponse = {
      mode: "equipment",
      runId: initial.run.runId,
      workerId: "WORKER-A",
      requestId: "response-1",
      incidentId: "incident-1",
      guidanceId: "guidance-1",
      guidanceVersion: 1,
      response: "received",
      occurredAt: "2026-09-21T09:00:01Z",
    };
    const change = {
      snapshot: { ...initial, run: { ...initial.run, version: 1 } },
      expectedVersion: 0,
      actorId: "worker-a",
      response,
    };
    const committed = repository.commit(change);
    // When
    const duplicate = repository.commit(change);
    // Then
    expect(duplicate).toEqual(committed);
    expect(repository.history(initial.run.runId)).toHaveLength(2);
  });

  it("rejects a reused request identifier with changed worker response content", () => {
    // Given
    const repository = fixture();
    const initial = repository.create(snapshotWithGuidance(), "operator");
    const response: WorkerResponse = {
      mode: "equipment",
      runId: initial.run.runId,
      workerId: "WORKER-A",
      requestId: "response-1",
      incidentId: "incident-1",
      guidanceId: "guidance-1",
      guidanceVersion: 1,
      response: "received",
      occurredAt: "2026-09-21T09:00:01Z",
    };
    const change = {
      snapshot: { ...initial, run: { ...initial.run, version: 1 } },
      expectedVersion: 0,
      actorId: "worker-a",
      response,
    };
    repository.commit(change);
    // When / Then
    expect(() =>
      repository.commit({ ...change, response: { ...response, response: "understood" } }),
    ).toThrowError("Request identifier conflict");
  });

  it("persists a control request result in the same commit", () => {
    // Given
    const repository = fixture();
    const initial = repository.create(runFixture(), "operator");
    const request: SimulationCommand = {
      mode: "equipment",
      action: "start",
      expectedVersion: 0,
      requestId: "start-1",
    };
    const next = { ...initial, run: { ...initial.run, version: 1, status: "running" as const } };
    repository.commit({ snapshot: next, expectedVersion: 0, actorId: "operator", request });
    // When
    const receipt = repository.requestReceipt({
      mode: "equipment",
      runId: initial.run.runId,
      requestId: "start-1",
    });
    // Then
    expect(receipt?.snapshot.run.status).toBe("running");
    expect(receipt?.actorId).toBe("operator");
  });
});
