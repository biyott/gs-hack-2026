import assert from "node:assert/strict";
import { describe, expect, it, vi } from "vitest";
import { TrackingSnapshotSchema } from "@/contracts";
import { POST as uploadUwb } from "../../../../app/api/tracking/uwb/route";
import { POST as setAnchor } from "../../../../app/api/tracking/uwb-anchor/route";
import { synchronizeTracking } from "../../simulation/tracking";
import { getTrackingServices } from "../tracking";
import { preparePairing, request, runtimeFixture } from "./fixtures";

const anchor = {
  version: "fixed-note20-1",
  positionTableM: { x: 0.35, y: 0.25 },
  headingRad: 0,
  antennaHeightM: 0.1,
  workerAntennaHeightsM: { "WORKER-A": 0.1, "WORKER-B": 0.1 },
} as const;
const capturedAt = "2026-01-01T00:00:00.000Z";
const measurement = {
  deviceId: "fixed-note20",
  workerId: "WORKER-A",
  capturedAt,
  sequence: 1,
  distanceM: 0.3,
  azimuthRad: 0,
  elevationRad: null,
  uncertaintyM: 0.01,
} as const;

function measuredRuntime(equipmentMovable = true) {
  const runtime = runtimeFixture();
  for (const run of runtime.runs.values()) {
    const preset = run.configuration.equipment.find(
      (candidate) => candidate.controls.translation === equipmentMovable,
    );
    assert.ok(preset);
    run.snapshot = {
      ...run.snapshot,
      run: { ...run.snapshot.run, positionInput: "measured" },
      equipment: { ...run.snapshot.equipment, presetId: preset.id },
    };
  }
  return runtime;
}

