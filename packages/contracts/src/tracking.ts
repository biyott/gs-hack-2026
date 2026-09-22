import { z } from "zod";
import { CaptureClockSchema, captureClockMatches } from "./clock";
import { InputSourceSchema } from "./core";
import { UwbFixedAnchorSchema } from "./uwb-anchor";

const PointSchema = z.object({ x: z.number().finite(), y: z.number().finite() }).readonly();
const TimestampSchema = z.string().datetime({ offset: true });
export const TrackedEntitySchema = z.enum(["EQUIPMENT-A", "WORKER-A", "WORKER-B"]);

export const FrameUploadSchema = z
  .object({
    cameraId: z.string().min(1).max(100),
    capturedAt: TimestampSchema,
    captureClock: CaptureClockSchema.optional(),
    sequence: z.number().int().nonnegative(),
    streamId: z.string().min(1).max(120).optional(),
    jpegBase64: z
      .string()
      .min(4)
      .max(4_000_000)
      .regex(/^[A-Za-z0-9+/]*={0,2}$/),
    source: z.enum(["live", "synthetic"]).default("live"),
    frameId: z.string().max(120).optional(),
    deviceId: z.string().max(120).optional(),
    runId: z.string().max(120).optional(),
    capturedElapsedNanos: z.string().regex(/^\d+$/).optional(),
    width: z.number().int().positive().max(4096).optional(),
    height: z.number().int().positive().max(4096).optional(),
  })
  .superRefine((value, context) => {
    if (!captureClockMatches(value.capturedAt, value.captureClock))
      context.addIssue({
        code: "custom",
        path: ["capturedAt"],
        message: "Capture timestamp must match the supplied clock correction.",
      });
  })
  .readonly();

export const UwbUploadSchema = z
  .object({
    deviceId: z.string().min(1).max(120),
    workerId: z.enum(["WORKER-A", "WORKER-B"]),
    capturedAt: TimestampSchema,
    captureClock: CaptureClockSchema.optional(),
    sequence: z.number().int().nonnegative(),
    sessionEpoch: z.string().max(120).optional(),
    source: z.enum(["live", "synthetic"]).optional(),
    distanceM: z.number().finite().min(0).max(100).nullable(),
    azimuthRad: z.number().finite().min(-Math.PI).max(Math.PI).nullable(),
    elevationRad: z
      .number()
      .finite()
      .min(-Math.PI / 2)
      .max(Math.PI / 2)
      .nullable(),
    uncertaintyM: z.number().finite().nonnegative().nullable(),
  })
  .superRefine((value, context) => {
    if (!captureClockMatches(value.capturedAt, value.captureClock))
      context.addIssue({
        code: "custom",
        path: ["capturedAt"],
        message: "Capture timestamp must match the supplied clock correction.",
      });
  })
  .readonly();

export const MarkerCalibrationSchema = z
  .object({
    markerId: z.number().int().min(4).max(249),
    entityId: TrackedEntitySchema,
    heightM: z.number().finite().min(0).max(1),
    antennaHeightM: z.number().finite().min(0).max(1),
    markerToReferenceM: PointSchema,
    markerToAntennaM: PointSchema,
  })
  .readonly();

export const CalibrationSchema = z
  .object({
    version: z.string().min(1).max(100),
    cameraId: z.string().min(1).max(100),
    camera: z
      .object({ positionTableM: PointSchema, heightM: z.number().finite().positive().max(10) })
      .readonly()
      .nullable(),
    markers: z.array(MarkerCalibrationSchema).length(3).readonly(),
    uwbYawRad: z
      .number()
      .finite()
      .min(-Math.PI)
      .max(Math.PI)
      .nullable()
      .describe("Calibrated UWB sensor axis yaw offset relative to equipment marker heading."),
    evaluationErrorM: z.number().finite().nonnegative().nullable(),
  })
  .superRefine((value, context) => {
    if (
      new Set(value.markers.map((marker) => marker.entityId)).size !== 3 ||
      new Set(value.markers.map((marker) => marker.markerId)).size !== 3
    ) {
      context.addIssue({
        code: "custom",
        message: "Each tracked entity and marker ID must occur once.",
      });
    }
    const camera = value.camera;
    if (camera && value.markers.some((marker) => marker.heightM >= camera.heightM)) {
      context.addIssue({ code: "custom", message: "Camera must be above every marker plane." });
    }
  })
  .readonly();

