import { z } from "zod";
import {
  ActionCodeSchema,
  HazardTypeSchema,
  LocaleSchema,
  PointSchema,
  PrioritySchema,
  SimulationModeSchema,
  TimestampSchema,
  WorkerProfileSchema,
} from "./core";

export const EvidenceSchema = z.object({
  documentId: z.string(),
  documentVersion: z.string(),
  chunkId: z.string(),
});
export const WaypointSchema = PointSchema.extend({ nodeId: z.string(), floorId: z.string() });
export const GuidanceSchema = z
  .object({
    incidentId: z.string(),
    eventId: z.string(),
    runId: z.string(),
    workerId: z.string(),
    guidanceId: z.string(),
    guidanceVersion: z.number().int().positive(),
    updateKind: z.enum(["primary", "supplement"]),
    primaryGuidanceVersion: z.number().int().positive(),
    simulationMode: SimulationModeSchema,
    hazardIds: z.array(z.string()),
    hazardType: HazardTypeSchema,
    priority: PrioritySchema,
    actionCode: ActionCodeSchema,
    routeVersion: z.number().int().positive().nullable(),
    stepId: z.string().nullable(),
    mapId: z.string(),
    mapVersion: z.string(),
    floorId: z.string(),
    waypoints: z.array(WaypointSchema),
    destinationId: z.string().nullable(),
    profileVersion: z.number().int().positive(),
    profileSnapshot: WorkerProfileSchema,
    locale: LocaleSchema,
    requestedLocale: z.string().nullable(),
    fallbackLocaleUsed: z.boolean(),
    templateCatalogVersion: z.string(),
    messageKey: z.string(),
    primaryMessageKey: z.string(),
    messageArgs: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
    primaryMessage: z.string(),
    managerExplanationKo: z.string(),
    supplementalExplanation: z.string().nullable(),
    evidence: z.array(EvidenceSchema),
    mode: z.enum(["template", "rag-assisted"]),
    generatedAt: TimestampSchema,
    expiresAt: TimestampSchema,
  })
  .superRefine((guidance, context) => {
    if (
      (guidance.updateKind === "primary" &&
        guidance.primaryGuidanceVersion !== guidance.guidanceVersion) ||
      (guidance.updateKind === "supplement" &&
        guidance.primaryGuidanceVersion >= guidance.guidanceVersion)
    ) {
      context.addIssue({
        code: "custom",
        path: ["primaryGuidanceVersion"],
        message: "Guidance update must reference its valid primary lineage",
      });
    }
    if (
      guidance.updateKind === "supplement" &&
      (guidance.mode !== "rag-assisted" ||
        guidance.supplementalExplanation === null ||
        guidance.evidence.length === 0)
    ) {
      context.addIssue({
        code: "custom",
        path: ["updateKind"],
        message: "A supplemental update requires evidenced RAG explanation",
      });
    }
    if (guidance.messageKey !== guidance.primaryMessageKey) {
      context.addIssue({
        code: "custom",
        path: ["primaryMessageKey"],
        message: "Compatibility message keys must match",
      });
    }
    if (
      guidance.waypoints.length === 0 &&
      (guidance.destinationId !== null ||
        guidance.routeVersion !== null ||
        guidance.stepId !== null)
    ) {
      context.addIssue({
        code: "custom",
        path: ["waypoints"],
        message: "A non-route action must clear route, step and destination",
      });
    }
    const stationaryActions = [
      "POSITION_UNKNOWN",
      "ROUTE_UNAVAILABLE",
      "SENSOR_UNKNOWN",
      "SHELTER_PER_SCENARIO",
      "AWAIT_REOPEN_AUTHORIZATION",
    ];
    if (stationaryActions.includes(guidance.actionCode) && guidance.waypoints.length > 0) {
      context.addIssue({
        code: "custom",
        path: ["waypoints"],
        message: "This action cannot carry a movement route",
      });
    }
    if (
      guidance.actionCode === "FOLLOW_VALIDATED_ROUTE" &&
      (guidance.waypoints.length < 2 ||
        guidance.destinationId === null ||
        guidance.routeVersion === null ||
        guidance.stepId === null)
    ) {
      context.addIssue({
        code: "custom",
        path: ["waypoints"],
        message: "Validated movement requires a route, destination and current step",
      });
    }
    if (guidance.profileSnapshot.version !== guidance.profileVersion) {
      context.addIssue({
        code: "custom",
        path: ["profileVersion"],
        message: "Profile snapshot version must match guidance",
      });
    }
    if (Date.parse(guidance.expiresAt) <= Date.parse(guidance.generatedAt)) {
      context.addIssue({
        code: "custom",
        path: ["expiresAt"],
        message: "Guidance expiry must follow generation",
      });
    }
  });

export type Guidance = z.infer<typeof GuidanceSchema>;
export type Waypoint = z.infer<typeof WaypointSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;
