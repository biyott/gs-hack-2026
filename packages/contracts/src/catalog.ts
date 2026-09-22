import { z } from "zod";
import { EquipmentArticulationSchema } from "./articulation";
import { PointSchema, SimulationModeSchema } from "./core";
import { MapSchema } from "./map";

const MeasurementSchema = z.number().finite().nullable();
const RangeSchema = z.tuple([z.number().finite(), z.number().finite()]).nullable();
export const EquipmentRiskGeometrySchema = z.object({
  presetId: z.string(),
  movable: z.boolean(),
  parts: z.array(
    z.object({
      part: z.enum(["body", "support", "tail", "load"]),
      frame: z.enum(["chassis", "upper", "hook"]),
      polygon: z.array(PointSchema).min(3),
    }),
  ),
});
export const EquipmentPresetSchema = z.object({
  id: z.string(),
  equipmentType: z.string(),
  model: z.string(),
  specEdition: z.string(),
  sourceUrl: z.url(),
  sourcePage: z.array(z.number().int().positive()),
  sourceSha256: z.string(),
  lengthM: MeasurementSchema,
  widthM: MeasurementSchema,
  heightM: MeasurementSchema,
  dimensionState: z.enum(["transport", "working"]),
  supportGeometry: z.object({
    kind: z.string(),
    coordinateBasis: z.enum(["centres", "pad-outer", "undercarriage", "unknown"]),
    widthM: MeasurementSchema,
    lengthM: MeasurementSchema,
    frontWidthM: MeasurementSchema,
    rearWidthM: MeasurementSchema,
    points: z.array(PointSchema).nullable(),
    notes: z.string(),
  }),
  slewOrigin: PointSchema.extend({ z: z.number().finite() }),
  manufacturerSlewDatum: z.string().nullable(),
  tailSwingRadiusM: MeasurementSchema,
  boomOrJibConfiguration: z.object({
    boomLengthM: MeasurementSchema,
    jibLengthM: MeasurementSchema,
    hookHeightM: MeasurementSchema,
    angleDeg: MeasurementSchema,
    fixedJibM: MeasurementSchema,
    notes: z.string(),
  }),
  assetUrl: z.string(),
  sourceBlend: z.string(),
  controls: z.object({
    translation: z.boolean(),
    slew: z.boolean(),
    boomAngle: z.boolean(),
    boomLength: z.boolean(),
    trolley: z.boolean(),
    hook: z.boolean(),
  }),
  controlNodes: z.object({
    slew: z.string().nullable(),
    trolley: z.string().nullable(),
    hook: z.string().nullable(),
    ropes: z.string().nullable(),
    boomPivot: z.string().nullable(),
    boomSegments: z.array(z.string()),
  }),
  controlBaselines: z.object({
    slewDeg: MeasurementSchema,
    trolleyM: MeasurementSchema,
    hookHeightM: MeasurementSchema,
    ropeTopM: MeasurementSchema,
    ropeLengthM: MeasurementSchema,
    boomAngleDeg: MeasurementSchema,
    boomLengthM: MeasurementSchema,
  }),
  controlNotes: z.string(),
  articulation: EquipmentArticulationSchema.nullable().default(null),
  demoPose: z.object({
    boomLengthM: MeasurementSchema,
    boomAngleDeg: z.number(),
    trolleyM: MeasurementSchema,
    hookHeightM: MeasurementSchema,
    slewDeg: z.number(),
  }),
  movementLimits: z.object({
    tableSlewDeg: RangeSchema,
    boomLengthM: RangeSchema,
    boomAngleDeg: RangeSchema,
    trolleyM: RangeSchema,
    hookHeightM: RangeSchema,
  }),
  riskGeometry: EquipmentRiskGeometrySchema.nullable(),
  riskGeometryStatus: z.enum(["unverified", "verified"]),
  riskGeometryNotes: z.string().optional(),
  manufacturerEvidencePath: z.string().optional(),
  visualizationNotes: z.array(z.string()),
  verificationStatus: z.string(),
  sourceEvidence: z
    .array(
      z.object({
        sourceId: z.string(),
        url: z.string(),
        pages: z.array(z.number()),
        sha256: z.string(),
        reportPath: z.string().optional(),
      }),
    )
    .optional(),
});
export const EquipmentCatalogSchema = z.object({
  schemaVersion: z.enum(["1.0.0", "1.0.1"]),
  units: z.literal("metres"),
  coordinateSystem: z.literal("map-xy-z-up"),
  equipment: z.array(EquipmentPresetSchema),
});
export const ScenarioSummarySchema = z.object({
  id: z.string(),
  label: z.object({ ko: z.string(), en: z.string() }),
  mode: SimulationModeSchema,
  durationMs: z.number().nonnegative(),
  seed: z.number().int(),
  mapId: z.string(),
  mapVersion: z.string(),
  coverage: z.array(z.string()),
});
export const CatalogSchema = z.object({
  contractVersion: z.literal("1.0.0"),
  maps: z.array(MapSchema),
  scenarios: z.array(ScenarioSummarySchema),
  equipment: z.array(EquipmentPresetSchema),
  policies: z.array(z.object({ id: z.string(), version: z.string(), mode: SimulationModeSchema })),
});

export type EquipmentPreset = z.infer<typeof EquipmentPresetSchema>;
export type EquipmentCatalogEntry = EquipmentPreset;
export type EquipmentCatalog = z.infer<typeof EquipmentCatalogSchema>;
export type ScenarioSummary = z.infer<typeof ScenarioSummarySchema>;
export type Catalog = z.infer<typeof CatalogSchema>;
