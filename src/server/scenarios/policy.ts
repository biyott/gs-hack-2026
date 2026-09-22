import { SimulationModeSchema } from "@gs-safety/contracts";
import { z } from "zod";

export const ResponsePolicySchema = z
  .object({
    id: z.string().min(1),
    version: z.string().min(1),
    mode: SimulationModeSchema,
    synthetic: z.literal(true),
    positionStaleAfterMs: z.number().int().positive(),
    sensorStaleAfterMs: z.number().int().positive(),
    equipmentPredictionSeconds: z.number().positive(),
    arrivalToleranceM: z.number().positive(),
    responses: z
      .array(
        z
          .object({
            hazardType: z.enum(["equipment", "fire", "gas", "combined"]),
            priority: z.number().int().nonnegative(),
            strategy: z.enum(["evacuate", "designated-space", "shelter"]),
            destinationIds: z.array(z.string().min(1)).readonly(),
          })
          .readonly(),
      )
      .min(1)
      .readonly(),
    gasAlarm: z
      .object({
        materialId: z.literal("DEMO-GAS-X"),
        minimumValue: z.number().positive(),
        unit: z.literal("demo-index"),
      })
      .readonly(),
    requireExplicitReopen: z.literal(true),
  })
  .superRefine((policy, context) => {
    const hazardTypes = policy.responses.map((response) => response.hazardType);
    if (new Set(hazardTypes).size !== hazardTypes.length) {
      context.addIssue({
        code: "custom",
        path: ["responses"],
        message: "A hazard type must have one deterministic response",
      });
    }
    if (policy.mode === "fire-gas" && !hazardTypes.includes("combined")) {
      context.addIssue({
        code: "custom",
        path: ["responses"],
        message: "Fire-gas policies require an explicit combined response",
      });
    }
    policy.responses.forEach((response, index) => {
      const expectedRoute = response.strategy !== "shelter";
      if (expectedRoute !== response.destinationIds.length > 0) {
        context.addIssue({
          code: "custom",
          path: ["responses", index, "destinationIds"],
          message: "Movement needs candidate destinations; shelter must not invent one",
        });
      }
    });
  })
  .readonly();

export type ResponsePolicy = z.infer<typeof ResponsePolicySchema>;
