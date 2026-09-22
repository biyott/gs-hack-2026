import {
  type Calibration,
  CalibrationSchema,
  type CameraFrame,
  FrameUploadSchema,
  type PositionObservation,
  type TrackedEntity,
  type TrackingSnapshot,
  UwbUploadSchema,
} from "../../../packages/contracts/src/tracking";
import { deriveCameraObservations } from "./camera";
import { detectJpeg } from "./detector";
import { type MarkerPose, TRACKING_STALE_MS, TrackingError } from "./types";
import { deriveUwbObservation, type UwbObservation } from "./uwb";

function ageObservation<T extends PositionObservation>(value: T, now: string): T {
  const ageMs =
    value.lastObservedAt === null
      ? null
      : Math.max(0, Date.parse(now) - Date.parse(value.lastObservedAt));
  if (ageMs !== null && ageMs > TRACKING_STALE_MS) {
    return {
      ...value,
      ageMs,
      status: "stale",
      position: null,
      tablePositionM: null,
      tablePositionCm: null,
      error: "Last observation is older than 1000ms.",
    };
  }
  return { ...value, ageMs };
}

/** Owns the latest per-source state; history persistence belongs to the server runtime. */
export class TrackingService {
  private calibration: Calibration | null = null;
  private camera: CameraFrame | null = null;
  private lastCamera: CameraFrame | null = null;
  private retiredCameraStreams = new Set<string>();
  private jpeg: Buffer | null = null;
  private cameraObservations: readonly PositionObservation[] = [];
  private uwbObservations = new Map<TrackedEntity, UwbObservation>();
  private retiredUwbSessions = new Map<TrackedEntity, Set<string>>();
  private uwbSequences = new Map<
    TrackedEntity,
    { readonly session: string; readonly sequence: number; readonly capturedAt: string }
  >();
  private poses: readonly MarkerPose[] = [];
  private receivedFrames = 0;
  private droppedFrames = 0;
  private processing = false;
  private epoch = 0;

  getSnapshot(now = new Date().toISOString()): TrackingSnapshot {
    const cameraObservations = this.cameraObservations.map((item) => ageObservation(item, now));
    const uwbObservations = [...this.uwbObservations.values()].map((item) =>
      ageObservation(item, now),
    );
    const updates = (["EQUIPMENT-A", "WORKER-A", "WORKER-B"] as const).flatMap((entityId) => {
      const camera = cameraObservations.find((item) => item.entityId === entityId);
      const uwb = uwbObservations.find((item) => item.entityId === entityId);
      const selected =
        camera?.status === "valid" ? camera : uwb?.status === "valid" ? uwb : (camera ?? uwb);
      return selected ? [selected] : [];
    });
    return {
      schemaVersion: "1.0.1",
      calibration: this.calibration,
      camera: this.camera,
      cameraObservations,
      uwbObservations,
      updates,
      receivedFrames: this.receivedFrames,
      droppedFrames: this.droppedFrames,
    };
  }

  setCalibration(raw: unknown): TrackingSnapshot {
    const parsed = CalibrationSchema.parse(raw);
    this.reset(this.calibration?.cameraId === parsed.cameraId);
    this.calibration = parsed;
    this.cameraObservations = deriveCameraObservations([], {
      calibration: parsed,
      capturedAt: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
    }).observations;
    return this.getSnapshot();
  }

