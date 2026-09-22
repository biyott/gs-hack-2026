import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { SimulationMode, SimulationSnapshot } from "@/contracts";
import { createDatabase } from "../db";
import { createRunRepository } from "../db/run-repository";
import { SimulationRuntime } from "./runtime";
import { cleanups, configuration, fixture } from "./runtime-test-fixtures";

const FIRST_RECOVERY = "2026-09-21T09:00:10.000Z";
const SECOND_RECOVERY = "2026-09-21T09:00:20.000Z";

function reopen(path: string) {
  const database = createDatabase(path);
  const repository = createRunRepository(database);
  const runtime = new SimulationRuntime({ configuration, database, repository });
  const close = () => {
    runtime.dispose();
    if (database.sqlite.open) database.close();
  };
  cleanups.push(close);
  return { repository, runtime, close };
}

function workerResponse(snapshot: SimulationSnapshot) {
  const worker = snapshot.workers.find((entry) => entry.workerId === "WORKER-A");
  assert.ok(worker);
  return worker.response;
}

function projection(snapshot: SimulationSnapshot) {
  return {
    runId: snapshot.run.runId,
    status: snapshot.run.status,
    version: snapshot.run.version,
    response: workerResponse(snapshot),
  };
}

const cases = (["equipment", "fire-gas"] as const).flatMap((mode: SimulationMode) =>
  (["pending", "playing", "completed", "failed", "unsupported"] as const).map((voiceStatus) => ({
    mode,
    voiceStatus,
  })),
);

describe("runtime playback recovery durability", () => {
  it.each(cases)(
    "persists recovery once for $voiceStatus across repeated $mode constructors",
    ({ mode, voiceStatus }) => {
      // Given
      const directory = mkdtempSync(join(tmpdir(), "gs-recovery-durability-"));
      cleanups.push(() => rmSync(directory, { recursive: true, force: true }));
      const path = join(directory, "runtime.sqlite");
      const original = fixture(path);
      original.command({ action: "start" }, mode);
      original.command({ action: "advance", deltaMs: 1000 }, mode);
      const guidance = original.snapshot(mode).workers[0]?.currentGuidance;
      assert.ok(guidance);
      if (voiceStatus !== "pending")
        original.runtime.respond(
          {
            mode,
            runId: guidance.runId,
            workerId: guidance.workerId,
            requestId: randomUUID(),
            incidentId: guidance.incidentId,
            guidanceId: guidance.guidanceId,
            guidanceVersion: guidance.guidanceVersion,
            response: voiceStatus === "playing" ? "voice-started" : `voice-${voiceStatus}`,
            occurredAt: new Date().toISOString(),
          },
          original.session("worker-a"),
        );
      const before = original.snapshot(mode);
      expect(before.run.status).toBe("running");
      expect(workerResponse(before)).toMatchObject({ voiceStatus, voiceStopRequestedAt: null });
      const history = original.repository.history(before.run.runId);
      const audits = original.repository.audits(before.run.runId);
      const checkpoint = original.repository.runtimeState(before.run.runId);
      assert.ok(checkpoint);
      original.runtime.dispose();
      original.database.close();
      // When
      vi.setSystemTime(FIRST_RECOVERY);
      const first = reopen(path);
      const firstLive = first.runtime.getRun(mode).snapshot;
      const firstStored = first.repository.current(mode);
      assert.ok(firstStored);
      first.close();
      vi.setSystemTime(SECOND_RECOVERY);
      const second = reopen(path);
      const secondLive = second.runtime.getRun(mode).snapshot;
      const secondStored = second.repository.current(mode);
      assert.ok(secondStored);
      const finalHistory = second.repository.history(before.run.runId);
      console.info(
        "QD-003 isolated recovery observation",
        JSON.stringify({
          mode,
          voiceStatus,
          firstRecoveryAt: FIRST_RECOVERY,
          secondRecoveryAt: SECOND_RECOVERY,
          before: projection(before),
          firstLive: projection(firstLive),
          firstStored: projection(firstStored),
          secondLive: projection(secondLive),
          secondStored: projection(secondStored),
          historyVersions: finalHistory.map((entry) => entry.run.version),
        }),
      );
      // Then
      const expectedResponse = {
        ...workerResponse(before),
        voiceStatus: voiceStatus === "playing" ? "stop-requested" : voiceStatus,
        voiceStopRequestedAt:
          voiceStatus === "pending" || voiceStatus === "playing" ? FIRST_RECOVERY : null,
      };
      expect.soft(firstLive.run.status).toBe("paused");
      expect.soft(workerResponse(firstLive)).toEqual(expectedResponse);
      expect
        .soft(firstStored.run)
        .toMatchObject({ status: "paused", version: before.run.version + 1 });
      expect.soft(workerResponse(firstStored)).toEqual(expectedResponse);
      expect.soft(workerResponse(secondLive)).toEqual(expectedResponse);
      expect.soft(secondStored).toEqual(firstStored);
      expect
        .soft(secondLive.run)
        .toMatchObject({ status: "paused", version: before.run.version + 1 });
      expect.soft(finalHistory).toHaveLength(history.length + 1);
      expect.soft(finalHistory.slice(0, history.length)).toEqual(history);
      expect.soft(second.repository.audits(before.run.runId)).toEqual(audits);
      expect
        .soft(JSON.parse(second.repository.runtimeState(before.run.runId) ?? "null"))
        .toEqual(JSON.parse(checkpoint));
      expect.soft(secondLive.workers[0]?.currentGuidance).toEqual(guidance);
      expect
        .soft(secondLive.incidents.map((entry) => entry.firstGuidance))
        .toEqual(before.incidents.map((entry) => entry.firstGuidance));
      expect.soft(secondLive.equipment).toEqual(before.equipment);
      expect.soft(secondLive.closedEdgeIds).toEqual(before.closedEdgeIds);
    },
  );

  it.each(["pending", "playing", "completed", "failed", "unsupported"] as const)(
    "does not recommit an already paused %s response or replace its first marker",
    (state) => {
      // Given
      const directory = mkdtempSync(join(tmpdir(), "gs-paused-durability-"));
      cleanups.push(() => rmSync(directory, { recursive: true, force: true }));
      const path = join(directory, "runtime.sqlite");
      const original = fixture(path);
      original.command({ action: "start" });
      original.command({ action: "advance", deltaMs: 1000 });
      if (state !== "pending")
        original.runtime.respond(
          original.response(state === "playing" ? "voice-started" : `voice-${state}`),
          original.session("worker-a"),
        );
      const before = original.command({ action: "pause" });
      const history = original.repository.history(before.run.runId);
      const audits = original.repository.audits(before.run.runId);
      const checkpoint = original.repository.runtimeState(before.run.runId);
      original.runtime.dispose();
      original.database.close();
      // When
      vi.setSystemTime(FIRST_RECOVERY);
      const first = reopen(path);
      const firstLive = first.runtime.getRun("equipment").snapshot;
      first.close();
      vi.setSystemTime(SECOND_RECOVERY);
      const second = reopen(path);
      const secondLive = second.runtime.getRun("equipment").snapshot;
      // Then
      expect(firstLive.run).toEqual(before.run);
      expect(secondLive.run).toEqual(before.run);
      expect(firstLive.workers).toEqual(before.workers);
      expect(secondLive.workers).toEqual(before.workers);
      expect(second.repository.current("equipment")).toEqual(before);
      expect(second.repository.history(before.run.runId)).toEqual(history);
      expect(second.repository.audits(before.run.runId)).toEqual(audits);
      expect(second.repository.runtimeState(before.run.runId)).toBe(checkpoint);
    },
  );
});
