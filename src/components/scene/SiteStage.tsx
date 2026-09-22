"use client";

import { Crosshair } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/primitives";
import type { EquipmentPreset } from "@/contracts";
import { EquipmentControls, type EquipmentPose } from "./EquipmentControls";
import { SceneBoundary } from "./SceneBoundary";
import { SiteMap } from "./SiteMap";
import { StageCameraControls } from "./StageCameraControls";
import { positionSourceLabel, workerLabel } from "./scene-data";
import type { ScenePalette, SceneSelection } from "./scene-types";
import { useSceneCamera } from "./use-scene-camera";

const LazyCanvas = lazy(async () => ({ default: (await import("./SiteCanvas")).SiteCanvas }));
type Props = SceneSelection & {
  readonly equipmentPreset: EquipmentPreset | null;
  readonly onEquipmentPoseChange?: (pose: EquipmentPose) => void;
  readonly initialView?: "2d" | "3d";
};
export function SiteStage(props: Props) {
  const { snapshot, map, equipmentPreset, selectedIncidentId, onEquipmentPoseChange } = props;
  const [view, setView] = useState(props.initialView ?? "3d");
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [palette, setPalette] = useState<ScenePalette | null>(null);
  const reachM = equipmentPreset?.boomOrJibConfiguration.jibLengthM ?? 0;
  const extentM = Math.max(reachM, snapshot.equipment.boomLengthM ?? 0);
  const camera = useSceneCamera(props, extentM, nowMs);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const style = getComputedStyle(document.documentElement);
    setPalette({
      ground: style.getPropertyValue("--map-ground").trim(),
      road: style.getPropertyValue("--map-road").trim(),
      text: style.getPropertyValue("--map-text").trim(),
      route: style.getPropertyValue("--map-route").trim(),
      danger: style.getPropertyValue("--map-danger").trim(),
      caution: style.getPropertyValue("--map-caution").trim(),
      structure: style.getPropertyValue("--map-structure").trim(),
      accent: style.getPropertyValue("--accent").trim(),
    });
  }, []);

  const frame = { ...camera.framing, zoom: camera.zoom, reachM, nowMs };
  return (
    <section className="site-stage" aria-label="현장 지도와 장비 시각화">
      <header className="stage-toolbar">
        <div>
          <p className="eyebrow">
            {map.mapId} · v{map.mapVersion}
          </p>
          <h2>현장 상황</h2>
          <p className="scene-status">{map.metadata.displayLabel}</p>
        </div>
        <fieldset className="stage-view-toggle" aria-label="지도 표시 방식">
          <Button aria-pressed={view === "2d"} onClick={() => setView("2d")}>
            2D 지도
          </Button>
          <Button aria-pressed={view === "3d"} onClick={() => setView("3d")}>
            3D 현장
          </Button>
        </fieldset>
      </header>
      <StageCameraControls
        mode={camera.mode}
        canLock={selectedIncidentId !== null}
        canFollow={Boolean(
          camera.selectedWorker?.position && camera.selectedWorker.positionStatus === "known",
        )}
        setMode={camera.setMode}
        setZoom={camera.setZoom}
        setReset={camera.setReset}
      />
      {camera.notice && !camera.notice.frame ? (
        <div className="scene-risk-notice" role="status" data-priority={camera.notice.priority}>
          <StatusBadge tone={camera.notice.priority === "critical" ? "danger" : "caution"}>
            새 위험 ·{" "}
            {
              { critical: "긴급", high: "높음", medium: "보통", low: "낮음" }[
                camera.notice.priority
              ]
            }
          </StatusBadge>
          <span className="scene-risk-identity">사건 {camera.notice.incidentId}</span>
          <span>현재 시점을 유지합니다.</span>
          <Button size="compact" onClick={camera.focusNotice}>
            위험 구역 보기
          </Button>
        </div>
      ) : null}
      <div className="site-stage__viewport" data-camera-mode={camera.mode}>
        {view === "2d" ? (
          <SiteMap {...props} {...frame} />
        ) : (
          <SceneBoundary
            key={`${snapshot.run.runId}:${snapshot.equipment.presetId}`}
            onUseMap={() => setView("2d")}
          >
            <Suspense
              fallback={
                <div className="scene-loading" role="status">
                  3D 뷰어 준비 중…
                </div>
              }
            >
              {palette ? <LazyCanvas {...props} {...frame} palette={palette} /> : null}
            </Suspense>
          </SceneBoundary>
        )}
      </div>
      <section className="site-legend" aria-label="지도 범례">
        <span className="legend-hazard">위험 영역</span>
        <span className="legend-route">현재 검증 경로</span>
        <span className="legend-worker">작업자</span>
        <span className="legend-refuge">대피 후보지 · 현재 경로 검증 필요</span>
        <span className="legend-boundary">관측 책상 140 × 50 m</span>
        <span>
          <Crosshair size={14} aria-hidden="true" />
          {view === "2d" ? "현장 로컬 +X → / +Y ↑" : "현장 로컬 +X / +Y"} · 1 단위 = 1 m
        </span>
      </section>
      <p className="scene-status">
        점선 외부: 실측 범위 밖 / Outside observed table · 장비 도달범위 참고선은 위험 영역과
        다릅니다.
      </p>
      <div className="stage-position-status">
        <span>
          <StatusBadge tone={snapshot.equipment.positionStatus === "known" ? "info" : "caution"}>
            장비 ·{" "}
            {snapshot.equipment.positionStatus === "unknown"
              ? "위치 미확인"
              : snapshot.equipment.positionStatus === "stale"
                ? "마지막 위치 · 오래됨"
                : "현재 위치"}{" "}
            · {positionSourceLabel(snapshot.equipment)}
          </StatusBadge>
          <time dateTime={snapshot.equipment.lastObservedAt ?? undefined}>
            {snapshot.equipment.lastObservedAt
              ? new Date(snapshot.equipment.lastObservedAt).toLocaleTimeString("ko-KR", {
                  hour12: false,
                })
              : "관측 시각 없음"}
          </time>
        </span>
        {snapshot.workers.map((worker) => (
          <span key={worker.workerId}>
            <StatusBadge tone={worker.positionStatus === "known" ? "info" : "caution"}>
              {workerLabel(worker)}
            </StatusBadge>
            <time dateTime={worker.lastObservedAt ?? undefined}>
              {worker.lastObservedAt
                ? new Date(worker.lastObservedAt).toLocaleTimeString("ko-KR", { hour12: false })
                : "관측 시각 없음"}
            </time>
          </span>
        ))}
      </div>
      {equipmentPreset ? (
        <EquipmentControls
          preset={equipmentPreset}
          equipment={snapshot.equipment}
          onEquipmentPoseChange={onEquipmentPoseChange}
        />
      ) : (
        <p className="scene-status" role="status">
          선택 장비의 검증된 카탈로그를 불러오는 중입니다.
        </p>
      )}
    </section>
  );
}
