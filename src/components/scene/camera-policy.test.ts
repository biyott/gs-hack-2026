import { describe, expect, it } from "vitest";
import {
  cameraEventDecision,
  cameraEventTransition,
  cameraScopeKey,
  prioritizeCameraNotice,
} from "./camera-policy";

const high = {
  incidentId: "incident-high",
  priority: "high",
  status: "active",
  hazardIds: ["hazard-1"],
} as const;
const critical = {
  incidentId: "incident-critical",
  priority: "critical",
  status: "active",
  hazardIds: ["hazard-2"],
} as const;

describe("event-driven camera policy", () => {
  it("frames a new incident once while in full-site mode", () => {
    expect(cameraEventDecision([], [high], "full")?.frame).toBe(true);
  });
  it("does not retarget for an incident already seen on an ordinary tick", () => {
    expect(cameraEventDecision(["incident-high:hazard-1"], [high], "risk")).toBeNull();
  });
  it("prioritizes a new critical incident over a high-priority incident", () => {
    expect(cameraEventDecision([], [high, critical], "full")?.incidentId).toBe("incident-critical");
  });
  it.each(["locked", "follow"] as const)(
    "preserves %s and surfaces the new risk notice",
    (mode) => {
      expect(cameraEventDecision([], [critical], mode)).toMatchObject({
        incidentId: "incident-critical",
        frame: false,
      });
    },
  );
  it("frames a newly related hazard without treating position updates as events", () => {
    expect(
      cameraEventDecision(
        ["incident-high:hazard-1"],
        [{ ...high, hazardIds: ["hazard-1", "hazard-3"] }],
        "risk",
      )?.frame,
    ).toBe(true);
  });
  it("ignores closed incidents", () => {
    expect(cameraEventDecision([], [{ ...critical, status: "closed" }], "full")).toBeNull();
  });
  it("keeps an unhandled critical notice above a later high-priority notice", () => {
    const held = { incidentId: critical.incidentId, priority: critical.priority, frame: false };
    const incoming = { incidentId: high.incidentId, priority: high.priority, frame: false };
    expect(prioritizeCameraNotice(held, incoming)).toBe(held);
  });
  it("frames an already seen incident again after the publisher restarts in the same run", () => {
    const memory = {
      scope: cameraScopeKey("publisher-1", "run-1"),
      keys: ["incident-high:hazard-1"],
    };
    const transition = cameraEventTransition(
      memory,
      cameraScopeKey("publisher-2", "run-1"),
      [high],
      "locked",
    );
    expect(transition).toMatchObject({
      scopeChanged: true,
      event: { incidentId: "incident-high", frame: true },
    });
  });
});
