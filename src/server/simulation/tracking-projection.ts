import type {
  CctvState,
  PositionObservation,
  SimulationSnapshot,
  TrackingSnapshot,
} from "@/contracts";
import { tableMetersToWorldMeters } from "../tracking/geometry";
import { TRACKING_STALE_MS } from "../tracking/types";

function positionSource(observation: PositionObservation): "video" | "uwb" {
  switch (observation.source) {
    case "camera-marker":
      return "video";
    case "uwb":
      return "uwb";
    default: {
      const exhaustive: never = observation.source;
      return exhaustive;
    }
  }
}

function positionStatus(observation: PositionObservation): "known" | "unknown" | "stale" {
  switch (observation.status) {
    case "valid":
      return observation.position === null ? "unknown" : "known";
    case "stale":
      return "stale";
    case "occluded":
    case "uncalibrated":
    case "invalid":
    case "distance-only":
      return "unknown";
    default: {
      const exhaustive: never = observation.status;
      return exhaustive;
    }
  }
}

function cameraState(camera: CctvState, tracking: TrackingSnapshot, now: string): CctvState {
  const frame = tracking.camera;
  if (frame === null)
    return {
      ...camera,
      status: "disconnected",
      lastFrameAt: null,
      frameUrl: null,
      receivedFps: 0,
      latencyMs: null,
    };
  const synchronized = frame.captureClock !== undefined && frame.captureClock.uncertaintyMs <= 50;
  return {
    ...camera,
    cameraId: frame.cameraId,
    source: frame.source === "live" ? "live" : "mock",
    status:
      Date.parse(now) - Date.parse(frame.capturedAt) > TRACKING_STALE_MS ? "stale" : "connected",
    lastFrameAt: frame.capturedAt,
    frameUrl: `/api/tracking/frame?cameraId=${encodeURIComponent(frame.cameraId)}&streamId=${encodeURIComponent(frame.streamId ?? "default")}&sequence=${frame.sequence}&frameId=${encodeURIComponent(frame.frameId)}`,
    receivedFps: frame.receiveFps ?? 0,
    latencyMs: synchronized
      ? Math.max(0, Date.parse(frame.processedAt) - Date.parse(frame.capturedAt))
      : null,
  };
}

export function projectTracking(
  snapshot: SimulationSnapshot,
  tracking: TrackingSnapshot,
  now: string,
  equipmentMovable = true,
): SimulationSnapshot {
  const cctv = snapshot.cctv.map((camera) => cameraState(camera, tracking, now));
  if (snapshot.run.positionInput === "scenario") return { ...snapshot, cctv };
  const equipment = tracking.updates.find(
    (observation) => observation.entityId === snapshot.equipment.id,
  );
  const workers: SimulationSnapshot["workers"] = snapshot.workers.map((worker) => {
    const observation = tracking.updates.find(
      (candidate) => candidate.entityId === worker.workerId,
    );
    if (observation === undefined)
      return {
        ...worker,
        position: null,
        positionSource: "video",
        positionInputSource: "unknown",
        positionStatus: "unknown",
        lastObservedAt: null,
      };
    return {
      ...worker,
      position: observation.status === "valid" ? observation.position : null,
      positionSource: positionSource(observation),
      positionInputSource: observation.inputSource,
      positionStatus: positionStatus(observation),
      lastObservedAt: observation.lastObservedAt,
    };
  });
  return {
    ...snapshot,
    workers,
    cctv,
    equipment: tracking.uwbAnchor
      ? {
          ...snapshot.equipment,
          position: tableMetersToWorldMeters(tracking.uwbAnchor.positionTableM),
          headingDeg: (tracking.uwbAnchor.headingRad * 180) / Math.PI,
          speedMps: 0,
          positionSource: "manual",
          positionInputSource: "synthetic",
          positionStatus: "known",
          lastObservedAt: null,
        }
      : !equipmentMovable && snapshot.equipment.positionSource !== "manual"
        ? {
            ...snapshot.equipment,
            positionSource: "mock",
            positionInputSource: "synthetic",
            positionStatus: "known",
          }
        : equipment === undefined ||
            (snapshot.equipment.positionSource === "manual" &&
              (equipment.status !== "valid" || equipment.position === null))
          ? {
              ...snapshot.equipment,
              positionSource: snapshot.equipment.positionSource === "manual" ? "manual" : "video",
              positionInputSource: "unknown",
              positionStatus: "unknown",
              lastObservedAt: null,
            }
          : {
              ...snapshot.equipment,
              position:
                equipment.status === "valid" && equipment.position !== null
                  ? equipment.position
                  : snapshot.equipment.position,
              positionSource: positionSource(equipment),
              positionInputSource: equipment.inputSource,
              positionStatus: positionStatus(equipment),
              lastObservedAt: equipment.lastObservedAt,
            },
  };
}
