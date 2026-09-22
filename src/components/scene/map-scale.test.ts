import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { MapSchema } from "@/contracts";
import { now, snapshot } from "@/server/incidents/test-fixtures";
import mapDocument from "../../../data/maps/site-construction-01.json";
import { fullSiteBounds } from "./geometry";
import { SiteMap } from "./SiteMap";

const viewport = vi.hoisted(() => ({ width: 321, height: 320 }));
vi.mock("./use-svg-size", () => ({ useSvgSize: () => ({ ref: null, size: viewport }) }));
const map = MapSchema.parse(mapDocument);
const bounds = fullSiteBounds({ x: 30, y: 25 }, 60);

describe("map distance scale", () => {
  it.each([
    [321, 0.5],
    [321, 1],
    [336, 1],
    [714, 1],
    [714, 4],
  ])("keeps its label in screen space at width %d and zoom %d", (width, zoom) => {
    // Given
    viewport.width = width;
    const worldWidth = (bounds.maxX - bounds.minX + 16) / zoom;
    const worldHeight = (bounds.maxY - bounds.minY + 16) / zoom;
    const scale = Math.min(width / worldWidth, viewport.height / worldHeight);

    // When
    const markup = renderToStaticMarkup(
      createElement(SiteMap, {
        snapshot,
        map,
        bounds,
        request: { mode: "full", selection: "all", reset: 0 },
        selectedWorkerId: null,
        selectedIncidentId: null,
        onSelectWorker: () => undefined,
        reachM: 60,
        zoom,
        nowMs: Date.parse(now),
      }),
    );

    // Then
    const label = markup.match(/<text[^>]*>10 m<\/text>/)?.[0];
    expect(label).toContain('font-size="var(--type-label)"');
    expect(label).toContain('text-anchor="middle"');
    expect(markup).toContain(`scale(${1 / scale})`);
    expect(markup).toMatch(/class="map-scale" d="M[^"]+h10m-10-1v2m10-2v2"/);
  });
});
