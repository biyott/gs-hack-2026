"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Panel, StatusBadge } from "@/components/ui/primitives";
import type { Calibration } from "@/contracts";
import { CALIBRATION_ENTITIES, parseCalibrationForm } from "./calibration-draft";
import { MarkerFields, NumberField } from "./calibration-fields";

export type CalibrationFormProps = {
  readonly calibration: Calibration | null;
  readonly cameraId?: string | undefined;
  readonly canCalibrate: boolean;
  readonly onSave: (calibration: Calibration) => Promise<void>;
};

export function CalibrationForm({
  calibration,
  cameraId,
  canCalibrate,
  onSave,
}: CalibrationFormProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedVersion, setSavedVersion] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canCalibrate || saving) return;
    setError(null);
    setSavedVersion(null);
    const result = parseCalibrationForm(new FormData(event.currentTarget));
    if (!result.success) {
      setError(
        result.error.issues
          .map((issue) => `${issue.path.join(".") || "보정"}: ${issue.message}`)
          .join(" / "),
      );
      return;
    }
    setSaving(true);
    try {
      await onSave(result.data);
      setSavedVersion(result.data.version);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "보정을 저장하지 못했습니다. 연결 상태를 확인해 주세요.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel
      title="실측 보정"
      className="calibration-panel"
      actions={
        <Button asChild size="compact">
          <a href="/markers/sheet.html" target="_blank" rel="noreferrer">
            마커 시트 인쇄
          </a>
        </Button>
      }
    >
      <section className="cluster" aria-label="저장된 보정 상태">
        <StatusBadge tone={calibration ? "info" : "caution"}>
          {calibration ? `보정 기록 ${calibration.version}` : "저장된 보정 없음"}
        </StatusBadge>
        <StatusBadge tone={calibration?.camera ? "info" : "caution"}>
          {calibration?.camera ? "카메라 기하 입력됨" : "카메라 기하 미보정"}
        </StatusBadge>
        <StatusBadge tone={calibration?.uwbYawRad != null ? "info" : "caution"}>
          {calibration?.uwbYawRad != null ? "UWB 축 입력됨" : "UWB 축 미보정"}
        </StatusBadge>
      </section>
      <p className="muted">
        모든 길이는 실물 테이블의 미터(m)입니다. 빈 측정값은 0으로 채우지 않습니다. 마커 10·11·12는
        인쇄 시트의 실물 부착 대상만 지정합니다.
      </p>
      {!canCalibrate ? (
        <p className="muted">관리자 또는 운영자만 보정을 저장할 수 있습니다.</p>
      ) : null}
      <form
        key={`${JSON.stringify(calibration)}:${cameraId ?? ""}`}
        className="calibration-form"
        onSubmit={submit}
        onReset={() => {
          setError(null);
          setSavedVersion(null);
        }}
        onInvalid={(event) => {
          if (event.target instanceof HTMLInputElement) {
            const details = event.target.closest("details");
            if (details) details.open = true;
          }
        }}
      >
        <fieldset disabled={!canCalibrate || saving}>
          <legend className="sr-only">보정 측정값</legend>
          <div className="calibration-grid">
            <Field label="보정 버전">
              <input
                name="version"
                defaultValue={calibration?.version ?? ""}
                required
                maxLength={100}
              />
            </Field>
            <Field label="카메라 ID">
              <input
                name="cameraId"
                defaultValue={calibration?.cameraId ?? cameraId ?? ""}
                required
                maxLength={100}
              />
            </Field>
          </div>
          <fieldset className="calibration-marker">
            <legend>카메라 위치 · 선택 입력</legend>
            <p className="muted">
              테이블 원점 기준 지면 투영 X/Y와 높이를 모두 입력하세요. 모두 비우면 카메라 미보정으로
              저장되며 높이가 있는 마커의 위치를 보정할 수 없습니다. 높이는 0보다 크고 모든 마커보다
              높아야 합니다.
            </p>
            <div className="calibration-grid">
              <NumberField
                name="cameraX"
                label="카메라 지면 X (m)"
                value={calibration?.camera?.positionTableM.x}
                required={false}
              />
              <NumberField
                name="cameraY"
                label="카메라 지면 Y (m)"
                value={calibration?.camera?.positionTableM.y}
                required={false}
              />
              <NumberField
                name="cameraHeight"
                label="카메라 높이 (m)"
                value={calibration?.camera?.heightM}
                min={0}
                max={10}
                required={false}
              />
            </div>
          </fieldset>
          {CALIBRATION_ENTITIES.map((entity) => (
            <MarkerFields key={entity.entityId} entity={entity} calibration={calibration} />
          ))}
          <div className="calibration-grid">
            <Field
              label="UWB 축 보정 (rad)"
              hint="장비 마커 헤딩에 더할 반시계 방향 회전. 빈칸은 미보정이며 UWB 평면 위치를 생성하지 않습니다."
            >
              <input
                name="uwbYawRad"
                type="number"
                step="any"
                min={-Math.PI}
                max={Math.PI}
                defaultValue={calibration?.uwbYawRad ?? ""}
              />
            </Field>
            <Field label="실측 평가 오차 (m)" hint="별도 평가를 하지 않았다면 비워 두세요.">
              <input
                name="evaluationErrorM"
                type="number"
                step="any"
                min={0}
                defaultValue={calibration?.evaluationErrorM ?? ""}
              />
            </Field>
          </div>
          <div className="cluster">
            <Button type="submit" variant="primary" aria-busy={saving}>
              {saving ? "보정 저장 중…" : "실측 보정 저장"}
            </Button>
            <Button type="reset" variant="quiet">
              입력 되돌리기
            </Button>
          </div>
        </fieldset>
        {error ? (
          <p role="alert" className="form-error">
            {error}
          </p>
        ) : null}
        {savedVersion ? <p role="status">보정 {savedVersion}을 저장했습니다.</p> : null}
      </form>
    </Panel>
  );
}
