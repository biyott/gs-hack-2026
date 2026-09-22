import { UwbFixedAnchorSchema } from "@/contracts";

export function parseFixedUwbAnchorForm(form: FormData, version: string) {
  function number(name: string, divisor: number): number | undefined {
    const value = form.get(name);
    return typeof value === "string" && value.trim() !== "" ? Number(value) / divisor : undefined;
  }

  return UwbFixedAnchorSchema.safeParse({
    version,
    positionTableM: { x: number("xCm", 100), y: number("yCm", 100) },
    headingRad: number("headingDeg", 180 / Math.PI),
    antennaHeightM: number("equipmentHeightCm", 100),
    workerAntennaHeightsM: {
      "WORKER-A": number("workerAHeightCm", 100),
      "WORKER-B": number("workerBHeightCm", 100),
    },
  });
}
