import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ApiErrorSchema, TrackingSnapshotSchema } from "@/contracts";
import { POST as uploadFrame } from "../../../../app/api/tracking/frame/route";
import { createMeasurementRepository } from "../../db/measurements";
import { getDatabaseServices } from "../database";
import { getTrackingServices } from "../tracking";
import { request, runtimeFixture } from "./fixtures";

const capturedAt = "2026-01-01T00:00:00Z";
const entities = ["EQUIPMENT-A", "WORKER-A", "WORKER-B"];
const nativeSources = [
  { label: "synthetic", source: "synthetic" },
  { label: "live", source: "live" },
  { label: "omitted", source: undefined },
] as const;
const storedPayloadSchema = z.object({
  source: z.string(),
  camera: z.object({ source: z.string() }),
  observations: z.array(z.object({ entityId: z.string(), inputSource: z.string() })),
});

async function framePayload(source?: "live" | "synthetic") {
  const jpeg = await sharp({
    create: { width: 16, height: 16, channels: 3, background: "white" },
  })
    .jpeg()
    .toBuffer();
  return {
    cameraId: "CCTV-01",
    deviceId: "provenance-camera-phone",
    streamId: "provenance-stream",
    frameId: "provenance-frame",
    capturedAt,
    sequence: 1,
    source,
    jpegBase64: jpeg.toString("base64"),
  };
}

describe("QD007 authenticated camera producer provenance", () => {
  it.each(nativeSources)(
    "binds CCTV source $label to live channel state and persistence",
    async ({ source }) => {
      // Given isolated auth, a real decoder/database and a generated blank JPEG.
      runtimeFixture();
      const payload = await framePayload(source);
      // When the CCTV credential supplies a source label or omits it like Android.
      const response = await uploadFrame(request("cctv", "/api/tracking/frame", payload));
      // Then acknowledgement privacy holds while all canonical channel facts are live.
      expect(response.status).toBe(204);
      expect(await response.text()).toBe("");
      const snapshot = getTrackingServices().tracking.getSnapshot();
      expect(snapshot.receivedFrames).toBe(1);
      expect(snapshot.camera).toMatchObject({
        frameId: payload.frameId,
        width: 16,
        height: 16,
      });
      expect.soft(snapshot.camera?.source).toBe("live");
      expect
        .soft(
          snapshot.cameraObservations.map(({ entityId, inputSource }) => ({
            entityId,
            inputSource,
          })),
        )
        .toEqual(entities.map((entityId) => ({ entityId, inputSource: "live" })));
      expect
        .soft(snapshot.updates.map(({ inputSource }) => inputSource))
        .toEqual(["live", "live", "live"]);
      const repository = createMeasurementRepository(getDatabaseServices().database);
      expect(repository.list("camera-frame")).toHaveLength(1);
      const record = repository.latest("camera-frame", "CCTV-01:provenance-camera-phone");
      expect(record).toMatchObject({ sequence: 1, observedAt: capturedAt });
      const stored = storedPayloadSchema.parse(JSON.parse(record?.payloadJson ?? "null"));
      expect.soft(stored).toEqual({
        source: "live",
        camera: { source: "live" },
        observations: entities.map((entityId) => ({ entityId, inputSource: "live" })),
      });
    },
  );

  it.each(["admin", "operator"])(
    "preserves %s explicit synthetic fixtures and full response",
    async (actor) => {
      // Given an authorized console fixture using the same generated JPEG.
      runtimeFixture();
      const payload = await framePayload("synthetic");
      // When the console explicitly requests the synthetic producer channel.
      const response = await uploadFrame(request(actor, "/api/tracking/frame", payload));
      // Then fixture provenance is synthetic in the full response, service and raw record.
      expect(response.status).toBe(200);
      const body = TrackingSnapshotSchema.parse(await response.json());
      const snapshot = TrackingSnapshotSchema.parse(getTrackingServices().tracking.getSnapshot());
      expect(body).toEqual(snapshot);
      expect(body.camera?.source).toBe("synthetic");
      expect(
        body.cameraObservations.map(({ entityId, inputSource }) => ({ entityId, inputSource })),
      ).toEqual(entities.map((entityId) => ({ entityId, inputSource: "synthetic" })));
      const record = createMeasurementRepository(getDatabaseServices().database).latest(
        "camera-frame",
        "CCTV-01:provenance-camera-phone",
      );
      expect(storedPayloadSchema.parse(JSON.parse(record?.payloadJson ?? "null"))).toEqual({
        source: "synthetic",
        camera: { source: "synthetic" },
        observations: entities.map((entityId) => ({ entityId, inputSource: "synthetic" })),
      });
    },
  );

  it.each([
    { actor: "admin", label: "live", source: "live" },
    { actor: "admin", label: "omitted", source: undefined },
    { actor: "operator", label: "live", source: "live" },
    { actor: "operator", label: "omitted", source: undefined },
  ] as const)(
    "rejects $actor source $label before ingestion or persistence",
    async ({ actor, source }) => {
      // Given a console credential attempting the live/default producer channel.
      const payload = await framePayload(source);
      // When it submits a valid JPEG without explicit synthetic intent.
      const response = await uploadFrame(request(actor, "/api/tracking/frame", payload));
      // Then authorization rejects the request without a frame or raw database write.
      expect(response.status).toBe(403);
      expect(ApiErrorSchema.strict().parse(await response.json()).error.code).toBe("FORBIDDEN");
      expect(getTrackingServices().tracking.getSnapshot()).toMatchObject({
        camera: null,
        receivedFrames: 0,
      });
      expect(
        createMeasurementRepository(getDatabaseServices().database).list("camera-frame"),
      ).toEqual([]);
    },
  );
});
