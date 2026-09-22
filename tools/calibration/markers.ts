import aruco from "js-aruco2";

export const TRACKING_MARKERS = {
  0: { role: "table-lower-left", tableX: 0, tableY: 0 },
  1: { role: "table-lower-right", tableX: 1.4, tableY: 0 },
  2: { role: "table-upper-right", tableX: 1.4, tableY: 0.5 },
  3: { role: "table-upper-left", tableX: 0, tableY: 0.5 },
  10: { role: "equipment-a", tableX: 0.3, tableY: 0.25 },
  11: { role: "worker-a", tableX: 0.65, tableY: 0.25 },
  12: { role: "worker-b", tableX: 0.9, tableY: 0.4 },
} as const;

export type TrackingMarkerId = keyof typeof TRACKING_MARKERS;
const TRACKING_MARKER_IDS: readonly TrackingMarkerId[] = [0, 1, 2, 3, 10, 11, 12];

const markerDictionary = new aruco.AR.Dictionary("ARUCO_MIP_36h12");

function innerSvg(svg: string): string {
  const start = svg.indexOf(">");
  const end = svg.lastIndexOf("</svg>");
  return start >= 0 && end > start ? svg.slice(start + 1, end) : svg;
}

export function markerSvg(id: number, sizeMm = 40): string {
  const content = innerSvg(markerDictionary.generateSVG(id));
  const quietMm = 5;
  const totalMm = sizeMm + quietMm * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalMm}mm" height="${totalMm}mm" viewBox="0 0 ${totalMm} ${totalMm}"><rect width="${totalMm}" height="${totalMm}" fill="white"/><g transform="scale(${sizeMm / 8})">${content}</g></svg>`;
}

export function markerSheetSvg(): string {
  const ids = TRACKING_MARKER_IDS;
  const cellW = 65;
  const cellH = 78;
  const rows = Math.ceil(ids.length / 3);
  const cells = ids
    .map((id, index) => {
      const x = (index % 3) * cellW;
      const y = Math.floor(index / 3) * cellH;
      const { role } = TRACKING_MARKERS[id];
      const content = innerSvg(markerDictionary.generateSVG(id));
      return `<g transform="translate(${x} ${y})"><rect x="5" y="5" width="50" height="50" fill="white"/><g transform="translate(5 5) scale(5)">${content}</g><text x="5" y="62" font-family="sans-serif" font-size="3.5">${role}</text><text x="5" y="67" font-family="sans-serif" font-size="3.5">ID ${id} | 40 mm | +X →</text></g>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="195mm" height="${rows * cellH + 8}mm" viewBox="0 0 195 ${rows * cellH + 8}"><rect width="100%" height="100%" fill="white"/>${cells}</svg>`;
}

export function markerSheetHtml(): string {
  return `<!doctype html><meta charset="utf-8"><title>Tracking markers</title><style>@page{size:A4;margin:7.5mm}body{margin:0}svg{width:195mm;height:auto;display:block}</style>${markerSheetSvg()}`;
}
