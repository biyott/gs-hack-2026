import { describe, expect, it } from "vitest";
import { confirmedProfile, graph, hazard, routeInput } from "./fixtures.test-support";
import { routeWorker } from "./routing";

describe("constrained Dijkstra routing", () => {
  it("finds the shortest weighted graph route", () => {
    // Given / When
    const result = routeWorker(routeInput);
    // Then
    expect(result).toMatchObject({
      kind: "valid",
      edgeIds: ["STAIRS", "SHORT"],
      distanceM: 8,
      estimatedSeconds: 10,
    });
  });

  it("uses the longer level route for confirmed stair prohibition", () => {
    // Given
    const input = { ...routeInput, profile: { ...confirmedProfile, canUseStairs: false } };
    // When
    const result = routeWorker(input);
    // Then
    expect(result).toMatchObject({
      kind: "valid",
      edgeIds: ["LEVEL", "LONG", "LINK"],
      distanceM: 16,
    });
  });

  it("treats unknown stairs as restricted and preserves assistance", () => {
    // Given
    const input = {
      ...routeInput,
      profile: { ...confirmedProfile, canUseStairs: null, needsAssistance: true, speedMps: null },
    };
    // When
    const result = routeWorker(input);
    // Then
    expect(result).toMatchObject({
      kind: "valid",
      edgeIds: ["LEVEL", "LONG", "LINK"],
      assistanceRequired: true,
      estimatedSeconds: null,
    });
  });

  it("refuses an unverified profile", () => {
    // Given
    const input = { ...routeInput, profile: { ...confirmedProfile, confirmedAt: null } };
    // When
    const result = routeWorker(input);
    // Then
    expect(result).toEqual({
      kind: "unavailable",
      reason: "profile-unverified",
      assistanceRequired: true,
    });
  });

  it("refuses a missing profile", () => {
    // Given / When
    const result = routeWorker({ ...routeInput, profile: null });
    // Then
    expect(result).toMatchObject({ kind: "unavailable", reason: "profile-unverified" });
  });

  it("avoids an edge crossing risk with safe endpoints", () => {
    // Given
    const danger = hazard([
      { x: 1, y: -1 },
      { x: 3, y: -1 },
      { x: 3, y: 1 },
      { x: 1, y: 1 },
    ]);
    // When
    const result = routeWorker({ ...routeInput, hazards: [danger] });
    // Then
    expect(result).toMatchObject({ kind: "valid", edgeIds: ["LEVEL", "LONG", "LINK"] });
  });

  it("permits only declared initial egress from a containing hazard", () => {
    // Given
    const danger = hazard([
      { x: -1, y: -1 },
      { x: 1, y: -1 },
      { x: 1, y: 1 },
      { x: -1, y: 1 },
    ]);
    // When
    const result = routeWorker({ ...routeInput, hazards: [danger] });
    // Then
    expect(result).toMatchObject({ kind: "valid", edgeIds: ["STAIRS", "SHORT"] });
  });

  it("rejects an exposed start without a declared egress connection", () => {
    // Given
    const danger = hazard([
      { x: -1, y: -1 },
      { x: 1, y: -1 },
      { x: 1, y: 1 },
      { x: -1, y: 1 },
    ]);
    const map = { ...graph, edges: graph.edges.map((edge) => ({ ...edge, initialEgress: false })) };
    // When
    const result = routeWorker({ ...routeInput, map, hazards: [danger] });
    // Then
    expect(result).toMatchObject({ kind: "unavailable", reason: "no-safe-attachment" });
  });

  it("excludes an unsafe nearer refuge", () => {
    // Given
    const danger = hazard([
      { x: 7, y: -1 },
      { x: 9, y: -1 },
      { x: 9, y: 1 },
      { x: 7, y: 1 },
    ]);
    // When
    const result = routeWorker({
      ...routeInput,
      hazards: [danger],
      destinationIds: ["REFUGE-01", "REFUGE-02"],
    });
    // Then
    expect(result).toMatchObject({ kind: "valid", destinationId: "REFUGE-02" });
  });

  it("uses a farther connected candidate when the closer candidate is disconnected", () => {
    // Given
    const map = {
      ...graph,
      edges: graph.edges.filter((edge) => edge.id !== "SHORT" && edge.id !== "LINK"),
    };
    // When
    const result = routeWorker({ ...routeInput, map, destinationIds: ["REFUGE-01", "REFUGE-02"] });
    // Then
    expect(result).toMatchObject({ kind: "valid", destinationId: "REFUGE-02" });
  });

  it("keeps a cleared-hazard passage closed until separately reopened", () => {
    // Given
    const danger = hazard([], { active: false });
    // When
    const result = routeWorker({ ...routeInput, hazards: [danger], closedEdgeIds: ["STAIRS"] });
    // Then
    expect(result).toMatchObject({ kind: "valid", edgeIds: ["LEVEL", "LONG", "LINK"] });
  });

  it("reports no route when every destination connection is closed", () => {
    // Given / When
    const result = routeWorker({ ...routeInput, closedEdgeIds: ["SHORT", "LINK"] });
    // Then
    expect(result).toMatchObject({
      kind: "unavailable",
      reason: "no-path",
      assistanceRequired: true,
    });
  });

  it("does not fabricate a connector for an off-corridor position", () => {
    // Given / When
    const result = routeWorker({ ...routeInput, position: { x: 4, y: 2 } });
    // Then
    expect(result).toMatchObject({ kind: "unavailable", reason: "no-safe-attachment" });
  });
});
