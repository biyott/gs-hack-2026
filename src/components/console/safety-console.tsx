"use client";

import { AlertTriangle, CircleDot, Radio, RefreshCw } from "lucide-react";
import { type ComponentProps, useState } from "react";
import { useConsoleStore } from "@/client/store";
import { useAlertAudio } from "@/client/use-alert-audio";
import { useCatalog } from "@/client/use-catalog";
import { sendCommand, useSession, useSimulation } from "@/client/use-simulation";
import { EventTimeline } from "@/components/incidents/event-timeline";
import { IncidentPanel } from "@/components/incidents/incident-panel";
import { SiteStage } from "@/components/scene/SiteStage";
import { CameraPanel } from "@/components/tracking/camera-panel";
import { relatedCameraId } from "@/components/tracking/related-camera";
import { canReadTracking } from "@/components/tracking/tracking-access";
import { TrackingPanel } from "@/components/tracking/tracking-panel";
import { useTracking } from "@/components/tracking/use-tracking";
import { Button } from "@/components/ui/button";
import { Banner, EmptyState, StatusBadge } from "@/components/ui/primitives";
import type { Catalog, SimulationSnapshot } from "@/contracts";
import { ConsoleHeader } from "./console-header";
import { EntryScreen } from "./entry-screen";
import { RunControls } from "./run-controls";
import { ScenarioRail } from "./scenario-rail";
import { WorkerBoard } from "./worker-board";

const runLabels = {
  idle: "실행 준비",
  running: "시나리오 실행 중",
  paused: "일시정지",
  completed: "시나리오 완료",
};

