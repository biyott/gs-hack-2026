import { CalibrationSchema } from "@/contracts";

export const CALIBRATION_ENTITIES = [
  { entityId: "EQUIPMENT-A", label: "장비", markerId: 10 },
  { entityId: "WORKER-A", label: "작업자 A", markerId: 11 },
  { entityId: "WORKER-B", label: "작업자 B", markerId: 12 },
] as const;

export function parseCalibrationForm(form: FormData) {
  function text(name: string): string {
    const value = form.get(name);
    return typeof value === "string" ? value.trim() : "";
  }

  function number(name: string): number | undefined {
    const value = text(name);
    return value === "" ? undefined : Number(value);
  }

  const cameraX = number("cameraX");
  const cameraY = number("cameraY");
  const cameraHeight = number("cameraHeight");
  const cameraEmpty = [cameraX, cameraY, cameraHeight].every((value) => value === undefined);
  return CalibrationSchema.safeParse({
    version: text("version"),
    cameraId: text("cameraId"),
    camera: cameraEmpty
      ? null
      : { positionTableM: { x: cameraX, y: cameraY }, heightM: cameraHeight },
    markers: CALIBRATION_ENTITIES.map(({ entityId }) => ({
      entityId,
      markerId: number(`${entityId}.markerId`),
      heightM: number(`${entityId}.heightM`),
      antennaHeightM: number(`${entityId}.antennaHeightM`),
      markerToReferenceM: {
        x: number(`${entityId}.referenceX`),
        y: number(`${entityId}.referenceY`),
      },
      markerToAntennaM: { x: number(`${entityId}.antennaX`), y: number(`${entityId}.antennaY`) },
    })),
    uwbYawRad: number("uwbYawRad") ?? null,
    evaluationErrorM: number("evaluationErrorM") ?? null,
  });
}
