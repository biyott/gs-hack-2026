import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { ScenarioSchema } from "../scenarios";
import { RuntimeCheckpointSchema } from "./checkpoint";
import { cleanups, configuration, fixture } from "./runtime-test-fixtures";

function arrivedFixture() {
  const base = configuration.scenarios.find((scenario) => scenario.id === "EQ-SPEED-DIRECTION");
  assert.ok(base);
  const scenario = ScenarioSchema.parse({
    ...base,
    id: "QD004-CONTINUITY",
    durationMs: 20_000,
    events: [
      ...base.events
        .map((event) => ({ ...event, atMs: Math.round((event.atMs * 20_000) / base.durationMs) }))
        .filter((event) => event.atMs <= 8000),
      ...[
        { atMs: 8000, position: { x: 65, y: 25 } },
        { atMs: 9000, position: { x: 125, y: 42 } },
        { atMs: 11_000, position: { x: 125, y: 8 } },
        { atMs: 12_000, position: null },
        { atMs: 13_000, position: { x: 125, y: 42 } },
      ].map((event) => ({
        ...event,
        id: `worker-${event.atMs}`,
        type: "worker.position",
        workerId: "WORKER-A",
      })),
    ],
  });
  const config = { ...configuration, scenarios: [...configuration.scenarios, scenario] };
  const directory = mkdtempSync(join(tmpdir(), "gs-qd004-continuity-"));
  cleanups.push(() => rmSync(directory, { recursive: true, force: true }));
  const path = join(directory, "runtime.sqlite");
  const f = fixture(path, config);
  f.command({ action: "select", scenarioId: scenario.id });
  f.command({ action: "speed", speed: 1 });
  f.command({ action: "start" });
  f.command({ action: "advance", deltaMs: 9000 });
  expect(f.snapshot().workers[0]?.currentGuidance?.actionCode).toBe("CONFIRM_ARRIVAL");
  return { f, path, config };
}

describe("QD004 arrival eligibility continuity", () => {
  it("allows a fresh return after departure, expiration, profile renewal, restart and temporary unknown position", () => {
    const { f, path, config } = arrivedFixture();
    const firstHistory = f.snapshot().incidents.map((incident) => incident.firstGuidance);
    f.command({ action: "advance", deltaMs: 2000 });
    const departed = f.snapshot().workers[0]?.currentGuidance;
    assert.ok(departed);
    expect(departed.actionCode).toBe("GUIDANCE_UPDATED");
    vi.setSystemTime(new Date(Date.parse(departed.expiresAt) + 1));
    const worker = f.snapshot().workers[0];
    assert.ok(worker);
    f.command({
      action: "profile",
      workerId: worker.workerId,
      profile: {
        ...worker.profile,
        preferredLocale: "en",
        version: worker.profile.version + 1,
      },
    });
    const renewed = f.snapshot().workers[0]?.currentGuidance;
    expect(renewed).toMatchObject({
      actionCode: "GUIDANCE_UPDATED",
      guidanceId: departed.guidanceId,
      locale: "en",
    });
    expect(renewed?.guidanceVersion).toBeGreaterThan(departed.guidanceVersion);
    f.command({ action: "pause" });
    f.runtime.dispose();
    f.database.close();
    const restored = fixture(path, config);
    expect(restored.runtime.getRun("equipment").arrivalIntents["WORKER-A"]?.target).toEqual({
      x: 125,
      y: 42,
    });
    restored.command({ action: "resume" });
    const unknown = restored.command({ action: "advance", deltaMs: 1000 });
    expect(unknown.workers[0]?.currentGuidance?.actionCode).toBe("POSITION_UNKNOWN");
    expect(unknown.workers[0]?.response.arrivedAt).toBeNull();
    const returned = restored.command({ action: "advance", deltaMs: 1000 });
    expect(returned.workers[0]?.currentGuidance).toMatchObject({
      actionCode: "CONFIRM_ARRIVAL",
      guidanceId: departed.guidanceId,
      waypoints: [],
      destinationId: null,
    });
    expect(returned.workers[0]?.response.arrivedAt).toBeNull();
    expect(returned.incidents.map((incident) => incident.firstGuidance)).toEqual(firstHistory);
    const acknowledged = restored.runtime.respond(
      restored.response("arrived"),
      restored.session("worker-a"),
    );
    expect(acknowledged.workers[0]?.response.arrivedAt).not.toBeNull();
  });

  it("retains historical arrival ACK, help, assigned support and closures while resetting the new primary response", () => {
    const { f } = arrivedFixture();
    const ack = f.response("arrived");
    f.runtime.respond(ack, f.session("worker-a"));
    f.runtime.respond(f.response("help-requested"), f.session("worker-a"));
    f.incident({ action: "acknowledge" });
    f.incident({ action: "assign", assigneeId: "support" });
    f.incident({ action: "accept-support" }, f.session("support"));
    const before = f.snapshot();
    const result = f.command({ action: "advance", deltaMs: 2000 });
    expect(result.workers[0]?.currentGuidance?.actionCode).toBe("GUIDANCE_UPDATED");
    expect(result.workers[0]?.response).toMatchObject({
      arrivedAt: null,
      helpRequestedAt: before.workers[0]?.response.helpRequestedAt,
    });
    expect(result.incidents[0]).toMatchObject({
      firstGuidance: before.incidents[0]?.firstGuidance,
      assignedTo: "support",
      supportStatus: "accepted",
      closedAt: before.incidents[0]?.closedAt,
      passageReopenedAt: before.incidents[0]?.passageReopenedAt,
    });
    expect(result.closedEdgeIds).toEqual(before.closedEdgeIds);
    expect(f.repository.responseReceipt(ack)?.snapshot.workers[0]?.response.arrivedAt).toBe(
      ack.occurredAt,
    );
    expect(f.repository.audits(result.run.runId)).toContainEqual(
      expect.objectContaining({ kind: "worker.arrived" }),
    );
    const repeated = f.command({ action: "advance", deltaMs: 100 });
    expect(repeated.workers[0]?.currentGuidance).toEqual(result.workers[0]?.currentGuidance);
  });

  it.each(["latest", "missing"] as const)(
    "reconstructs legacy CONFIRM eligibility only with the exact %s sidecar target",
    (target) => {
      const { f } = arrivedFixture();
      const run = f.runtime.getRun("equipment");
      const { arrivalIntents: _oldIntents, ...legacy } = RuntimeCheckpointSchema.parse(
        JSON.parse(run.checkpoint()),
      );
      run.arrivalTargets["WORKER-A"] = { x: 125, y: 8 };
      run.restoreCheckpoint(
        JSON.stringify({
          ...legacy,
          arrivalTargets: target === "latest" ? legacy.arrivalTargets : {},
        }),
      );
      expect(run.arrivalIntents["WORKER-A"]?.target).toEqual(
        target === "latest" ? { x: 125, y: 42 } : undefined,
      );
      if (target === "latest") {
        f.command({ action: "advance", deltaMs: 4000 });
        expect(f.snapshot().workers[0]?.currentGuidance?.actionCode).toBe("CONFIRM_ARRIVAL");
        expect(run.arrivalTargets["WORKER-A"]).toMatchObject({ x: 125, y: 42 });
      }
    },
  );
});
