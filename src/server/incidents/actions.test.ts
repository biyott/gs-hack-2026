import { describe, expect, it } from "vitest";
import type { IncidentAction, Session } from "@/contracts";
import { AuthenticationError } from "../auth/types";
import { applyIncidentAction, IncidentTransitionError } from "./index";
import { action, incident, managerContext, now, session, snapshot } from "./test-fixtures";

describe("incident management", () => {
  it("records acknowledgment separately when an operator reviews the incident", () => {
    // Given
    const context = { now, session: session("operator") };
    // When
    const outcome = applyIncidentAction(snapshot, action(), context);
    // Then
    expect(outcome.snapshot.incidents[0]).toMatchObject({
      acknowledgedAt: now,
      status: "active",
      version: 2,
      hazardClearedAt: null,
      passageReopenedAt: null,
      closedAt: null,
    });
    expect(outcome.snapshot.events[0]).toMatchObject({
      actorId: "operator-a",
      occurredAt: now,
      incidentId: "INCIDENT-A",
      kind: "incident.acknowledge",
    });
    expect(outcome.snapshot.incidents[0]?.audit).toEqual(outcome.snapshot.events);
    expect(snapshot.incidents[0]?.acknowledgedAt).toBeNull();
  });

  it.each(["clear-hazard", "reopen-passage", "close"] satisfies IncidentAction["action"][])(
    "denies an operator when %s is attempted",
    (name) => {
      // Given
      const context = { now, session: session("operator") };
      // When / Then
      expect(() => applyIncidentAction(snapshot, action(name), context)).toThrow(
        AuthenticationError,
      );
    },
  );

  it.each(["support", "worker", "device", "observer"] satisfies Session["role"][])(
    "denies assignment when the actor is %s",
    (role) => {
      // Given
      const command = { ...action("assign"), assigneeId: "support-a" };
      // When / Then
      expect(() => applyIncidentAction(snapshot, command, { now, session: session(role) })).toThrow(
        AuthenticationError,
      );
    },
  );

  it("rejects competing assignments when the incident version has advanced", () => {
    // Given
    const state = {
      ...snapshot,
      incidents: [
        {
          ...incident,
          version: 2,
          assignedTo: "support-first",
          supportStatus: "assigned" as const,
        },
      ],
    };
    // When / Then
    expect(() =>
      applyIncidentAction(
        state,
        { ...action("assign"), assigneeId: "support-second" },
        managerContext,
      ),
    ).toThrow(IncidentTransitionError);
  });

  it("rejects an obsolete snapshot version when an action is submitted", () => {
    // Given
    const command = { ...action(), expectedVersion: 6 };
    // When / Then
    expect(() => applyIncidentAction(snapshot, command, managerContext)).toThrow(
      IncidentTransitionError,
    );
  });

  it("retains the original guidance when policy regeneration is requested", () => {
    // Given
    const command = { ...action("follow-up"), note: "operator audit note" };
    // When
    const outcome = applyIncidentAction(snapshot, command, managerContext);
    // Then
    expect(outcome.refreshWorkerIds).toEqual(["WORKER-A"]);
    expect(outcome.snapshot.incidents[0]?.firstGuidance).toEqual(incident.firstGuidance);
    expect(outcome.snapshot.incidents[0]?.currentGuidance).toEqual(incident.currentGuidance);
  });

  it("keeps passage closure when the administrator clears a hazard", () => {
    // Given / When
    const outcome = applyIncidentAction(snapshot, action("clear-hazard"), managerContext);
    // Then
    expect(outcome.snapshot.incidents[0]).toMatchObject({
      status: "cleared",
      hazardClearedAt: now,
      passageReopenedAt: null,
      closedAt: null,
    });
    expect(outcome.snapshot.hazards[0]?.active).toBe(false);
    expect(outcome.snapshot.closedEdgeIds).toEqual(["EDGE-A"]);
  });

  it("rejects reopening when a hazard remains active", () => {
    // Given / When / Then
    expect(() => applyIncidentAction(snapshot, action("reopen-passage"), managerContext)).toThrow(
      IncidentTransitionError,
    );
  });

  it("accepts support separately when the assigned support actor responds", () => {
    // Given
    const state = {
      ...snapshot,
      incidents: [{ ...incident, assignedTo: "support-a", supportStatus: "assigned" as const }],
    };
    // When
    const outcome = applyIncidentAction(state, action("accept-support"), {
      now,
      session: session("support"),
    });
    // Then
    expect(outcome.snapshot.incidents[0]?.supportStatus).toBe("accepted");
    expect(outcome.snapshot.workers[0]?.response).toEqual(snapshot.workers[0]?.response);
  });

  it("rejects another support actor when accepting an assignment", () => {
    // Given
    const state = {
      ...snapshot,
      incidents: [{ ...incident, assignedTo: "support-other", supportStatus: "assigned" as const }],
    };
    // When / Then
    expect(() =>
      applyIncidentAction(state, action("accept-support"), { now, session: session("support") }),
    ).toThrow(AuthenticationError);
  });
});

