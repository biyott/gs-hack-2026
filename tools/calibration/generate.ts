import { mkdir, writeFile } from "node:fs/promises";
import { markerSheetHtml, markerSheetSvg, markerSvg, TRACKING_MARKERS } from "./markers";

await mkdir("public/markers", { recursive: true });
await Promise.all([
  ...Object.keys(TRACKING_MARKERS).map((id) =>
    writeFile(`public/markers/marker-${id}.svg`, markerSvg(Number(id))),
  ),
  writeFile("public/markers/index.html", markerSheetHtml()),
  writeFile("public/markers/sheet.html", markerSheetHtml()),
  writeFile("public/markers/tracking-sheet.svg", markerSheetSvg()),
]);
