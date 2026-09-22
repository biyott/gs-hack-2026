import { z } from "zod";

const ArticulationLinkSchema = z
  .object({
    node: z.string().min(1),
    fromNode: z.string().min(1),
    toNode: z.string().min(1),
    startFraction: z.number().min(0).max(1),
    endFraction: z.number().min(0).max(1),
    axis: z.literal("y"),
    restLengthM: z.number().positive(),
    origin: z.literal("start"),
  })
  .refine((link) => link.startFraction < link.endFraction, {
    message: "A linkage must occupy a positive fraction of the anchor span",
  });

export const EquipmentArticulationSchema = z.object({
  boom: z.object({
    pivotNode: z.string().min(1),
    axis: z.literal("z"),
    angleSign: z.literal(1),
    tipNode: z.string().min(1),
    segments: z.array(
      z.object({
        node: z.string().min(1),
        axis: z.literal("x"),
        lengthShare: z.number().positive(),
      }),
    ),
  }),
  hook: z.object({ node: z.string().min(1), tipNode: z.string().min(1) }),
  links: z.array(ArticulationLinkSchema),
});

export type EquipmentArticulation = z.infer<typeof EquipmentArticulationSchema>;
