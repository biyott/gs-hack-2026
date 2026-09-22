import aruco from "js-aruco2";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { detectJpeg } from "../src/server/tracking/detector";

describe("JPEG marker detector", () => {
  it("detects marker identity and pixels from an actual JPEG image", async () => {
    // Given a rendered dictionary marker, independent of detection coordinates.
    const svg = new aruco.AR.Dictionary("ARUCO_MIP_36h12").generateSVG(11);
    const jpeg = await sharp(Buffer.from(svg)).resize(240, 240).jpeg({ quality: 92 }).toBuffer();
    // When the JPEG bytes pass through the production decoder.
    const result = await detectJpeg(jpeg);
    // Then the raster image itself supplies the marker identity and corners.
    expect(result.width).toBe(240);
    expect(result.markers.map((marker) => marker.id)).toEqual([11]);
    expect(result.markers[0]?.corners[0].x).toBeCloseTo(24, 0);
  });

  it("rejects non-JPEG uploads even when another image format is decodable", async () => {
    // Given PNG image bytes.
    const png = await sharp({
      create: { width: 20, height: 20, channels: 3, background: "#ffffff" },
    })
      .png()
      .toBuffer();
    // When the JPEG boundary is used, then it rejects the image format.
    await expect(detectJpeg(png)).rejects.toMatchObject({ code: "invalid-image" });
  });
});
