import assert from "node:assert/strict";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Guidance, SimulationMode } from "@/contracts";
import type { EnrichmentInput, EnrichmentResult } from "../rag";
import { active, fixture } from "../simulation/runtime-test-fixtures";
import { type AttachedRagService, attachRag } from "./rag";

type Pending = {
  readonly input: EnrichmentInput;
  readonly resolve: (result: EnrichmentResult) => void;
  readonly reject: (error: unknown) => void;
};
function controlled() {
  const calls: Pending[] = [];
  const service: AttachedRagService = {
    initialize: async () => undefined,
    enrichGuidance: (input) =>
      new Promise((resolve, reject) => calls.push({ input, resolve, reject })),
  };
  return { service, calls };
}
function current(f: ReturnType<typeof fixture>, mode: SimulationMode = "equipment"): Guidance {
  const guidance = f
    .snapshot(mode)
    .workers.find((worker) => worker.workerId === "WORKER-A")?.currentGuidance;
  assert.ok(guidance);
  return guidance;
}
function pending(calls: readonly Pending[], guidance: Guidance): Pending {
  const call = calls.findLast(
    (candidate) =>
      candidate.input.guidance.guidanceId === guidance.guidanceId &&
      candidate.input.guidance.guidanceVersion === guidance.guidanceVersion,
  );
  assert.ok(call);
  return call;
}
function accepted(guidance: Guidance): EnrichmentResult {
  return {
    status: "accepted",
    ragRunId: "fault-injection-fixture",
    supplement: {
      actionCode: guidance.actionCode,
      locale: guidance.locale,
      supplementalExplanation: "Fault-injection test explanation.",
      evidence: [{ documentId: "EQ-001", documentVersion: "0.1.0", chunkId: "EQ-001-01" }],
    },
  };
}

afterEach(() => vi.unstubAllEnvs());

