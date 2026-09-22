import type { PositionObservation, TrackedEntity } from "../../../packages/contracts/src/tracking";
import type { Point2 } from "./geometry";

export type { PositionObservation } from "../../../packages/contracts/src/tracking";

export type ObservationStatus =
  | "valid"
  | "occluded"
  | "stale"
  | "uncalibrated"
  | "invalid"
  | "distance-only";
export type MarkerPose = {
  readonly entityId: TrackedEntity;
  readonly markerId: number;
  readonly centerTableM: Point2;
  readonly headingRad: number;
  readonly antennaTableM: Point2;
  readonly observedAt: string;
  readonly inputSource?: PositionObservation["inputSource"];
};

export type PixelMarker = {
  readonly id: number;
  readonly corners: readonly [Point2, Point2, Point2, Point2];
  readonly hammingDistance: number;
};

export class TrackingError extends Error {
  constructor(
    readonly code:
      | "invalid-image"
      | "out-of-order"
      | "camera-mismatch"
      | "busy"
      | "invalid-timestamp"
      | "calibration-changed",
    message: string,
  ) {
    super(message);
    this.name = "TrackingError";
  }
}

export const TRACKING_STALE_MS = 1_000;
