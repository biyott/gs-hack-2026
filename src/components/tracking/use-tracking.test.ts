import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { trackingApi } from "@/client/tracking-api";
import {
  type Calibration,
  type SessionRole,
  type TrackingSnapshot,
  TrackingSnapshotSchema,
} from "@/contracts";
import { canReadTracking } from "./tracking-access";
import { createTrackingSession, type TrackingView } from "./use-tracking";

const snapshot = TrackingSnapshotSchema.parse({
  schemaVersion: "1.0.1",
  calibration: null,
  camera: null,
  cameraObservations: [],
  uwbObservations: [],
  updates: [],
  receivedFrames: 7,
  droppedFrames: 0,
});
const calibration: Calibration = {
  version: "test",
  cameraId: "CAM-1",
  camera: null,
  markers: (["EQUIPMENT-A", "WORKER-A", "WORKER-B"] as const).map((entityId, index) => ({
    markerId: index + 10,
    entityId,
    heightM: 0,
    antennaHeightM: 0,
    markerToReferenceM: { x: 0, y: 0 },
    markerToAntennaM: { x: 0, y: 0 },
  })),
  uwbYawRad: null,
  evaluationErrorM: null,
};

function deferred<T>() {
  let resolve: (value: T) => void = () => {
    throw new Error("Promise not initialized");
  };
  let reject: (reason: Error) => void = () => {
    throw new Error("Promise not initialized");
  };
  const promise = new Promise<T>((accept, fail) => {
    resolve = accept;
    reject = fail;
  });
  return { promise, resolve, reject };
}

