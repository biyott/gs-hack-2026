"use client";

import { ArrowLeft, ShieldCheck, Volume2, VolumeX, Wifi, WifiOff } from "lucide-react";
import { useConsoleStore } from "@/client/store";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/primitives";

const roleLabel = {
  admin: "안전관리자",
  operator: "데모 운영자",
  support: "지원 담당자",
  worker: "작업자",
  device: "측정 장치",
  observer: "관찰자",
};

export function ConsoleHeader({
  onExit,
  audioStatus,
}: {
  readonly onExit: () => void;
  readonly audioStatus: string;
}) {
  const session = useConsoleStore((state) => state.session);
  const connection = useConsoleStore((state) => state.connection);
  const soundEnabled = useConsoleStore((state) => state.soundEnabled);
  const online = connection === "connected";
  return (
    <header className="console-header">
      <div className="console-brand">
        <Button variant="quiet" size="compact" onClick={onExit} aria-label="모드 선택으로 돌아가기">
          <ArrowLeft size={18} />
        </Button>
        <ShieldCheck className="brand-mark" size={24} />
        <div>
          <strong>안전 운영 콘솔</strong>
          <span className="console-wordmark">GS SAFETY OPERATIONS</span>
          <div className="compact-simulation-scope">
            <StatusBadge tone="synthetic">시뮬레이션 / SIMULATION</StatusBadge>
          </div>
        </div>
      </div>
      <div className="header-scope">
        <StatusBadge tone="synthetic">시뮬레이션 / SIMULATION</StatusBadge>
        <span>서산 HVO 현장 참고 / 상세 배치 재구성</span>
      </div>
      <div className="header-actions">
        <span
          className={`connection-label ${online ? "status-safe" : "status-caution"}`}
          data-testid="connection-state"
        >
          {online ? <Wifi size={16} /> : <WifiOff size={16} />}
          {online ? "실시간 연결" : connection === "connecting" ? "연결 중" : "재연결 중"}
        </span>
        <Button
          variant="quiet"
          size="compact"
          onClick={() => useConsoleStore.getState().toggleSound()}
          aria-pressed={soundEnabled}
          aria-label={soundEnabled ? "경보 소리 끄기" : "경보 소리 켜기"}
          title={audioStatus}
        >
          {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          <span>{soundEnabled ? "소리 켜짐" : "소리 꺼짐"}</span>
        </Button>
        <div className="session-chip">
          <span className="session-avatar">{session?.actorId.slice(0, 1).toUpperCase()}</span>
          <span>
            {session ? roleLabel[session.role] : ""}
            <small>{session?.actorId}</small>
          </span>
        </div>
      </div>
    </header>
  );
}
