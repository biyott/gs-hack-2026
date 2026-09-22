import type { Point } from "../../../packages/contracts/src/core";
import type { EquipmentState, Hazard } from "../../../packages/contracts/src/state";
import type { Polygon } from "./geometry";
import { sweepRotation, sweepTranslation, transformPolygon } from "./hull";

export type EquipmentRiskPart = {
  readonly part: "body" | "support" | "tail" | "load";
  readonly frame: "chassis" | "upper" | "hook";
  readonly polygon: Polygon;
};

export type EquipmentRiskModel = {
  readonly presetId: string;
  readonly movable: boolean;
  readonly parts: readonly EquipmentRiskPart[];
};

export type EquipmentRiskInput = {
  readonly equipment: EquipmentState;
  readonly model: EquipmentRiskModel;
  readonly predictionSeconds: number;
  readonly observedAt: string;
  readonly floorId: string;
  readonly plannedSlewDeg?: number;
};

export type EquipmentHazard = Hazard & {
  readonly part: EquipmentRiskPart["part"];
  readonly geometryVersion: number;
  readonly presetId: string;
};

class EquipmentGeometryMismatch extends Error {
  constructor(
    readonly expectedPresetId: string,
    readonly actualPresetId: string,
  ) {
    super(`Equipment geometry ${expectedPresetId} cannot evaluate preset ${actualPresetId}`);
    this.name = "EquipmentGeometryMismatch";
  }
}

function unreachable(value: never): never {
  throw new TypeError(`Unsupported equipment frame: ${value}`);
}

function localPart(part: EquipmentRiskPart, equipment: EquipmentState): Polygon {
  switch (part.frame) {
    case "chassis":
    case "upper":
      return part.polygon;
    case "hook": {
      if (equipment.trolleyM === null && equipment.boomLengthM === null) {
        throw new EquipmentGeometryMismatch("known hook radius", equipment.presetId);
      }
      const radius =
        equipment.trolleyM ??
        (equipment.boomLengthM === null
          ? 0
          : equipment.boomLengthM * Math.cos((equipment.boomAngleDeg * Math.PI) / 180));
      return part.polygon.map((point) => ({ x: point.x + radius, y: point.y }));
    }
    default:
      return unreachable(part.frame);
  }
}

function partAngles(part: EquipmentRiskPart, input: EquipmentRiskInput): readonly [number, number] {
  const { equipment } = input;
  switch (part.frame) {
    case "chassis":
      return [equipment.headingDeg, equipment.headingDeg];
    case "upper":
    case "hook":
      return [
        equipment.headingDeg + equipment.slewDeg,
        equipment.headingDeg + (input.plannedSlewDeg ?? equipment.slewDeg),
      ];
    default:
      return unreachable(part.frame);
  }
}

export function deriveEquipmentHazards(input: EquipmentRiskInput): readonly EquipmentHazard[] {
  const { equipment, model } = input;
  if (equipment.presetId !== model.presetId)
    throw new EquipmentGeometryMismatch(model.presetId, equipment.presetId);
  const heading = (equipment.headingDeg * Math.PI) / 180;
  const distance = model.movable ? equipment.speedMps * input.predictionSeconds : 0;
  const delta: Point = { x: distance * Math.cos(heading), y: distance * Math.sin(heading) };
  return model.parts.map((part, index) => {
    const local = localPart(part, equipment);
    const swept = sweepRotation(local, partAngles(part, input));
    const world = transformPolygon(swept, equipment.position, 0);
    return {
      hazardId: `${equipment.id}:${model.presetId}:${equipment.geometryVersion}:${part.part}:${index}`,
      hazardType: "equipment",
      priority: "high",
      polygon: [...sweepTranslation(world, delta)],
      active: true,
      floorId: input.floorId,
      source: "engine",
      observedAt: input.observedAt,
      sensorStatus: "not-applicable",
      affectedWorkerIds: [],
      reason: `${part.part} and predicted movement envelope`,
      part: part.part,
      zoneId: null,
      substanceId: null,
      geometryVersion: equipment.geometryVersion,
      presetId: model.presetId,
    };
  });
}