describe("fixed UWB anchor projection", () => {
  it.each([true, false])(
    "marks only the manually fixed equipment known when translation is %s",
    (equipmentMovable) => {
      // Given measured runs without camera frames or live ranges.
      const runtime = measuredRuntime(equipmentMovable);
      // When the equipment antenna origin is explicitly fixed.
      const snapshot = getTrackingServices().tracking.setUwbAnchor(anchor);
      synchronizeTracking(snapshot);
      // Then manual equipment provenance remains separate from absent worker measurements.
      expect(TrackingSnapshotSchema.parse(snapshot).uwbAnchor).toEqual(anchor);
      for (const run of runtime.runs.values()) {
        expect(run.snapshot.equipment).toMatchObject({
          position: { x: 35, y: 25 },
          positionSource: "manual",
          positionInputSource: "synthetic",
          positionStatus: "known",
          lastObservedAt: null,
        });
        expect(run.snapshot.workers.map((worker) => worker.position)).toEqual([null, null]);
        expect(run.snapshot.workers.map((worker) => worker.positionStatus)).toEqual([
          "unknown",
          "unknown",
        ]);
      }
    },
  );

  it.each([true, false])("clears manually fixed equipment when translation is %s", (movable) => {
    // Given previously visible manual equipment in measured mode.
    const runtime = measuredRuntime(movable);
    const tracking = getTrackingServices().tracking;
    synchronizeTracking(tracking.setUwbAnchor(anchor));
    // When the operator removes the anchor with no camera fallback.
    synchronizeTracking(tracking.setUwbAnchor(null));
    // Then the retained nonnullable equipment coordinate is explicitly unavailable.
    for (const run of runtime.runs.values())
      expect(run.snapshot.equipment.positionStatus).toBe("unknown");
  });

  it("keeps cleared nonmovable equipment unknown on the next empty synchronization", () => {
    // Given a fixed preset whose manual anchor has already been removed.
    const runtime = measuredRuntime(false);
    const tracking = getTrackingServices().tracking;
    synchronizeTracking(tracking.setUwbAnchor(anchor));
    synchronizeTracking(tracking.setUwbAnchor(null));
    const empty = TrackingSnapshotSchema.parse({
      ...tracking.getSnapshot(),
      camera: null,
      cameraObservations: [],
      uwbObservations: [],
      updates: [],
    });
    // When a later refresh has no replacement sensor observation.
    synchronizeTracking(empty);
    // Then the old fixed preset cannot silently restore a known synthetic location.
    for (const run of runtime.runs.values())
      expect(run.snapshot.equipment.positionStatus).toBe("unknown");
  });

  it("projects fresh equipment-authenticated range and angle without any camera", async () => {
    // Given a fixed origin and a ready authenticated UWB session.
    const runtime = measuredRuntime();
    const tracking = getTrackingServices().tracking;
    synchronizeTracking(tracking.setUwbAnchor(anchor));
    const sessionEpoch = preparePairing();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.100Z"));
    // When native equipment uploads a fresh range and azimuth.
    const response = await uploadUwb(
      request("equipment", "/api/tracking/uwb", {
        ...measurement,
        capturedAt: new Date().toISOString(),
        sessionEpoch,
      }),
    );
    // Then both measured maps show live worker coordinates with no camera dependency.
    expect(response.status).toBe(204);
    expect(tracking.getSnapshot().camera).toBeNull();
    for (const run of runtime.runs.values())
      expect(run.snapshot.workers.find((worker) => worker.workerId === "WORKER-A")).toMatchObject({
        position: { x: expect.closeTo(65), y: expect.closeTo(25), z: 0 },
        positionSource: "uwb",
        positionInputSource: "live",
        positionStatus: "known",
      });
  });

  it.each([
    { label: "replayed sequence", sequence: 1, capturedAt: "2026-01-01T00:00:00.200Z" },
    { label: "pre-anchor capture", sequence: 2, capturedAt: "2026-01-01T00:00:00.100Z" },
  ])("rejects $label after the anchor changes", async (delayed) => {
    // Given an accepted live measurement followed by a changed anchor.
    measuredRuntime();
    const tracking = getTrackingServices().tracking;
    tracking.setUwbAnchor(anchor);
    const sessionEpoch = preparePairing();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.100Z"));
    const accepted = await uploadUwb(
      request("equipment", "/api/tracking/uwb", {
        ...measurement,
        capturedAt: new Date().toISOString(),
        sessionEpoch,
      }),
    );
    expect(accepted.status).toBe(204);
    vi.setSystemTime(new Date("2026-01-01T00:00:00.200Z"));
    tracking.setUwbAnchor({ ...anchor, version: "fixed-note20-2", headingRad: Math.PI / 2 });
    // When a callback from before the anchor change or an already used sequence arrives.
    const response = await uploadUwb(
      request("equipment", "/api/tracking/uwb", { ...measurement, ...delayed, sessionEpoch }),
    );
    // Then the delayed measurement cannot become a live coordinate at the new origin.
    expect(response.status).toBe(409);
    expect(tracking.getSnapshot().uwbObservations.some((item) => item.status === "valid")).toBe(
      false,
    );
  });
});

