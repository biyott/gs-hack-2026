import type {
  Calibration,
  MarkerCalibration,
  PositionObservation,
  TrackedEntity,
} from "../../../packages/contracts/src/tracking";
import {
  correctHeightProjection,
  GeometryError,
  type Homography,
  type Point2,
  rotateOffset,
  solveHomography,
  tableMetersToCentimeters,
  tableMetersToWorldMeters,
  transformPoint,
} from "./geometry";
import { type MarkerPose, type PixelMarker, TRACKING_STALE_MS } from "./types";

export type CameraObservationContext = {
  readonly calibration: Calibration | null;
  readonly capturedAt: string;
  readonly receivedAt: string;
  readonly inputSource?: PositionObservation["inputSource"];
};
const ENTITIES = ["EQUIPMENT-A", "WORKER-A", "WORKER-B"] as const;
const CORNERS = [
  { x: 0, y: 0 },
  { x: 1.4, y: 0 },
  { x: 1.4, y: 0.5 },
  { x: 0, y: 0.5 },
] as const;

function pixelCenter(marker: PixelMarker): Point2 {
  const [a, b, c, d] = marker.corners;
  const r = { x: c.x - a.x, y: c.y - a.y };
  const s = { x: d.x - b.x, y: d.y - b.y };
  const cross = r.x * s.y - r.y * s.x;
  if (Math.abs(cross) < 1)
    throw new GeometryError(
      "degenerate_calibration",
      "Marker diagonals do not intersect reliably.",
    );
  const t = ((b.x - a.x) * s.y - (b.y - a.y) * s.x) / cross;
  return { x: a.x + t * r.x, y: a.y + t * r.y };
}

function observation(
  entityId: TrackedEntity,
  context: CameraObservationContext,
): PositionObservation {
  return {
    entityId,
    source: "camera-marker",
    inputSource: context.inputSource ?? "unknown",
    status: "uncalibrated",
    position: null,
    tablePositionM: null,
    tablePositionCm: null,
    lastObservedAt: null,
    receivedAt: context.receivedAt,
    ageMs: null,
    uncertaintyTableM: context.calibration?.evaluationErrorM ?? null,
    uncertaintyWorldM:
      context.calibration?.evaluationErrorM == null
        ? null
        : context.calibration.evaluationErrorM * 100,
    error: "Table or entity calibration is unavailable.",
  };
}

function projectMarker(
  marker: PixelMarker,
  mapping: Homography,
  geometry: { readonly settings: MarkerCalibration; readonly calibration: Calibration },
): MarkerPose {
  const { settings, calibration } = geometry;
  const corrected = (point: Point2): Point2 => {
    const plane = transformPoint(mapping, point);
    if (settings.heightM === 0) return plane;
    if (calibration.camera === null)
      throw new GeometryError(
        "invalid_height",
        "Camera height and position are required for elevated markers.",
      );
    return correctHeightProjection(plane, {
      cameraXY: calibration.camera.positionTableM,
      cameraHeightM: calibration.camera.heightM,
      markerHeightM: settings.heightM,
    });
  };
  const centerTableM = corrected(pixelCenter(marker));
  const edgeA = corrected(marker.corners[0]);
  const edgeB = corrected(marker.corners[1]);
  const headingRad = Math.atan2(edgeB.y - edgeA.y, edgeB.x - edgeA.x);
  const antennaOffset = rotateOffset(settings.markerToAntennaM, headingRad);
  return {
    entityId: settings.entityId,
    markerId: marker.id,
    centerTableM,
    headingRad,
    antennaTableM: { x: centerTableM.x + antennaOffset.x, y: centerTableM.y + antennaOffset.y },
    observedAt: "",
  };
}

export function deriveCameraObservations(
  markers: readonly PixelMarker[],
  context: CameraObservationContext,
): {
  readonly observations: readonly PositionObservation[];
  readonly poses: readonly MarkerPose[];
} {
  const base = ENTITIES.map((entityId) => observation(entityId, context));
  const { calibration } = context;
  if (calibration === null) return { observations: base, poses: [] };
  const ageMs = Date.parse(context.receivedAt) - Date.parse(context.capturedAt);
  if (ageMs < 0 || ageMs > TRACKING_STALE_MS)
    return {
      observations: base.map((item) => ({
        ...item,
        status: ageMs < 0 ? "invalid" : "stale",
        error: "Camera capture time is outside the current observation window.",
      })),
      poses: [],
    };
  try {
    const referencePairs = CORNERS.map((target, id) => {
      const matches = markers.filter((marker) => marker.id === id);
      const marker = matches[0];
      if (matches.length !== 1 || !marker)
        throw new GeometryError(
          "degenerate_calibration",
          "All four unique corner markers must be visible.",
        );
      return { source: pixelCenter(marker), target };
    });
    const turns = referencePairs.map((pair, index) => {
      const next = referencePairs[(index + 1) % 4];
      const after = referencePairs[(index + 2) % 4];
      if (!next || !after)
        throw new GeometryError("degenerate_calibration", "Table corners are incomplete.");
      return (
        (next.source.x - pair.source.x) * (after.source.y - next.source.y) -
        (next.source.y - pair.source.y) * (after.source.x - next.source.x)
      );
    });
    if (
      turns.some((turn) => Math.abs(turn) < 1) ||
      (turns.some((turn) => turn > 0) && turns.some((turn) => turn < 0))
    )
      throw new GeometryError(
        "degenerate_calibration",
        "Table corner IDs must follow a convex boundary.",
      );
    const mapping = solveHomography(referencePairs);
    const poses: MarkerPose[] = [];
    const observations = base.map((item): PositionObservation => {
      const settings = calibration.markers.find((entry) => entry.entityId === item.entityId);
      if (!settings) return item;
      const matches = markers.filter((marker) => marker.id === settings.markerId);
      const marker = matches[0];
      if (matches.length !== 1 || !marker)
        return {
          ...item,
          status: "occluded",
          error: matches.length > 1 ? "Duplicate entity marker ID." : "Entity marker is occluded.",
        };
      try {
        const pose = {
          ...projectMarker(marker, mapping, { settings, calibration }),
          observedAt: context.capturedAt,
          inputSource: context.inputSource ?? "unknown",
        };
        const offset = rotateOffset(settings.markerToReferenceM, pose.headingRad);
        const tablePositionM = {
          x: pose.centerTableM.x + offset.x,
          y: pose.centerTableM.y + offset.y,
        };
        if (
          tablePositionM.x < -1e-6 ||
          tablePositionM.x > 1.400001 ||
          tablePositionM.y < -1e-6 ||
          tablePositionM.y > 0.500001
        )
          return {
            ...item,
            status: "invalid",
            error: "Reference point is outside the physical table.",
          };
        poses.push(pose);
        return {
          ...item,
          status: "valid",
          tablePositionM,
          tablePositionCm: tableMetersToCentimeters(tablePositionM),
          position: { ...tableMetersToWorldMeters(tablePositionM), z: 0 },
          lastObservedAt: context.capturedAt,
          ageMs,
          error: null,
        };
      } catch (error) {
        if (error instanceof GeometryError) return { ...item, error: error.message };
        throw error;
      }
    });
    return { observations, poses };
  } catch (error) {
    if (error instanceof GeometryError)
      return { observations: base.map((item) => ({ ...item, error: error.message })), poses: [] };
    throw error;
  }
}
