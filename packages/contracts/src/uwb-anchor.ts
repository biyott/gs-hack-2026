import { z } from "zod";

const AntennaHeightSchema = z.number().finite().min(0).max(3);

export const UwbFixedAnchorSchema = z
  .object({
    version: z.string().min(1).max(100),
    positionTableM: z
      .object({ x: z.number().finite().min(0).max(1.4), y: z.number().finite().min(0).max(0.5) })
      .readonly(),
    headingRad: z.number().finite().min(-Math.PI).max(Math.PI),
    antennaHeightM: AntennaHeightSchema,
    workerAntennaHeightsM: z
      .object({ "WORKER-A": AntennaHeightSchema, "WORKER-B": AntennaHeightSchema })
      .readonly(),
  })
  .readonly();

export const UwbFixedAnchorRequestSchema = z
  .object({ anchor: UwbFixedAnchorSchema.nullable() })
  .readonly();

export type UwbFixedAnchor = z.infer<typeof UwbFixedAnchorSchema>;
