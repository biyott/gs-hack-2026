import sharp from "sharp";
import { markerSvg } from "./markers";

export type FixturePoint = Readonly<{ x: number; y: number }>;
export type TrackingFixtureOptions = Readonly<{
  readonly hiddenIds?: readonly number[];
  readonly positions?: Readonly<Partial<Record<number, FixturePoint>>>;
  readonly quality?: number;
  readonly background?: "white" | "#d9d9d9";
  readonly markerSizePx?: number;
}>;

const WIDTH = 1280;
const HEIGHT = 720;
const CORNERS: Readonly<Record<number, FixturePoint>> = {
  0: { x: 0, y: 0 },
  1: { x: 1.4, y: 0 },
  2: { x: 1.4, y: 0.5 },
  3: { x: 0, y: 0.5 },
};
const TRACKED: Readonly<Record<number, FixturePoint>> = {
  10: { x: 0.3, y: 0.25 },
  11: { x: 0.65, y: 0.25 },
  12: { x: 0.9, y: 0.4 },
};

export async function createTrackingFixture(options: TrackingFixtureOptions = {}): Promise<Buffer> {
  const markerSizePx = options.markerSizePx ?? 40;
  const hidden = new Set(options.hiddenIds ?? []);
  const positions = { ...CORNERS, ...TRACKED, ...options.positions };
  const layers = Object.entries(positions).flatMap(([rawId, tablePosition]) => {
    const id = Number(rawId);
    const center = tablePosition
      ? { x: 80 + tablePosition.x * 800, y: 560 - tablePosition.y * 800 }
      : undefined;
    if (hidden.has(id) || !center) return [];
    const svg = markerSvg(id);
    const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
    return [
      `<image href="${dataUri}" x="${center.x - markerSizePx / 2}" y="${center.y - markerSizePx / 2}" width="${markerSizePx}" height="${markerSizePx}"/>`,
    ];
  });
  const scene = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}"><rect width="100%" height="100%" fill="${options.background ?? "white"}"/>${layers.join("")}</svg>`;
  return sharp(Buffer.from(scene))
    .jpeg({ quality: options.quality ?? 90 })
    .toBuffer();
}
