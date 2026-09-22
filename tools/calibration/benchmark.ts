import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { availableParallelism, cpus, loadavg } from "node:os";
import { performance } from "node:perf_hooks";
import aruco from "js-aruco2";
import sharp from "sharp";
import { detectJpeg } from "../../src/server/tracking/detector";
import { solveHomography, transformPoint } from "../../src/server/tracking/homography";
import type { PixelMarker } from "../../src/server/tracking/types";
import { createTrackingFixture } from "./fixtures";
import { TRACKING_MARKERS } from "./markers";

const WIDTHS = [640, 800, 960, 1280] as const;
const BACKGROUNDS = ["white", "#d9d9d9"] as const;
const MARKER_SIZES = [40, 64] as const;
const EXPECTED_IDS = [0, 1, 2, 3, 10, 11, 12] as const;
const WARMUP = 5;
const SAMPLES = 20;
const knownMarkers = Object.entries(TRACKING_MARKERS).map(([id, marker]) => ({
  id: Number(id),
  target: { x: marker.tableX, y: marker.tableY },
}));
const center = (marker: PixelMarker) =>
  marker.corners.reduce((sum, point) => ({ x: sum.x + point.x / 4, y: sum.y + point.y / 4 }), {
    x: 0,
    y: 0,
  });

function summarize(values: readonly number[]) {
  const sorted = values.toSorted((left, right) => left - right);
  return {
    count: sorted.length,
    min: sorted[0] ?? 0,
    p50: sorted[Math.ceil(sorted.length * 0.5) - 1] ?? 0,
    p95: sorted[Math.ceil(sorted.length * 0.95) - 1] ?? 0,
    max: sorted.at(-1) ?? 0,
    mean: sorted.reduce((sum, value) => sum + value, 0) / sorted.length,
  };
}

function accuracy(result: Awaited<ReturnType<typeof detectJpeg>>) {
  const scale = result.width / 1280;
  const knownPlaneErrorsCm = knownMarkers.flatMap(({ id, target }) => {
    const marker = result.markers.find((item) => item.id === id);
    if (!marker) return [];
    const pixel = center(marker);
    const decoded = { x: (pixel.x / scale - 80) / 800, y: (560 - pixel.y / scale) / 800 };
    return [{ id, decoded, errorCm: 100 * Math.hypot(decoded.x - target.x, decoded.y - target.y) }];
  });
  const cornerPairs = knownMarkers
    .filter(({ id }) => id < 4)
    .flatMap(({ id, target }) => {
      const marker = result.markers.find((item) => item.id === id);
      return marker ? [{ source: center(marker), target }] : [];
    });
  const homography = cornerPairs.length === 4 ? solveHomography(cornerPairs) : undefined;
  const calibratedErrorsCm = homography
    ? knownMarkers
        .filter(({ id }) => id >= 10)
        .flatMap(({ id, target }) => {
          const marker = result.markers.find((item) => item.id === id);
          if (!marker) return [];
          const decoded = transformPoint(homography, center(marker));
          return [
            { id, decoded, errorCm: 100 * Math.hypot(decoded.x - target.x, decoded.y - target.y) },
          ];
        })
    : [];
  return {
    ids: result.markers.map(({ id }) => id).toSorted((left, right) => left - right),
    missingIds: EXPECTED_IDS.filter((id) => !result.markers.some((marker) => marker.id === id)),
    unexpectedIds: result.markers
      .filter(({ id }) => !knownMarkers.some((marker) => marker.id === id))
      .map(({ id }) => id),
    knownPlaneErrorsCm,
    calibratedErrorsCm,
  };
}

// Instrument only the timed harness; the production detector and its output are unchanged.
const originalDetect = aruco.AR.Detector.prototype.detect;
let lastDetectionCpuMs = 0;
aruco.AR.Detector.prototype.detect = function (
  image: Parameters<typeof originalDetect>[0],
): unknown {
  const started = performance.now();
  try {
    return originalDetect.call(this, image);
  } finally {
    lastDetectionCpuMs = performance.now() - started;
  }
};

const startedAt = new Date().toISOString();
const environment = {
  node: process.version,
  platform: process.platform,
  architecture: process.arch,
  cpu: cpus()[0]?.model,
  availableParallelism: availableParallelism(),
  loadAverageAtStart: loadavg(),
};
const detectorSha256 = createHash("sha256")
  .update(await readFile("src/server/tracking/detector.ts"))
  .digest("hex");
