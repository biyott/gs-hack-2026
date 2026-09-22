import { describe, expect, it, vi } from "vitest";
import type { UwbFixedAnchor } from "@/contracts";
import example from "../../../../tools/calibration/example-calibration.json";
import { createTrackingFixture } from "../../../../tools/calibration/fixtures";
import { refreshTrackingAge, synchronizeTracking } from "../../simulation/tracking";
import { getTrackingServices } from "../tracking";
import { runtimeFixture } from "./fixtures";

const anchor: UwbFixedAnchor = {
  version: "fixed-note20",
  positionTableM: { x: 0.3, y: 0.25 },
  headingRad: 0,
  antennaHeightM: 0.1,
  workerAntennaHeightsM: { "WORKER-A": 0.1, "WORKER-B": 0.1 },
};

describe("fixed UWB reference and camera independence", () => {
  it.each([
    { cameraStatus: "uncalibrated", movable: false },
    { cameraStatus: "stale", movable: false },
    { cameraStatus: "stale", movable: true },
  ])(
    "keeps cleared equipment unavailable with $cameraStatus camera and translation $movable",
    async ({ cameraStatus, movable }) => {
      // Given a fixed preset and camera metadata that cannot provide a current position.
      const runtime = runtimeFixture();
      for (const run of runtime.runs.values()) {
        const preset = run.configuration.equipment.find(
          (item) => item.controls.translation === movable,
        );
        run.snapshot = {
          ...run.snapshot,
          run: { ...run.snapshot.run, positionInput: "measured" },
          equipment: { ...run.snapshot.equipment, presetId: preset?.id ?? "missing" },
        };
      }
      const tracking = getTrackingServices().tracking;
      tracking.setCalibration(example);
      if (cameraStatus === "stale") {
        await tracking.ingestFrame({
          cameraId: example.cameraId,
          sequence: 1,
          capturedAt: new Date().toISOString(),
          source: "synthetic",
          jpegBase64: (await createTrackingFixture()).toString("base64"),
        });
      }
      synchronizeTracking(tracking.setUwbAnchor(anchor));
      vi.setSystemTime(new Date(Date.now() + 1001));
      synchronizeTracking(tracking.setUwbAnchor(null));
      // When a subsequent tracking update still has no valid replacement camera position.
      synchronizeTracking(tracking.getSnapshot());
      // Then the removed manual coordinate cannot return as a known synthetic preset position.
      for (const run of runtime.runs.values())
        expect(run.snapshot.equipment).toMatchObject({
          positionSource: "manual",
          positionInputSource: "unknown",
          positionStatus: "unknown",
          lastObservedAt: null,
        });
      const publish = vi.spyOn(runtime, "publishTransient");
      refreshTrackingAge();
      expect(publish).not.toHaveBeenCalled();
      publish.mockRestore();
    },
  );

  it.each([
    { azimuthRad: 0, elapsedMs: 0, status: "valid" },
    { azimuthRad: null, elapsedMs: 0, status: "distance-only" },
    { azimuthRad: 0, elapsedMs: 1001, status: "stale" },
  ])("keeps $status UWB authoritative despite a valid synthetic camera", async (sample) => {
    // Given competing synthetic camera positions and an explicitly fixed UWB reference.
    const tracking = getTrackingServices().tracking;
    tracking.setCalibration(example);
    tracking.setUwbAnchor(anchor);
    const capturedAt = new Date().toISOString();
    tracking.ingestUwb({
      deviceId: "fixed-note20",
      workerId: "WORKER-A",
      source: "live",
      sequence: 1,
      capturedAt,
      distanceM: 0.5,
      azimuthRad: sample.azimuthRad,
      elevationRad: null,
      uncertaintyM: null,
    });
    vi.setSystemTime(new Date(Date.now() + sample.elapsedMs));
    // When a valid camera image arrives while UWB is valid, incomplete, or stale.
    const snapshot = await tracking.ingestFrame({
      cameraId: example.cameraId,
      sequence: 1,
      capturedAt: new Date().toISOString(),
      source: "synthetic",
      jpegBase64: (await createTrackingFixture()).toString("base64"),
    });
    // Then the selected worker remains UWB-only instead of silently borrowing image coordinates.
    expect(snapshot.cameraObservations.find((item) => item.entityId === "WORKER-A")?.status).toBe(
      "valid",
    );
    expect(snapshot.updates.find((item) => item.entityId === "WORKER-A")).toMatchObject({
      source: "uwb",
      inputSource: "live",
      status: sample.status,
      position: sample.status === "valid" ? { x: 80, y: 25, z: 0 } : null,
    });
  });

  it("does not repeatedly publish a manual origin because an unused camera observation is stale", async () => {
    // Given measured runs with a fixed origin and an older camera observation.
    const runtime = runtimeFixture();
    for (const run of runtime.runs.values()) {
      const translating = run.configuration.equipment.find((preset) => preset.controls.translation);
      run.snapshot = {
        ...run.snapshot,
        run: { ...run.snapshot.run, positionInput: "measured" },
        equipment: { ...run.snapshot.equipment, presetId: translating?.id ?? "missing" },
      };
    }
    const tracking = getTrackingServices().tracking;
    tracking.setCalibration(example);
    await tracking.ingestFrame({
      cameraId: example.cameraId,
      sequence: 1,
      capturedAt: new Date().toISOString(),
      source: "synthetic",
      jpegBase64: (await createTrackingFixture()).toString("base64"),
    });
    synchronizeTracking(tracking.setUwbAnchor(anchor));
    vi.setSystemTime(new Date(Date.now() + 1001));
    refreshTrackingAge();
    const publish = vi.spyOn(runtime, "publishTransient");
    // When polling again after stale camera metadata was already projected.
    refreshTrackingAge();
    // Then an explicitly fixed equipment coordinate does not trigger redundant publications.
    expect(publish).not.toHaveBeenCalled();
    expect(runtime.getRun("equipment").snapshot.equipment.positionSource).toBe("manual");
    publish.mockRestore();
  });
});
