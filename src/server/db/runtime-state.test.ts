import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

describe("runtime recovery state", () => {
  it("restores the current checkpoint after reopening the database", () => {
    // Given
    const directory = mkdtempSync(join(tmpdir(), "gs-runtime-state-"));
    const filename = join(directory, "safety.sqlite");
    const database = createDatabase(filename);
    const initial = runFixture();
    const checkpoint = '{"manualEquipment":true,"eventIndex":3}';
    createRunRepository(database).create(initial, "operator", checkpoint);
    database.close();
    // When
    const reopened = createDatabase(filename);
    try {
      // Then
      expect(createRunRepository(reopened).runtimeState(initial.run.runId)).toBe(checkpoint);
    } finally {
      reopened.close();
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("returns only the checkpoint for the current head version", () => {
    // Given
    const { repository } = fixture();
    const initial = repository.create(runFixture(), "operator", '{"eventIndex":1}');
    const next = { ...initial, run: { ...initial.run, version: 1 } };
    // When
    repository.commit({
      snapshot: next,
      expectedVersion: 0,
      actorId: "operator",
      runtimeStateJson: '{"eventIndex":2}',
    });
    // Then
    expect(repository.runtimeState(initial.run.runId)).toBe('{"eventIndex":2}');
  });

  it("returns null when the current head has no checkpoint", () => {
    // Given
    const { repository } = fixture();
    const initial = repository.create(runFixture(), "operator", '{"eventIndex":1}');
    const next = { ...initial, run: { ...initial.run, version: 1 } };
    // When
    repository.commit({ snapshot: next, expectedVersion: 0, actorId: "operator" });
    // Then
    expect(repository.runtimeState(initial.run.runId)).toBeNull();
  });

  it("keeps the winning checkpoint when a stale version is rejected", () => {
    // Given
    const { repository } = fixture();
    const initial = repository.create(runFixture(), "operator", '{"winner":0}');
    const next = { ...initial, run: { ...initial.run, version: 1 } };
    repository.commit({
      snapshot: next,
      expectedVersion: 0,
      actorId: "operator",
      runtimeStateJson: '{"winner":1}',
    });
    // When / Then
    expect(() =>
      repository.commit({
        snapshot: next,
        expectedVersion: 0,
        actorId: "other",
        runtimeStateJson: '{"winner":2}',
      }),
    ).toThrowError("Run version conflict");
    expect(repository.runtimeState(initial.run.runId)).toBe('{"winner":1}');
  });

  it("attaches replacement state to the new run and retains the previous checkpoint", () => {
    // Given
    const { repository } = fixture();
    const initial = repository.create(runFixture(), "operator", '{"run":"old"}');
    const replacement = { ...initial, run: { ...initial.run, runId: "replacement" } };
    // When
    repository.replace(
      replacement,
      { runId: initial.run.runId, version: 0, runtimeStateJson: '{"run":"new"}' },
      "operator",
    );
    // Then
    expect(repository.runtimeState("replacement")).toBe('{"run":"new"}');
    expect(repository.runtimeState(initial.run.runId)).toBe('{"run":"old"}');
  });
});
