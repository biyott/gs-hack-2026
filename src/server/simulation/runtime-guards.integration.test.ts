import { describe, expect, it } from "vitest";
import { ApiFault } from "../http/errors";
import { active, configuration, fixture } from "./runtime-test-fixtures";

describe("runtime authorization and stale mutations", () => {
  it.each([{ position: { x: 36, y: 25 } }, { headingDeg: 30 }, { speedMps: 1 }])(
    "rejects measured equipment pose override %j without changing state",
    (pose) => {
      // Given
      const f = active();
      const before = f.command({ action: "position-input", input: "measured" });
      const history = f.repository.history(before.run.runId);
      // When / Then
      expect(() => f.command({ action: "control", pose })).toThrowError(ApiFault);
      expect(f.snapshot()).toEqual(before);
      expect(f.repository.history(before.run.runId)).toEqual(history);
    },
  );

  it("rejects table relinking when the retained slew exceeds the table limit", () => {
    // Given
    const f = active();
    const before = f.command({ action: "control", pose: { tableLinked: false, slewDeg: 90 } });
    const history = f.repository.history(before.run.runId);
    // When / Then
    expect(() => f.command({ action: "control", pose: { tableLinked: true } })).toThrowError(
      expect.objectContaining({ code: "CONTROL_LIMIT" }),
    );
    expect(f.snapshot()).toEqual(before);
    expect(f.repository.history(before.run.runId)).toEqual(history);
  });

  it.each(["operator", "support", "worker-a"])(
    "denies hazard clearance when the actor is %s",
    (actor) => {
      // Given
      const f = active();
      const before = f.snapshot();
      // When / Then
      expect(() =>
        f.runtime.incident(f.action({ action: "clear-hazard" }), f.session(actor)),
      ).toThrowError(expect.objectContaining({ code: "FORBIDDEN" }));
      expect(f.snapshot()).toEqual(before);
    },
  );

  it.each(["reopen-passage", "close"] as const)(
    "rejects %s when the hazard is still active",
    (action) => {
      // Given
      const f = active();
      const before = f.snapshot();
      // When / Then
      expect(() => f.incident({ action })).toThrowError(
        expect.objectContaining({ code: "INVALID_TRANSITION" }),
      );
      expect(f.snapshot()).toEqual(before);
    },
  );

  it("rejects closing a cleared incident when passage reopening is unapproved", () => {
    // Given
    const f = active();
    const before = f.incident({ action: "clear-hazard" });
    // When / Then
    expect(() => f.incident({ action: "close" })).toThrowError(
      expect.objectContaining({ code: "INVALID_TRANSITION" }),
    );
    expect(f.snapshot()).toEqual(before);
  });

  it("rejects a non-support assignee before changing the incident", () => {
    // Given
    const f = active();
    const before = f.snapshot();
    // When / Then
    expect(() => f.incident({ action: "assign", assigneeId: "admin" })).toThrowError(
      expect.objectContaining({ code: "ASSIGNEE_INVALID" }),
    );
    expect(f.snapshot()).toEqual(before);
  });

  it.each(["worker-b", "admin", "observer"])(
    "denies a worker response when submitted by %s",
    (actor) => {
      // Given
      const f = active();
      const before = f.snapshot();
      // When / Then
      expect(() => f.runtime.respond(f.response("understood"), f.session(actor))).toThrowError(
        expect.objectContaining({ code: "FORBIDDEN" }),
      );
      expect(f.snapshot()).toEqual(before);
    },
  );

  it("rejects arrival when the current position is outside the destination tolerance", () => {
    // Given
    const f = active();
    const actor = f.session("worker-a");
    const before = f.snapshot();
    // When / Then
    expect(() => f.runtime.respond(f.response("arrived"), actor)).toThrowError(
      expect.objectContaining({ code: "ARRIVAL_UNVERIFIED" }),
    );
    expect(f.snapshot()).toEqual(before);
  });

  it("records explicit arrival independently when the scenario reaches its destination", () => {
    // Given
    const f = fixture();
    f.command({ action: "select", scenarioId: "EQ-ARRIVAL" });
    f.command({ action: "start" });
    f.command({ action: "advance", deltaMs: 32000 });
    const actor = f.session("worker-a");
    // When
    const result = f.runtime.respond(f.response("arrived"), actor);
    // Then
    expect(result.workers[0]?.response).toMatchObject({
      arrivedAt: expect.any(String),
      receivedAt: null,
      displayedAt: null,
      spokenAt: null,
      understoodAt: null,
    });
  });

  it("rejects an older guidance version after a follow-up reissues it", () => {
    // Given
    const f = active();
    const old = f.response("understood");
    const actor = f.session("worker-a");
    const before = f.incident({ action: "follow-up" });
    // When / Then
    expect(() => f.runtime.respond(old, actor)).toThrowError(
      expect.objectContaining({ code: "STALE_GUIDANCE" }),
    );
    expect(f.snapshot()).toEqual(before);
  });

  it.each(configuration.equipment.map((preset) => preset.id))(
    "invalidates old guidance when selecting equipment %s",
    (presetId) => {
      // Given
      const f = active();
      const old = f.response("understood");
      const actor = f.session("worker-a");
      const version = f.snapshot().equipment.geometryVersion;
      const result = f.command({ action: "equipment", presetId });
      // When / Then
      expect(() => f.runtime.respond(old, actor)).toThrowError(
        expect.objectContaining({ code: "STALE_GUIDANCE" }),
      );
      expect(result.equipment).toMatchObject({ presetId, geometryVersion: version + 1 });
      expect(result.workers[0]?.currentGuidance?.guidanceVersion).toBeGreaterThan(
        old.guidanceVersion,
      );
    },
  );

  it.each(["changed payload", "different actor"])(
    "rejects reused command IDs with %s",
    (difference) => {
      // Given
      const f = fixture();
      const request = f.request({ action: "speed", speed: 2 });
      const before = f.runtime.command(request, f.admin);
      const altered =
        difference === "changed payload" ? { ...request, action: "pause" as const } : request;
      const actor = difference === "different actor" ? f.session("operator") : f.admin;
      // When / Then
      expect(() => f.runtime.command(altered, actor)).toThrowError(
        expect.objectContaining({ code: "REQUEST_CONFLICT" }),
      );
      expect(f.snapshot()).toEqual(before);
    },
  );

  it("rejects reused response IDs when the response kind changes", () => {
    // Given
    const f = active();
    const actor = f.session("worker-a");
    const response = f.response("received");
    const before = f.runtime.respond(response, actor);
    // When / Then
    expect(() => f.runtime.respond({ ...response, response: "understood" }, actor)).toThrowError(
      expect.objectContaining({ code: "REQUEST_CONFLICT" }),
    );
    expect(f.snapshot()).toEqual(before);
  });

  it.each(["reset", "incident"] as const)(
    "rejects changed payloads and actors for an existing %s receipt",
    (kind) => {
      // Given
      const f = active();
      const request =
        kind === "reset" ? f.request({ action: "reset" }) : f.action({ action: "acknowledge" });
      const dispatch = (actor = f.admin) =>
        "incidentId" in request
          ? f.runtime.incident(request, actor)
          : f.runtime.command(request, actor);
      const first = dispatch();
      const history = f.repository.history(first.run.runId);
      // When / Then
      expect(() => dispatch(f.session("operator"))).toThrowError(
        expect.objectContaining({ code: "REQUEST_CONFLICT" }),
      );
      expect(() =>
        "incidentId" in request
          ? f.runtime.incident({ ...request, note: "changed" }, f.admin)
          : f.runtime.command({ ...request, action: "pause" }, f.admin),
      ).toThrowError(expect.objectContaining({ code: "REQUEST_CONFLICT" }));
      expect(f.snapshot()).toEqual(first);
      expect(f.repository.history(first.run.runId)).toEqual(history);
    },
  );

  it("rejects a competing incident version without storing an audit or receipt", () => {
    // Given
    const f = active();
    const request = f.action({ action: "acknowledge" });
    const first = f.incident({ action: "field-check" });
    const audits = f.repository.audits(first.run.runId);
    const history = f.repository.history(first.run.runId);
    // When / Then
    expect(() =>
      f.runtime.incident({ ...request, expectedVersion: first.run.version }, f.admin),
    ).toThrowError(expect.objectContaining({ code: "CONFLICT" }));
    expect(f.snapshot()).toEqual(first);
    expect(f.repository.history(first.run.runId)).toEqual(history);
    expect(f.repository.audits(first.run.runId)).toEqual(audits);
    expect(f.repository.findRequestReceipt("equipment", request.requestId)).toBeNull();
  });
});
