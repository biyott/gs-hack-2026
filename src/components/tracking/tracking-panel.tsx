"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Banner, Panel, StatusBadge } from "@/components/ui/primitives";
import type { CctvState, Session } from "@/contracts";
import { CalibrationForm } from "./calibration-form";
import { CameraPanel } from "./camera-panel";
import { FixedUwbAnchorForm } from "./fixed-uwb-anchor-form";
import { CameraObservationTable, UwbObservationTable } from "./observation-table";
import type { TrackingState } from "./use-tracking";

export type TrackingPanelProps = {
  readonly cctv: readonly CctvState[];
  readonly role: Session["role"];
  readonly tracking: TrackingState;
};

export function TrackingPanel({ cctv, role, tracking }: TrackingPanelProps) {
  const snapshot = tracking.snapshot;
  const canCalibrate = role === "admin" || role === "operator";
  const canViewFrame = canCalibrate || role === "observer";
  const cameraId = snapshot?.camera?.cameraId ?? cctv[0]?.cameraId;

  return (
    <section className="tracking-panel stack" aria-label="카메라 및 UWB 추적">
      <div className="tracking-toolbar cluster">
        <h2>카메라 · UWB 추적</h2>
        <StatusBadge tone={tracking.connected ? "info" : tracking.error ? "offline" : "caution"}>
          {tracking.connected
            ? "추적 서버 연결됨"
            : tracking.error
              ? "추적 서버 연결 끊김"
              : "추적 서버 접속 확인 중"}
        </StatusBadge>
        <Button onClick={tracking.refresh}>
          <RefreshCw size={16} aria-hidden="true" />
          다시 조회
        </Button>
      </div>
      {tracking.error ? (
        <Banner tone="offline">
          {tracking.error} 마지막 수신값은 현재 측정으로 간주하지 마세요.
        </Banner>
      ) : null}
      <FixedUwbAnchorForm
        anchor={snapshot?.uwbAnchor ?? null}
        canConfigure={canCalibrate && tracking.connected}
        onSave={tracking.saveUwbAnchor}
      />
      <CameraPanel
        cameras={cctv}
        frame={snapshot?.camera ?? null}
        connected={tracking.connected}
        canViewFrame={canViewFrame}
        now={tracking.now}
        receivedFrames={snapshot?.receivedFrames ?? 0}
        droppedFrames={snapshot?.droppedFrames ?? 0}
      />
      <Panel title="위치 관측" eyebrow="MEASUREMENT" className="tracking-observations">
        <div className="stack">
          <p className="muted">
            테이블 단위는 m, 월드 단위는 m입니다. 테이블 1cm를 월드 1m로 환산합니다. 미확인 값은
            0으로 대체하지 않습니다.
          </p>
          <CameraObservationTable
            observations={snapshot?.cameraObservations ?? []}
            now={tracking.now}
          />
          <UwbObservationTable observations={snapshot?.uwbObservations ?? []} now={tracking.now} />
        </div>
      </Panel>
      <CalibrationForm
        calibration={snapshot?.calibration ?? null}
        {...(cameraId ? { cameraId } : {})}
        canCalibrate={canCalibrate}
        onSave={tracking.saveCalibration}
      />
    </section>
  );
}
