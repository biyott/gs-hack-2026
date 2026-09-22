"use client";

import Image from "next/image";
import { useState } from "react";
import { Banner, EmptyState, Panel, StatusBadge } from "@/components/ui/primitives";
import type { CameraFrame, CctvState } from "@/contracts";
import { cameraFrameUrl, cameraView, formatValue, timeText } from "./tracking-view";

export type CameraPanelProps = {
  readonly compact?: boolean;
  readonly relatedCameraId?: string | null;
  readonly cameras: readonly CctvState[];
  readonly frame: CameraFrame | null;
  readonly connected: boolean;
  readonly canViewFrame: boolean;
  readonly now: number;
  readonly receivedFrames: number;
  readonly droppedFrames: number;
};

const sourceLabels = {
  live: "실제 카메라 / LIVE",
  synthetic: "합성 프레임 / SYNTHETIC",
  recorded: "녹화 영상 / RECORDED",
  mock: "모의 카메라 / MOCK",
  unknown: "출처 미확인 / Unknown",
} as const;
const stateLabels = {
  receiving: "프레임 수신 중",
  awaiting: "첫 프레임 수신 대기",
  stale: "오래된 프레임 / Stale",
  disconnected: "연결 끊김 / Disconnected",
} as const;

export function CameraPanel({
  cameras,
  frame: latestFrame,
  compact = false,
  relatedCameraId,
  connected,
  canViewFrame,
  now,
  receivedFrames,
  droppedFrames,
}: CameraPanelProps) {
  const [failedFrameUrl, setFailedFrameUrl] = useState<string | null>(null);
  const view = cameraView(cameras, latestFrame, now, connected, relatedCameraId);
  const frame = view.frame;
  const metadata = view.metadata;
  const frameUrl = frame ? cameraFrameUrl(frame) : "";
  const imageFailed = frame !== null && failedFrameUrl === frameUrl;
  const tone =
    view.state === "receiving" ? "info" : view.state === "disconnected" ? "offline" : "caution";

  if (relatedCameraId === null)
    return (
      <Panel
        title="관련 CCTV"
        eyebrow="INCIDENT CAMERA"
        className="camera-panel camera-panel-compact"
      >
        <EmptyState title="이 사건 구역에 연결된 카메라가 없습니다.">
          같은 층과 구역을 관측하는 등록 카메라가 필요합니다.
        </EmptyState>
      </Panel>
    );

  return (
    <Panel
      title={metadata?.name ?? frame?.cameraId ?? "테이블 카메라"}
      eyebrow={compact ? "INCIDENT CAMERA" : "CAMERA"}
      className={compact ? "camera-panel camera-panel-compact" : "camera-panel"}
      actions={<StatusBadge tone={tone}>{stateLabels[view.state]}</StatusBadge>}
    >
      <div className="stack">
        <div className="cluster">
          <StatusBadge
            tone={
              view.source === "live" ? "info" : view.source === "unknown" ? "offline" : "synthetic"
            }
          >
            {sourceLabels[view.source]}
          </StatusBadge>
          <span className="muted">
            층 {metadata?.floorId ?? "미확인"} · 구역 {metadata?.zoneIds.join(", ") || "미확인"}
          </span>
        </div>
        {!canViewFrame ? (
          <EmptyState title="카메라 영상 열람 권한이 없습니다.">
            현재 계정에서는 추적 상태와 보정 정보만 열람할 수 있습니다.
          </EmptyState>
        ) : frame && !imageFailed ? (
          <figure className={`camera-frame camera-frame-${view.state}`}>
            <Image
              unoptimized
              src={frameUrl}
              alt={`${metadata?.name ?? frame.cameraId}의 마지막 수신 프레임. ${sourceLabels[view.source]}. ${stateLabels[view.state]}.`}
              width={frame.width}
              height={frame.height}
              onError={() => setFailedFrameUrl(frameUrl)}
            />
            <figcaption>
              {view.state === "receiving" ? (
                "마지막 수신 프레임"
              ) : (
                <>
                  이전 수신 프레임 — 현재 위치 판단에{" "}
                  <span className="keep-phrase">사용하지 마세요.</span>
                </>
              )}
            </figcaption>
          </figure>
        ) : (
          <EmptyState
            title={
              imageFailed
                ? "카메라 이미지를 불러오지 못했습니다."
                : "아직 수신한 카메라 프레임이 없습니다."
            }
          >
            CCTV 기기에서 프레임을 전송하면 실제 수신 이미지가 표시됩니다.
          </EmptyState>
        )}
        {imageFailed ? (
          <Banner tone="offline">프레임 메타데이터는 수신했지만 이미지 요청에 실패했습니다.</Banner>
        ) : null}
        {frame?.source === "synthetic" ? (
          <Banner tone="synthetic">
            검증용 합성 영상입니다. 실제 휴대폰 카메라 연결 또는 현장 실측{" "}
            <span className="keep-phrase">증거가 아닙니다.</span>
          </Banner>
        ) : null}
        <dl className="camera-metadata">
          <div>
            <dt>카메라 ID</dt>
            <dd className="mono">{frame?.cameraId ?? metadata?.cameraId ?? "미확인"}</dd>
          </div>
          <div>
            <dt>수신 FPS</dt>
            <dd>{formatValue(frame?.receiveFps ?? null, "fps", 1)}</dd>
          </div>
          <div>
            <dt>촬영 시각</dt>
            <dd>{timeText(frame?.capturedAt ?? null)}</dd>
          </div>
          <div>
            <dt>서버 수신 시각</dt>
            <dd>{timeText(frame?.receivedAt ?? null)}</dd>
          </div>
          <div>
            <dt>수신 후 경과</dt>
            <dd>{formatValue(view.ageMs, "ms", 0)}</dd>
          </div>
          {!compact ? (
            <div>
              <dt>영상 처리 시간</dt>
              <dd>{formatValue(frame?.processingMs ?? null, "ms", 1)}</dd>
            </div>
          ) : null}
          {!compact ? (
            <div>
              <dt>감지 마커 ID</dt>
              <dd>{frame ? frame.detectedMarkerIds.join(", ") || "감지 없음" : "미확인"}</dd>
            </div>
          ) : null}
          {!compact ? (
            <div>
              <dt>프레임 수신 / 제외</dt>
              <dd className="mono">
                {receivedFrames} / {droppedFrames}
              </dd>
            </div>
          ) : null}
        </dl>
      </div>
    </Panel>
  );
}
