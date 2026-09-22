import { Focus, Maximize, Minus, Plus, RotateCcw } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import type { CameraMode } from "./geometry";

const labels = {
  full: "전체 현장",
  risk: "위험 구역",
  locked: "선택 사건 고정",
  follow: "작업자 따라가기",
} as const;
type Props = {
  readonly mode: CameraMode;
  readonly canLock: boolean;
  readonly canFollow: boolean;
  readonly setMode: Dispatch<SetStateAction<CameraMode>>;
  readonly setZoom: Dispatch<SetStateAction<number>>;
  readonly setReset: Dispatch<SetStateAction<number>>;
};

export function StageCameraControls({
  mode,
  canLock,
  canFollow,
  setMode,
  setZoom,
  setReset,
}: Props) {
  return (
    <div className="stage-controls">
      <label className="stage-camera-select">
        <Focus size={18} aria-hidden="true" />
        <span className="sr-only">카메라 모드</span>
        <select
          aria-label="카메라 모드"
          value={mode}
          onChange={(event) => {
            const value = event.currentTarget.value;
            if (value === "full" || value === "risk" || value === "locked" || value === "follow")
              setMode(value);
          }}
        >
          {Object.entries(labels).map(([value, label]) => (
            <option
              key={value}
              value={value}
              disabled={(value === "locked" && !canLock) || (value === "follow" && !canFollow)}
            >
              {label}
            </option>
          ))}
        </select>
      </label>
      <Button
        size="compact"
        aria-label="지도 확대"
        onClick={() => setZoom((value) => Math.min(4, value * 1.3))}
      >
        <Plus size={18} aria-hidden="true" />
      </Button>
      <Button
        size="compact"
        aria-label="지도 축소"
        onClick={() => setZoom((value) => Math.max(0.5, value / 1.3))}
      >
        <Minus size={18} aria-hidden="true" />
      </Button>
      <Button
        size="compact"
        onClick={() => {
          setZoom(1);
          setReset((value) => value + 1);
        }}
      >
        <RotateCcw size={16} aria-hidden="true" />
        시점 초기화
      </Button>
      <Button
        size="compact"
        onClick={() => {
          setMode("full");
          setZoom(1);
          setReset((value) => value + 1);
        }}
      >
        <Maximize size={16} aria-hidden="true" />
        전체 범위
      </Button>
    </div>
  );
}
