import { describe, expect, it } from "vitest";
import { POST as uploadUwb } from "../../../../app/api/tracking/uwb/route";
import { getTrackingServices } from "../tracking";
import { preparePairing, request, runtimeFixture } from "./fixtures";

const measurement = {
  deviceId: "equipment-phone",
  workerId: "WORKER-A",
  capturedAt: "2026-01-01T00:00:00Z",
  sequence: 1,
  distanceM: 0.35,
  azimuthRad: null,
  elevationRad: null,
  uncertaintyM: null,
} as const;

describe("live UWB pairing epoch authorization", () => {
  it("rejects a live range before participant preparation is complete", async () => {
    // Given an equipment credential without a ready multicast session.
    runtimeFixture();
    const incoming = request("equipment", "/api/tracking/uwb", {
      ...measurement,
      sessionEpoch: "unprepared",
    });
    // When attempting to upload a native range.
    const response = await uploadUwb(incoming);
    // Then the range cannot enter tracking state.
    expect(response.status).toBe(409);
    expect(getTrackingServices().tracking.getSnapshot().uwbObservations).toEqual([]);
  });

  it.each([undefined, "another-epoch"])(
    "rejects a ready participant's missing or mismatched epoch: %s",
    async (sessionEpoch) => {
      // Given a ready epoch and equipment submitting an unrelated epoch.
      runtimeFixture();
      preparePairing();
      const incoming = request("equipment", "/api/tracking/uwb", { ...measurement, sessionEpoch });
      // When uploading that native range.
      const response = await uploadUwb(incoming);
      // Then stale or unbound native scopes cannot contribute positions.
      expect(response.status).toBe(409);
    },
  );

  it("rejects ranges from an epoch invalidated by participant cleanup", async () => {
    // Given an epoch that was ready until a participant stopped.
    runtimeFixture();
    const sessionEpoch = preparePairing();
    getTrackingServices().pairing.unregister("WORKER_1");
    const incoming = request("equipment", "/api/tracking/uwb", { ...measurement, sessionEpoch });
    // When a delayed native callback uploads the previous session's range.
    const response = await uploadUwb(incoming);
    // Then it is rejected after epoch revocation.
    expect(response.status).toBe(409);
  });
});
