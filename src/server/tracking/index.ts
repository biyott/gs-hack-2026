import { TrackingService } from "./service";

export const trackingService = new TrackingService();
export type {
  PositionObservation,
  TrackingSnapshot,
} from "../../../packages/contracts/src/tracking";
export {
  CalibrationSchema,
  FrameUploadSchema,
  TrackingSnapshotSchema,
  UwbUploadSchema,
} from "../../../packages/contracts/src/tracking";
export { TrackingService } from "./service";
export { TrackingError } from "./types";