describe("fixed UWB anchor API", () => {
  it("preserves scenario poses and run state when an anchor is saved", async () => {
    // Given independent runs still using their scenario positions.
    const runtime = runtimeFixture();
    const before = [...runtime.runs.values()].map(({ snapshot }) => structuredClone(snapshot));
    for (const snapshot of before) expect(snapshot.run.positionInput).toBe("scenario");
    // When the operator saves a fixed sensor origin.
    const response = await setAnchor(request("operator", "/api/tracking/uwb-anchor", { anchor }));
    // Then only measured mode can adopt that origin; scenario facts remain exact.
    expect(response.status).toBe(200);
    for (const snapshot of before) {
      const after = runtime.getRun(snapshot.mode).snapshot;
      expect(after.run).toEqual(snapshot.run);
      expect(after.equipment).toEqual(snapshot.equipment);
      expect(after.workers).toEqual(snapshot.workers);
    }
  });

  it.each(["admin", "operator"])("allows %s to publish a fixed anchor", async (actor) => {
    // Given measured maps and an authorized console credential.
    const runtime = measuredRuntime();
    // When the console saves the antenna origin through the route.
    const response = await setAnchor(request(actor, "/api/tracking/uwb-anchor", { anchor }));
    // Then the contract exposes the anchor and the simulation receives it immediately.
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(TrackingSnapshotSchema.parse(await response.json()).uwbAnchor).toEqual(anchor);
    expect(runtime.getRun("equipment").snapshot.equipment).toMatchObject({
      position: { x: 35, y: 25 },
      positionSource: "manual",
      positionStatus: "known",
    });
  });

  it.each(["worker-a", "worker-b", "equipment", "cctv", "observer", "support"])(
    "denies fixed anchor changes by %s",
    async (actor) => {
      // Given a nonoperator credential attempting a calibration change.
      const incoming = request(actor, "/api/tracking/uwb-anchor", { anchor });
      // When submitting an otherwise valid fixed antenna origin.
      const response = await setAnchor(incoming);
      // Then authorization prevents any new tracking reference.
      expect(response.status).toBe(403);
      expect(getTrackingServices().tracking.getSnapshot().uwbAnchor).toBeNull();
    },
  );

  it("rejects an unauthenticated anchor change", async () => {
    // Given a valid anchor without a credential.
    const incoming = request(null, "/api/tracking/uwb-anchor", { anchor });
    // When submitting the reference.
    const response = await setAnchor(incoming);
    // Then authentication is required.
    expect(response.status).toBe(401);
  });

  it.each([
    { positionTableM: { x: -0.01, y: 0.25 } },
    { positionTableM: { x: 1.41, y: 0.25 } },
    { positionTableM: { x: 0.35, y: 0.51 } },
    { headingRad: Math.PI + 0.01 },
    { antennaHeightM: -0.01 },
    { workerAntennaHeightsM: { "WORKER-A": 3.01, "WORKER-B": 0.1 } },
  ])("rejects out-of-bounds anchor fields: %j", async (invalid) => {
    // Given an authorized operator and physically out-of-contract reference geometry.
    const incoming = request("operator", "/api/tracking/uwb-anchor", {
      anchor: { ...anchor, ...invalid },
    });
    // When the invalid calibration is submitted.
    const response = await setAnchor(incoming);
    // Then validation rejects it before storing an anchor.
    expect(response.status).toBe(400);
    expect(getTrackingServices().tracking.getSnapshot().uwbAnchor).toBeNull();
  });

  it("clears an anchor and its equipment projection through the route", async () => {
    // Given a manually fixed equipment position in a measured map.
    const runtime = measuredRuntime();
    synchronizeTracking(getTrackingServices().tracking.setUwbAnchor(anchor));
    // When the operator explicitly removes the anchor.
    const response = await setAnchor(
      request("operator", "/api/tracking/uwb-anchor", { anchor: null }),
    );
    // Then the response and map both remove the manual position's availability.
    expect(response.status).toBe(200);
    expect(TrackingSnapshotSchema.parse(await response.json()).uwbAnchor).toBeNull();
    expect(runtime.getRun("equipment").snapshot.equipment.positionStatus).toBe("unknown");
  });

  it("rejects cross-origin browser anchor changes", async () => {
    // Given a valid operator cookie used by another browser origin.
    const incoming = request("operator", "/api/tracking/uwb-anchor", { anchor });
    const token = incoming.headers.get("authorization")?.slice(7);
    incoming.headers.delete("authorization");
    incoming.headers.set("cookie", `gs_safety_session=${token}`);
    incoming.headers.set("origin", "https://untrusted.example");
    // When the browser submits the calibration.
    const response = await setAnchor(incoming);
    // Then same-origin enforcement prevents the mutation.
    expect(response.status).toBe(403);
    expect(getTrackingServices().tracking.getSnapshot().uwbAnchor).toBeNull();
  });
});
