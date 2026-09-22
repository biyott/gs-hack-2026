import { describe, expect, it } from "vitest";
import type { Session } from "@/contracts";
import { allowedIncidentActions } from "./incident-permissions";

describe("incident action visibility", () => {
  it("limits final controls to an administrator", () => {
    const incident = { assignedTo: "support-1" };
    const session = { actorId: "manager-1", role: "operator" } satisfies Pick<
      Session,
      "actorId" | "role"
    >;
    const actions = allowedIncidentActions(session, incident);
    expect(actions).toEqual(["acknowledge", "assign", "field-check", "follow-up"]);
  });

  it("allows assigned support to respond to their assignment only", () => {
    const incident = { assignedTo: "support-1" };
    const session = { actorId: "support-1", role: "support" } satisfies Pick<
      Session,
      "actorId" | "role"
    >;
    const actions = allowedIncidentActions(session, incident);
    expect(actions).toEqual(["accept-support", "complete-support"]);
  });

  it("shows no support actions to another support actor", () => {
    const session = { actorId: "support-2", role: "support" } satisfies Pick<
      Session,
      "actorId" | "role"
    >;
    const actions = allowedIncidentActions(session, { assignedTo: "support-1" });
    expect(actions).toEqual([]);
  });

  it.each(["worker", "device", "observer"] as const)(
    "shows no management actions to %s",
    (role) => {
      const session = { actorId: "viewer-1", role };
      const actions = allowedIncidentActions(session, { assignedTo: null });
      expect(actions).toEqual([]);
    },
  );

  it("shows no actions without an authenticated session", () => {
    const actions = allowedIncidentActions(null, { assignedTo: null });
    expect(actions).toEqual([]);
  });

  it("includes the three independent final controls for an administrator", () => {
    const session = { actorId: "manager-1", role: "admin" } satisfies Pick<
      Session,
      "actorId" | "role"
    >;
    const actions = allowedIncidentActions(session, { assignedTo: null });
    expect(actions).toEqual([
      "acknowledge",
      "assign",
      "field-check",
      "follow-up",
      "clear-hazard",
      "reopen-passage",
      "close",
    ]);
  });
});