const results = [];
try {
  for (const { background, markerSizePx } of BACKGROUNDS.flatMap((background) =>
    MARKER_SIZES.map((markerSizePx) => ({ background, markerSizePx })),
  )) {
    const fixture = await createTrackingFixture({ background, markerSizePx });
    for (const width of WIDTHS) {
      const resizeStarted = performance.now();
      const jpeg = await sharp(fixture)
        .resize({ width, withoutEnlargement: true })
        .jpeg({ quality: 90 })
        .toBuffer();
      const fixtureResizeEncodeMs = performance.now() - resizeStarted;
      const warmupMs: number[] = [];
      const samples = [];
      for (let index = 0; index < WARMUP + SAMPLES; index += 1) {
        const started = performance.now();
        const detection = await detectJpeg(jpeg);
        const totalMs = performance.now() - started;
        if (index < WARMUP) {
          warmupMs.push(totalMs);
          continue;
        }
        samples.push({
          totalMs,
          detectionCpuMs: lastDetectionCpuMs,
          decodeConstructorValidationMs: totalMs - lastDetectionCpuMs,
          width: detection.width,
          height: detection.height,
          ...accuracy(detection),
        });
      }
      const decodeSamplesMs: number[] = [];
      const constructorSamplesMs: number[] = [];
      for (let index = 0; index < SAMPLES; index += 1) {
        const decodeStarted = performance.now();
        await sharp(jpeg, { limitInputPixels: 8_500_000, failOn: "warning" })
          .rotate()
          .resize({ width: 1280, height: 960, fit: "inside", withoutEnlargement: true })
          .ensureAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });
        decodeSamplesMs.push(performance.now() - decodeStarted);
        const constructorStarted = performance.now();
        new aruco.AR.Detector({ dictionaryName: "ARUCO_MIP_36h12", maxHammingDistance: 2 });
        constructorSamplesMs.push(performance.now() - constructorStarted);
      }
      const summary = {
        totalMs: summarize(samples.map((sample) => sample.totalMs)),
        detectionCpuMs: summarize(samples.map((sample) => sample.detectionCpuMs)),
        decodeConstructorValidationMs: summarize(
          samples.map((sample) => sample.decodeConstructorValidationMs),
        ),
        decodeOnlyMs: summarize(decodeSamplesMs),
        constructorOnlyMs: summarize(constructorSamplesMs),
        allSamplesHaveExpectedIds: samples.every(
          (sample) => sample.ids.join(",") === EXPECTED_IDS.join(","),
        ),
        maxKnownPlaneErrorCm: Math.max(
          ...samples.flatMap((sample) => sample.knownPlaneErrorsCm.map(({ errorCm }) => errorCm)),
        ),
        maxCalibratedTrackedErrorCm: Math.max(
          ...samples.flatMap((sample) => sample.calibratedErrorsCm.map(({ errorCm }) => errorCm)),
        ),
      };
      results.push({
        width,
        background,
        sourceMarkerOuterPixels: markerSizePx,
        sourceMarkerBlackSquarePixels: markerSizePx * 0.8,
        jpegBytes: jpeg.length,
        fixtureResizeEncodeMs,
        warmupMs,
        summary,
        samples,
        decodeSamplesMs,
        constructorSamplesMs,
      });
      console.log(JSON.stringify({ width, background, markerSizePx, ...summary }));
    }
  }
} finally {
  aruco.AR.Detector.prototype.detect = originalDetect;
}
await writeFile(
  "tools/calibration/benchmark-results.json",
  `${JSON.stringify(
    {
      evidenceType: "synthetic runtime only; not physical camera or table accuracy evidence",
      startedAt,
      completedAt: new Date().toISOString(),
      environment: { ...environment, loadAverageAtEnd: loadavg() },
      detectorSha256,
      command: "npm exec -- tsx tools/calibration/benchmark.ts",
      procedure: {
        sourceFixturePixels: [1280, 720],
        sourceMarkerOuterPixels: MARKER_SIZES,
        sourceMarkerBlackSquarePixels: MARKER_SIZES.map((size) => size * 0.8),
        jpegQuality: 90,
        warmupsPerCombination: WARMUP,
        measuredSamplesPerCombination: SAMPLES,
        analysisWidths: WIDTHS,
        execution:
          "Sequential; complete one width/background before next; shared host also runs other agents and build/test processes.",
        stageTiming:
          "Timed production detectJpeg with only a prototype timing wrapper around synchronous AR.Detector.detect; decode+constructor+validation is elapsed residual. Separate decoder and constructor samples measured afterward.",
        imagePreparation:
          "Resize and re-encode original JPEG before production detectJpeg; preparation cost excluded from detection latency. Production resize cap stays unchanged and does not resize these inputs.",
        softwareAccuracy:
          "Compare decoded centers against independent fixture pixel-to-table mapping; also solve homography from detected corner centers and compare tracked centers. Synthetic flat image has no lens, height, perspective, blur, lighting, motion, physical placement, or print errors.",
      },
      results,
    },
    null,
    2,
  )}\n`,
);
