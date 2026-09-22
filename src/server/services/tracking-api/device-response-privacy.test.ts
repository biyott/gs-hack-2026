import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ApiErrorSchema, TrackingSnapshotSchema } from "@/contracts";
import { GET as latestFrame, POST as uploadFrame } from "../../../../app/api/tracking/frame/route";
import { POST as uploadUwb } from "../../../../app/api/tracking/uwb/route";
import { createMeasurementRepository } from "../../db/measurements";
import { getDatabaseServices } from "../database";
import { getTrackingServices } from "../tracking";
import { preparePairing, request, runtimeFixture } from "./fixtures";

const frame = {
  cameraId: "CCTV-01",
  deviceId: "camera-phone",
  streamId: "privacy-stream",
  frameId: "privacy-frame",
  capturedAt: "2026-01-01T00:00:00Z",
  sequence: 1,
  source: "synthetic",
} as const;
const range = {
  deviceId: "equipment-phone",
  workerId: "WORKER-A",
  capturedAt: frame.capturedAt,
  sequence: 1,
  distanceM: 0.31,
  azimuthRad: null,
  elevationRad: null,
  uncertaintyM: null,
  source: "synthetic",
} as const;

async function seedCrossSensorFacts() {
  const tracking = getTrackingServices().tracking;
  tracking.ingestUwb({ ...range, workerId: "WORKER-B", distanceM: 0.77 });
  const jpeg = await sharp({
    create: { width: 32, height: 32, channels: 3, background: "white" },
  })
    .jpeg()
    .toBuffer();
  await tracking.ingestFrame({ ...frame, jpegBase64: jpeg.toString("base64") });
  return jpeg;
}

function measuredRun() {
  const run = runtimeFixture().getRun("equipment");
  run.snapshot = { ...run.snapshot, run: { ...run.snapshot.run, positionInput: "measured" } };
  return run;
}

function frameQuery() {
  return new URLSearchParams({
    cameraId: frame.cameraId,
    streamId: frame.streamId,
    frameId: frame.frameId,
    sequence: String(frame.sequence),
  });
}

describe("SEC-01 camera read policy with an actual stored synthetic JPEG", () => {
  it.each(["admin", "operator", "observer"])("serves the exact frame to %s", async (actor) => {
    // Given a stored blank JPEG with a complete frame identity.
    const jpeg = await seedCrossSensorFacts();
    // When an authorized console requests that identity.
    const response = latestFrame(request(actor, `/api/tracking/frame?${frameQuery()}`));
    // Then byte content, identity and caching still match the stored frame.
    expect(response.status).toBe(200);
    expect(Object.fromEntries(response.headers)).toMatchObject({
      "content-type": "image/jpeg",
      "cache-control": "no-store",
      "x-frame-camera-id": frame.cameraId,
      "x-frame-stream-id": frame.streamId,
      "x-frame-sequence": "1",
      "x-frame-id": frame.frameId,
    });
    expect(Buffer.from(await response.arrayBuffer())).toEqual(jpeg);
  });

  it.each(["support", "worker-a", "worker-b", "equipment", "cctv"])(
    "denies %s even when the requested JPEG exists",
    async (actor) => {
      // Given a stored synthetic image and a credential outside the camera viewer roles.
      await seedCrossSensorFacts();
      // When requesting the exact frame rather than an absent or superseded image.
      const response = latestFrame(request(actor, `/api/tracking/frame?${frameQuery()}`));
      // Then the response contains only a forbidden error, never JPEG bytes.
      expect(response.status).toBe(403);
      expect(ApiErrorSchema.strict().parse(await response.json()).error.code).toBe("FORBIDDEN");
    },
  );

  it("retains the observer superseded-frame guard", async () => {
    // Given a stored JPEG and a different requested sequence.
    await seedCrossSensorFacts();
    const query = frameQuery();
    query.set("sequence", "0");
    // When an observer requests the older identity.
    const response = latestFrame(request("observer", `/api/tracking/frame?${query}`));
    // Then access does not silently substitute a different frame.
    expect(response.status).toBe(409);
    expect(ApiErrorSchema.strict().parse(await response.json()).error.code).toBe(
      "FRAME_SUPERSEDED",
    );
  });
});

