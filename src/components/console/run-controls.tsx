"use client";

import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { useConsoleStore } from "@/client/store";
import { sendCommand } from "@/client/use-simulation";
import { Button } from "@/components/ui/button";
import type { SimulationSnapshot } from "@/contracts";

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
            void sendCommand({ action: "advance", deltaMs: 5000 });
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
