import { z } from "zod";
import { PointSchema } from "./core";
import { containsBounds, containsPoint, segmentIntersectsBounds } from "./map-geometry";

export const BoundsSchema = z
  .strictObject({
    minX: z.number().finite(),
    minY: z.number().finite(),
    maxX: z.number().finite(),
    maxY: z.number().finite(),
  })
  .refine((bounds) => bounds.minX < bounds.maxX && bounds.minY < bounds.maxY, {
    message: "Bounds must have positive width and height",
  })
  .readonly();

export const MapNodeSchema = z
  .strictObject({
    id: z.string().min(1),
    x: z.number().finite(),
    y: z.number().finite(),
    floorId: z.literal("GROUND"),
    kind: z.enum(["junction", "start", "refuge", "assembly", "shelter"]),
  })
  .readonly();

export const MapEdgeSchema = z
  .strictObject({
    id: z.string().min(1),
    from: z.string().min(1),
    to: z.string().min(1),
    pathId: z.enum(["PATH-A", "PATH-B", "PATH-C"]),
    widthM: z.number().positive().finite(),
    stairs: z.boolean(),
    accessible: z.boolean(),
    enabled: z.boolean(),
    initialEgress: z.boolean(),
  })
  .readonly();

export const MapZoneSchema = z
  .strictObject({
    id: z.enum(["ZONE-A", "ZONE-B", "ZONE-C"]),
    name: z.string().min(1),
    bounds: BoundsSchema,
  })
  .readonly();

export const MapObstacleSchema = z
  .strictObject({
    id: z.string().min(1),
    bounds: BoundsSchema,
    heightM: z.number().positive().finite(),
  })
  .readonly();

export const MapSchema = z
  .strictObject({
    mapId: z.literal("SITE-CONSTRUCTION-01"),
    mapVersion: z.literal("1.0.0"),
    floorId: z.literal("GROUND"),
    synthetic: z.literal(true),
    units: z.literal("m"),
    bounds: z
      .strictObject({
        minX: z.literal(0),
        minY: z.literal(0),
        maxX: z.literal(140),
        maxY: z.literal(50),
      })
      .readonly(),
    nodes: z.array(MapNodeSchema).min(1).readonly(),
    edges: z.array(MapEdgeSchema).min(1).readonly(),
    zones: z.array(MapZoneSchema).length(3).readonly(),
    obstacles: z.array(MapObstacleSchema).min(1).readonly(),
    metadata: z
      .strictObject({
        displayLabel: z.string().min(1),
        craneOrigin: PointSchema.strict().readonly(),
        defaultJibDirection: z.literal("+X"),
        workArea: BoundsSchema,
        storageArea: BoundsSchema,
        liftDestination: BoundsSchema,
        tableScale: z.literal(100),
        notes: z.array(z.string().min(1)).min(1).readonly(),
      })
      .readonly(),
  })
  .superRefine((map, context) => {
    for (const [collection, items] of [
      ["nodes", map.nodes],
      ["edges", map.edges],
      ["zones", map.zones],
      ["obstacles", map.obstacles],
    ] as const) {
      const ids = new Set<string>();
      for (const [index, item] of items.entries()) {
        if (ids.has(item.id)) {
          context.addIssue({
            code: "custom",
            path: [collection, index, "id"],
            message: "Duplicate map identifier",
          });
        }
        ids.add(item.id);
      }
    }

    const nodesById = new Map(map.nodes.map((node) => [node.id, node]));
    for (const [index, edge] of map.edges.entries()) {
      const from = nodesById.get(edge.from);
      const to = nodesById.get(edge.to);
      if (!from || !to || edge.from === edge.to) {
        context.addIssue({
          code: "custom",
          path: ["edges", index],
          message: "Edge must join two distinct known nodes",
        });
        continue;
      }
      if (from.x === to.x && from.y === to.y) {
        context.addIssue({
          code: "custom",
          path: ["edges", index],
          message: "Edge endpoints must have distinct coordinates",
        });
      }
      const radius = edge.widthM / 2;
      const inset = {
        minX: map.bounds.minX + radius,
        minY: map.bounds.minY + radius,
        maxX: map.bounds.maxX - radius,
        maxY: map.bounds.maxY - radius,
      };
      if (!containsPoint(inset, from) || !containsPoint(inset, to)) {
        context.addIssue({
          code: "custom",
          path: ["edges", index],
          message: "Edge width extends outside map bounds",
        });
      }
      for (const obstacle of map.obstacles) {
        const expanded = {
          minX: obstacle.bounds.minX - radius,
          minY: obstacle.bounds.minY - radius,
          maxX: obstacle.bounds.maxX + radius,
          maxY: obstacle.bounds.maxY + radius,
        };
        if (segmentIntersectsBounds(from, to, expanded)) {
          context.addIssue({
            code: "custom",
            path: ["edges", index],
            message: "Edge width intersects a static obstacle",
          });
        }
      }
      const corridorY = { "PATH-A": 8, "PATH-B": 42, "PATH-C": null } as const;
      const expectedY = corridorY[edge.pathId];
      if (
        expectedY !== null &&
        (from.y !== expectedY ||
          to.y !== expectedY ||
          edge.widthM !== 4 ||
          Math.min(from.x, to.x) < 8 ||
          Math.max(from.x, to.x) > 132)
      ) {
        context.addIssue({
          code: "custom",
          path: ["edges", index],
          message: "Corridor geometry differs from source 008",
        });
      }
      if (edge.initialEgress && from.kind !== "start") {
        context.addIssue({
          code: "custom",
          path: ["edges", index, "initialEgress"],
          message: "Initial egress must depart an explicit start node",
        });
      }
    }

    for (const [index, node] of map.nodes.entries()) {
      if (!containsPoint(map.bounds, node)) {
        context.addIssue({
          code: "custom",
          path: ["nodes", index],
          message: "Node lies outside map bounds",
        });
      }
    }
    for (const [collection, items] of [
      ["zones", map.zones],
      ["obstacles", map.obstacles],
    ] as const) {
      for (const [index, item] of items.entries()) {
        if (!containsBounds(map.bounds, item.bounds)) {
          context.addIssue({
            code: "custom",
            path: [collection, index, "bounds"],
            message: "Geometry lies outside map bounds",
          });
        }
      }
    }
    if (!containsPoint(map.bounds, map.metadata.craneOrigin)) {
      context.addIssue({
        code: "custom",
        path: ["metadata", "craneOrigin"],
        message: "Crane origin lies outside map bounds",
      });
    }
    if (!containsBounds(map.bounds, map.metadata.workArea)) {
      context.addIssue({
        code: "custom",
        path: ["metadata", "workArea"],
        message: "Work area lies outside map bounds",
      });
    }
    for (const field of ["storageArea", "liftDestination"] as const) {
      if (!containsBounds(map.metadata.workArea, map.metadata[field])) {
        context.addIssue({
          code: "custom",
          path: ["metadata", field],
          message: "Facility lies outside work area",
        });
      }
    }
  })
  .readonly();

export type Bounds = z.infer<typeof BoundsSchema>;
export type MapNode = z.infer<typeof MapNodeSchema>;
export type MapEdge = z.infer<typeof MapEdgeSchema>;
export type MapZone = z.infer<typeof MapZoneSchema>;
export type MapObstacle = z.infer<typeof MapObstacleSchema>;
export type SiteMap = z.infer<typeof MapSchema>;
