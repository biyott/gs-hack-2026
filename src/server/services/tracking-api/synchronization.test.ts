import { describe, expect, it, vi } from "vitest";
import type { PositionObservation } from "@/contracts";
import { TrackingSnapshotSchema } from "@/contracts";
import { synchronizeTracking } from "../../simulation/tracking";
import { getTrackingServices } from "../tracking";
import { runtimeFixture as createRuntimeFixture } from "./fixtures";

function runtimeFixture() {
  const runtime = createRuntimeFixture();
  for (const run of runtime.runs.values()) {
    const translating = run.configuration.equipment.find((preset) => preset.controls.translation);
    run.snapshot = {
      ...run.snapshot,
      run: { ...run.snapshot.run, positionInput: "measured" },
      equipment: {
        ...run.snapshot.equipment,
        presetId: translating?.id ?? run.snapshot.equipment.presetId,
      },
    };
  }
  return runtime;
}

const observation: PositionObservation = {
  entityId: "WORKER-A",
  inputSource: "synthetic",
  source: "camera-marker",
  status: "valid",
  position: { x: 12, y: 20, z: 0 },
  tablePositionM: { x: 0.12, y: 0.2 },
  tablePositionCm: { x: 12, y: 20 },
  lastObservedAt: "2026-01-01T00:00:00Z",
  receivedAt: "2026-01-01T00:00:00Z",
  ageMs: 0,
  uncertaintyTableM: null,
  uncertaintyWorldM: null,
  error: null,
};

