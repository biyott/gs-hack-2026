import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { UwbFixedAnchor } from "@/contracts";
import { FixedUwbAnchorForm } from "./fixed-uwb-anchor-form";

const anchor: UwbFixedAnchor = {
  version: "fixed-ui",
  positionTableM: { x: 0.3, y: 0.4 },
  headingRad: Math.PI / 2,
  antennaHeightM: 1.1,
  workerAntennaHeightsM: { "WORKER-A": 0.8, "WORKER-B": 1.25 },
};

function renderForm(canConfigure: boolean, configured: UwbFixedAnchor | null = anchor) {
  return renderToStaticMarkup(
    createElement(FixedUwbAnchorForm, { anchor: configured, canConfigure, onSave: async () => {} }),
  );
}

describe("fixed UWB anchor form controls", () => {
  it("disables the complete configuration fieldset for read-only consumers", () => {
    // Given a read-only consumer.
    const canConfigure = false;
    // When the fixed anchor controls are rendered.
    const html = renderForm(canConfigure);
    // Then native fieldset semantics disable every edit and action.
    expect(html).toMatch(/<fieldset\b[^>]*disabled=""/);
  });

  it("shows the applied server configuration in centimeters and degrees", () => {
    // Given an applied configuration distinct from every default.
    const configured = anchor;
    // When the operator opens the controls.
    const html = renderForm(true, configured);
    // Then editing starts from the server-confirmed physical geometry.
    expect(html).toMatch(/name="xCm"[^>]*value="30"/);
    expect(html).toMatch(/name="yCm"[^>]*value="40"/);
    expect(html).toMatch(/name="headingDeg"[^>]*value="90"/);
    expect(html).toMatch(/name="workerAHeightCm"[^>]*value="80"/);
    expect(html).toMatch(/name="workerBHeightCm"[^>]*value="125"/);
  });

  it("disables clearing when no fixed anchor has been applied", () => {
    // Given an editable form with no server configuration.
    const configured = null;
    // When it is rendered.
    const html = renderForm(true, configured);
    // Then the clear action is disabled while apply remains enabled.
    expect(html).toMatch(/<button\b[^>]*type="button"[^>]*disabled=""/);
    expect(html).not.toMatch(/<button\b[^>]*type="submit"[^>]*disabled=""/);
  });
});
