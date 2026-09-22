import type { CameraFrame, CctvState, Point, PositionObservation } from "@/contracts";

const FRESHNESS_MS = 1_000;
type CameraView = {
  readonly state: "receiving" | "awaiting" | "stale" | "disconnected";
  readonly source: CameraFrame["source"] | CctvState["source"] | "unknown";
  readonly frame: CameraFrame | null;
  readonly metadata: CctvState | null;
  readonly ageMs: number | null;
};

export function cameraView(
  cameras: readonly CctvState[],
  latestFrame: CameraFrame | null,
  now: number,
  connected: boolean,
  relatedCameraId?: string | null,
): CameraView {
  const frame =
    relatedCameraId === undefined || relatedCameraId === latestFrame?.cameraId ? latestFrame : null;
  const metadata =
    relatedCameraId !== undefined
      ? (cameras.find((camera) => camera.cameraId === relatedCameraId) ?? null)
      : frame
        ? (cameras.find((camera) => camera.cameraId === frame.cameraId) ?? null)
        : (cameras[0] ?? null);
  const ageMs = frame ? Math.max(0, now - Date.parse(frame.receivedAt)) : null;
  const source = frame?.source ?? metadata?.source ?? "unknown";
  if (!connected || metadata?.status === "disconnected")
    return { state: "disconnected", source, metadata, ageMs, frame };
  if (!frame) return { state: "awaiting", source, metadata, ageMs, frame };
  const stale =
    metadata?.status === "stale" ||
    (ageMs !== null && ageMs > FRESHNESS_MS) ||
    now - Date.parse(frame.capturedAt) > FRESHNESS_MS;
  return { state: stale ? "stale" : "receiving", source, metadata, ageMs, frame };
}

export function observationCoordinates(observation: PositionObservation) {
  switch (observation.status) {
    case "valid":
    case "stale":
      return { table: observation.tablePositionM, world: observation.position };
    case "occluded":
    case "uncalibrated":
    case "invalid":
    case "distance-only":
      return { table: null, world: null };
    default:
      return unreachable(observation.status);
  }
}

const observationStates = {
  valid: { label: "측정 위치 / Valid", tone: "info" },
  stale: { label: "오래된 관측 / Stale", tone: "caution" },
  occluded: { label: "마커 가림 / Occluded", tone: "caution" },
  uncalibrated: { label: "미보정 / Uncalibrated", tone: "caution" },
  invalid: { label: "관측 무효 / Invalid", tone: "danger" },
  "distance-only": { label: "거리만 수신 / Distance only", tone: "caution" },
} as const;

export function observationStatus(observation: PositionObservation, now: number) {
  const ageMs =
    observation.lastObservedAt === null
      ? null
      : Math.max(observation.ageMs ?? 0, now - Date.parse(observation.lastObservedAt), 0);
  const status =
    observation.status === "valid" && ageMs !== null && ageMs > FRESHNESS_MS
      ? "stale"
      : observation.status;
  return { ...observationStates[status], ageMs };
}

export function formatValue(value: number | null, unit: string, precision = 3): string {
  return value === null ? "미확인 / Unknown" : `${value.toFixed(precision)} ${unit}`;
}

export function formatPoint(point: Point | null): string {
  return point ? `${point.x.toFixed(3)}, ${point.y.toFixed(3)}` : "미확인 / Unknown";
}

export function timeText(value: string | null): string {
  return value === null
    ? "미확인 / Unknown"
    : new Date(value).toLocaleString("ko-KR", { hour12: false });
}

function unreachable(value: never): never {
  throw new TypeError(`Unknown observation status: ${String(value)}`);
}

export function cameraFrameUrl(frame: CameraFrame): string {
  const query = new URLSearchParams({
    cameraId: frame.cameraId,
    frameId: frame.frameId,
    streamId: frame.streamId ?? "default",
    sequence: String(frame.sequence),
    receivedAt: frame.receivedAt,
  });
  return `/api/tracking/frame?${query.toString()}`;
}