export type FrameUpload = z.infer<typeof FrameUploadSchema>;
export type UwbUpload = z.infer<typeof UwbUploadSchema>;
export type Calibration = z.infer<typeof CalibrationSchema>;
export type MarkerCalibration = z.infer<typeof MarkerCalibrationSchema>;
export type TrackedEntity = z.infer<typeof TrackedEntitySchema>;

export const PositionObservationSchema = z
  .object({
    entityId: TrackedEntitySchema,
    source: z.enum(["camera-marker", "uwb"]),
    inputSource: InputSourceSchema.default("unknown"),
    status: z.enum(["valid", "occluded", "stale", "uncalibrated", "invalid", "distance-only"]),
    position: z
      .object({ x: z.number().finite(), y: z.number().finite(), z: z.literal(0) })
      .readonly()
      .nullable(),
    tablePositionM: PointSchema.nullable(),
    tablePositionCm: PointSchema.nullable(),
    lastObservedAt: TimestampSchema.nullable(),
    receivedAt: TimestampSchema,
    ageMs: z.number().nonnegative().nullable(),
    uncertaintyTableM: z.number().nonnegative().nullable(),
    uncertaintyWorldM: z.number().nonnegative().nullable(),
    error: z.string().nullable(),
  })
  .readonly();

export const UwbObservationSchema = PositionObservationSchema.unwrap()
  .extend({
    captureClock: CaptureClockSchema.optional(),
    rangeInputSource: InputSourceSchema.default("unknown"),
    referenceSource: z.enum(["fixed-anchor", "camera-marker"]).optional(),
    tableDistanceM: z.number().nonnegative().nullable(),
    worldDistanceM: z.number().nonnegative().nullable(),
    azimuthRad: z.number().nullable(),
    elevationRad: z.number().nullable(),
  })
  .readonly();

export const CameraFrameSchema = z
  .object({
    cameraId: z.string(),
    frameId: z.string(),
    streamId: z.string().optional(),
    sequence: z.number().int(),
    capturedAt: TimestampSchema,
    captureClock: CaptureClockSchema.optional(),
    receivedAt: TimestampSchema,
    processedAt: TimestampSchema,
    width: z.number().int(),
    height: z.number().int(),
    detectedMarkerIds: z.array(z.number().int()).readonly(),
    processingMs: z.number().nonnegative(),
    receiveFps: z.number().nonnegative().nullable(),
    source: z.enum(["live", "synthetic"]),
  })
  .readonly();

export const TrackingSnapshotSchema = z
  .object({
    schemaVersion: z.enum(["1.0.0", "1.0.1"]),
    calibration: CalibrationSchema.nullable(),
    uwbAnchor: UwbFixedAnchorSchema.nullable().optional(),
    camera: CameraFrameSchema.nullable(),
    cameraObservations: z.array(PositionObservationSchema).readonly(),
    uwbObservations: z.array(UwbObservationSchema).readonly(),
    updates: z.array(PositionObservationSchema).readonly(),
    receivedFrames: z.number().int().nonnegative(),
    droppedFrames: z.number().int().nonnegative(),
  })
  .readonly();

export type PositionObservation = z.infer<typeof PositionObservationSchema>;
export type TrackingSnapshot = z.infer<typeof TrackingSnapshotSchema>;
export type CameraFrame = z.infer<typeof CameraFrameSchema>;
