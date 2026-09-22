import type { SimulationCommand } from "@gs-safety/contracts";
import { afterEach, describe, expect, it } from "vitest";
import { runFixture } from "./fixtures.test-support";
import { createDatabase, type SafetyDatabase } from "./index";
import { createRunRepository } from "./run-repository";

const databases: SafetyDatabase[] = [];
afterEach(() => {
  for (const database of databases.splice(0)) database.close();
});

function fixture() {
  const database = createDatabase(":memory:");
  databases.push(database);
  return { database, repository: createRunRepository(database) };
}

describe("runtime checkpoint atomicity", () => {
  it("rolls back the snapshot and head when checkpoint insertion fails", () => {
    // Given
    const { database, repository } = fixture();
    const initial = repository.create(runFixture(), "operator", '{"eventIndex":0}');
    database.sqlite.exec(
      "CREATE TEMP TRIGGER reject_checkpoint BEFORE INSERT ON run_runtime_state WHEN NEW.version = 1 BEGIN SELECT RAISE(ABORT, 'injected checkpoint failure'); END",
    );
    const next = { ...initial, run: { ...initial.run, version: 1 } };
    // When / Then
    expect(() =>
      repository.commit({
        snapshot: next,
        expectedVersion: 0,
        actorId: "operator",
        runtimeStateJson: '{"eventIndex":1}',
      }),
    ).toThrowError();
    expect(repository.get(initial.run.runId)?.run.version).toBe(0);
    expect(repository.history(initial.run.runId)).toHaveLength(1);
    expect(repository.runtimeState(initial.run.runId)).toBe('{"eventIndex":0}');
  });

  it("rolls back the checkpoint when a later receipt write fails", () => {
    // Given
    const { repository } = fixture();
    const initial = repository.create(runFixture(), "operator", '{"eventIndex":0}');
    const next = { ...initial, run: { ...initial.run, version: 1 } };
    const request: SimulationCommand = {
      mode: "fire-gas",
      action: "start",
      requestId: "wrong-mode",
      expectedVersion: 0,
    };
    // When / Then
    expect(() =>
      repository.commit({
        snapshot: next,
        expectedVersion: 0,
        actorId: "operator",
        request,
        runtimeStateJson: '{"eventIndex":1}',
      }),
    ).toThrowError("Request mode mismatch");
    expect(repository.runtimeState(initial.run.runId)).toBe('{"eventIndex":0}');
    expect(repository.history(initial.run.runId)).toHaveLength(1);
  });

  it("keeps the active run when replacement checkpoint insertion fails", () => {
    // Given
    const { database, repository } = fixture();
    const initial = repository.create(runFixture(), "operator", '{"run":"old"}');
    const replacement = { ...initial, run: { ...initial.run, runId: "replacement" } };
    database.sqlite.exec(
      "CREATE TEMP TRIGGER reject_checkpoint BEFORE INSERT ON run_runtime_state WHEN NEW.run_id = 'replacement' BEGIN SELECT RAISE(ABORT, 'injected checkpoint failure'); END",
    );
    // When / Then
    expect(() =>
      repository.replace(
        replacement,
        { runId: initial.run.runId, version: 0, runtimeStateJson: '{"run":"new"}' },
        "operator",
      ),
    ).toThrowError();
    expect(repository.current("equipment")?.run.runId).toBe(initial.run.runId);
    expect(repository.get("replacement")).toBeNull();
    expect(repository.runtimeState(initial.run.runId)).toBe('{"run":"old"}');
  });

  it("retains original checkpoint bytes when a command is replayed", () => {
    // Given
    const { repository } = fixture();
    const initial = repository.create(runFixture(), "operator", '{"eventIndex":0}');
    const next = { ...initial, run: { ...initial.run, version: 1 } };
    const request: SimulationCommand = {
      mode: "equipment",
      action: "start",
      requestId: "start-1",
      expectedVersion: 0,
    };
    const change = {
      snapshot: next,
      expectedVersion: 0,
      actorId: "operator",
      request,
      runtimeStateJson: '{"eventIndex":1}',
    };
    repository.commit(change);
    // When
    repository.commit({ ...change, runtimeStateJson: '{"eventIndex":999}' });
    // Then
    expect(repository.runtimeState(initial.run.runId)).toBe('{"eventIndex":1}');
  });

  it.each(["UPDATE run_runtime_state SET payload_json = '{}'", "DELETE FROM run_runtime_state"])(
    "rejects immutable checkpoint mutation: %s",
    (sql) => {
      // Given
      const { database, repository } = fixture();
      repository.create(runFixture(), "operator", '{"eventIndex":0}');
      // When / Then
      expect(() => database.sqlite.exec(sql)).toThrowError("immutable runtime state");
    },
  );
});
