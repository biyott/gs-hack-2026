"use client";

import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { useConsoleStore } from "@/client/store";
import { sendCommand } from "@/client/use-simulation";
import { Button } from "@/components/ui/button";
import type { SimulationSnapshot } from "@/contracts";

const speeds = [0.25, 0.5, 0.75, 1, 1.2, 1.4, 1.5, 1.6, 1.8, 2, 2.5, 3, 4, 6, 8, 12, 16] as const;

export function RunControls({ snapshot }: { readonly snapshot: SimulationSnapshot }) {
  const busy = useConsoleStore((state) => state.busy);
  const role = useConsoleStore((state) => state.session?.role);
  const editable = role === "admin" || role === "operator";
  const running = snapshot.run.status === "running";
  const action = running ? "pause" : snapshot.run.status === "paused" ? "resume" : "start";
  const elapsed = Math.floor(snapshot.run.virtualTimeMs / 1000);
  return (
    <div className="run-controls">
      <div className="run-clock">
        <span className={`run-dot ${running ? "is-running" : ""}`} />
        <div>
          <strong className="mono">
            {String(Math.floor(elapsed / 60)).padStart(2, "0")}:
            {String(elapsed % 60).padStart(2, "0")}
          </strong>
          <span>가상 시간 · {snapshot.run.speed}×</span>
        </div>
      </div>
      <label className="run-speed">
        <span>속도</span>
        <select
          aria-label="가상시간 속도"
          value={snapshot.run.speed}
          disabled={busy || !editable}
          onChange={(event) => {
            void sendCommand({ action: "speed", speed: Number(event.currentTarget.value) });
          }}
        >
          {!speeds.some((speed) => speed === snapshot.run.speed) ? (
            <option value={snapshot.run.speed}>{snapshot.run.speed}×</option>
          ) : null}
          {speeds.map((speed) => (
            <option key={speed} value={speed}>
              {speed}×
            </option>
          ))}
        </select>
      </label>
      <div className="cluster">
        <Button
          onClick={() => {
            void sendCommand({ action: "reset" });
          }}
          disabled={busy || !editable}
        >
          <RotateCcw size={18} />
          초기화
        </Button>
        <Button
          onClick={() => {
            void sendCommand({ action: "advance", deltaMs: 5000 / snapshot.run.speed });
          }}
          disabled={busy || !editable}
        >
          <SkipForward size={18} />
          5초 진행
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            void sendCommand({ action });
          }}
          disabled={busy || !editable || snapshot.run.status === "completed"}
          data-testid="run-toggle"
        >
          {running ? <Pause size={18} /> : <Play size={18} />}
          {running
            ? "일시정지"
            : snapshot.run.status === "paused"
              ? "재개"
              : snapshot.run.status === "completed"
                ? "시나리오 완료"
                : "시나리오 실행"}
        </Button>
      </div>
    </div>
  );
}