describe("tracking into independent simulation snapshots", () => {
  it("updates measured coordinates in both modes without sharing run identities", () => {
    // Given two independent runs and one valid camera marker observation.
    const runtime = runtimeFixture();
    const snapshot = { ...getTrackingServices().tracking.getSnapshot(), updates: [observation] };
    // When ingesting measured tracking state.
    synchronizeTracking(snapshot);
    // Then each mode receives the measured position while retaining its own run.
    const equipment = runtime.getRun("equipment").snapshot;
    const fire = runtime.getRun("fire-gas").snapshot;
    for (const run of [equipment, fire]) {
      expect(run.workers.find((worker) => worker.workerId === "WORKER-A")).toMatchObject({
        position: { x: 12, y: 20, z: 0 },
        positionSource: "video",
        positionStatus: "known",
      });
    }
    expect(equipment.run.runId).not.toBe(fire.run.runId);
  });

  it("clears stale worker positions instead of borrowing simulated coordinates", () => {
    // Given a previously known worker and a stale measurement with a last-observed time.
    const runtime = runtimeFixture();
    const snapshot = {
      ...getTrackingServices().tracking.getSnapshot(),
      updates: [{ ...observation, status: "stale", position: null }],
    };
    // When applying the unavailable measurement.
    synchronizeTracking(TrackingSnapshotSchema.parse(snapshot));
    // Then the worker remains explicitly stale with no fabricated coordinate.
    expect(
      runtime.getRun("equipment").snapshot.workers.find((worker) => worker.workerId === "WORKER-A"),
    ).toMatchObject({
      position: null,
      positionSource: "video",
      positionStatus: "stale",
      lastObservedAt: observation.lastObservedAt,
    });
  });

  it("marks equipment unavailable while retaining its last coordinate for the nonnullable contract", () => {
    // Given equipment with an existing coordinate and an invalid camera observation.
    const runtime = runtimeFixture();
    const previous = runtime.getRun("equipment").snapshot.equipment.position;
    const snapshot = TrackingSnapshotSchema.parse({
      ...getTrackingServices().tracking.getSnapshot(),
      updates: [{ ...observation, entityId: "EQUIPMENT-A", status: "occluded", position: null }],
    });
    // When applying the camera loss.
    synchronizeTracking(snapshot);
    // Then the position's availability is explicit and no replacement XY is invented.
    expect(runtime.getRun("equipment").snapshot.equipment).toMatchObject({
      position: previous,
      positionStatus: "unknown",
      positionSource: "video",
    });
  });

  it.each([
    { uncertaintyMs: 50, expected: 25 },
    { uncertaintyMs: 51, expected: null },
  ])(
    "sets camera latency only within the clock uncertainty bound: $uncertaintyMs ms",
    ({ uncertaintyMs, expected }) => {
      // Given a camera frame with its explicit synchronization uncertainty.
      const runtime = runtimeFixture();
      const snapshot = TrackingSnapshotSchema.parse({
        ...getTrackingServices().tracking.getSnapshot(),
        camera: {
          cameraId: "CCTV-01",
          frameId: "frame-1",
          sequence: 1,
          capturedAt: observation.lastObservedAt,
          receivedAt: "2026-01-01T00:00:00.010Z",
          processedAt: "2026-01-01T00:00:00.025Z",
          width: 32,
          height: 32,
          detectedMarkerIds: [],
          processingMs: 15,
          receiveFps: 5,
          source: "live",
          captureClock: {
            deviceCapturedAt: observation.lastObservedAt,
            offsetMs: 0,
            uncertaintyMs,
            synchronizedAt: observation.lastObservedAt,
          },
        },
      });
      // When applying the processed frame metadata.
      synchronizeTracking(snapshot);
      // Then latency is available only when the timestamp uncertainty permits it.
      expect(runtime.getRun("equipment").snapshot.cctv[0]).toMatchObject({
        status: "connected",
        source: "live",
        receivedFps: 5,
        latencyMs: expected,
      });
    },
  );

  it("publishes a 10 Hz jitter stream without creating new primary guidance or geometry versions", () => {
    // Given a measurement that already produced any required safety transition.
    const runtime = runtimeFixture();
    const run = runtime.getRun("equipment");
    run.snapshot = { ...run.snapshot, run: { ...run.snapshot.run, status: "running" } };
    const snapshot = { ...getTrackingServices().tracking.getSnapshot(), updates: [observation] };
    synchronizeTracking(snapshot);
    const version = runtime.getRun("equipment").snapshot.run.version;
    const geometryVersion = run.snapshot.equipment.geometryVersion;
    const guidanceVersions = run.snapshot.workers.map(
      (worker) => worker.currentGuidance?.guidanceVersion,
    );
    // When ten sub-centimetre jitter measurements arrive with distinct capture times.
    for (let index = 1; index <= 10; index++) {
      const capturedAt = new Date(Date.parse(observation.receivedAt) + index * 100).toISOString();
      vi.setSystemTime(new Date(capturedAt));
      synchronizeTracking({
        ...snapshot,
        updates: [
          {
            ...observation,
            position: { x: 12 + index / 1000, y: 20, z: 0 },
            lastObservedAt: capturedAt,
            receivedAt: capturedAt,
          },
        ],
      });
    }
    // Then high-frequency position refreshes do not append run history.
    expect(runtime.getRun("equipment").snapshot.run.version).toBe(version);
    expect(run.snapshot.equipment.geometryVersion).toBe(geometryVersion);
    expect(run.snapshot.workers.map((worker) => worker.currentGuidance?.guidanceVersion)).toEqual(
      guidanceVersions,
    );
  });

  it.each(["idle", "paused", "completed"] as const)(
    "updates facts without evaluating a %s run",
    (status) => {
      // Given a run that must not advance its safety workflow.
      const runtime = runtimeFixture();
      const run = runtime.getRun("equipment");
      run.snapshot = { ...run.snapshot, run: { ...run.snapshot.run, status } };
      const snapshot = { ...getTrackingServices().tracking.getSnapshot(), updates: [observation] };
      // When a measured position arrives.
      synchronizeTracking(snapshot);
      // Then facts refresh while the prior workflow remains unchanged.
      expect(run.snapshot.run.status).toBe(status);
      expect(run.snapshot.hazards).toEqual([]);
      expect(run.snapshot.incidents).toEqual([]);
      expect(run.snapshot.workers.every((worker) => worker.currentGuidance === null)).toBe(true);
      expect(runtime.getRun("fire-gas").snapshot.incidents).toEqual([]);
    },
  );
});
