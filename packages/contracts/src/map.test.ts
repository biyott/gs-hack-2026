import { describe, expect, it } from "vitest";
import mapFixture from "../../../data/maps/site-construction-01.json";
import { MapSchema } from "./map";

describe("synthetic site map contract", () => {
  it("accepts the versioned source-008 fixture when parsed at the file boundary", () => {
    const actual = MapSchema.safeParse(mapFixture);
    expect(actual.success).toBe(true);
  });

  it.each([
    { case: "extra root data", data: { ...mapFixture, unexpected: true } },
    { case: "a real-site claim", data: { ...mapFixture, synthetic: false } },
    { case: "an unknown version", data: { ...mapFixture, mapVersion: "2.0.0" } },
    {
      case: "wrong bounds",
      data: { ...mapFixture, bounds: { minX: 0, minY: 0, maxX: 141, maxY: 50 } },
    },
    {
      case: "PATH-D",
      data: {
        ...mapFixture,
        edges: mapFixture.edges.map((edge) => ({ ...edge, pathId: "PATH-D" })),
      },
    },
    {
      case: "an unknown endpoint",
      data: { ...mapFixture, edges: mapFixture.edges.map((edge) => ({ ...edge, to: "MISSING" })) },
    },
    {
      case: "duplicate nodes",
      data: { ...mapFixture, nodes: [...mapFixture.nodes, ...mapFixture.nodes] },
    },
    {
      case: "duplicate edges",
      data: { ...mapFixture, edges: [...mapFixture.edges, ...mapFixture.edges] },
    },
    {
      case: "an invalid floor",
      data: {
        ...mapFixture,
        nodes: mapFixture.nodes.map((node) => ({ ...node, floorId: "UPPER" })),
      },
    },
    {
      case: "out-of-bounds nodes",
      data: { ...mapFixture, nodes: mapFixture.nodes.map((node) => ({ ...node, x: -0.000001 })) },
    },
    {
      case: "empty widths",
      data: { ...mapFixture, edges: mapFixture.edges.map((edge) => ({ ...edge, widthM: 0 })) },
    },
    {
      case: "egress on corridor edges",
      data: {
        ...mapFixture,
        edges: mapFixture.edges.map((edge) => ({ ...edge, initialEgress: true })),
      },
    },
    {
      case: "inverted rectangles",
      data: {
        ...mapFixture,
        metadata: { ...mapFixture.metadata, workArea: { minX: 100, minY: 12, maxX: 15, maxY: 38 } },
      },
    },
    {
      case: "storage outside work",
      data: {
        ...mapFixture,
        metadata: { ...mapFixture.metadata, storageArea: { minX: 1, minY: 1, maxX: 10, maxY: 10 } },
      },
    },
    {
      case: "invented point axes",
      data: {
        ...mapFixture,
        metadata: { ...mapFixture.metadata, craneOrigin: { x: 30, y: 25, z: 6 } },
      },
    },
    {
      case: "coincident endpoints",
      data: { ...mapFixture, nodes: mapFixture.nodes.map((node) => ({ ...node, x: 65, y: 25 })) },
    },
    {
      case: "obstacle crossings",
      data: {
        ...mapFixture,
        edges: [
          ...mapFixture.edges,
          {
            id: "CROSSING",
            from: "J-C-WEST",
            to: "J-C-EAST",
            pathId: "PATH-C",
            widthM: 4,
            stairs: false,
            accessible: true,
            enabled: true,
            initialEgress: false,
          },
        ],
      },
    },
    {
      case: "clearance overlaps",
      data: {
        ...mapFixture,
        nodes: mapFixture.nodes.map((node) =>
          node.id === "J-C-WEST" ? { ...node, x: 104 } : node,
        ),
      },
    },
    {
      case: "corridor width drift",
      data: { ...mapFixture, edges: mapFixture.edges.map((edge) => ({ ...edge, widthM: 6 })) },
    },
    {
      case: "boundary sweep",
      data: {
        ...mapFixture,
        nodes: mapFixture.nodes.map((node) => (node.id === "J-C-WEST" ? { ...node, x: 1 } : node)),
      },
    },
  ])("rejects $case when loading external map data", ({ data }) => {
    const actual = MapSchema.safeParse(data);
    expect(actual.success).toBe(false);
  });

  it("preserves source layout coordinates when loading the map", () => {
    const actual = MapSchema.parse(mapFixture);
    expect(actual.metadata).toMatchObject({
      craneOrigin: { x: 30, y: 25 },
      workArea: { minX: 15, minY: 12, maxX: 100, maxY: 38 },
      storageArea: { minX: 55, minY: 17, maxX: 75, maxY: 29 },
      liftDestination: { minX: 80, minY: 17, maxX: 95, maxY: 29 },
    });
    expect(actual.obstacles).toEqual([
      { id: "OBSTACLE-01", bounds: { minX: 105, minY: 18, maxX: 120, maxY: 30 }, heightM: 6 },
    ]);
    expect(actual.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "REFUGE-01", x: 125, y: 8 }),
        expect.objectContaining({ id: "REFUGE-02", x: 125, y: 42 }),
        expect.objectContaining({ id: "WORKER-A-START", x: 65, y: 25 }),
        expect.objectContaining({ id: "WORKER-B-START", x: 90, y: 40 }),
        expect.objectContaining({ id: "ASSEMBLY-01", x: 132, y: 42 }),
        expect.objectContaining({ id: "SHELTER-01", x: 8, y: 42 }),
      ]),
    );
  });

  it("provides exactly four explicit departure edges when the worker starts are loaded", () => {
    const actual = MapSchema.parse(mapFixture).edges.filter((edge) => edge.initialEgress);
    expect(actual.map(({ from, to }) => ({ from, to }))).toEqual([
      { from: "WORKER-A-START", to: "J-A-65" },
      { from: "WORKER-A-START", to: "J-B-65" },
      { from: "WORKER-B-START", to: "J-A-90" },
      { from: "WORKER-B-START", to: "J-B-90" },
    ]);
  });

  it("keeps full corridor widths clear of the static obstacle when graph geometry is swept", () => {
    const actual = MapSchema.parse(mapFixture);
    const nodes = new Map(actual.nodes.map((node) => [node.id, node]));
    for (const edge of actual.edges) {
      const from = nodes.get(edge.from);
      const to = nodes.get(edge.to);
      if (!from || !to) throw new RangeError("Fixture edge endpoint is missing");
      expect(from.x === to.x || from.y === to.y).toBe(true);
      const radius = edge.widthM / 2;
      for (const obstacle of actual.obstacles) {
        const clear =
          Math.max(from.x, to.x) + radius < obstacle.bounds.minX ||
          Math.min(from.x, to.x) - radius > obstacle.bounds.maxX ||
          Math.max(from.y, to.y) + radius < obstacle.bounds.minY ||
          Math.min(from.y, to.y) - radius > obstacle.bounds.maxY;
        expect(clear, edge.id).toBe(true);
      }
      if (edge.pathId === "PATH-A" || edge.pathId === "PATH-B") {
        const expectedY = edge.pathId === "PATH-A" ? 8 : 42;
        expect([from.y, to.y, edge.widthM]).toEqual([expectedY, expectedY, 4]);
        expect(Math.min(from.x, to.x)).toBeGreaterThanOrEqual(8);
        expect(Math.max(from.x, to.x)).toBeLessThanOrEqual(132);
      }
    }
  });

  it.each(["WORKER-A-START", "WORKER-B-START"])(
    "connects all candidate destinations without stairs when starting at %s",
    (startId) => {
      const map = MapSchema.parse(mapFixture);
      const reached = new Set([startId]);
      const pending = [startId];
      for (const current of pending) {
        for (const edge of map.edges.filter(
          (item) => item.enabled && item.accessible && !item.stairs,
        )) {
          const next = edge.from === current ? edge.to : edge.to === current ? edge.from : null;
          if (next !== null && !reached.has(next)) {
            reached.add(next);
            pending.push(next);
          }
        }
      }
      expect([...reached]).toEqual(
        expect.arrayContaining(["REFUGE-01", "REFUGE-02", "ASSEMBLY-01", "SHELTER-01"]),
      );
    },
  );
});
