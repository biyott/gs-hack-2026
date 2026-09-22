import { describe, expect, it } from "vitest";
import { frameRequestChanged, fullSiteBounds, polygonPoints, routeIsCurrent } from "./geometry";

describe("scene geometry contracts", () => {
  it("preserves the original 60 m reach beyond the observed table", () => {
    const bounds = fullSiteBounds({ x: 30, y: 25 }, 60);
    expect(bounds).toEqual({ minX: -30, maxX: 140, minY: -35, maxY: 85 });
  });

  it("maps positive logical Y upward on the SVG surface", () => {
    const points = polygonPoints([
      { x: 0, y: 0 },
      { x: 140, y: 50 },
    ]);
    expect(points).toBe("0,0 140,-50");
  });
});

describe("camera request isolation", () => {
  const request = { mode: "locked", selection: "incident-1", reset: 0 } as const;

  it("preserves a locked camera when a snapshot refreshes", () => {
    expect(frameRequestChanged(request, { ...request })).toBe(false);
  });

  it("frames again when the user explicitly resets", () => {
    expect(frameRequestChanged(request, { ...request, reset: 1 })).toBe(true);
  });

  it("updates framing only for following a moving worker", () => {
    const follow = { ...request, mode: "follow" } as const;
    expect(frameRequestChanged(follow, follow)).toBe(true);
  });
});

describe("route validity at the presentation boundary", () => {
  const context = {
    runId: "run-2",
    mapId: "SITE-CONSTRUCTION-01",
    mapVersion: "1.0.0",
    observedAt: "2026-09-21T09:00:00Z",
    nowMs: Date.parse("2026-09-21T09:00:00Z"),
  } as const;
  const route = {
    runId: "run-2",
    mapId: "SITE-CONSTRUCTION-01",
    mapVersion: "1.0.0",
    expiresAt: "2026-09-21T09:01:00Z",
  } as const;

  it("hides routes from a previous run", () => {
    expect(routeIsCurrent({ ...route, runId: "run-1" }, context)).toBe(false);
  });

  it("hides routes from a different map version", () => {
    expect(routeIsCurrent({ ...route, mapVersion: "0.9.0" }, context)).toBe(false);
  });

  it("hides expired routes at the expiry boundary", () => {
    expect(routeIsCurrent({ ...route, expiresAt: context.observedAt }, context)).toBe(false);
  });

  it("retains an unexpired route for the current run and map", () => {
    expect(routeIsCurrent(route, context)).toBe(true);
  });

  it("expires a route when the wall clock advances while the snapshot is frozen", () => {
    expect(routeIsCurrent(route, { ...context, nowMs: Date.parse("2026-09-21T09:01:01Z") })).toBe(
      false,
    );
  });
});
