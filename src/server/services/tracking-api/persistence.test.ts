import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { POST as uploadFrame } from "../../../../app/api/tracking/frame/route";
import { POST as uploadUwb } from "../../../../app/api/tracking/uwb/route";
import { createMeasurementRepository } from "../../db/measurements";
import { getDatabaseServices } from "../database";
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
  sessionEpoch: "test-epoch",
  captureClock: {
    deviceCapturedAt: "2026-01-01T00:00:00Z",
    offsetMs: 0,
    uncertaintyMs: 51,
    synchronizedAt: "2026-01-01T00:00:00Z",
  },
} as const;

describe("raw measurement persistence at the HTTP boundary", () => {
  it("preserves nullable native ranges and clock uncertainty with an authenticated fixture source", async () => {
    // Given an authorized operator fixture and the real measurement repository.
    runtimeFixture();
    const incoming = request("admin", "/api/tracking/uwb", measurement);
    // When the sample is accepted by the route.
    const response = await uploadUwb(incoming);
    // Then the raw sensor values persist with their identity, units and uncertainty.
    expect(response.status).toBe(200);
    const stored = createMeasurementRepository(getDatabaseServices().database).latest(
      "uwb",
      "equipment-phone:WORKER-A:test-epoch",
    );
    expect(stored).toMatchObject({ sequence: 1, observedAt: measurement.capturedAt });
    const raw = z
      .object({
        source: z.string(),
        distanceM: z.number(),
        azimuthRad: z.null(),
        captureClock: z.object({ uncertaintyMs: z.number() }),
      })
      .parse(JSON.parse(stored?.payloadJson ?? "null"));
    expect(raw).toEqual({
      source: "synthetic",
      distanceM: 0.35,
      azimuthRad: null,
      captureClock: { uncertaintyMs: 51 },
    });
  });

  it("keeps both workers' equal native sequence numbers in separate measurement namespaces", async () => {
    // Given the first worker's accepted equipment range sample.
    runtimeFixture();
    const sessionEpoch = preparePairing();
    const firstResponse = await uploadUwb(
      request("equipment", "/api/tracking/uwb", { ...measurement, sessionEpoch }),
    );
    expect(firstResponse.status).toBe(204);
    expect(await firstResponse.text()).toBe("");
    // When the equipment reports the second worker with the same native sequence.
    const response = await uploadUwb(
      request("equipment", "/api/tracking/uwb", {
        ...measurement,
        sessionEpoch,
        workerId: "WORKER-B",
      }),
    );
    // Then both raw peer measurements persist independently.
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(
      createMeasurementRepository(getDatabaseServices().database)
        .list("uwb")
        .map((event) => event.sourceId)
        .sort(),
    ).toEqual([
      `equipment-phone:WORKER-A:${sessionEpoch}`,
      `equipment-phone:WORKER-B:${sessionEpoch}`,
    ]);
  });

  it("persists camera metadata without retaining image bytes", async () => {
    // Given a synthetic JPEG with explicit capture metadata.
    runtimeFixture();
    const jpeg = await sharp({
      create: { width: 32, height: 32, channels: 3, background: "white" },
    })
      .jpeg()
      .toBuffer();
    const jpegBase64 = jpeg.toString("base64");
    const incoming = request("admin", "/api/tracking/frame", {
      cameraId: "CCTV-01",
      deviceId: "camera-phone",
      sequence: 1,
      capturedAt: measurement.capturedAt,
      source: "synthetic",
      jpegBase64,
    });
    // When a camera frame is accepted.
    const response = await uploadFrame(incoming);
    // Then only derived observations and metadata are stored.
    expect(response.status).toBe(200);
    const stored = createMeasurementRepository(getDatabaseServices().database).latest(
      "camera-frame",
      "CCTV-01:camera-phone",
    );
    expect(stored?.payloadJson).not.toContain(jpegBase64);
    expect(stored?.payloadJson).not.toContain("jpegBase64");
    expect(stored?.payloadJson).not.toContain("sessionKeyHex");
    expect(stored).toMatchObject({ sequence: 1, observedAt: measurement.capturedAt });
  });
});