  async ingestFrame(
    raw: unknown,
    receivedAt = new Date().toISOString(),
  ): Promise<TrackingSnapshot> {
    const frame = FrameUploadSchema.parse(raw);
    if (this.calibration && frame.cameraId !== this.calibration.cameraId)
      throw new TrackingError(
        "camera-mismatch",
        "Frame camera does not match the calibrated camera.",
      );
    if (Date.parse(frame.capturedAt) > Date.parse(receivedAt))
      throw new TrackingError(
        "invalid-timestamp",
        "Camera capture time must not be later than server receipt; synchronize device clocks.",
      );
    const stream = frame.streamId ?? "default";
    const previousStream = this.lastCamera?.streamId ?? "default";
    const changingStream = this.lastCamera !== null && stream !== previousStream;
    if (
      this.retiredCameraStreams.has(stream) ||
      (this.lastCamera &&
        (Date.parse(frame.capturedAt) < Date.parse(this.lastCamera.capturedAt) ||
          (!changingStream && frame.sequence <= this.lastCamera.sequence))) ||
      Date.parse(receivedAt) - Date.parse(frame.capturedAt) > TRACKING_STALE_MS
    )
      throw new TrackingError(
        "out-of-order",
        "Frame must advance capture time and active stream sequence; retired streams cannot resume.",
      );
    if (this.processing) {
      this.droppedFrames++;
      throw new TrackingError(
        "busy",
        "A frame is already processing; send the next captured frame.",
      );
    }
    this.processing = true;
    const epoch = this.epoch;
    const started = performance.now();
    try {
      const jpeg = Buffer.from(frame.jpegBase64, "base64");
      const decoded = await detectJpeg(jpeg);
      if (epoch !== this.epoch)
        throw new TrackingError(
          "calibration-changed",
          "Calibration or tracking session changed during decoding.",
        );
      const result = deriveCameraObservations(decoded.markers, {
        calibration: this.calibration,
        capturedAt: frame.capturedAt,
        receivedAt,
        inputSource: frame.source,
      });
      this.cameraObservations = result.observations.map((item) => {
        const previous = this.cameraObservations.find((old) => old.entityId === item.entityId);
        return item.lastObservedAt === null
          ? { ...item, lastObservedAt: previous?.lastObservedAt ?? null }
          : item;
      });
      this.poses = result.poses;
      const elapsed = performance.now() - started;
      const interval =
        this.camera === null ? null : Date.parse(receivedAt) - Date.parse(this.camera.receivedAt);
      if (changingStream) this.retiredCameraStreams.add(previousStream);
      this.camera = {
        cameraId: frame.cameraId,
        frameId: frame.frameId ?? `${frame.cameraId}:${stream}:${frame.sequence}`,
        streamId: frame.streamId,
        sequence: frame.sequence,
        capturedAt: frame.capturedAt,
        captureClock: frame.captureClock,
        receivedAt,
        processedAt: new Date(Date.parse(receivedAt) + elapsed).toISOString(),
        width: decoded.width,
        height: decoded.height,
        detectedMarkerIds: decoded.markers.map((marker) => marker.id),
        processingMs: elapsed,
        receiveFps: interval !== null && interval > 0 ? 1000 / interval : null,
        source: frame.source,
      };
      this.jpeg = jpeg;
      this.lastCamera = this.camera;
      this.receivedFrames++;
      return this.getSnapshot(receivedAt);
    } finally {
      this.processing = false;
    }
  }

  ingestUwb(raw: unknown, receivedAt = new Date().toISOString()): TrackingSnapshot {
    const input = UwbUploadSchema.parse(raw);
    const previous = this.uwbSequences.get(input.workerId);
    const session = input.sessionEpoch ?? "default";
    if (Date.parse(input.capturedAt) > Date.parse(receivedAt))
      throw new TrackingError(
        "invalid-timestamp",
        "UWB capture time must not be later than server receipt; synchronize device clocks.",
      );
    if (
      this.retiredUwbSessions.get(input.workerId)?.has(session) ||
      (previous &&
        (Date.parse(input.capturedAt) < Date.parse(previous.capturedAt) ||
          (session === previous.session && input.sequence <= previous.sequence)))
    )
      throw new TrackingError(
        "out-of-order",
        "UWB sequence, capture time and active session must move forward.",
      );
    const observation = deriveUwbObservation(input, {
      calibration: this.calibration,
      poses: this.poses,
      receivedAt,
    });
    if (previous && session !== previous.session) {
      const retired = this.retiredUwbSessions.get(input.workerId) ?? new Set<string>();
      retired.add(previous.session);
      this.retiredUwbSessions.set(input.workerId, retired);
    }
    this.uwbSequences.set(input.workerId, {
      session,
      sequence: input.sequence,
      capturedAt: input.capturedAt,
    });
    this.uwbObservations.set(input.workerId, observation);
    return this.getSnapshot(receivedAt);
  }

  getLatestJpeg(): Buffer | null {
    return this.jpeg;
  }

  invalidatePendingFrames(): void {
    this.epoch++;
  }

  reset(preserveOrdering = false): void {
    this.invalidatePendingFrames();
    this.camera = null;
    if (!preserveOrdering) {
      this.lastCamera = null;
      this.retiredCameraStreams.clear();
      this.uwbSequences.clear();
      this.retiredUwbSessions.clear();
    }
    this.jpeg = null;
    this.poses = [];
    this.cameraObservations = [];
    this.uwbObservations.clear();
    this.receivedFrames = 0;
    this.droppedFrames = 0;
  }
}