describe("RAG attachment with the real simulation runtime", () => {
  it("keeps primary guidance available when RAG environment configuration is invalid", () => {
    // Given
    const f = fixture();
    vi.stubEnv("RAG_TIMEOUT_MS", "0");
    vi.stubEnv("RAG_LLM_API_KEY", "fixture-private-token");
    // When
    const readiness = attachRag(f.runtime);
    f.command({ action: "start" });
    f.command({ action: "advance", deltaMs: 1000 });
    // Then
    expect(readiness).toEqual({ status: "failed", detail: "configuration_failed" });
    expect(
      f.snapshot().workers.some((worker) => worker.currentGuidance?.updateKind === "primary"),
    ).toBe(true);
    expect(JSON.stringify(readiness)).not.toContain("fixture-private-token");
  });

  it.each([new Error("fixture-private-token"), "fixture-private-token"])(
    "contains initialization rejection without exposing its payload (%s)",
    async (failure) => {
      const f = active();
      const before = current(f);
      const service = { ...controlled().service, initialize: () => Promise.reject(failure) };
      const readiness = attachRag(f.runtime, () => service);
      await vi.waitFor(() => expect(readiness.status).toBe("failed"));
      expect(readiness.detail).toMatch(/^initialization_(failed|rejected)$/u);
      expect(current(f)).toEqual(before);
      expect(JSON.stringify(readiness)).not.toContain("fixture-private-token");
    },
  );

  it.each([new Error("fixture-private-token"), "fixture-private-token"])(
    "contains enrichment rejection after primary delivery (%s)",
    async (failure) => {
      const f = active();
      const primary = current(f);
      const control = controlled();
      const readiness = attachRag(f.runtime, () => control.service);
      await Promise.resolve();
      pending(control.calls, primary).reject(failure);
      await Promise.resolve();
      expect(readiness.status).toBe("ready");
      expect(readiness.detail).toMatch(/^enrichment_(failed|rejected)$/u);
      expect(current(f)).toEqual(primary);
    },
  );

  it.each([
    ["FG-FIRE", "evacuation"],
    ["FG-GAS-DESIGNATED", "designated-refuge"],
    ["FG-SHELTER", "shelter-per-scenario"],
  ])("maps the actual %s strategy to the retrieval category", async (scenarioId, category) => {
    const f = fixture();
    f.command({ action: "select", scenarioId }, "fire-gas");
    f.command({ action: "start" }, "fire-gas");
    f.command({ action: "advance", deltaMs: 1000 }, "fire-gas");
    const control = controlled();
    attachRag(f.runtime, () => control.service);
    await Promise.resolve();
    expect(
      control.calls.find((call) => call.input.guidance.simulationMode === "fire-gas")?.input.context
        .scenarioPolicy,
    ).toBe(category);
  });

  it.each([true, null])(
    "preserves companion need and confirmed-profile status when companion=%s",
    async (needsCompanion) => {
      const f = active();
      const profile = {
        ...current(f).profileSnapshot,
        version: 2,
        needsAssistance: false,
        needsCompanion,
        confirmedAt: needsCompanion ? "2026-09-21T08:00:00.000Z" : null,
      };
      f.command({ action: "profile", workerId: profile.workerId, profile });
      const control = controlled();
      attachRag(f.runtime, () => control.service);
      await Promise.resolve();
      expect(pending(control.calls, current(f)).input.context.profile).toMatchObject({
        assistanceRequired: needsCompanion,
        verified: needsCompanion === true,
      });
    },
  );

  it("keeps primary guidance and records an incident-linked fallback when enrichment times out", async () => {
    const f = active();
    const primary = current(f);
    const control = controlled();
    attachRag(f.runtime, () => control.service);
    await Promise.resolve();
    pending(control.calls, primary).resolve({
      status: "fallback",
      reason: "timeout",
      ragRunId: "fault-injection-fixture",
    });
    await Promise.resolve();
    expect(current(f)).toEqual(primary);
    expect(
      f
        .snapshot()
        .incidents[0]?.audit.some(
          (event) => event.kind === "rag.fallback" && event.incidentId === primary.incidentId,
        ),
    ).toBe(true);
  });

  it("publishes and persists the primary before waiting for a supplement while preserving primary receipts", async () => {
    const f = fixture();
    const control = controlled();
    attachRag(f.runtime, () => control.service);
    await Promise.resolve();
    f.command({ action: "start" });
    f.command({ action: "advance", deltaMs: 1000 });
    const primary = current(f);
    const first = structuredClone(f.snapshot().incidents[0]?.firstGuidance);
    expect(
      f.repository
        .current("equipment")
        ?.workers.some((worker) => worker.currentGuidance?.guidanceId === primary.guidanceId),
    ).toBe(true);
    const receipt = f.response("received");
    f.runtime.respond(receipt, f.session("worker-a"));
    for (const kind of ["displayed", "understood", "voice-completed", "help-requested"] as const)
      f.runtime.respond(f.response(kind), f.session("worker-a"));
    const response = structuredClone(
      f.snapshot().workers.find((worker) => worker.workerId === "WORKER-A")?.response,
    );
    await new Promise<void>((resolve) => setImmediate(resolve));
    pending(control.calls, primary).resolve(accepted(primary));
    await Promise.resolve();
    const supplement = current(f);
    expect(supplement).toMatchObject({
      guidanceVersion: primary.guidanceVersion + 1,
      updateKind: "supplement",
      primaryGuidanceVersion: primary.guidanceVersion,
      generatedAt: primary.generatedAt,
      expiresAt: primary.expiresAt,
    });
    expect(f.snapshot().workers.find((worker) => worker.workerId === "WORKER-A")?.response).toEqual(
      response,
    );
    expect(f.snapshot().incidents[0]?.firstGuidance).toEqual(first);
    expect(
      f
        .snapshot()
        .incidents[0]?.audit.some(
          (event) =>
            event.kind === "guidance.supplement" && event.incidentId === primary.incidentId,
        ),
    ).toBe(true);
    expect(f.repository.responseReceipt(receipt)?.request.guidanceVersion).toBe(
      primary.guidanceVersion,
    );
    const supplementalReceipt = f.response("received");
    f.runtime.respond(supplementalReceipt, f.session("worker-a"));
    expect(f.repository.responseReceipt(supplementalReceipt)?.request.guidanceVersion).toBe(
      supplement.guidanceVersion,
    );
  });

  it.each(["reset", "profile", "expiry", "dispose"] as const)(
    "rejects an in-flight supplement after %s",
    async (change) => {
      const f = active();
      const primary = current(f);
      const control = controlled();
      attachRag(f.runtime, () => control.service);
      await Promise.resolve();
      if (change === "reset") f.command({ action: "reset" });
      if (change === "profile")
        f.command({
          action: "profile",
          workerId: primary.workerId,
          profile: { ...primary.profileSnapshot, version: 2, preferredLocale: "en" },
        });
      if (change === "expiry") vi.setSystemTime(new Date(primary.expiresAt));
      if (change === "dispose") f.runtime.dispose();
      const before = structuredClone(f.snapshot());
      pending(control.calls, primary).resolve(accepted(primary));
      await Promise.resolve();
      expect(f.snapshot()).toEqual(before);
    },
  );

  it.each(["accepted", "fallback"] as const)(
    "keeps the committed primary unchanged when a %s commit fails",
    async (status) => {
      const f = active();
      const primary = current(f);
      const control = controlled();
      const readiness = attachRag(f.runtime, () => control.service);
      await Promise.resolve();
      const before = structuredClone(f.snapshot());
      vi.spyOn(f.repository, "commit").mockImplementationOnce(() => {
        throw new TypeError("fixture-private-token");
      });
      pending(control.calls, primary).resolve(
        status === "accepted"
          ? accepted(primary)
          : { status, reason: "timeout", ragRunId: "fault-injection-fixture" },
      );
      await Promise.resolve();
      expect(f.snapshot()).toEqual(before);
      expect(f.repository.current("equipment")).toEqual(before);
      expect(readiness.detail).toBe("enrichment_failed");
    },
  );
});
