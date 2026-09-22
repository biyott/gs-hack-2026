import type { EquipmentPreset, SimulationCommand } from "@/contracts";
import { ApiFault } from "../http/errors";
import type { SimulationRun } from "./run";

export function constrainEquipmentWorld(run: SimulationRun): void {
  const preset = run.configuration.equipment.find(
    (entry) => entry.id === run.snapshot.equipment.presetId,
  );
  const equipment = run.world.state.equipment;
  if (preset?.controls.translation !== false || equipment === null) return;
  run.world = {
    ...run.world,
    state: {
      ...run.world.state,
      equipment: {
        ...equipment,
        modelId: preset.id,
        position: run.configuration.map.metadata.craneOrigin,
        headingDeg: 0,
        speedMps: 0,
      },
    },
  };
}

function validateRange(
  value: number | undefined,
  range: readonly [number, number] | null,
  label: string,
): void {
  if (value !== undefined && range && (value < range[0] || value > range[1]))
    throw new ApiFault(400, "CONTROL_LIMIT", `${label} is outside the selected demo configuration`);
}

export function applyControl(
  run: SimulationRun,
  command: Extract<SimulationCommand, { action: "control" }>,
  preset: EquipmentPreset,
): void {
  const { pose } = command;
  if (
    run.snapshot.run.positionInput === "measured" &&
    (pose.position !== undefined || pose.headingDeg !== undefined || pose.speedMps !== undefined)
  )
    throw new ApiFault(
      409,
      "INPUT_SOURCE_CONFLICT",
      "Select scenario position input before changing equipment position, heading or speed",
    );
  const capabilities = preset.controls;
  if (
    (!capabilities.translation &&
      (pose.position !== undefined ||
        pose.headingDeg !== undefined ||
        pose.speedMps !== undefined)) ||
    (!capabilities.slew && pose.slewDeg !== undefined) ||
    (!capabilities.boomAngle && pose.boomAngleDeg !== undefined) ||
    (!capabilities.boomLength && pose.boomLengthM !== undefined) ||
    (!capabilities.trolley && pose.trolleyM !== undefined) ||
    (!capabilities.hook && pose.hookHeightM !== undefined)
  )
    throw new ApiFault(
      400,
      "UNSUPPORTED_CONTROL",
      "This motion is not supported by the selected model",
    );
  const { movementLimits } = preset;
  if (pose.tableLinked ?? run.snapshot.equipment.tableLinked)
    validateRange(
      pose.slewDeg ?? run.snapshot.equipment.slewDeg,
      movementLimits.tableSlewDeg,
      "Slew",
    );
  validateRange(pose.boomLengthM, movementLimits.boomLengthM, "Boom length");
  validateRange(pose.boomAngleDeg, movementLimits.boomAngleDeg, "Boom angle");
  validateRange(pose.trolleyM, movementLimits.trolleyM, "Trolley");
  validateRange(pose.hookHeightM, movementLimits.hookHeightM, "Hook");
  if (
    pose.position &&
    (pose.position.x < 0 || pose.position.x > 140 || pose.position.y < 0 || pose.position.y > 50)
  )
    throw new ApiFault(400, "MAP_BOUNDS", "Equipment origin must stay inside the detailed map");
  run.snapshot = {
    ...run.snapshot,
    equipment: {
      ...run.snapshot.equipment,
      position: pose.position ?? run.snapshot.equipment.position,
      headingDeg: pose.headingDeg ?? run.snapshot.equipment.headingDeg,
      speedMps: pose.speedMps ?? run.snapshot.equipment.speedMps,
      slewDeg: pose.slewDeg ?? run.snapshot.equipment.slewDeg,
      boomAngleDeg: pose.boomAngleDeg ?? run.snapshot.equipment.boomAngleDeg,
      boomLengthM: pose.boomLengthM ?? run.snapshot.equipment.boomLengthM,
      trolleyM: pose.trolleyM ?? run.snapshot.equipment.trolleyM,
      hookHeightM: pose.hookHeightM ?? run.snapshot.equipment.hookHeightM,
      tableLinked: pose.tableLinked ?? run.snapshot.equipment.tableLinked,
      geometryVersion: run.snapshot.equipment.geometryVersion + 1,
    },
  };
  const equipment = run.world.state.equipment;
  if (equipment)
    run.world = {
      ...run.world,
      state: {
        ...run.world.state,
        equipment: {
          ...equipment,
          position: run.snapshot.equipment.position,
          headingDeg: run.snapshot.equipment.headingDeg,
          speedMps: run.snapshot.equipment.speedMps,
          slewDeg: run.snapshot.equipment.slewDeg,
        },
      },
    };
}
