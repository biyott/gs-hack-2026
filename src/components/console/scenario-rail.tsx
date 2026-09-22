"use client";

import { Activity, Construction, Flame, Layers, Radio, Shield, Timer } from "lucide-react";
import { useState } from "react";
import { useConsoleStore } from "@/client/store";
import { sendCommand } from "@/client/use-simulation";
import { Button } from "@/components/ui/button";
import { Field, StatusBadge } from "@/components/ui/primitives";
import { type Catalog, PositionInputSchema, type SimulationSnapshot } from "@/contracts";

export function ScenarioRail({
  catalog,
  snapshot,
}: {
  readonly catalog: Catalog;
  readonly snapshot: SimulationSnapshot;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const session = useConsoleStore((state) => state.session);
  const busy = useConsoleStore((state) => state.busy);
  const editable = session?.role === "admin" || session?.role === "operator";
  const scenario = catalog.scenarios.find((item) => item.id === snapshot.run.scenarioId);
  const preset = catalog.equipment.find((item) => item.id === snapshot.equipment.presetId);
  return (
    <aside className={`scenario-rail ${settingsOpen ? "rail-settings-open" : ""}`}>
      <nav className="rail-navigation" aria-label="관제 화면">
        <a className="rail-link active" href="#site-stage">
          <Activity size={20} />
          <span>현장 운영</span>
        </a>
        <a className="rail-link" href="#scenario-settings">
          <Layers size={20} />
          <span>시나리오</span>
        </a>
        <a className="rail-link" href="#tracking">
          <Radio size={20} />
          <span>장치·영상</span>
        </a>
        <a className="rail-link" href="#incident-detail">
          <Shield size={20} />
          <span>사건 기록</span>
        </a>
      </nav>
      <Button
        className="settings-toggle"
        onClick={() => setSettingsOpen(!settingsOpen)}
        aria-expanded={settingsOpen}
        aria-controls="scenario-settings"
      >
        <Layers size={20} />
        <span>설정</span>
      </Button>
      <section className="rail-section" id="scenario-settings">
        <p className="eyebrow">SCENARIO SETTINGS</p>
        <h2>시나리오 설정</h2>
        <fieldset className="mode-switch" aria-label="시뮬레이션 모드">
          <Button
            variant={snapshot.mode === "equipment" ? "primary" : "quiet"}
            onClick={() => useConsoleStore.getState().selectMode("equipment")}
            aria-pressed={snapshot.mode === "equipment"}
          >
            <Construction size={18} />
            <span>중장비</span>
          </Button>
          <Button
            variant={snapshot.mode === "fire-gas" ? "primary" : "quiet"}
            onClick={() => useConsoleStore.getState().selectMode("fire-gas")}
            aria-pressed={snapshot.mode === "fire-gas"}
          >
            <Flame size={18} />
            <span>화재·가스</span>
          </Button>
        </fieldset>
        <Field label="실행 시나리오">
          <select
            data-testid="scenario-select"
            value={snapshot.run.scenarioId}
            disabled={busy || !editable}
            onChange={(event) => {
              void sendCommand({ action: "select", scenarioId: event.target.value });
            }}
          >
            {catalog.scenarios
              .filter((item) => item.mode === snapshot.mode)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label.ko}
                </option>
              ))}
          </select>
        </Field>
        {scenario ? (
          <p className="selected-scenario-name" data-testid="selected-scenario-name">
            {scenario.label.ko}
          </p>
        ) : null}
        {snapshot.mode === "equipment" ? (
          <Field label="주요 장비">
            <select
              data-testid="equipment-select"
              value={snapshot.equipment.presetId}
              disabled={busy || !editable}
              onChange={(event) => {
                void sendCommand({ action: "equipment", presetId: event.target.value });
              }}
            >
              {catalog.equipment.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.model}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <div className="rail-note">
            <Flame size={18} />
            <p>
              DEMO-GAS-X
              <br />
              <small>시연 전용 가상 물질</small>
            </p>
          </div>
        )}
        {preset ? (
          <p className="selected-equipment-name stack" data-testid="selected-equipment-name">
            <strong>{preset.model}</strong>
            <span>{preset.specEdition}</span>
            <span>{preset.boomOrJibConfiguration.notes}</span>
          </p>
        ) : null}
        <Field
          label="위치 입력"
          hint={
            snapshot.run.positionInput === "scenario"
              ? "업로드 영상은 유지하고 시나리오 위치로 실행합니다."
              : "추적 위치를 사용합니다. 미수신·오래된 위치는 미확인으로 처리합니다."
          }
        >
          <select
            value={snapshot.run.positionInput}
            disabled={busy || !editable}
            onChange={(event) => {
              void sendCommand({
                action: "position-input",
                input: PositionInputSchema.parse(event.target.value),
              });
            }}
            data-testid="position-input-select"
          >
            <option value="scenario">시나리오 위치 · 모의 입력</option>
            <option value="measured">장치 추적 위치 · 출처 확인</option>
          </select>
        </Field>
        <Field label="실행 속도">
          <select
            value={snapshot.run.speed}
            disabled={busy || !editable}
            onChange={(event) => {
              void sendCommand({ action: "speed", speed: Number(event.target.value) });
            }}
          >
            {[0.5, 1, 2, 4, 8].map((speed) => (
              <option key={speed} value={speed}>
                {speed}×
              </option>
            ))}
          </select>
        </Field>
        <dl className="rail-facts">
          <div>
            <dt>현장 크기</dt>
            <dd>140m × 50m</dd>
          </div>
          <div>
            <dt>축척</dt>
            <dd>1:100 · 1 unit = 1m</dd>
          </div>
          <div>
            <dt>시나리오 seed</dt>
            <dd className="mono">{snapshot.run.seed}</dd>
          </div>
          <div>
            <dt>실행 길이</dt>
            <dd>
              <Timer size={14} />
              {scenario ? `${scenario.durationMs / 1000}초` : "미확인"}
            </dd>
          </div>
        </dl>
        <p className="muted">{scenario?.coverage.join(" · ")}</p>
        {preset ? (
          <details className="equipment-spec">
            <summary>장비 제원 · 선택 구성</summary>
            <dl>
              <div>
                <dt>제원 기준</dt>
                <dd>{preset.specEdition}</dd>
              </div>
              <div>
                <dt>{preset.dimensionState === "transport" ? "운송 크기" : "작업 외곽"}</dt>
                <dd>
                  {preset.lengthM ?? "미확인"} × {preset.widthM ?? "미확인"} ×{" "}
                  {preset.heightM ?? "미확인"} m
                </dd>
              </div>
              <div>
                <dt>선택 구성</dt>
                <dd>{preset.boomOrJibConfiguration.notes}</dd>
              </div>
              <div>
                <dt>지지 형상 기준</dt>
                <dd>{preset.supportGeometry.coordinateBasis}</dd>
              </div>
            </dl>
            <a href={preset.sourceUrl} target="_blank" rel="noreferrer">
              제조사 근거 · p.{preset.sourcePage.join(", ")}
            </a>
            <p>{preset.controlNotes}</p>
          </details>
        ) : null}
      </section>
      <div className="rail-scope">
        <StatusBadge tone="synthetic">시연 전용 데이터</StatusBadge>
        <p>상태 판단은 서버가 수행합니다. 화면 보간과 3D 모델은 시각화입니다.</p>
      </div>
    </aside>
  );
}
