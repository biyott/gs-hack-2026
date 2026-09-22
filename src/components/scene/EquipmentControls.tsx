import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/primitives";
import type { EquipmentPreset, EquipmentState, SimulationCommand } from "@/contracts";

export type EquipmentPose = Extract<SimulationCommand, { action: "control" }>["pose"];
type MotionField = "slewDeg" | "trolleyM" | "hookHeightM" | "boomAngleDeg" | "boomLengthM";
type ControlDefinition = {
  readonly field: MotionField;
  readonly label: string;
  readonly unit: string;
  readonly range: readonly [number, number];
  readonly value: number;
};
type Props = {
  readonly preset: EquipmentPreset;
  readonly equipment: EquipmentState;
  readonly onEquipmentPoseChange: ((pose: EquipmentPose) => void) | undefined;
};

function MotionControl({
  definition,
  onApply,
}: {
  readonly definition: ControlDefinition;
  readonly onApply: ((pose: EquipmentPose) => void) | undefined;
}) {
  const [draft, setDraft] = useState(definition.value);
  return (
    <Field
      label={`${definition.label} · ${draft.toFixed(1)} ${definition.unit}`}
      hint={`${definition.range[0]}–${definition.range[1]} ${definition.unit}`}
    >
      <div className="equipment-motion-field">
        <input
          type="range"
          min={definition.range[0]}
          max={definition.range[1]}
          step="0.1"
          value={draft}
          disabled={!onApply}
          onChange={(event) => setDraft(event.currentTarget.valueAsNumber)}
        />
        <Button
          size="compact"
          disabled={!onApply || draft === definition.value}
          onClick={() => onApply?.({ [definition.field]: draft })}
        >
          적용
        </Button>
      </div>
    </Field>
  );
}

export function EquipmentControls({ preset, equipment, onEquipmentPoseChange }: Props) {
  const definitions: ControlDefinition[] = [];
  const limits = preset.movementLimits;
  if (preset.controls.slew)
    definitions.push({
      field: "slewDeg",
      label: equipment.tableLinked ? "선회 · 책상 데모 제한" : "선회",
      unit: "°",
      range: equipment.tableLinked && limits.tableSlewDeg ? limits.tableSlewDeg : [-180, 180],
      value: equipment.slewDeg,
    });
  if (preset.controls.trolley && limits.trolleyM && equipment.trolleyM !== null)
    definitions.push({
      field: "trolleyM",
      label: "트롤리",
      unit: "m",
      range: limits.trolleyM,
      value: equipment.trolleyM,
    });
  if (preset.controls.hook && limits.hookHeightM && equipment.hookHeightM !== null)
    definitions.push({
      field: "hookHeightM",
      label: "훅 높이",
      unit: "m",
      range: limits.hookHeightM,
      value: equipment.hookHeightM,
    });
  if (preset.controls.boomAngle && limits.boomAngleDeg)
    definitions.push({
      field: "boomAngleDeg",
      label: "붐 각도",
      unit: "°",
      range: limits.boomAngleDeg,
      value: equipment.boomAngleDeg,
    });
  if (preset.controls.boomLength && limits.boomLengthM && equipment.boomLengthM !== null)
    definitions.push({
      field: "boomLengthM",
      label: "붐 길이",
      unit: "m",
      range: limits.boomLengthM,
      value: equipment.boomLengthM,
    });
  return (
    <details className="equipment-controls">
      <summary>{preset.model} · 장비 동작</summary>
      <div className="equipment-controls-grid">
        {definitions.map((definition) => (
          <MotionControl
            key={`${preset.id}-${definition.field}-${definition.value}`}
            definition={definition}
            onApply={onEquipmentPoseChange}
          />
        ))}
      </div>
      <p className="scene-status">
        {equipment.tableLinked && limits.tableSlewDeg
          ? "선회 제한은 책상 시연 규칙이며 장비의 기계적 한계가 아닙니다. "
          : ""}
        {preset.controls.translation
          ? "장비 위치는 현재 관측 또는 시나리오 입력을 따릅니다."
          : "고정 타워 · 장비 원점 고정"}
        {!onEquipmentPoseChange ? " 현재 세션은 조회 전용입니다." : ""}
      </p>
    </details>
  );
}