function harness() {
  const states: TrackingView[] = [];
  const saved = vi.fn();
  const session = createTrackingSession((state) => states.push(state), saved);
  return { states, saved, session };
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("tracking authorization lifecycle", () => {
  it.each(["admin", "operator", "support", "observer"] satisfies SessionRole[])(
    "preserves raw snapshot polling for console role %s",
    async (role) => {
      const read = vi.spyOn(trackingApi, "snapshot").mockResolvedValue(snapshot);
      const { session, states } = harness();
      session.start(canReadTracking(role));
      await vi.advanceTimersByTimeAsync(200);
      expect(read).toHaveBeenCalledTimes(2);
      expect(states.at(-1)).toMatchObject({ snapshot, error: null, connected: true });
      session.stop();
    },
  );

  it("does not poll or save calibration when initially disabled", async () => {
    const read = vi.spyOn(trackingApi, "snapshot").mockResolvedValue(snapshot);
    const save = vi.spyOn(trackingApi, "calibrate").mockResolvedValue(snapshot);
    const { session, states } = harness();
    session.start(false);
    await session.saveCalibration(calibration);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(read).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
    expect(states.at(-1)).toMatchObject({ snapshot: null, error: null, connected: false });
    expect(vi.getTimerCount()).toBe(0);
  });

  it("clears privileged data and aborts pending polling on disable", async () => {
    const pending = deferred<TrackingSnapshot>();
    const read = vi
      .spyOn(trackingApi, "snapshot")
      .mockResolvedValueOnce(snapshot)
      .mockReturnValue(pending.promise);
    const { session, states } = harness();
    session.start(true);
    await vi.advanceTimersByTimeAsync(200);
    expect(states.at(-1)?.snapshot).toEqual(snapshot);
    session.start(false);
    expect(read.mock.calls[1]?.[0].aborted).toBe(true);
    expect(states.at(-1)).toMatchObject({ snapshot: null, error: null, connected: false });
    pending.resolve(snapshot);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(states.at(-1)).toMatchObject({ snapshot: null, error: null, connected: false });
    expect(read).toHaveBeenCalledTimes(2);
  });

  it("silently discards a rejected request after disable", async () => {
    const pending = deferred<TrackingSnapshot>();
    vi.spyOn(trackingApi, "snapshot").mockReturnValue(pending.promise);
    const { session, states } = harness();
    session.start(true);
    session.start(false);
    pending.reject(new Error("Aborted after role downgrade"));
    await vi.advanceTimersByTimeAsync(0);
    expect(states.at(-1)).toMatchObject({ snapshot: null, error: null, connected: false });
  });

  it("discards a calibration completion from an earlier authorized session", async () => {
    vi.spyOn(trackingApi, "snapshot").mockResolvedValue(snapshot);
    const pending = deferred<TrackingSnapshot>();
    vi.spyOn(trackingApi, "calibrate").mockReturnValue(pending.promise);
    const { session, states, saved } = harness();
    session.start(true);
    await vi.advanceTimersByTimeAsync(0);
    const saving = session.saveCalibration(calibration);
    session.start(false);
    pending.resolve(snapshot);
    await saving;
    expect(states.at(-1)).toMatchObject({ snapshot: null, error: null, connected: false });
    expect(saved).not.toHaveBeenCalled();
  });

  it("publishes only the fresh request when access is re-enabled", async () => {
    const old = deferred<TrackingSnapshot>();
    const fresh = { ...snapshot, receivedFrames: 8 };
    vi.spyOn(trackingApi, "snapshot").mockReturnValueOnce(old.promise).mockResolvedValue(fresh);
    const { session, states } = harness();
    session.start(true);
    session.start(false);
    session.start(true);
    await vi.advanceTimersByTimeAsync(0);
    old.resolve(snapshot);
    await vi.advanceTimersByTimeAsync(0);
    expect(states.at(-1)).toMatchObject({ snapshot: fresh, error: null, connected: true });
    session.stop();
  });

  it("does not overwrite a new session with an older calibration completion", async () => {
    const fresh = { ...snapshot, receivedFrames: 9 };
    vi.spyOn(trackingApi, "snapshot").mockResolvedValue(fresh);
    const pending = deferred<TrackingSnapshot>();
    vi.spyOn(trackingApi, "calibrate").mockReturnValue(pending.promise);
    const { session, states, saved } = harness();
    session.start(true);
    const saving = session.saveCalibration(calibration);
    session.start(false);
    session.start(true);
    await vi.advanceTimersByTimeAsync(0);
    pending.resolve(snapshot);
    await saving;
    expect(states.at(-1)).toMatchObject({ snapshot: fresh, error: null, connected: true });
    expect(saved).not.toHaveBeenCalled();
    session.stop();
  });

  it("publishes a successful calibration while the same session remains enabled", async () => {
    const calibrated = { ...snapshot, calibration };
    vi.spyOn(trackingApi, "snapshot").mockResolvedValue(snapshot);
    vi.spyOn(trackingApi, "calibrate").mockResolvedValue(calibrated);
    const { session, states, saved } = harness();
    session.start(true);
    await session.saveCalibration(calibration);
    expect(states.at(-1)).toMatchObject({ snapshot: calibrated, error: null, connected: true });
    expect(saved).toHaveBeenCalledOnce();
    session.stop();
  });

  it("keeps polling serialized at 200ms while enabled", async () => {
    const pending = deferred<TrackingSnapshot>();
    const read = vi.spyOn(trackingApi, "snapshot").mockReturnValue(pending.promise);
    const { session } = harness();
    session.start(true);
    await vi.advanceTimersByTimeAsync(600);
    expect(read).toHaveBeenCalledTimes(1);
    pending.resolve(snapshot);
    await vi.advanceTimersByTimeAsync(200);
    expect(read).toHaveBeenCalledTimes(2);
    session.stop();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("fixed UWB anchor updates", () => {
  it("supersedes an older pending poll when the anchor is applied", async () => {
    // Given an in-flight poll without a fixed anchor.
    const pending = deferred<TrackingSnapshot>();
    const configured = {
      ...snapshot,
      uwbAnchor: {
        version: "fixed-note20",
        positionTableM: { x: 0, y: 0.25 },
        headingRad: 0,
        antennaHeightM: 0,
        workerAntennaHeightsM: { "WORKER-A": 0, "WORKER-B": 0 },
      },
    };
    vi.spyOn(trackingApi, "snapshot").mockReturnValue(pending.promise);
    vi.spyOn(trackingApi, "saveUwbAnchor").mockResolvedValue(configured);
    const { session, states, saved } = harness();
    session.start(true);
    // When the new anchor is saved and the old poll completes afterward.
    await session.saveUwbAnchor(configured.uwbAnchor);
    pending.resolve(snapshot);
    await vi.advanceTimersByTimeAsync(0);
    // Then the old response cannot remove the applied configuration.
    expect(states.at(-1)?.snapshot?.uwbAnchor).toEqual(configured.uwbAnchor);
    expect(saved).toHaveBeenCalledOnce();
    session.stop();
  });

  it("publishes the server snapshot when the fixed anchor is cleared", async () => {
    // Given an authorized tracking session and the clear response.
    vi.spyOn(trackingApi, "snapshot").mockResolvedValue(snapshot);
    const save = vi.spyOn(trackingApi, "saveUwbAnchor").mockResolvedValue(snapshot);
    const { session, states } = harness();
    session.start(true);
    // When the operator clears the anchor.
    await session.saveUwbAnchor(null);
    // Then null crosses the API and the response replaces the local snapshot.
    expect(save).toHaveBeenCalledWith(null);
    expect(states.at(-1)?.snapshot).toEqual(snapshot);
    session.stop();
  });

  it("does not save an anchor while tracking access is disabled", async () => {
    // Given a disabled tracking session.
    const save = vi.spyOn(trackingApi, "saveUwbAnchor").mockResolvedValue(snapshot);
    const { session } = harness();
    session.start(false);
    // When a stale form attempts to clear the anchor.
    await session.saveUwbAnchor(null);
    // Then no request is sent.
    expect(save).not.toHaveBeenCalled();
  });

  it("discards a pending anchor response after access is revoked", async () => {
    // Given an authorized save that has not yet completed.
    vi.spyOn(trackingApi, "snapshot").mockResolvedValue(snapshot);
    const pending = deferred<TrackingSnapshot>();
    vi.spyOn(trackingApi, "saveUwbAnchor").mockReturnValue(pending.promise);
    const { session, states, saved } = harness();
    session.start(true);
    const saving = session.saveUwbAnchor(null);
    session.start(false);
    // When that request eventually completes.
    pending.resolve(snapshot);
    await saving;
    // Then privileged state and the refresh callback remain cleared.
    expect(states.at(-1)?.snapshot).toBeNull();
    expect(saved).not.toHaveBeenCalled();
  });
});

describe("fixed UWB anchor save failures", () => {
  it("propagates a failed save to the form without replacing the current snapshot", async () => {
    // Given a connected session and a rejected configuration request.
    vi.spyOn(trackingApi, "snapshot").mockResolvedValue(snapshot);
    const failure = new Error("Configuration request failed");
    vi.spyOn(trackingApi, "saveUwbAnchor").mockRejectedValue(failure);
    const { session, states, saved } = harness();
    session.start(true);
    await vi.advanceTimersByTimeAsync(0);
    // When saving fails.
    await expect(session.saveUwbAnchor(null)).rejects.toBe(failure);
    // Then the caller can show the error and no success refresh is emitted.
    expect(states.at(-1)?.snapshot).toEqual(snapshot);
    expect(saved).not.toHaveBeenCalled();
    session.stop();
  });
});
