import assert from "node:assert/strict";
import { describe, expect, it } from "vitest";
import { active, fixture } from "./runtime-test-fixtures";

describe("runtime incident and worker lifecycle", () => {
  const lifecycle = [
    { action: "acknowledge", expected: { acknowledgedAt: expect.any(String) } },
    {
      action: "assign",
      assigneeId: "support",
      expected: { assignedTo: "support", supportStatus: "assigned" },
    },
    { action: "accept-support", expected: { supportStatus: "accepted" } },
    { action: "complete-support", expected: { supportStatus: "completed" } },
    { action: "follow-up", expected: { status: "active" } },
    {
      action: "clear-hazard",
      expected: { status: "cleared", hazardClearedAt: expect.any(String), passageReopenedAt: null },
    },
    {
      action: "reopen-passage",
      expected: { status: "cleared", passageReopenedAt: expect.any(String) },
    },
    { action: "close", expected: { status: "closed", closedAt: expect.any(String) } },
  ] as const;
  it.each(lifecycle.map((step, index) => ({ ...step, index })))(
    "preserves first guidance when $action updates an incident",
    ({ index, expected }) => {
      // Given
      const f = active();
      const first = f.snapshot().incidents[0]?.firstGuidance;
      const support = f.session("support");
      const apply = (step: (typeof lifecycle)[number]) =>
        f.incident(
          step,
          step.action === "accept-support" || step.action === "complete-support"
            ? support
            : f.admin,
        );
      for (const step of lifecycle.slice(0, index)) apply(step);
      const target = lifecycle[index];
      assert.ok(target);
      const before = f.snapshot().incidents[0];
      // When
      const result = apply(target);
      // Then
      expect(result.incidents[0]).toMatchObject(expected);
      expect(result.incidents[0]?.firstGuidance).toEqual(first);
      expect(result.incidents[0]?.version).toBeGreaterThan(before?.version ?? 0);
      if (target.action === "follow-up")
        expect(result.workers[0]?.currentGuidance?.guidanceVersion).toBeGreaterThan(
          before?.currentGuidance[0]?.guidanceVersion ?? 0,
        );
      if (target.action === "close")
        expect(result.workers.every((worker) => worker.currentGuidance === null)).toBe(true);
    },
  );

  it.each(["observer", "worker-a", "support"])(
    "denies simulation commands when the actor is %s",
    (actor) => {
      // Given
      const f = fixture();
      const before = f.snapshot();
      // When / Then
      expect(() =>
        f.runtime.command(f.request({ action: "start" }), f.session(actor)),
      ).toThrowError(expect.objectContaining({ code: "FORBIDDEN" }));
      expect(f.snapshot()).toEqual(before);
    },
  );

  const responses = [
    ["received", { receivedAt: expect.any(String) }],
    ["displayed", { displayedAt: expect.any(String) }],
    ["voice-started", { voiceStatus: "playing" }],
    ["voice-completed", { spokenAt: expect.any(String), voiceStatus: "completed" }],
    ["voice-failed", { voiceStatus: "failed" }],
    ["voice-unsupported", { voiceStatus: "unsupported" }],
    ["understood", { understoodAt: expect.any(String) }],
    ["help-requested", { helpRequestedAt: expect.any(String) }],
  ] as const;
  it.each(responses)(
    "changes only the relevant worker response state when %s arrives",
    (kind, expected) => {
      // Given
      const f = active();
      const before = f.snapshot();
      const actor = f.session("worker-a");
      // When
      const result = f.runtime.respond(f.response(kind), actor);
      // Then
      expect(result.workers[0]?.response).toEqual({ ...before.workers[0]?.response, ...expected });
      expect(result.workers[1]).toEqual(before.workers[1]);
      expect(result.incidents[0]?.supportStatus).toBe(
        kind === "help-requested" ? "requested" : before.incidents[0]?.supportStatus,
      );
    },
  );

  it("replays a worker response without new history when its request is duplicated", () => {
    // Given
    const f = active();
    const actor = f.session("worker-a");
    const response = f.response("understood");
    const first = f.runtime.respond(response, actor);
    const history = f.repository.history(first.run.runId);
    // When
    const result = f.runtime.respond(response, actor);
    // Then
    expect(result).toEqual(first);
    expect(f.repository.history(first.run.runId)).toEqual(history);
  });
});