describe("separate incident lifecycle transitions", () => {
  it("records assignment without accepting support when the manager chooses a support actor", () => {
    // Given
    const command = { ...action("assign"), assigneeId: "support-a" };
    // When
    const outcome = applyIncidentAction(snapshot, command, managerContext);
    // Then
    expect(outcome.snapshot.incidents[0]).toMatchObject({
      assignedTo: "support-a",
      supportStatus: "assigned",
      acknowledgedAt: null,
    });
  });

  it("records support completion without arrival when the accepted support actor finishes", () => {
    // Given
    const state = {
      ...snapshot,
      incidents: [{ ...incident, assignedTo: "support-a", supportStatus: "accepted" as const }],
    };
    // When
    const outcome = applyIncidentAction(state, action("complete-support"), {
      now,
      session: session("support"),
    });
    // Then
    expect(outcome.snapshot.incidents[0]?.supportStatus).toBe("completed");
    expect(outcome.snapshot.workers[0]?.response.arrivedAt).toBeNull();
  });

  it("rejects completion when support has not been accepted", () => {
    // Given
    const state = {
      ...snapshot,
      incidents: [{ ...incident, assignedTo: "support-a", supportStatus: "assigned" as const }],
    };
    // When / Then
    expect(() =>
      applyIncidentAction(state, action("complete-support"), { now, session: session("support") }),
    ).toThrow(IncidentTransitionError);
  });

  it("records separate reopening authorization when the hazard is cleared", () => {
    // Given
    const state = {
      ...snapshot,
      incidents: [{ ...incident, status: "cleared" as const, hazardClearedAt: now }],
    };
    // When
    const outcome = applyIncidentAction(state, action("reopen-passage"), managerContext);
    // Then
    expect(outcome.snapshot.incidents[0]).toMatchObject({
      status: "cleared",
      passageReopenedAt: now,
      closedAt: null,
    });
    expect(outcome.refreshWorkerIds).toEqual(["WORKER-A"]);
  });

  it("rejects closure when passage reopening is still pending", () => {
    // Given
    const state = {
      ...snapshot,
      incidents: [{ ...incident, status: "cleared" as const, hazardClearedAt: now }],
    };
    // When / Then
    expect(() => applyIncidentAction(state, action("close"), managerContext)).toThrow(
      IncidentTransitionError,
    );
  });

  it("closes only the incident when clearance and reopening were separately recorded", () => {
    // Given
    const state = {
      ...snapshot,
      incidents: [
        { ...incident, status: "cleared" as const, hazardClearedAt: now, passageReopenedAt: now },
      ],
    };
    // When
    const outcome = applyIncidentAction(state, action("close"), managerContext);
    // Then
    expect(outcome.snapshot.incidents[0]).toMatchObject({ status: "closed", closedAt: now });
    expect(outcome.snapshot.workers[0]?.response.arrivedAt).toBeNull();
    expect(outcome.snapshot.run.version).toBe(7);
  });

  it("records field observations without changing first guidance when a note is submitted", () => {
    // Given
    const command = { ...action("field-check"), note: "camera visibility confirmed" };
    // When
    const outcome = applyIncidentAction(snapshot, command, managerContext);
    // Then
    expect(outcome.snapshot.incidents[0]?.firstGuidance).toEqual(incident.firstGuidance);
    expect(outcome.snapshot.events[0]).toMatchObject({
      kind: "incident.field-check",
      actorId: "admin-a",
      occurredAt: now,
    });
  });

  it("rejects mutation when the authenticated session is expired", () => {
    // Given
    const context = { now, session: { ...session(), expiresAt: now } };
    // When / Then
    expect(() => applyIncidentAction(snapshot, action(), context)).toThrow(AuthenticationError);
  });
});
