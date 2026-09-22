import { describe, expect, it } from "vitest";
import { type ActionCode, ActionCodeSchema } from "@/contracts";
import { GuidanceTemplateError, getActionMessage, getMessageKey } from "./templates";

const approvedActions = [
  "ALERT_HAZARD",
  "FOLLOW_VALIDATED_ROUTE",
  "GUIDANCE_UPDATED",
  "ROUTE_UNAVAILABLE",
  "POSITION_UNKNOWN",
  "SENSOR_UNKNOWN",
  "REQUEST_ASSISTANCE",
  "SHELTER_PER_SCENARIO",
  "CONFIRM_UNDERSTANDING",
  "CONFIRM_ARRIVAL",
  "AWAIT_REOPEN_AUTHORIZATION",
] as const satisfies readonly ActionCode[];

describe("reviewed action catalog", () => {
  it("covers only the eleven authorized actions when compared with the shared contract", () => {
    const authorized = [...approvedActions].sort();
    const contractActions = [...ActionCodeSchema.options].sort();
    expect(contractActions).toEqual(authorized);
  });

  it.each(approvedActions)("provides both supported languages when action is %s", (actionCode) => {
    const destinationId = "REFUGE-02";
    const korean = getActionMessage(actionCode, "ko", destinationId);
    const english = getActionMessage(actionCode, "en", destinationId);
    expect(korean).toMatch(/[가-힣]/u);
    expect(english).toMatch(/[a-z]/iu);
    expect(english).not.toMatch(/[가-힣]/u);
    expect(korean).not.toBe(english);
    expect(korean).not.toMatch(/\{[^}]+\}/u);
    expect(english).not.toMatch(/\{[^}]+\}/u);
  });

  it("preserves the engine destination identifier when rendering a route instruction", () => {
    const destinationId = "REFUGE-02";
    const messages = ["ko", "en"].map((locale) =>
      getActionMessage("FOLLOW_VALIDATED_ROUTE", locale === "ko" ? "ko" : "en", destinationId),
    );
    expect(messages.every((message) => message.includes(destinationId))).toBe(true);
  });

  it("omits stale destination identifiers when rendering a nonmovement action", () => {
    const destinationId = "REFUGE-02";
    const message = getActionMessage("ROUTE_UNAVAILABLE", "en", destinationId);
    expect(message).not.toContain(destinationId);
  });

  it("rejects a movement message when the authoritative destination is missing", () => {
    const render = () => getActionMessage("FOLLOW_VALIDATED_ROUTE", "en", null);
    expect(render).toThrow(GuidanceTemplateError);
  });

  it("preserves literal identifier characters when rendering an engine-supplied destination", () => {
    const destinationId = "REFUGE-$&-$`-$'";
    const message = getActionMessage("FOLLOW_VALIDATED_ROUTE", "en", destinationId);
    expect(message).toContain(destinationId);
    expect(message).not.toContain("{destinationId}");
  });

  it.each(approvedActions)(
    "provides a stable machine message key when action is %s",
    (actionCode) => {
      const messageKey = getMessageKey(actionCode);
      expect(messageKey).toBe(`guidance.${actionCode.toLowerCase()}`);
    },
  );
});
