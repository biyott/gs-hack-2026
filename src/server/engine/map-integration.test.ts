import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MapSchema } from "../../../packages/contracts/src/map";
import { confirmedProfile, hazard } from "./fixtures.test-support";
import { routeWorker } from "./routing";

const map = MapSchema.parse(
  JSON.parse(
    readFileSync(new URL("../../../data/maps/site-construction-01.json", import.meta.url), "utf8"),
  ),
);
const risk = hazard([
  { x: 64, y: 24 },
  { x: 66, y: 24 },
  { x: 66, y: 26 },
  { x: 64, y: 26 },
]);
const input = {
  map,
  position: { x: 65, y: 25 },
  profile: confirmedProfile,
  hazards: [risk],
  closedEdgeIds: [],
  destinationIds: ["REFUGE-01", "REFUGE-02"],
};

describe("frozen shared-map integration", () => {
  it("uses the southern refuge for a confirmed stair-capable worker", () => {
    // Given / When
    const route = routeWorker(input);
    // Then
    expect(route).toMatchObject({ kind: "valid", destinationId: "REFUGE-01", distanceM: 77 });
    if (route.kind === "valid") expect(route.edgeIds[0]).toBe("EDGE-EGRESS-A-SOUTH");
  });

  it("uses the northern refuge and preserves assistance for a stair-ineligible worker", () => {
    // Given
    const next = {
      ...input,
      profile: {
        ...confirmedProfile,
        workerId: "WORKER-B",
        canUseStairs: false,
        needsAssistance: true,
        needsCompanion: true,
        speedMps: { min: 0.3, max: 0.7 },
      },
    };
    // When
    const route = routeWorker(next);
    // Then
    expect(route).toMatchObject({
      kind: "valid",
      destinationId: "REFUGE-02",
      distanceM: 77,
      assistanceRequired: true,
      estimatedSeconds: 77 / 0.3,
    });
    if (route.kind === "valid") expect(route.edgeIds[0]).toBe("EDGE-EGRESS-A-NORTH");
  });

  it("does not restore either refuge path when hazards clear but both corridors remain closed", () => {
    // Given
    const next = {
      ...input,
      hazards: [{ ...risk, active: false }],
      closedEdgeIds: ["PATH-A", "PATH-B"],
    };
    // When
    const route = routeWorker(next);
    // Then
    expect(route).toMatchObject({ kind: "unavailable", assistanceRequired: true });
  });
});
