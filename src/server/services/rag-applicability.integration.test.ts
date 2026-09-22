import assert from "node:assert/strict";
import { describe, expect, it, vi } from "vitest";
import type { EnrichmentInput } from "../rag";
import { ResponsePolicySchema } from "../scenarios/policy";
import { configuration, fixture } from "../simulation/runtime-test-fixtures";
import { type AttachedRagService, attachRag } from "./rag";

async function capture(f: ReturnType<typeof fixture>): Promise<readonly EnrichmentInput[]> {
  const calls: EnrichmentInput[] = [];
  const service: AttachedRagService = {
    initialize: async () => undefined,
    enrichGuidance: (input) => {
      calls.push(input);
      return new Promise(() => undefined);
    },
  };
  attachRag(f.runtime, () => service);
  await Promise.resolve();
  return calls;
}

describe("QD008 authoritative RAG applicability context", () => {
  it("publishes the primary before reading optional enrichment history", async () => {
    // Given a ready enrichment attachment and no issued guidance.
    const f = fixture();
    const calls = await capture(f);
    const history = vi.spyOn(f.repository, "history");
    // When the authoritative command issues a primary.
    f.command({ action: "start" });
    f.command({ action: "advance", deltaMs: 1000 });
    expect(f.snapshot().workers.some((worker) => worker.currentGuidance !== null)).toBe(true);
    // Then optional history decoding waits for a later event-loop turn.
    expect(history).not.toHaveBeenCalled();
    expect(calls).toHaveLength(0);
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(history).toHaveBeenCalled();
    expect(calls.length).toBeGreaterThan(0);
  });

  it("drops queued enrichment after reset before reading history", async () => {
    // Given a primary whose optional enrichment has been queued.
    const f = fixture();
    const calls = await capture(f);
    const history = vi.spyOn(f.repository, "history");
    f.command({ action: "start" });
    f.command({ action: "advance", deltaMs: 1000 });
    // When reset supersedes that primary before the deferred turn.
    f.command({ action: "reset" });
    await new Promise<void>((resolve) => setImmediate(resolve));
    // Then neither historical applicability nor a provider call is attempted for it.
    expect(history).not.toHaveBeenCalled();
    expect(calls).toHaveLength(0);
  });

  it("recognizes a persisted fire reroute after later snapshots repeat its primary", async () => {
    // Given an existing validated route before the scenario expands fire across it.
    const f = fixture();
    f.command({ action: "select", scenarioId: "FG-ROUTE-BLOCK" }, "fire-gas");
    f.command({ action: "start" }, "fire-gas");
    f.command({ action: "advance", deltaMs: 1000 }, "fire-gas");
    const before = f.snapshot("fire-gas").workers[0]?.currentGuidance;
    assert.ok(before);
    expect(before.actionCode).toBe("FOLLOW_VALIDATED_ROUTE");
    // When fire invalidates that route and a later pause repeats the replacement primary.
    f.command({ action: "advance", deltaMs: 7000 }, "fire-gas");
    f.command({ action: "pause" }, "fire-gas");
    const calls = await capture(f);
    const input = calls.find((call) => call.guidance.workerId === before.workerId);
    assert.ok(input);
    expect(input.guidance.actionCode).toBe("FOLLOW_VALIDATED_ROUTE");
    expect(input.guidance.waypoints).not.toEqual(before.waypoints);
    // Then immutable transition history supplies the verified positive fact on startup.
    expect(input.context).toMatchObject({
      applicability: { fireInvalidatedPreviousRoute: true, equipmentDirectionChanged: false },
    });
  });

  it("recognizes an actual equipment direction event without treating initial setup as change", async () => {
    // Given an active equipment scenario with a later authored direction change.
    const f = fixture();
    f.command({ action: "select", scenarioId: "EQ-SPEED-DIRECTION" });
    f.command({ action: "start" });
    f.command({ action: "advance", deltaMs: 1000 });
    // When the direction event generates a new primary and RAG initializes afterward.
    f.command({ action: "advance", deltaMs: 7000 });
    const calls = await capture(f);
    const input = calls.find((call) => call.guidance.simulationMode === "equipment");
    assert.ok(input);
    // Then the exact preceding equipment state proves the direction change.
    expect(input.context).toMatchObject({
      applicability: { fireInvalidatedPreviousRoute: false, equipmentDirectionChanged: true },
    });
  });

  it.each(["equipment", "fire-gas"] as const)(
    "does not invent a prior change for the first %s guidance",
    async (mode) => {
      // Given a first guidance issued through the real runtime and SQLite history.
      const f = fixture();
      f.command({ action: "start" }, mode);
      f.command({ action: "advance", deltaMs: 1000 }, mode);
      // When RAG initializes after that primary was persisted.
      const calls = await capture(f);
      const input = calls.find((call) => call.guidance.simulationMode === mode);
      assert.ok(input);
      // Then neither an existing fire route nor equipment direction change is invented.
      expect(input.context).toMatchObject({
        applicability: {
          fireInvalidatedPreviousRoute: false,
          equipmentDirectionChanged: false,
        },
      });
    },
  );

  it("forwards the engine-selected strategy across competing hazard priorities", async () => {
    // Given a valid policy where gas wins over the combined response.
    const config = {
      ...configuration,
      policies: configuration.policies.map((policy) =>
        policy.id === "POLICY-FG-EVACUATE"
          ? ResponsePolicySchema.parse({
              ...policy,
              responses: policy.responses.map((response) =>
                response.hazardType === "gas"
                  ? { ...response, priority: 200, strategy: "designated-space" }
                  : response,
              ),
            })
          : policy,
      ),
    };
    const f = fixture(":memory:", config);
    f.command({ action: "select", scenarioId: "FG-COMBINED" }, "fire-gas");
    f.command({ action: "start" }, "fire-gas");
    f.command({ action: "advance", deltaMs: 1000 }, "fire-gas");
    // When the selected decision reaches RAG.
    const calls = await capture(f);
    const input = calls.find((call) => call.guidance.hazardType === "combined");
    assert.ok(input);
    expect(input.guidance.messageArgs["reasonCode"]).toBe("designated-space");
    // Then retrieval receives that selected policy rather than reselecting by hazard type.
    expect(input.context.scenarioPolicy).toBe("designated-refuge");
  });

  it("does not invent a movement policy for a route-unavailable decision", async () => {
    // Given an authoritative no-route action despite a configured evacuation response.
    const f = fixture();
    f.command({ action: "select", scenarioId: "FG-NO-ROUTE" }, "fire-gas");
    f.command({ action: "start" }, "fire-gas");
    f.command({ action: "advance", deltaMs: 1000 }, "fire-gas");
    // When RAG reads the issued decision.
    const calls = await capture(f);
    const input = calls.find((call) => call.guidance.actionCode === "ROUTE_UNAVAILABLE");
    assert.ok(input);
    // Then a non-movement reason remains unknown for movement-policy eligibility.
    expect(input.context.scenarioPolicy).toBeNull();
  });
});
