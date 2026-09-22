import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { SimulationSnapshot } from "@/contracts";
import { createDatabase } from "../db";
import { PersistenceError } from "../db/errors";
import { createRunRepository, type RunRepository } from "../db/run-repository";
import type { ClockState } from "./clock";
import { SimulationRuntime } from "./runtime";
import { cleanups, configuration, fixture } from "./runtime-test-fixtures";

const RECOVERY_TIME = "2026-09-21T09:00:10.000Z";
const WINNER_TIME = "2026-09-21T09:00:20.000Z";

function persistent() {
  const directory = mkdtempSync(join(tmpdir(), "gs-recovery-boundary-"));
  cleanups.push(() => rmSync(directory, { recursive: true, force: true }));
  const path = join(directory, "runtime.sqlite");
  const original = fixture(path);
  const database = createDatabase(path);
  const repository = createRunRepository(database);
  cleanups.push(() => {
    if (database.sqlite.open) database.close();
  });
  return { original, database, repository };
}

describe("runtime durable recovery transaction boundaries", () => {
  it.each(["pause", "reset", "resume"] as const)(
    "rereads a real concurrent %s winner after its recovery CAS loses",
    (action) => {
      // Given
      const { original, database, repository } = persistent();
      original.command({ action: "start" });
      original.command({ action: "advance", deltaMs: 1000 });
      original.command({ action: "control", pose: { slewDeg: 3 } });
      const before = original.snapshot();
      const previousClock = original.runtime.getRun("equipment").clock.snapshot();
      const previousCheckpoint = original.repository.runtimeState(before.run.runId);
      assert.ok(previousCheckpoint);
      const winners: {
        snapshot: SimulationSnapshot;
        history: readonly SimulationSnapshot[];
        checkpoint: string | null;
        clock: ClockState;
      }[] = [];
      let attempts = 0;
      let conflicts = 0;
      const interleaved: RunRepository = {
        ...repository,
        commit(change) {
          attempts += 1;
          if (attempts === 1) {
            vi.setSystemTime(WINNER_TIME);
            original.command({ action: "speed", speed: 2 });
            original.command({ action: "advance", deltaMs: 250 });
            original.command({ action: "control", pose: { slewDeg: 7 } });
            if (action === "resume") original.command({ action: "pause" });
            const snapshot = original.command({ action });
            winners.push({
              snapshot,
              history: original.repository.history(snapshot.run.runId),
              checkpoint: original.repository.runtimeState(snapshot.run.runId),
              clock: original.runtime.getRun("equipment").clock.snapshot(),
            });
          }
          try {
            return repository.commit(change);
          } catch (error) {
            if (error instanceof PersistenceError && error.code === "CONFLICT") conflicts += 1;
            throw error;
          }
        },
      };
      vi.setSystemTime(RECOVERY_TIME);
      // When
      const recovered = new SimulationRuntime({ configuration, database, repository: interleaved });
      cleanups.push(() => recovered.dispose());
      // Then
      const winner = winners[0];
      assert.ok(winner);
      assert.ok(winner.checkpoint);
      expect(attempts).toBe(1);
      expect(conflicts).toBe(1);
      const recoveredRun = recovered.getRun("equipment");
      const live = recoveredRun.snapshot;
      expect(live.run).toEqual(winner.snapshot.run);
      expect(winner.clock).not.toEqual(previousClock);
      expect(recoveredRun.clock.snapshot()).toEqual(winner.clock);
      expect(JSON.parse(winner.checkpoint)).not.toEqual(JSON.parse(previousCheckpoint));
      expect(JSON.parse(recoveredRun.checkpoint())).toEqual(JSON.parse(winner.checkpoint));
      expect(live.workers).toEqual(winner.snapshot.workers);
      expect(live.incidents).toEqual(winner.snapshot.incidents);
      expect(live.events).toEqual(winner.snapshot.events);
      expect(repository.current("equipment")).toEqual(winner.snapshot);
      expect(repository.history(live.run.runId)).toEqual(winner.history);
      expect(repository.runtimeState(live.run.runId)).toBe(winner.checkpoint);
      if (action === "reset") {
        expect(live.run.runId).not.toBe(before.run.runId);
        expect(live.run.status).toBe("idle");
      } else {
        expect(live.workers[0]?.response.voiceStopRequestedAt).toBe(WINNER_TIME);
        expect(live.run.status).toBe(action === "resume" ? "running" : "paused");
      }
    },
  );

  it("durably recovers synchronized state before rejecting a stale mutation without applying it", () => {
    // Given
    const { original, database, repository } = persistent();
    const stale = new SimulationRuntime({ configuration, database, repository });
    cleanups.push(() => stale.dispose());
    const oldVersion = stale.getRun("equipment").snapshot.run.version;
    original.command({ action: "start" });
    original.command({ action: "advance", deltaMs: 1000 });
    const before = original.snapshot();
    const history = repository.history(before.run.runId);
    const audits = repository.audits(before.run.runId);
    const checkpoint = repository.runtimeState(before.run.runId);
    const requestId = randomUUID();
    vi.setSystemTime(RECOVERY_TIME);
    // When / Then
    expect(() =>
      stale.command(
        {
          action: "speed",
          speed: 4,
          mode: "equipment",
          expectedVersion: oldVersion,
          requestId,
        },
        original.admin,
      ),
    ).toThrowError(expect.objectContaining({ code: "VERSION_CONFLICT" }));
    const stored = repository.current("equipment");
    assert.ok(stored);
    expect(stored.run).toMatchObject({
      status: "paused",
      version: before.run.version + 1,
      speed: before.run.speed,
    });
    expect(stored.workers[0]?.response).toMatchObject({
      voiceStatus: "pending",
      voiceStopRequestedAt: RECOVERY_TIME,
      spokenAt: null,
    });
    expect(stale.getRun("equipment").snapshot.run).toEqual(stored.run);
    expect(stale.getRun("equipment").snapshot.workers).toEqual(stored.workers);
    expect(stale.getRun("equipment").clock.snapshot().status).toBe("paused");
    expect(repository.history(before.run.runId)).toEqual([...history, stored]);
    expect(repository.audits(before.run.runId)).toEqual(audits);
    expect(repository.runtimeState(before.run.runId)).toBe(checkpoint);
    expect(repository.findRequestReceipt("equipment", requestId)).toBeNull();
    expect(
      database.sqlite
        .prepare("SELECT actor_id FROM run_snapshots WHERE run_id = ? AND version = ?")
        .get(stored.run.runId, stored.run.version),
    ).toEqual({ actor_id: "engine" });
  });
});