function ConsoleWorkspace({
  catalog,
  snapshot,
  onExit,
}: {
  readonly catalog: Catalog;
  readonly snapshot: SimulationSnapshot;
  readonly onExit: () => void;
}) {
  const audioStatus = useAlertAudio();
  const session = useConsoleStore((state) => state.session);
  const trackingEnabled = canReadTracking(session?.role);
  const tracking = useTracking(trackingEnabled);
  const selectedWorkerId = useConsoleStore((state) => state.selectedWorkerId);
  const selectedIncidentId = useConsoleStore((state) => state.selectedIncidentId);
  const busy = useConsoleStore((state) => state.busy);
  const error = useConsoleStore((state) => state.error);
  const connection = useConsoleStore((state) => state.connection);
  const activeHazards = snapshot.hazards.filter((item) => item.active);
  const activeIncidents = snapshot.incidents.filter((item) => item.status === "active");
  const affected = new Set(activeHazards.flatMap((item) => item.affectedWorkerIds));
  const map = catalog.maps.find(
    (item) => item.mapId === snapshot.run.mapId && item.mapVersion === snapshot.run.mapVersion,
  );
  const equipmentPreset =
    catalog.equipment.find((item) => item.id === snapshot.equipment.presetId) ?? null;
  const canControl = session?.role === "admin" || session?.role === "operator";
  const relatedCamera = trackingEnabled ? relatedCameraId(snapshot, selectedIncidentId) : null;
  return (
    <div className="console-shell">
      <ConsoleHeader onExit={onExit} audioStatus={audioStatus} />
      <div className="console-layout">
        <ScenarioRail catalog={catalog} snapshot={snapshot} />
        <main id="main" className="console-main">
          <div className="workspace-heading">
            <div>
              <p className="eyebrow">SITE-CONSTRUCTION-01 / GROUND</p>
              <h1>{snapshot.mode === "equipment" ? "중장비 접근 대응" : "화재·가스 대응"}</h1>
            </div>
            <div className="cluster">
              {trackingEnabled && selectedIncidentId ? (
                <Button asChild size="compact">
                  <a href="#incident-camera">관련 CCTV</a>
                </Button>
              ) : null}
              <StatusBadge tone={snapshot.run.status === "running" ? "safe" : "info"}>
                {runLabels[snapshot.run.status]}
              </StatusBadge>
            </div>
          </div>
          {error ? (
            <Banner tone="danger">
              <span>{error}</span>
              <button
                type="button"
                className="inline-dismiss"
                onClick={() => useConsoleStore.getState().setError(null)}
                aria-label="오류 메시지 닫기"
              >
                닫기
              </button>
            </Banner>
          ) : null}
          {connection !== "connected" ? (
            <Banner tone="caution">
              실시간 연결 복구 중 · 마지막으로 수신한 상태입니다. 새로 수신될 때까지 위치와 안내의
              갱신 시각을 확인하세요.
            </Banner>
          ) : null}
          {audioStatus === "failed" || audioStatus === "unavailable" ? (
            <Banner tone="caution">
              소리 출력 {audioStatus === "unavailable" ? "미지원" : "실패"} · 화면 경보와 사건
              상태는 유지됩니다.
            </Banner>
          ) : null}
          <div className="status-strip">
            <span>
              <AlertTriangle size={16} />
              활성 위험 <strong>{activeHazards.length}</strong>
            </span>
            <span>
              <CircleDot size={16} />
              영향 작업자 <strong>{affected.size}</strong>
            </span>
            <span>
              <Radio size={16} />
              진행 사건 <strong>{activeIncidents.length}</strong>
            </span>
            <span className="status-strip-version">
              {snapshot.run.positionInput === "scenario" ? "시나리오 위치" : "장치 추적 위치"} · v
              {snapshot.run.version}
            </span>
          </div>
          <section id="site-stage" className="stage-section" data-testid="site-stage">
            <RunControls snapshot={snapshot} />
            {map ? (
              <SiteStage
                snapshot={snapshot}
                map={map}
                equipmentPreset={equipmentPreset}
                selectedWorkerId={selectedWorkerId}
                selectedIncidentId={selectedIncidentId}
                onSelectIncident={(incidentId) =>
                  useConsoleStore.getState().selectIncident(incidentId)
                }
                onSelectWorker={(workerId) => useConsoleStore.getState().selectWorker(workerId)}
                {...(canControl
                  ? {
                      onEquipmentPoseChange: (
                        pose: Parameters<
                          NonNullable<ComponentProps<typeof SiteStage>["onEquipmentPoseChange"]>
                        >[0],
                      ) => {
                        void sendCommand({ action: "control", pose });
                      },
                    }
                  : {})}
              />
            ) : (
              <Banner tone="danger">
                지도 계약 불일치 · 현재 지도 버전을 찾을 수 없습니다. 경로를 표시하지 않습니다.
              </Banner>
            )}
          </section>
          {trackingEnabled && selectedIncidentId ? (
            <div id="incident-camera">
              <CameraPanel
                compact
                cameras={snapshot.cctv}
                frame={tracking.snapshot?.camera ?? null}
                connected={tracking.connected}
                canViewFrame={canControl || session?.role === "observer"}
                now={tracking.now}
                receivedFrames={tracking.snapshot?.receivedFrames ?? 0}
                droppedFrames={tracking.snapshot?.droppedFrames ?? 0}
                relatedCameraId={relatedCamera}
              />
            </div>
          ) : null}
          <div className="event-ledger">
            <EventTimeline snapshot={snapshot} />
          </div>
          {trackingEnabled && session ? (
            <div id="tracking">
              <TrackingPanel cctv={snapshot.cctv} role={session.role} tracking={tracking} />
            </div>
          ) : null}
          <footer className="workspace-footer">
            <span className="mono">{snapshot.run.runId}</span>
            <span>지도 v{snapshot.run.mapVersion} · 서버 기준 상태</span>
          </footer>
        </main>
        <aside className="context-rail">
          {!selectedIncidentId ? <WorkerBoard snapshot={snapshot} /> : null}
          <div id="incident-detail" data-testid="incident-detail">
            {session ? (
              <IncidentPanel
                snapshot={snapshot}
                selectedIncidentId={selectedIncidentId}
                session={session}
                busy={busy}
                onSelectIncident={(id) => useConsoleStore.getState().selectIncident(id)}
                onSelectWorker={(id) => useConsoleStore.getState().selectWorker(id)}
              />
            ) : null}
          </div>
          {selectedIncidentId ? <WorkerBoard snapshot={snapshot} /> : null}
        </aside>
      </div>
    </div>
  );
}

export function SafetyConsole() {
  useSession();
  useSimulation();
  const { catalog, error: catalogError } = useCatalog();
  const stateError = useConsoleStore((state) => state.error);
  const session = useConsoleStore((state) => state.session);
  const snapshot = useConsoleStore((state) => state.snapshot);
  const [entered, setEntered] = useState(false);
  if (!session || !entered)
    return (
      <EntryScreen
        onEnter={(mode) => {
          useConsoleStore.getState().selectMode(mode);
          setEntered(true);
        }}
      />
    );
  if (!snapshot || !catalog)
    return (
      <main id="main" className="loading-screen">
        <EmptyState title="관제 상태를 불러오고 있습니다">
          서버의 현재 실행과 지도 계약을 확인합니다.
        </EmptyState>
        {catalogError || stateError ? (
          <Banner tone="danger">{catalogError ?? stateError}</Banner>
        ) : null}
        <Button onClick={() => window.location.reload()}>
          <RefreshCw size={18} />
          다시 연결
        </Button>
        <Button variant="quiet" onClick={() => setEntered(false)}>
          모드 선택으로
        </Button>
      </main>
    );
  return (
    <ConsoleWorkspace catalog={catalog} snapshot={snapshot} onExit={() => setEntered(false)} />
  );
}
