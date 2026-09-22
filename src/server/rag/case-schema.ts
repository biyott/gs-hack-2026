import { z } from "zod";
import {
  ActionCodeSchema,
  HazardTypeSchema,
  LocaleSchema,
  SimulationModeSchema,
  TimestampSchema,
} from "../../../packages/contracts/src/core";

const identifier = z.string().min(1);

export const RagCaseSchema = z
  .object({
    testId: identifier,
    simulationType: SimulationModeSchema,
    context: z
      .object({
        siteId: identifier,
        hazardTypes: z.array(HazardTypeSchema).min(1),
        role: identifier,
        zoneIds: z.array(identifier),
        substanceIds: z.array(identifier),
        actionCode: ActionCodeSchema,
        profile: z
          .object({
            stairsAllowed: z.boolean().nullable(),
            assistanceRequired: z.boolean().nullable(),
            verified: z.boolean(),
          })
          .strict(),
        scenarioPolicy: z
          .enum(["evacuation", "designated-refuge", "shelter-per-scenario"])
          .nullable(),
        scope: z.enum(["demo", "production"]),
        now: TimestampSchema,
        preferredLocale: LocaleSchema,
        negativeFixtureIds: z.array(z.string().regex(/^NEG-[A-Z-]+$/u)),
      })
      .strict(),
    query: identifier,
    expectedDocumentIds: z.array(identifier),
    forbiddenDocumentIds: z.array(identifier),
    expectedActionCodes: z.array(ActionCodeSchema),
    expectedOutcome: z.enum(["matched", "no_match", "conflict"]),
    reason: identifier,
  })
  .strict();

export type RagCase = z.infer<typeof RagCaseSchema>;
