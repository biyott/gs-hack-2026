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
  return { database, repository: createRunRepository(database) };
}

describe("independent durable runs", () => {
  it("keeps each mode independent when one run advances", () => {
    // Given
    const { repository } = fixture();
    const equipment = repository.create(runFixture(), "operator");
    repository.create(runFixture("fire-gas"), "operator");
    // When
    repository.commit({
      snapshot: { ...equipment, run: { ...equipment.run, version: 1, status: "running" } },
      expectedVersion: 0,
      actorId: "operator",
    });
    // Then
    expect(repository.current("equipment")?.run.status).toBe("running");
    expect(repository.current("fire-gas")?.run.status).toBe("idle");
  });

  it("allows only one writer for the same expected version", () => {
    // Given
    const { repository } = fixture();
    const initial = repository.create(runFixture(), "operator");
    const next = { ...initial, run: { ...initial.run, version: 1, speed: 2 } };
    repository.commit({ snapshot: next, expectedVersion: 0, actorId: "admin-1" });
    // When / Then
    expect(() =>
      repository.commit({
        snapshot: { ...next, run: { ...next.run, speed: 4 } },
        expectedVersion: 0,
        actorId: "admin-2",
      }),
    ).toThrowError("Run version conflict");
    expect(repository.get(initial.run.runId)?.run.speed).toBe(2);
    expect(repository.history(initial.run.runId)).toHaveLength(2);
  });

  it("rejects overwriting a persisted guidance envelope and rolls back the run", () => {
    // Given
    const { repository } = fixture();
    const initial = repository.create(snapshotWithGuidance(), "operator");
    const changed = snapshotWithGuidance();
    const incident = changed.incidents[0];
    if (incident === undefined) throw new Error("Fixture incident missing");
    const guidance = incident.currentGuidance[0];
    if (guidance === undefined) throw new Error("Fixture guidance missing");
    const snapshot = {
      ...changed,
      run: { ...changed.run, version: 1 },
      incidents: [
        {
          ...incident,
          currentGuidance: [{ ...guidance, actionCode: "ROUTE_UNAVAILABLE" as const }],
        },
      ],
    };
    // When / Then
    expect(() =>
      repository.commit({ snapshot, expectedVersion: 0, actorId: "admin" }),
    ).toThrowError("Immutable guidance conflict");
    expect(repository.get(initial.run.runId)?.run.version).toBe(0);
  });

  it("denies direct SQL changes to immutable guidance history", () => {
    // Given
    const { database, repository } = fixture();
    repository.create(snapshotWithGuidance(), "operator");
    // When / Then
    expect(() =>
      database.sqlite
        .prepare("UPDATE guidance_versions SET payload_json = '{}' WHERE guidance_id = ?")
        .run("guidance-1"),
    ).toThrowError("immutable guidance");
  });
});
