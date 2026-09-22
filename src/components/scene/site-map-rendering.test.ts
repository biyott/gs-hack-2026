import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { type EquipmentState, MapSchema } from "@/contracts";
import { now, snapshot } from "@/server/incidents/test-fixtures";
import mapDocument from "../../../data/maps/site-construction-01.json";
import { SiteMap } from "./SiteMap";

const map = MapSchema.parse(mapDocument);

function renderEquipment(positionStatus: EquipmentState["positionStatus"]): string {
  return renderToStaticMarkup(
    createElement(SiteMap, {
      snapshot: {
        ...snapshot,
        equipment: { ...snapshot.equipment, position: { x: 31, y: 26 }, positionStatus },
      },
      map,
      bounds: map.bounds,
      request: { mode: "full", selection: "all", reset: 0 },
      selectedWorkerId: null,
      selectedIncidentId: null,
      onSelectWorker: () => undefined,
      reachM: 60,
      zoom: 1,
      nowMs: Date.parse(now),
    }),
  );
}

describe("map equipment position validity", () => {
  it("hides equipment and reach when its position is unknown", () => {
    // Given / When
    const markup = renderEquipment("unknown");
    // Then
    expect(markup).not.toContain('class="map-equipment"');
    expect(markup).not.toContain('class="map-reach-reference"');
  });

  it("marks the last reported equipment position visibly when it is stale", () => {
    // Given / When
    const markup = renderEquipment("stale");
    // Then
    expect(markup).toContain('data-state="stale"');
    expect(markup).toContain('transform="translate(31 -26)"');
    expect(markup).toMatch(/<title>장비 · [^<]+ · 마지막 위치 · 오래됨<\/title>/);
  });

  it("retains equipment and reach at reported coordinates when its position is known", () => {
    // Given / When
    const markup = renderEquipment("known");
    // Then
    expect(markup).toContain('class="map-equipment"');
    expect(markup).toContain('class="map-reach-reference" cx="31" cy="-26" r="60"');
    expect(markup).not.toContain('data-state="stale"');
  });
});
