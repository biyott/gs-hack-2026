import { z } from "zod";

export const CaptureClockSchema = z
  .object({
    deviceCapturedAt: z.string().datetime({ offset: true }),
    offsetMs: z.number().finite(),
    uncertaintyMs: z.number().finite().nonnegative(),
    synchronizedAt: z.string().datetime({ offset: true }),
  })
  .readonly();

export const ServerClockSchema = z
  .object({
    serverAt: z.string().datetime({ offset: true }),
  })
  .readonly();

export type CaptureClock = z.infer<typeof CaptureClockSchema>;

export function captureClockMatches(capturedAt: string, clock: CaptureClock | undefined): boolean {
  return (
    clock === undefined ||
    Math.abs(Date.parse(capturedAt) - Date.parse(clock.deviceCapturedAt) - clock.offsetMs) <= 1
  );
}