describe("SEC-01 native upload acknowledgements", () => {
  it("accepts CCTV data internally without echoing another worker's range", async () => {
    // Given a measured idle runtime, another worker's range and a stored blank image.
    const run = measuredRun();
    const jpeg = await seedCrossSensorFacts();
    // When CCTV submits the next image using its native credential.
    const response = await uploadFrame(
      request("cctv", "/api/tracking/frame", {
        ...frame,
        sequence: 2,
        frameId: "native-frame",
        source: "live",
        jpegBase64: jpeg.toString("base64"),
      }),
    );
    // Then service state, raw persistence and selected runtime retain the accepted data.
    const snapshot = getTrackingServices().tracking.getSnapshot();
    expect(snapshot.camera).toMatchObject({ frameId: "native-frame", sequence: 2, source: "live" });
    expect(snapshot.uwbObservations).toEqual([
      expect.objectContaining({ entityId: "WORKER-B", tableDistanceM: 0.77, position: null }),
    ]);
    const stored = createMeasurementRepository(getDatabaseServices().database).latest(
      "camera-frame",
      "CCTV-01:camera-phone",
    );
    expect(stored).toMatchObject({ sequence: 2, observedAt: frame.capturedAt });
    expect(
      z
        .object({ source: z.string(), camera: z.object({ frameId: z.string() }) })
        .parse(JSON.parse(stored?.payloadJson ?? "null")),
    ).toEqual({ source: "live", camera: { frameId: "native-frame" } });
    expect(stored?.payloadJson).not.toContain("jpegBase64");
    expect(run.snapshot.cctv[0]).toMatchObject({
      status: "connected",
      source: "live",
      frameUrl: expect.stringContaining("frameId=native-frame"),
    });
    expect(run.snapshot.workers.find((worker) => worker.workerId === "WORKER-B")).toMatchObject({
      position: null,
      positionSource: "video",
      positionInputSource: "live",
      positionStatus: "unknown",
    });
    expect(run.snapshot.run.status).toBe("idle");
    // Then the native acknowledgement cannot expose the global tracking snapshot.
    expect.soft(response.status).toBe(204);
    expect.soft(await response.text()).toBe("");
  });

  it("accepts paired equipment data internally without echoing camera or other-worker facts", async () => {
    // Given another worker's range, a camera frame and a current native pairing epoch.
    const run = measuredRun();
    await seedCrossSensorFacts();
    const sessionEpoch = preparePairing();
    const beforeSequence = run.snapshot.sequence;
    // When equipment submits its own worker measurement while claiming a synthetic source.
    const response = await uploadUwb(
      request("equipment", "/api/tracking/uwb", { ...range, sessionEpoch }),
    );
    // Then accepted raw facts remain available internally with server-bound live provenance.
    const snapshot = getTrackingServices().tracking.getSnapshot();
    expect(snapshot.camera).toMatchObject({ frameId: frame.frameId, source: "synthetic" });
    expect(snapshot.uwbObservations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entityId: "WORKER-A",
          tableDistanceM: 0.31,
          position: null,
          inputSource: "live",
        }),
        expect.objectContaining({
          entityId: "WORKER-B",
          tableDistanceM: 0.77,
          position: null,
          inputSource: "synthetic",
        }),
      ]),
    );
    const stored = createMeasurementRepository(getDatabaseServices().database).latest(
      "uwb",
      `equipment-phone:WORKER-A:${sessionEpoch}`,
    );
    expect(stored).toMatchObject({ sequence: 1, observedAt: range.capturedAt });
    expect(
      z
        .object({
          source: z.string(),
          distanceM: z.number(),
          azimuthRad: z.null(),
          elevationRad: z.null(),
          uncertaintyM: z.null(),
        })
        .parse(JSON.parse(stored?.payloadJson ?? "null")),
    ).toEqual({
      source: "live",
      distanceM: 0.31,
      azimuthRad: null,
      elevationRad: null,
      uncertaintyM: null,
    });
    expect(run.snapshot.workers.find((worker) => worker.workerId === "WORKER-A")).toMatchObject({
      position: null,
      positionSource: "video",
      positionInputSource: "synthetic",
      positionStatus: "unknown",
    });
    expect(run.snapshot.sequence).toBeGreaterThan(beforeSequence);
    expect(run.snapshot.cctv[0]).toMatchObject({
      status: "connected",
      frameUrl: expect.stringContaining("frameId=privacy-frame"),
    });
    expect(run.snapshot.run.status).toBe("idle");
    // Then no cross-worker or camera facts are returned to the native uploader.
    expect.soft(response.status).toBe(204);
    expect.soft(await response.text()).toBe("");
  });
});

describe("SEC-01 console fixture response compatibility", () => {
  it.each(["admin", "operator"])(
    "retains the full synthetic frame response for %s",
    async (actor) => {
      // Given an authorized console fixture and unrelated worker data.
      measuredRun();
      const jpeg = await seedCrossSensorFacts();
      // When uploading another synthetic blank JPEG.
      const response = await uploadFrame(
        request(actor, "/api/tracking/frame", {
          ...frame,
          sequence: 2,
          jpegBase64: jpeg.toString("base64"),
        }),
      );
      // Then tooling retains the complete tracking contract and unrelated range.
      expect(response.status).toBe(200);
      const snapshot = TrackingSnapshotSchema.parse(await response.json());
      expect(snapshot.camera).toMatchObject({ sequence: 2, source: "synthetic" });
      expect(snapshot.uwbObservations[0]).toMatchObject({
        entityId: "WORKER-B",
        tableDistanceM: 0.77,
        position: null,
      });
    },
  );

  it.each(["admin", "operator"])(
    "retains the full synthetic UWB response for %s",
    async (actor) => {
      // Given a console account and populated facts from both sensor types.
      measuredRun();
      await seedCrossSensorFacts();
      // When the console submits a sample even with a claimed live source.
      const response = await uploadUwb(
        request(actor, "/api/tracking/uwb", { ...range, source: "live" }),
      );
      // Then tooling receives the complete snapshot with source bound to synthetic.
      expect(response.status).toBe(200);
      const snapshot = TrackingSnapshotSchema.parse(await response.json());
      expect(snapshot.camera).toMatchObject({ frameId: frame.frameId });
      expect(snapshot.uwbObservations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            entityId: "WORKER-A",
            tableDistanceM: 0.31,
            position: null,
            inputSource: "synthetic",
          }),
          expect.objectContaining({ entityId: "WORKER-B", tableDistanceM: 0.77, position: null }),
        ]),
      );
    },
  );
});
