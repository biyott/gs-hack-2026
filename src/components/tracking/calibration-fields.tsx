import { Field } from "@/components/ui/primitives";
import type { Calibration, TrackedEntity } from "@/contracts";

type NumberFieldProps = {
  readonly name: string;
  readonly label: string;
  readonly value?: number | null | undefined;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number | "any";
  readonly required?: boolean;
};

export function NumberField({ name, label, value, required = true, ...bounds }: NumberFieldProps) {
  return (
    <Field label={label}>
      <input
        name={name}
        type="number"
        step="any"
        defaultValue={value ?? ""}
        required={required}
        {...bounds}
      />
    </Field>
  );
}

export function MarkerFields({
  entity,
  calibration,
}: {
  readonly entity: {
    readonly entityId: TrackedEntity;
    readonly label: string;
    readonly markerId: number;
  };
  readonly calibration: Calibration | null;
}) {
  const marker = calibration?.markers.find((item) => item.entityId === entity.entityId);
  return (
    <fieldset className="calibration-marker">
      <legend>
        {entity.label} <span className="muted">{entity.entityId}</span>
      </legend>
      <div className="calibration-grid">
        <NumberField
          name={`${entity.entityId}.markerId`}
          label="실물 마커 ID"
          value={marker?.markerId ?? entity.markerId}
          min={4}
          max={249}
          step={1}
        />
        <NumberField
          name={`${entity.entityId}.heightM`}
          label="마커 높이 (m)"
          value={marker?.heightM}
          min={0}
          max={1}
        />
        <NumberField
          name={`${entity.entityId}.antennaHeightM`}
          label="안테나 높이 (m)"
          value={marker?.antennaHeightM}
          min={0}
          max={1}
        />
      </div>
      <details>
        <summary>마커 기준축 오프셋 · XY (m)</summary>
        <p className="muted">
          인쇄된 마커의 로컬 축 기준입니다. 장비 기준점은 회전축 지면 투영점입니다. Z는 위의 실측
          높이로 입력합니다.
        </p>
        <div className="calibration-grid">
          <NumberField
            name={`${entity.entityId}.referenceX`}
            label="마커 → 기준점 X (m)"
            value={marker?.markerToReferenceM.x}
          />
          <NumberField
            name={`${entity.entityId}.referenceY`}
            label="마커 → 기준점 Y (m)"
            value={marker?.markerToReferenceM.y}
          />
          <NumberField
            name={`${entity.entityId}.antennaX`}
            label="마커 → 안테나 X (m)"
            value={marker?.markerToAntennaM.x}
          />
          <NumberField
            name={`${entity.entityId}.antennaY`}
            label="마커 → 안테나 Y (m)"
            value={marker?.markerToAntennaM.y}
          />
        </div>
      </details>
    </fieldset>
  );
}
