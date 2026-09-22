import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Guidance } from "@/contracts";
import { guidance, incident, session, snapshot } from "@/server/incidents/test-fixtures";
import { GuidanceRecord } from "./guidance-record";
import { IncidentPanel } from "./incident-panel";

describe("immutable first guidance rendering", () => {
  it("groups a destination suffix without changing either transmitted message", () => {
    const original = "표시된 유효 경로를 따라 REFUGE-01(으)로 이동하세요.";
    const output = renderToStaticMarkup(
      createElement(GuidanceRecord, {
        guidance: {
          ...guidance,
          destinationId: "REFUGE-01",
          primaryMessage: original,
          managerExplanationKo: original,
        },
        original: true,
        observedAt: guidance.generatedAt,
      }),
    );
    for (const className of ["guidance-primary", "guidance-explanation"]) {
      const content = output.match(new RegExp(`<p class="${className}"[^>]*>(.*?)</p>`))?.[1];
      expect(content).toContain('<span class="keep-phrase">REFUGE-01(으)로</span>');
      expect(content?.replace(/<[^>]+>/g, "")).toBe(original);
    }
  });

  it("retains the original language and text after current guidance changes", () => {
    const first = { ...guidance, primaryMessage: "ORIGINAL_GUIDE_BODY" } satisfies Guidance;
    const current = {
      ...guidance,
      guidanceVersion: 2,
      primaryGuidanceVersion: 2,
      locale: "ko",
      primaryMessage: "CURRENT_GUIDE_BODY",
    } satisfies Guidance;
    const state = {
      ...snapshot,
      incidents: [{ ...incident, firstGuidance: [first], currentGuidance: [current] }],
    };
    const output = renderToStaticMarkup(
      createElement(IncidentPanel, {
        snapshot: state,
        selectedIncidentId: incident.incidentId,
        session: session("observer"),
        busy: false,
        onSelectIncident: () => undefined,
        onSelectWorker: () => undefined,
      }),
    );
    const originalRecord = output.match(
      /<article class="guidance-record guidance-original">([\s\S]*?)<\/article>/,
    )?.[1];
    expect(originalRecord).toContain('lang="en">ORIGINAL_GUIDE_BODY');
    expect(originalRecord).not.toContain("CURRENT_GUIDE_BODY");
    expect(output).toContain('lang="ko">CURRENT_GUIDE_BODY');
  });
});
