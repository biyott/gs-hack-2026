import aruco from "js-aruco2";
import sharp from "sharp";
import { z } from "zod";
import { type PixelMarker, TrackingError } from "./types";

const PointSchema = z.object({ x: z.number().finite(), y: z.number().finite() });
const DetectionSchema = z.array(
  z.object({
    id: z.number().int().min(0).max(249),
    corners: z.tuple([PointSchema, PointSchema, PointSchema, PointSchema]),
    hammingDistance: z.number().int().nonnegative(),
  }),
);

class TableMarkerDetector extends aruco.AR.Detector {
  override notTooNear(candidates: unknown, _minDistance: number): unknown {
    // The upstream 10px radius suppresses the black square beside its white border.
    return super.notTooNear(candidates, 2);
  }
}

function sameContour(left: PixelMarker, right: PixelMarker): boolean {
  const center = (marker: PixelMarker) =>
    marker.corners.reduce((sum, point) => ({ x: sum.x + point.x / 4, y: sum.y + point.y / 4 }), {
      x: 0,
      y: 0,
    });
  const a = center(left);
  const b = center(right);
  return left.id === right.id && Math.hypot(a.x - b.x, a.y - b.y) < 3;
}

export async function detectJpeg(jpeg: Buffer): Promise<{
  readonly width: number;
  readonly height: number;
  readonly markers: readonly PixelMarker[];
}> {
  if (jpeg.length > 3_000_000 || jpeg[0] !== 0xff || jpeg[1] !== 0xd8) {
    throw new TrackingError("invalid-image", "A JPEG image of at most 3 MB is required.");
  }
  try {
    const image = await sharp(jpeg, { limitInputPixels: 8_500_000, failOn: "warning" })
      .rotate()
      .resize({ width: 1280, height: 960, fit: "inside", withoutEnlargement: true })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const detector = new TableMarkerDetector({
      dictionaryName: "ARUCO_MIP_36h12",
      maxHammingDistance: 2,
    });
    const markers = DetectionSchema.parse(
      detector.detect({ width: image.info.width, height: image.info.height, data: image.data }),
    );
    const unique = markers.filter(
      (marker, index) => !markers.slice(0, index).some((previous) => sameContour(previous, marker)),
    );
    return { width: image.info.width, height: image.info.height, markers: unique };
  } catch (error) {
    if (error instanceof Error)
      throw new TrackingError("invalid-image", "JPEG decoding or marker extraction failed.");
    throw error;
  }
}
