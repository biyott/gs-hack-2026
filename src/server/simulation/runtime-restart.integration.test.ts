import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { SimulationMode } from "@/contracts";
import { ScenarioSchema } from "../scenarios";
import type { SimulationConfiguration } from "./configuration";
import { cleanups, configuration, fixture } from "./runtime-test-fixtures";

type RuntimeFixture = ReturnType<typeof fixture>;

function persistent(config: SimulationConfiguration = configuration) {
  const directory = mkdtempSync(join(tmpdir(), "gs-runtime-"));
  cleanups.push(() => rmSync(directory, { recursive: true, force: true }));
  const path = join(directory, "safety.sqlite");
  const context = fixture(path, config);
  context.command({ action: "start" });
  const checkpoint = context.runtime.getRun("equipment").scenario.expectedResults[0];
  assert.ok(checkpoint);
  advanceTo(context, checkpoint.atMs);
  return { path, context };
}

function advanceTo(f: RuntimeFixture, atMs: number, mode: SimulationMode = "equipment") {
  const { virtualTimeMs, speed } = f.snapshot(mode).run;
  return f.command({ action: "advance", deltaMs: (atMs - virtualTimeMs) / speed }, mode);
}

describe("runtime persisted continuation", () => {
  it("restores both mode histories and pauses clocks when SQLite is reopened", () => {
    // Given
    const { path, context: f } = persistent();
    f.command({ action: "start" }, "fire-gas");
    const checkpoint = f.runtime.getRun("fire-gas").scenario.expectedResults.at(-1);
    assert.ok(checkpoint);
    advanceTo(f, checkpoint.atMs, "fire-gas");
    f.runtime.respond(f.response("help-requested"), f.session("worker-a"));
    const modes = [f.snapshot(), f.snapshot("fire-gas")];
    const histories = modes.map((snapshot) => f.repository.history(snapshot.run.runId));
    const audits = modes.map((snapshot) => f.repository.audits(snapshot.run.runId));
    f.runtime.dispose();
    f.database.close();
    // When
    const reopened = fixture(path);
    // Then
    for (const [index, before] of modes.entries()) {
      expect(reopened.snapshot(before.mode)).toEqual({
        ...before,
        streamId: expect.any(String),
        sequence: expect.any(Number),
        run: { ...before.run, status: "paused", version: before.run.version + 1 },
        workers: before.workers.map((worker) =>
          worker.currentGuidance && ["pending", "playing"].includes(worker.response.voiceStatus)
            ? {
                ...worker,
                response: {
                  ...worker.response,
                  voiceStatus:
                    worker.response.voiceStatus === "playing" ? "stop-requested" : "pending",
                  voiceStopRequestedAt:
                    worker.response.voiceStopRequestedAt ?? new Date().toISOString(),
                },
              }
            : worker,
        ),
      });
      expect(reopened.snapshot(before.mode).streamId).not.toBe(before.streamId);
      const recoveredHistory = reopened.repository.history(before.run.runId);
      expect(recoveredHistory.slice(0, -1)).toEqual(histories[index]);
      expect(recoveredHistory.at(-1)).toEqual(reopened.repository.current(before.mode));
      expect(reopened.repository.audits(before.run.runId)).toEqual(audits[index]);
    }
  });

  it("retains equipment clearance when a reopened run is resumed", () => {
    // Given
    const { path, context: f } = persistent();
    f.incident({ action: "clear-hazard" });
    const before = f.snapshot();
    f.runtime.dispose();
    f.database.close();
    const reopened = fixture(path);
    reopened.command({ action: "resume" });
    // When
    const result = reopened.command({ action: "advance", deltaMs: 250 });
    // Then
    expect(
      result.hazards.map((hazard) => ({ id: hazard.hazardId, active: hazard.active })),
    ).toEqual(before.hazards.map((hazard) => ({ id: hazard.hazardId, active: false })));
    expect(result.incidents.map((incident) => incident.status)).toEqual(["cleared"]);
  });

  it.each(["sk1265-at6", "tadano-gr250n4"])("restores %s pose and trajectory", (presetId) => {
    const { path, context: f } = persistent();
    if (presetId !== f.snapshot().equipment.presetId) f.command({ action: "equipment", presetId });
    const before = f.command({ action: "control", pose: { slewDeg: 7 } });
    const expected = f.runtime.getRun("equipment").advance(250, 0).at(-1);
    assert.ok(expected);
    f.runtime.dispose();
    f.database.close();
    const reopened = fixture(path);
    expect(reopened.snapshot().equipment).toEqual(before.equipment);
    reopened.command({ action: "resume" });
    const result = reopened.command({ action: "advance", deltaMs: 250 });
    expect(result.equipment).toEqual(expected.equipment);
    expect(result.hazards.map((hazard) => hazard.hazardId)).toEqual(
      expected.hazards.map((hazard) => hazard.hazardId),
    );
  });

  it.each([false, true])(
    "retains fire clearance and passage authorization after restart when reopened=%s",
    (passageReopened) => {
      // Given
      const { path, context: f } = persistent();
      f.command({ action: "select", scenarioId: "FG-ROUTE-BLOCK" }, "fire-gas");
      f.command({ action: "start" }, "fire-gas");
      const checkpoint = f.runtime
        .getRun("fire-gas")
        .scenario.expectedResults.find((expected) => expected.kind === "blocked-paths");
      assert.ok(checkpoint);
      advanceTo(f, checkpoint.atMs, "fire-gas");
      f.runtime.incident(f.action({ action: "clear-hazard" }, "fire-gas"), f.admin);
      if (passageReopened)
        f.runtime.incident(f.action({ action: "reopen-passage" }, "fire-gas"), f.admin);
      const before = f.snapshot("fire-gas");
      f.runtime.dispose();
      f.database.close();
      const reopened = fixture(path);
      reopened.command({ action: "resume" }, "fire-gas");
      // When
      const result = reopened.command({ action: "advance", deltaMs: 250 }, "fire-gas");
      // Then
      expect(result.hazards.every((hazard) => !hazard.active)).toBe(true);
      expect(result.closedEdgeIds).toEqual(before.closedEdgeIds);
      expect(result.incidents[0]?.passageReopenedAt).toBe(before.incidents[0]?.passageReopenedAt);
    },
  );

  it("uses the most recent rerouted arrival target after SQLite is reopened", () => {
    // Given
    const base = configuration.scenarios.find((scenario) => scenario.id === "EQ-ARRIVAL");
    assert.ok(base);
    const hold = base.events.find((event) => event.type === "worker.position");
    assert.ok(hold);
    const scenario = ScenarioSchema.parse({
      ...base,
      id: "EQ-APPROACH",
      events: [
        ...base.events.filter((event) => event.type === "equipment.pose"),
        {
          id: "reroute",
          type: "route.block",
          atMs: 2000,
          pathIds: ["EDGE-A-04", "EDGE-A-05", "EDGE-C-05"],
        },
        { ...hold, atMs: 2000 },
        { ...hold, id: "arrive", atMs: 3000, position: { x: 125, y: 42 } },
      ],
    });
    const scenarios = configuration.scenarios.filter((entry) => entry.id !== scenario.id);
    const config = { ...configuration, scenarios: [...scenarios, scenario] };
    const { path, context: f } = persistent(config);
    expect(f.snapshot().workers[0]?.currentGuidance?.destinationId).toBe("REFUGE-01");
    advanceTo(f, 2000);
    expect(f.snapshot().workers[0]?.currentGuidance?.destinationId).toBe("REFUGE-02");
    advanceTo(f, 3000);
    expect(f.snapshot().workers[0]?.currentGuidance).toMatchObject({
      actionCode: "CONFIRM_ARRIVAL",
      waypoints: [],
    });
    f.runtime.dispose();
    f.database.close();
    const reopened = fixture(path, config);
    // When
    const result = reopened.runtime.respond(
      reopened.response("arrived"),
      reopened.session("worker-a"),
    );
    // Then
    expect(result.workers[0]?.response).toMatchObject({
      arrivedAt: expect.any(String),
      understoodAt: null,
      receivedAt: null,
    });
  });

  it("retains worker profile edits when a reopened run is resumed", () => {
    // Given
    const { path, context: f } = persistent();
    const original = f.snapshot().workers[0]?.profile;
    assert.ok(original);
    const profile = {
      ...original,
      version: original.version + 1,
      canUseStairs: false,
      needsAssistance: true,
    };
    f.command({ action: "profile", workerId: original.workerId, profile });
    f.runtime.dispose();
    f.database.close();
    const reopened = fixture(path);
    reopened.command({ action: "resume" });
    // When
    const result = reopened.command({ action: "advance", deltaMs: 250 });
    // Then
    expect(result.workers[0]?.profile).toEqual(profile);
  });

  it.each(["response receipt", "command", "incident", "response"] as const)(
    "returns current stream state when replaying a persisted %s after restart",
    (kind) => {
      // Given
      const { path, context: f } = persistent();
      const command = f.request({ action: "speed", speed: 2 });
      const incident = f.action({ action: "acknowledge" });
      const response = f.response("understood");
      const dispatch = (context: RuntimeFixture) => {
        switch (kind) {
          case "command":
            return context.runtime.command(command, context.admin);
          case "incident":
            return context.runtime.incident(incident, context.admin);
          case "response":
          case "response receipt":
            return context.runtime.respond(response, context.session("worker-a"));
          default:
            return assert.fail(`Unexpected replay kind ${String(kind)}`);
        }
      };
      const requestId = kind === "command" ? command.requestId : incident.requestId;
      const receipt = (context: RuntimeFixture) =>
        kind === "command" || kind === "incident"
          ? context.repository.findRequestReceipt("equipment", requestId)
          : context.repository.responseReceipt(response);
      const original = dispatch(f);
      const history = f.repository.history(original.run.runId);
      const originalReceipt = receipt(f);
      assert.ok(originalReceipt);
      expect(originalReceipt.snapshot).toEqual(original);
      f.runtime.dispose();
      f.database.close();
      const reopened = fixture(path);
      const current = reopened.snapshot();
      const recoveredHistory = reopened.repository.history(original.run.runId);
      expect(current.run.version).toBe(original.run.version + 1);
      expect(recoveredHistory).toEqual([...history, reopened.repository.current("equipment")]);
      const recoveryActor = reopened.database.sqlite
        .prepare("SELECT actor_id FROM run_snapshots WHERE run_id=? AND version=?")
        .get(current.run.runId, current.run.version);
      expect(recoveryActor).toEqual({ actor_id: "engine" });
      expect(receipt(reopened)).toEqual(originalReceipt);
      // When
      const replay = dispatch(reopened);
      // Then
      expect(replay).toEqual(current);
      expect(replay.streamId).not.toBe(original.streamId);
      expect(reopened.repository.history(original.run.runId)).toEqual(recoveredHistory);
      expect(receipt(reopened)).toEqual(originalReceipt);
    },
  );

  it("installs one scheduler and releases it when disposed", () => {
    // Given
    vi.useFakeTimers();
    const f = fixture();
    f.command({ action: "start" });
    f.runtime.startScheduler();
    f.runtime.startScheduler();
    // When
    vi.advanceTimersByTime(1000);
    // Then
    expect(f.snapshot().run.virtualTimeMs).toBe(1000 * f.snapshot().run.speed);
    expect(f.snapshot("fire-gas").run.virtualTimeMs).toBe(0);
    expect(vi.getTimerCount()).toBe(1);
    f.runtime.dispose();
    expect(vi.getTimerCount()).toBe(0);
  });
});
