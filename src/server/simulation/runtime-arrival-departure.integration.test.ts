import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ScenarioSchema } from "../scenarios";
import { cleanups, configuration, fixture } from "./runtime-test-fixtures";

describe("QD004 current arrival guidance after departure", () => {
  it("withdraws the current arrival prompt when a restored worker leaves the latest target", () => {
    // Given the same motion and position sequence as QA's preserved S20 OS fixture.
    const base = configuration.scenarios.find((scenario) => scenario.id === "EQ-SPEED-DIRECTION");
    assert.ok(base);
    const scenario = ScenarioSchema.parse({
      ...base,
      id: "QA-S20-OS",
      durationMs: 12_000,
      events: [
        ...base.events.filter((event) => event.atMs <= 8000),
        {
          id: "qa-latest-arrival",
          type: "worker.position",
          atMs: 9000,
          workerId: "WORKER-A",
          position: { x: 125, y: 42 },
        },
        {
          id: "qa-old-target",
          type: "worker.position",
          atMs: 11_000,
          workerId: "WORKER-A",
          position: { x: 125, y: 8 },
        },
      ],
    });
    const config = { ...configuration, scenarios: [...configuration.scenarios, scenario] };
    const directory = mkdtempSync(join(tmpdir(), "gs-qd004-arrival-"));
    cleanups.push(() => rmSync(directory, { recursive: true, force: true }));
    const path = join(directory, "runtime.sqlite");
    const original = fixture(path, config);
    original.command({ action: "select", scenarioId: scenario.id });
    original.command({ action: "start" });
    const first = original.command({ action: "advance", deltaMs: 4000 });
    expect(first.workers[0]?.currentGuidance?.destinationId).toBe("REFUGE-01");
    const latest = original.command({ action: "advance", deltaMs: 4000 });
    expect(latest.workers[0]?.currentGuidance?.destinationId).toBe("REFUGE-02");
    const atTarget = original.command({ action: "advance", deltaMs: 1000 });
    const arrival = atTarget.workers[0]?.currentGuidance;
    assert.ok(arrival);
    expect(arrival).toMatchObject({
      actionCode: "CONFIRM_ARRIVAL",
      guidanceVersion: 3,
      messageArgs: { reasonCode: "destination-reached" },
    });
    expect(atTarget.workers[0]?.response.arrivedAt).toBeNull();
    original.command({ action: "pause" });
    original.runtime.dispose();
    original.database.close();
    const restored = fixture(path, config);
    expect(restored.runtime.getRun("equipment").arrivalTargets["WORKER-A"]).toMatchObject({
      x: 125,
      y: 42,
    });
    expect(restored.snapshot().workers[0]?.currentGuidance).toEqual(arrival);
    restored.command({ action: "resume" });

    // When a fresh authoritative position moves to the obsolete first destination.
    const result = restored.command({ action: "advance", deltaMs: 2000 });

    // Then first history and arrival ACK remain independent from the current prompt.
    const worker = result.workers[0];
    assert.ok(worker);
    expect(result.run.virtualTimeMs).toBe(11_000);
    expect(worker).toMatchObject({
      position: { x: 125, y: 8 },
      positionStatus: "known",
      response: { arrivedAt: null },
    });
    expect(restored.runtime.getRun("equipment").arrivalTargets["WORKER-A"]).toMatchObject({
      x: 125,
      y: 42,
    });
    assert.ok(worker.position);
    expect(Math.hypot(worker.position.x - 125, worker.position.y - 42)).toBe(34);
    expect(result.incidents.map((incident) => incident.firstGuidance)).toEqual(
      first.incidents.map((incident) => incident.firstGuidance),
    );
    expect(() =>
      restored.runtime.respond(restored.response("arrived"), restored.session("worker-a")),
    ).toThrowError(expect.objectContaining({ code: "ARRIVAL_UNVERIFIED" }));
    expect(restored.repository.current("equipment")).toEqual(result);
    expect(worker.currentGuidance).toMatchObject({
      actionCode: "GUIDANCE_UPDATED",
      guidanceId: arrival.guidanceId,
      guidanceVersion: arrival.guidanceVersion + 1,
      messageArgs: { reasonCode: "risk-context-recalculated" },
      waypoints: [],
      destinationId: null,
      routeVersion: null,
      stepId: null,
    });
  });
});
