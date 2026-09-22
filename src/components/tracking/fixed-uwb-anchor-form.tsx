"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Panel, StatusBadge } from "@/components/ui/primitives";
import type { UwbFixedAnchor } from "@/contracts";
import { NumberField } from "./calibration-fields";
import { parseFixedUwbAnchorForm } from "./fixed-uwb-anchor-draft";

type FixedUwbAnchorFormProps = {
  readonly anchor: UwbFixedAnchor | null;
  readonly canConfigure: boolean;
  readonly onSave: (anchor: UwbFixedAnchor | null) => Promise<void>;
};

export function FixedUwbAnchorForm({ anchor, canConfigure, onSave }: FixedUwbAnchorFormProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function save(next: UwbFixedAnchor | null) {
    if (!canConfigure || saving) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await onSave(next);
      setNotice(
        next
          ? "고정 기준점을 적용했습니다. 새 UWB 측정값을 기다립니다."
          : "고정 기준점을 해제했습니다.",
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "기준점 설정을 저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canConfigure || saving) return;
    const result = parseFixedUwbAnchorForm(
      new FormData(event.currentTarget),
      `note20-${Date.now()}`,
    );
    if (!result.success) {
      setNotice(null);
      setError("위치·방향·높이를 허용 범위 안의 숫자로 모두 입력해 주세요.");
      return;
    }
    void save(result.data);
  }

  return (
    <Panel title="Note20 고정 기준점" eyebrow="UWB" aria-label="고정 UWB 기준점 설정">
      <div className="stack">
        <section className="cluster" aria-label="고정 기준점 상태">
          <StatusBadge tone={anchor ? "info" : "caution"}>
            {anchor ? "고정 기준점 적용됨" : "미적용 · 입력 후 적용 필요"}
          </StatusBadge>
          <StatusBadge tone="synthetic">장비 위치는 수동 설정</StatusBadge>
        </section>
        <p>
          Note20은 고정하고 작업자 폰만 이동하세요. 카메라 없이 UWB 거리·방위각으로 작업자 안테나
          위치를 계산합니다. <a href="#scenario-settings">위치 입력</a>을 ‘장치 추적 위치’로
          선택해야 지도에 반영됩니다.
        </p>
        <p className="muted">
          테이블 왼쪽 아래가 (0, 0)입니다. Note20을 세로로 세우고 뒷면을 기준 방향으로 향하게
          고정하세요. 0°는 지도 오른쪽(+X), 90°는 위쪽(+Y)입니다. 적용 후 Note20 위치와 방향을
          바꾸지 마세요.
        </p>
        {!canConfigure ? (
          <p className="muted">관리자 또는 운영자만 기준점을 변경할 수 있습니다.</p>
        ) : null}
        <form
          key={JSON.stringify(anchor)}
          className="calibration-form"
          aria-label="고정 기준점 입력"
          onSubmit={submit}
        >
          <fieldset className="stack" disabled={!canConfigure || saving}>
            <legend className="sr-only">고정 장비 위치와 안테나 높이</legend>
            <div className="calibration-grid">
              <NumberField
                name="xCm"
                label="Note20 위치 X (cm)"
                value={(anchor?.positionTableM.x ?? 0) * 100}
                min={0}
                max={140}
              />
              <NumberField
                name="yCm"
                label="Note20 위치 Y (cm)"
                value={(anchor?.positionTableM.y ?? 0.25) * 100}
                min={0}
                max={50}
              />
              <NumberField
                name="headingDeg"
                label="Note20 기준 방향 (°)"
                value={((anchor?.headingRad ?? 0) * 180) / Math.PI}
                min={-180}
                max={180}
              />
            </div>
            <fieldset className="calibration-marker stack">
              <legend>안테나 높이</legend>
              <p className="muted">
                같은 기준면에서 잰 높이입니다. 모두 0이면 세 폰이 같은 높이에 있다는 설정입니다.
                높이가 다르면 실측값을 입력하세요.
              </p>
              <div className="calibration-grid">
                <NumberField
                  name="equipmentHeightCm"
                  label="Note20 높이 (cm)"
                  value={(anchor?.antennaHeightM ?? 0) * 100}
                  min={0}
                  max={300}
                />
                <NumberField
                  name="workerAHeightCm"
                  label="작업자 A 높이 (cm)"
                  value={(anchor?.workerAntennaHeightsM["WORKER-A"] ?? 0) * 100}
                  min={0}
                  max={300}
                />
                <NumberField
                  name="workerBHeightCm"
                  label="작업자 B 높이 (cm)"
                  value={(anchor?.workerAntennaHeightsM["WORKER-B"] ?? 0) * 100}
                  min={0}
                  max={300}
                />
              </div>
            </fieldset>
            <div className="cluster">
              <Button type="submit" variant="primary" aria-busy={saving}>
                {saving ? "기준점 저장 중…" : "고정 기준점 적용"}
              </Button>
              <Button
                type="button"
                variant="quiet"
                disabled={!anchor}
                onClick={() => void save(null)}
              >
                고정 기준점 해제
              </Button>
            </div>
          </fieldset>
          <p className="muted">
            처음 표시된 값은 적용 전 예시입니다. 테이블 1cm는 지도 1m에 해당하며, 설정은 서버 재시작
            후 다시 적용해야 합니다. 방위각이 없는 거리 측정만으로는 위치를 표시하지 않습니다.
          </p>
          {error ? (
            <p role="alert" className="form-error">
              {error}
            </p>
          ) : null}
          {notice ? <p role="status">{notice}</p> : null}
        </form>
      </div>
    </Panel>
  );
}
