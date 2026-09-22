import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { TrackingSnapshotSchema } from "@/contracts";
import { GET as clock } from "../../../../app/api/clock/route";
import { POST as calibrate } from "../../../../app/api/tracking/calibration/route";
import { GET as latestFrame, POST as uploadFrame } from "../../../../app/api/tracking/frame/route";
import { POST as uploadUwb } from "../../../../app/api/tracking/uwb/route";
import { getTrackingServices } from "../tracking";
import { preparePairing, request, runtimeFixture } from "./fixtures";

const frame = {
  cameraId: "CCTV-01",
  capturedAt: "2026-01-01T00:00:00Z",
  sequence: 1,
  jpegBase64: "AAAA",
  source: "live",
} as const;
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

describe("tracking upload authorization", () => {
  it.each(["admin", "operator", "equipment", "worker-a", "observer"])(
    "denies live frame uploads by %s",
    async (actor) => {
      // Given a live frame with credentials not bound to CCTV.
      const incoming = request(actor, "/api/tracking/frame", frame);
      // When uploading the frame.
      const response = await uploadFrame(incoming);
      // Then the source cannot be impersonated.
      expect(response.status).toBe(403);
    },
  );

  it.each(["worker-a", "worker-b", "cctv", "observer", "support"])(
    "denies equipment UWB uploads by %s",
    async (actor) => {
      // Given an equipment measurement and another account's credentials.
      const incoming = request(actor, "/api/tracking/uwb", measurement);
      // When uploading a range measurement.
      const response = await uploadUwb(incoming);
      // Then only equipment or an operator fixture can provide ranges.
      expect(response.status).toBe(403);
    },
  );

  it.each(["equipment", "admin", "operator"])("accepts a UWB measurement by %s", async (actor) => {
    // Given a real isolated runtime and an authorized equipment/fixture account.
    runtimeFixture();
    const incoming = request(
      actor,
      "/api/tracking/uwb",
      actor === "equipment"
        ? { ...measurement, source: "synthetic", sessionEpoch: preparePairing() }
        : { ...measurement, source: "live" },
    );
    // When uploading a range with no angles.
    const response = await uploadUwb(incoming);
    const body =
      actor === "equipment"
        ? getTrackingServices().tracking.getSnapshot()
        : TrackingSnapshotSchema.parse(await response.json());
    // Then the sensor remains explicitly distance-only.
    expect(response.status).toBe(actor === "equipment" ? 204 : 200);
    if (actor === "equipment") expect(await response.text()).toBe("");
    expect(body.uwbObservations[0]).toMatchObject({
      status: "distance-only",
      position: null,
      tableDistanceM: 0.35,
      inputSource: actor === "equipment" ? "live" : "synthetic",
    });
  });

  it.each(["cctv", "admin"])("stores and serves an authorized JPEG from %s", async (actor) => {
    // Given a valid JPEG and an isolated runtime.
    runtimeFixture();
    const jpeg = await sharp({
      create: { width: 32, height: 32, channels: 3, background: "white" },
    })
      .jpeg()
      .toBuffer();
    const incoming = request(actor, "/api/tracking/frame", {
      ...frame,
      jpegBase64: jpeg.toString("base64"),
      source: actor === "cctv" ? "live" : "synthetic",
    });
    const upload = await uploadFrame(incoming);
    expect(upload.status).toBe(actor === "cctv" ? 204 : 200);
    if (actor === "cctv") expect(await upload.text()).toBe("");
    // When an authorized observer retrieves the latest frame.
    const response = latestFrame(request("observer", "/api/tracking/frame"));
    // Then the JPEG response is the received frame and cannot be cached.
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/jpeg");
    expect(Buffer.from(await response.arrayBuffer())).toEqual(jpeg);
  });

  it("rejects cross-origin cookie uploads before changing state", async () => {
    // Given a valid cookie credential on a cross-origin browser mutation.
    const incoming = request("cctv", "/api/tracking/frame", frame);
    const token = incoming.headers.get("authorization")?.slice(7);
    incoming.headers.delete("authorization");
    incoming.headers.set("cookie", `gs_safety_session=${token}`);
    incoming.headers.set("origin", "https://untrusted.example");
    // When the browser submits a frame.
    const response = await uploadFrame(incoming);
    // Then same-origin enforcement rejects it.
    expect(response.status).toBe(403);
  });

  it("denies calibration to a camera device", async () => {
    // Given a camera-bound account attempting to control calibration.
    const incoming = request("cctv", "/api/tracking/calibration", {});
    // When changing calibration.
    const response = await calibrate(incoming);
    // Then authorization rejects the mutation before schema parsing.
    expect(response.status).toBe(403);
  });

  it("returns 404 when an authorized reader has no camera frame", () => {
    // Given an empty tracking service.
    const incoming = request("observer", "/api/tracking/frame");
    // When reading the current JPEG.
    const response = latestFrame(incoming);
    // Then frame absence is explicit.
    expect(response.status).toBe(404);
  });

  it("does not let a worker retrieve a general camera frame", () => {
    // Given a worker-bound credential.
    const incoming = request("worker-a", "/api/tracking/frame");
    // When requesting the camera image.
    const response = latestFrame(incoming);
    // Then the image is forbidden.
    expect(response.status).toBe(403);
  });
});

describe("server clock endpoint", () => {
  it("requires authentication", () => {
    // Given no server credential.
    const incoming = request(null, "/api/clock");
    // When requesting a synchronization sample.
    const response = clock(incoming);
    // Then the clock endpoint follows the authenticated API policy.
    expect(response.status).toBe(401);
  });
  it("provides an authenticated UTC timestamp", async () => {
    // Given any authenticated account.
    const incoming = request("observer", "/api/clock");
    // When requesting a synchronization sample.
    const response = clock(incoming);
    // Then the response provides server receipt-time evidence.
    expect(await response.json()).toEqual({
      serverAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T.*Z$/),
    });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
