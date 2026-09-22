import type { Calibration, UwbUpload } from "../../../packages/contracts/src/tracking";
import { rotateOffset, tableMetersToCentimeters, tableMetersToWorldMeters } from "./geometry";
import { type MarkerPose, type PositionObservation, TRACKING_STALE_MS } from "./types";

export type UwbObservation = PositionObservation & {
  readonly captureClock?: UwbUpload["captureClock"];
  readonly rangeInputSource: PositionObservation["inputSource"];
  readonly tableDistanceM: number | null;
  readonly worldDistanceM: number | null;
  readonly azimuthRad: number | null;
  readonly elevationRad: number | null;
};

export type UwbContext = {
  readonly calibration: Calibration | null;
  readonly poses: readonly MarkerPose[];
  readonly receivedAt: string;
};

export function deriveUwbObservation(input: UwbUpload, context: UwbContext): UwbObservation {
  const receivedMs = Date.parse(context.receivedAt);
  const ageMs = receivedMs - Date.parse(input.capturedAt);
  const observation: UwbObservation = {
    entityId: input.workerId,
    captureClock: input.captureClock,
    source: "uwb",
    inputSource: input.source ?? "unknown",
    rangeInputSource: input.source ?? "unknown",
    status: "invalid",
    position: null,
    tablePositionM: null,
    tablePositionCm: null,
    lastObservedAt: input.capturedAt,
    receivedAt: context.receivedAt,
    ageMs: Number.isFinite(ageMs) && ageMs >= 0 ? ageMs : null,
    uncertaintyTableM: input.uncertaintyM,
    uncertaintyWorldM: input.uncertaintyM === null ? null : input.uncertaintyM * 100,
    tableDistanceM: input.distanceM,
    worldDistanceM: input.distanceM === null ? null : input.distanceM * 100,
    azimuthRad: input.azimuthRad,
    elevationRad: input.elevationRad,
    error: null,
  };
  if (!Number.isFinite(ageMs) || ageMs < 0)
    return { ...observation, error: "Measurement timestamp must precede receipt." };
  if (ageMs > TRACKING_STALE_MS)
    return { ...observation, status: "stale", error: "UWB measurement is stale." };
  if (input.distanceM === null) return { ...observation, error: "UWB distance is unavailable." };
  if (input.azimuthRad === null)
    return { ...observation, status: "distance-only", error: "UWB azimuth is unavailable." };

  const { calibration } = context;
  if (calibration === null || calibration.uwbYawRad === null)
    return { ...observation, status: "uncalibrated", error: "UWB sensor yaw is uncalibrated." };
  const equipment = calibration.markers.find((marker) => marker.entityId === "EQUIPMENT-A");
  const worker = calibration.markers.find((marker) => marker.entityId === input.workerId);
  if (equipment === undefined || worker === undefined)
    return {
      ...observation,
      status: "uncalibrated",
      error: "Entity antenna geometry is uncalibrated.",
    };

  const equipmentPose = context.poses.find(
    (pose) => pose.entityId === equipment.entityId && pose.markerId === equipment.markerId,
  );
  const workerPose = context.poses.find(
    (pose) => pose.entityId === worker.entityId && pose.markerId === worker.markerId,
  );
  const antennaToReference = {
    x: worker.markerToReferenceM.x - worker.markerToAntennaM.x,
    y: worker.markerToReferenceM.y - worker.markerToAntennaM.y,
  };
  const needsWorkerHeading = antennaToReference.x !== 0 || antennaToReference.y !== 0;
  if (equipmentPose === undefined || (needsWorkerHeading && workerPose === undefined))
    return {
      ...observation,
      status: "uncalibrated",
      error: "Required camera antenna origin or heading is unavailable.",
    };
  const requiredPoses =
    needsWorkerHeading && workerPose !== undefined ? [equipmentPose, workerPose] : [equipmentPose];
  const inputSources = [
    input.source ?? "unknown",
    ...requiredPoses.map((pose) => pose.inputSource ?? "unknown"),
  ];
  const inputSource = inputSources.includes("synthetic")
    ? "synthetic"
    : inputSources.includes("unknown")
      ? "unknown"
      : "live";
  const poseAges = requiredPoses.map((pose) => receivedMs - Date.parse(pose.observedAt));
  if (poseAges.some((age) => !Number.isFinite(age) || age < 0))
    return { ...observation, error: "Camera pose timestamp must precede receipt." };
  if (poseAges.some((age) => age > TRACKING_STALE_MS))
    return {
      ...observation,
      status: "stale",
      error: "Required camera antenna origin or heading is stale.",
    };

  const heightDifferenceM = worker.antennaHeightM - equipment.antennaHeightM;
  if (input.elevationRad === null && Math.abs(heightDifferenceM) > input.distanceM)
    return {
      ...observation,
      error: "UWB range is shorter than calibrated antenna height separation.",
    };
  const planarDistanceM =
    input.elevationRad === null
      ? Math.sqrt(input.distanceM ** 2 - heightDifferenceM ** 2)
      : input.distanceM * Math.cos(input.elevationRad);
  const relative = rotateOffset(
    {
      x: planarDistanceM * Math.cos(input.azimuthRad),
      y: -planarDistanceM * Math.sin(input.azimuthRad),
    },
    equipmentPose.headingRad + calibration.uwbYawRad,
  );
  const correction =
    needsWorkerHeading && workerPose !== undefined
      ? rotateOffset(antennaToReference, workerPose.headingRad)
      : { x: 0, y: 0 };
  const tablePositionM = {
    x: equipmentPose.antennaTableM.x + relative.x + correction.x,
    y: equipmentPose.antennaTableM.y + relative.y + correction.y,
  };
  return {
    ...observation,
    inputSource,
    status: "valid",
    tablePositionM,
    tablePositionCm: tableMetersToCentimeters(tablePositionM),
    position: { ...tableMetersToWorldMeters(tablePositionM), z: 0 },
  };
}
