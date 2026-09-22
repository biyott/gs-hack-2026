import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { CalibrationSchema } from "../packages/contracts/src/tracking";
import { deriveCameraObservations } from "../src/server/tracking/camera";
import { detectJpeg } from "../src/server/tracking/detector";
import example from "../tools/calibration/example-calibration.json";
import { createTrackingFixture } from "../tools/calibration/fixtures";

const timestamp = "2026-09-21T09:00:00.000Z";
const context = {
  calibration: CalibrationSchema.parse(example),
  capturedAt: timestamp,
  receivedAt: timestamp,
};

describe("Camera image coordinates", () => {
  it("preserves table axes when the camera image is rotated", async () => {
    // Given a camera sensor mounted a quarter turn from the printable scene.
    const image = await sharp(await createTrackingFixture())
      .rotate(90)
      .jpeg()
      .toBuffer();
    const detected = await detectJpeg(image);
    // When the marker identities establish the table coordinate frame.
    const result = deriveCameraObservations(detected.markers, context);
    // Then world coordinates use table axes instead of image axes.
    const worker = result.observations.find((item) => item.entityId === "WORKER-B");
    expect(worker?.tablePositionM?.x).toBeCloseTo(0.9, 2);
    expect(worker?.tablePositionM?.y).toBeCloseTo(0.4, 2);
  });

  it("rejects crossed table corner identities", async () => {
    // Given corner labels physically swapped into a bow-tie ordering.
    const image = await createTrackingFixture({
      positions: { 1: { x: 1.4, y: 0.5 }, 2: { x: 1.4, y: 0 } },
    });
    const detected = await detectJpeg(image);
    // When calibration examines the current image.
    const result = deriveCameraObservations(detected.markers, context);
    // Then a folded projective map cannot produce authoritative coordinates.
    expect(result.observations.every((item) => item.status === "uncalibrated")).toBe(true);
  });

  it("corrects raised marker projection and keeps antenna and reference offsets distinct", async () => {
    // Given a 10cm elevated marker under a 1m camera, with independent physical offsets.
    const calibration = CalibrationSchema.parse({
      ...example,
      camera: { positionTableM: { x: 0.7, y: 0.25 }, heightM: 1 },
      markers: example.markers.map((item) =>
        item.entityId === "WORKER-A"
          ? {
              ...item,
              heightM: 0.1,
              markerToReferenceM: { x: 0.02, y: 0 },
              markerToAntennaM: { x: 0.01, y: 0 },
            }
          : item,
      ),
    });
    const image = await createTrackingFixture({
      positions: { 11: { x: 0.6444444444444445, y: 0.25 } },
    });
    const detected = await detectJpeg(image);
    // When height and printed local offsets are applied.
    const result = deriveCameraObservations(detected.markers, { ...context, calibration });
    // Then the reference and antenna remain physically distinct after correction.
    expect(
      result.observations.find((item) => item.entityId === "WORKER-A")?.tablePositionM?.x,
    ).toBeCloseTo(0.67, 2);
    expect(result.poses.find((item) => item.entityId === "WORKER-A")?.antennaTableM.x).toBeCloseTo(
      0.66,
      2,
    );
  });

  it.each(["white", "#d9d9d9"] as const)(
    "maps three markers from JPEG pixels on %s table",
    async (background) => {
      // Given real JPEG pixels with known printed marker positions.
      const jpeg = await createTrackingFixture({ background });
      const detected = await detectJpeg(jpeg);
      // When the four visual references calibrate this frame.
      const result = deriveCameraObservations(detected.markers, context);
      // Then IDs map to the required independent worker identities and scale.
      const worker = result.observations.find((item) => item.entityId === "WORKER-A");
      expect(worker?.status).toBe("valid");
      expect(worker?.tablePositionM?.x).toBeCloseTo(0.65, 2);
      expect(worker?.tablePositionM?.y).toBeCloseTo(0.25, 2);
      expect(worker?.position?.x).toBeCloseTo(65, 0);
      expect(worker?.source).toBe("camera-marker");
      expect(worker?.uncertaintyTableM).toBeNull();
    },
  );

  it("withholds coordinates when an actual corner marker is covered", async () => {
    // Given the top-left calibration marker absent from the JPEG.
    const detected = await detectJpeg(await createTrackingFixture({ hiddenIds: [3] }));
    // When the current frame is calibrated.
    const result = deriveCameraObservations(detected.markers, context);
    // Then old calibration is never used after camera geometry becomes unknown.
    expect(result.observations).toHaveLength(3);
    expect(
      result.observations.every((item) => item.position === null && item.status === "uncalibrated"),
    ).toBe(true);
  });

  it("reports occlusion independently for a missing worker marker", async () => {
    // Given a visible calibrated table and hidden worker B marker.
    const detected = await detectJpeg(await createTrackingFixture({ hiddenIds: [12] }));
    // When visual positions are derived.
    const result = deriveCameraObservations(detected.markers, context);
    // Then worker B has no invented position while worker A remains observed.
    expect(result.observations.find((item) => item.entityId === "WORKER-B")).toMatchObject({
      status: "occluded",
      position: null,
    });
    expect(result.observations.find((item) => item.entityId === "WORKER-A")?.status).toBe("valid");
  });
});
