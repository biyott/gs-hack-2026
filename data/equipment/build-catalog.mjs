import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const run = "docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z";
const provenance = JSON.parse(
  fs.readFileSync(path.join(root, run, "evidence/research/manufacturer/manifest.json"), "utf8"),
).models;
const rectangle = (x0, y0, x1, y1) => [
  { x: x0, y: y0 },
  { x: x1, y: y0 },
  { x: x1, y: y1 },
  { x: x0, y: y1 },
];
const foot = (x, y, l, w) => ({
  part: "support",
  frame: "chassis",
  polygon: rectangle(x - l / 2, y - w / 2, x + l / 2, y + w / 2),
});
const body = (x0, y0, x1, y1) => ({
  part: "body",
  frame: "chassis",
  polygon: rectangle(x0, y0, x1, y1),
});
const noNodes = {
  slew: "SLEW",
  trolley: null,
  hook: null,
  ropes: null,
  boomPivot: null,
  boomSegments: [],
};
const noLimits = {
  tableSlewDeg: null,
  boomLengthM: null,
  boomAngleDeg: null,
  trolleyM: null,
  hookHeightM: null,
};
const base = (id, index, type, model, edition, url, pages, dimensions) => ({
  id,
  equipmentType: type,
  model,
  specEdition: edition,
  sourceUrl: url,
  sourcePage: pages,
  sourceSha256: provenance[index].sha256,
  lengthM: dimensions[0],
  widthM: dimensions[1],
  heightM: dimensions[2],
  dimensionState: "transport",
  sourceEvidence: [
    {
      sourceId: id,
      url,
      pages,
      sha256: provenance[index].sha256,
      reportPath: provenance[index].reportPath,
    },
  ],
  manufacturerEvidencePath: provenance[index].metadataPath,
  slewOrigin: { x: 0, y: 0, z: 0 },
  manufacturerSlewDatum: null,
  tailSwingRadiusM: null,
  assetUrl: `/assets/cranes/${id}.glb`,
  sourceBlend: "",
  controls: {
    translation: true,
    slew: true,
    boomAngle: false,
    boomLength: false,
    trolley: false,
    hook: false,
  },
  controlNodes: { ...noNodes },
  controlBaselines: {
    slewDeg: 0,
    trolleyM: null,
    hookHeightM: null,
    ropeTopM: null,
    ropeLengthM: null,
    boomAngleDeg: null,
    boomLengthM: null,
  },
  controlNotes:
    "Only declared controls are implemented. Geometry details are exterior visual approximations.",
  movementLimits: { ...noLimits },
  riskGeometry: null,
  riskGeometryStatus: "verified",
  riskGeometryNotes:
    "Chosen synthetic demonstration geometry separate from manufacturer safety limits. No load-capacity or ground-bearing claim.",
  visualizationNotes: [],
  verificationStatus: "production-in-progress",
});
const support = (
  kind,
  basis,
  width,
  length,
  front = null,
  rear = null,
  points = null,
  notes = "",
) => ({
  kind,
  coordinateBasis: basis,
  widthM: width,
  lengthM: length,
  frontWidthM: front,
  rearWidthM: rear,
  points,
  notes,
});
const boom = (length, jib, hook, angle, notes) => ({
  boomLengthM: length,
  jibLengthM: jib,
  hookHeightM: hook,
  angleDeg: angle,
  fixedJibM: null,
  notes,
});
const pose = (length, angle, trolley, hook) => ({
  boomLengthM: length,
  boomAngleDeg: angle,
  trolleyM: trolley,
  hookHeightM: hook,
  slewDeg: 0,
});
const sk = JSON.parse(fs.readFileSync("data/equipment/catalog.draft.json", "utf8")).equipment[0];
sk.sourceEvidence = [
  {
    sourceId: "SPIERINGS-LEGACY-60M",
    url: sk.sourceUrl,
    pages: sk.sourcePage,
    sha256: provenance[0].sha256,
    reportPath: provenance[0].reportPath,
  },
];
sk.manufacturerEvidencePath = provenance[0].metadataPath;
sk.movementLimits.hookHeightM = [1, 34];
sk.controlNotes =
  "Use glTF initial node transform plus difference from controlBaselines; hook localY += heightDelta; rope scaleY = initialScaleY*(18.52-heightDelta)/18.52. Chosen demo hook limit34m avoids trolley overlap; official rated hookmax35m remains separate.";
sk.riskGeometry = {
  presetId: sk.id,
  movable: true,
  parts: [
    body(-8.162, -1.57, 4.16, 1.57),
    ...sk.supportGeometry.points.map((p) => foot(p.x, p.y, 2.5, 1)),
    { part: "tail", frame: "upper", polygon: rectangle(-3.83, -1.4, 0, 1.4) },
    { part: "load", frame: "hook", polygon: rectangle(-0.55, -0.55, 0.55, 0.55) },
  ],
};
sk.riskGeometryStatus = "verified";
sk.riskGeometryNotes =
  "Chosen demo meshes: body lower-carrier envelope,4groundplates,low rotating ballast footprint,1.1m load footprint. Manufacturer tail radii are not substituted for static envelope. Max jib radius is not a hazard disk.";
const td = base(
  "tadano-gr250n4",
  1,
  "rough-terrain-crane",
  "Tadano GR-250N-4",
  "GR-250N-4-00101 /1609-01-05",
  "https://mediahub.tadano.com/m/20be7de269e4d894/original/doc_Tadano_GR250N-4_specsheet_korean-pdf-pdf.pdf",
  [1, 6, 8],
  [11.53, 2.62, 3.475],
);
td.supportGeometry = support(
  "X-outriggers",
  "centres",
  6.6,
  6.68,
  null,
  null,
  null,
  "Exact oriented pad centers unknown; official pad outer width7.18m separate. Visual offsets approximate. H-type excluded.",
);
td.tailSwingRadiusM = 3.1;
td.boomOrJibConfiguration = boom(
  null,
  null,
  31.3,
  null,
  "4section mainboom9.35–30.5m; chosen20m/50deg; noauxiliaryjib. Max radius27.9 andheight31.3 are separate limits.",
);
td.demoPose = pose(20, 50, null, 8);
td.sourceBlend = "resources/blender/safety-simulator/mobile-cranes/tadano-gr250n4.blend";
td.visualizationNotes = [
  "Source transport envelope differs from deployed pose",
  "Fore/aft support offsets and boom-section overlap are visual approximations",
  "Chosen luff, extension and hoist ranges are tested demo geometry, not mechanical operating limits",
];
const lt = base(
  "liebherr-ltm1050",
  2,
  "all-terrain-crane",
  "Liebherr LTM 1050-3.1",
  "lwe-td-185-02-defisr01-2023 /385-95R25",
  "https://assets-cdn.liebherr.com/versions/e57b2c0c-a794-4463-bfdc-40af69903c8d/original/",
  [3, 10, 23],
  [11.83, 2.55, 3.785],
);
lt.supportGeometry = support(
  "four-point-outriggers",
  "centres",
  6.4,
  7.151,
  null,
  null,
  null,
  "Toprow7.151,bottomrow7.169m; exact transverse datum not confirmed. Do not use centered rectangle as official geometry.",
);
lt.boomOrJibConfiguration = boom(
  null,
  null,
  null,
  null,
  "Mainboom11.4–38m; chosen26m/50deg. Optional maxima radius44m/hook54m do not describe main-boom-only pose.",
);
lt.demoPose = pose(26, 50, null, 10);
lt.sourceBlend = "resources/blender/safety-simulator/mobile-cranes/liebherr-ltm1050.blend";
lt.visualizationNotes = [
  "Selected transport385/95R25 unlowered;12.391 accessory/3.835 alternative excluded",
  "Tail radius null:3.53/4.07 labels require accessory interpretation",
  "Visual transverse support symmetry explicitly approximated",
];
const ma = base(
  "maeda-mc305",
  3,
  "spider-crane",
  "Maeda MC305C-5",
  "Metric CE MC305C-5",
  "https://www.maeda-minicranes.com/assets/pdf/mc305c-5_printdata_ce.pdf",
  [1, 2],
  [4.11, 1.28, 1.695],
);
ma.sourceEvidence.push({
  sourceId: "M-C2-MC305C-5-BOOM-CONSTRUCTION",
  url: "https://www.maeda-minicranes.com/download/files/MC305C-5.pdf",
  pages: [2],
  sha256: "10ea95a9f92dc35f864b16138bfb723f6ec5a568abbac6c7cea608ecbfaa1a55",
  reportPath: `${run}/research/manufacturer/compact/maeda/README.md`,
});
ma.supportGeometry = support(
  "four-slanted-outriggers",
  "pad-outer",
  null,
  5.17,
  4.808,
  4.704,
  null,
  "Official outerpad dimensions; model0.28m squarepad centerlocations inferred to preserve envelope, not official centers.",
);
ma.boomOrJibConfiguration = boom(
  null,
  null,
  12.52,
  null,
  "Chosen10m/55deg mainboom. Maximum working radius12.16m andliftheight12.52m are distinct.",
);
ma.demoPose = pose(10, 55, null, 3);
ma.sourceBlend = "resources/blender/safety-simulator/maeda-site/maeda/maeda-mc305.blend";
ma.visualizationNotes = [
  "Pad centers reconstructed from official outerenvelope using approximate0.28m squares",
  "Small full-scale model never enlarged to phone size",
  "Five pentagonal principal boom shells (one fixed and four moving) follow the matching global MC305C-5 brochure p2; CE transport dimensions retain their separate source.",
  "Individual section lengths and representative pentagonal profiles are authored demo geometry, not verified OEM face angles, wall thicknesses or tolerances. The 10m baseline, 8–10.6m range and existing tip/hook law remain unchanged.",
];
const lr = base(
  "liebherr-lr1100",
  4,
  "crawler-crane",
  "Liebherr LR 1100.1",
  "Official EN-US LR1100.1 fixed32m mainboom",
  "https://www.liebherr.com/shared/media/mobile-and-crawler-cranes/brochures/crawler-cranes-up-to-300-tonnnes/data-sheets/lr/liebherr-lr-1100-crawler-crane-technical-data-sheet-specifications-usa.pdf",
  [8, 14],
  [6.6, 5.0, null],
);
lr.dimensionState = "working";
lr.supportGeometry = support(
  "crawler-tracks",
  "undercarriage",
  5,
  6.6,
  null,
  null,
  null,
  "Tracklength6.275m; platforms totalwidth5.535m separate;11.48m includes loweredboom not chassis.",
);
lr.tailSwingRadiusM = 4.7;
lr.boomOrJibConfiguration = boom(
  32,
  null,
  null,
  60,
  "32m=5.5+6+12+8.5m, nofixedjib;60deg chosen demoangle.",
);
lr.demoPose = pose(32, 60, null, null);
lr.sourceBlend = "resources/blender/safety-simulator/lattice-cranes/liebherr-lr1100.blend";
lr.visualizationNotes = [
  "Rounded manufacturer imperial dimensions maintained asapproximate",
  "Exterior lattice,cab andconnection details inferred",
  "Boom-foot forward offset uses EN p8 1200 mm = 1.2 m; the matching EN-US p8 label is 3 ft 11 in (1.1938 m literal conversion). Pivot height remains an unconfirmed visual fitting value.",
];
lr.sourceSha256 = "d0398be38dcc2c12ae0b8e5dc6e2b12b822184fc606011b0aa672179a6ae8e26";
lr.sourceEvidence[0].sha256 = lr.sourceSha256;
lr.sourceEvidence.push({
  sourceId: "LIEBHERR-LR1100-METRIC-EN",
  url: "https://www.liebherr.com/shared/media/mobile-and-crawler-cranes/brochures/crawler-cranes-up-to-300-tonnnes/data-sheets/lr/liebherr-lr-1100-crawler-crane-technical-data-sheet-specifications-english.pdf",
  pages: [8, 14],
  sha256: provenance[4].sha256,
  reportPath: provenance[4].reportPath,
});
const tw = base(
  "liebherr-172ecb",
  5,
  "fixed-tower-crane",
  "Liebherr 172 EC-B 8 Litronic",
  "2025-02 /16HC175 /UC-0460m /50m jib /42.3m hook",
  "https://assets-cdn.liebherr.com/versions/e947e028-e7d0-4341-b16a-15cb83217ac4/original/",
  [4, 6, 8],
  [null, null, null],
);
tw.dimensionState = "working";
tw.controls = {
  translation: false,
  slew: true,
  boomAngle: false,
  boomLength: false,
  trolley: true,
  hook: true,
};
tw.supportGeometry = support(
  "UC-0460m-rail-undercarriage",
  "unknown",
  4.6,
  null,
  null,
  null,
  null,
  "4.6m nominalsupportwidth not verified complete outerfootprint. Exact oriented supportpolygon unknown; visualbase schematic.",
);
tw.boomOrJibConfiguration = boom(
  null,
  50,
  42.3,
  0,
  "16HC175 towerwidth1.8m/standardsections2.5m;11-rowfirstcolumn starredhook42.3m;physicaljibextent51.5m;counterjib14.5m. Hookheight not totalsteelheight.",
);
tw.demoPose = pose(50, 0, 25, 18);
tw.sourceBlend = "resources/blender/safety-simulator/lattice-cranes/tower172/liebherr-172ecb.blend";
tw.visualizationNotes = [
  "Fixed origin is demo policy despite rail undercarriage reference",
  "Basefloor footprint visualapproximation not foundation design",
];
tw.demoPose = pose(50, 0, 30, 18.8);
tw.sourceBlend = "resources/blender/safety-simulator/lattice-cranes/liebherr-172ecb.blend";
tw.controlNodes = { ...noNodes, trolley: "TROLLEY", hook: "HOOK", ropes: "HOIST_ROPES" };
tw.movementLimits = { ...noLimits, trolleyM: [3, 50], hookHeightM: [2, 42.3] };
tw.controlNotes =
  "glTF initial transforms plus delta from demoPose: TROLLEY x += trolleyDelta; HOOK y += hookHeightDelta; HOIST_ROPES y scale=initial*(24.73-hookHeightDelta)/24.73. SLEW authoredheight44.5; trolley0.5 above; hook local-26.2 => world18.8. Original42.3 max hook is not steel height.";
tw.controlBaselines = { ...tw.controlBaselines, ...tw.demoPose };
tw.controlBaselines.ropeTopM = 44.68;
tw.controlBaselines.ropeLengthM = 24.73;
sk.articulation = null;
tw.articulation = null;
const rigFields = [
  "articulation",
  "demoPose",
  "movementLimits",
  "controlBaselines",
  "controls",
  "controlNodes",
  "controlNotes",
];
const assetRoot = "resources/blender/safety-simulator";
for (const [item, fragmentPath] of [
  [td, "mobile-cranes/tadano-gr250n4-rig.json"],
  [lt, "mobile-cranes/liebherr-ltm1050-rig.json"],
  [ma, "maeda-site/maeda/rig-catalog.json"],
  [lr, "lattice-cranes/liebherr-lr1100-rig.json"],
]) {
  const fragment = JSON.parse(fs.readFileSync(path.join(assetRoot, fragmentPath), "utf8"));
  for (const field of rigFields) {
    if (!(field in fragment)) throw new Error(`Missing rig field ${field} in ${fragmentPath}`);
    item[field] = fragment[field];
  }
  item.movementLimits.tableSlewDeg = null;
}
for (const item of [sk, td, lt, ma, lr, tw])
  item.verificationStatus = "blender-export-reimport-verified";
const load = (offset = 0, r = 0.5) => ({
  part: "load",
  frame: "hook",
  polygon: rectangle(offset - r, -r, offset + r, r),
});
const tail = (x0, y0, x1, y1) => ({
  part: "tail",
  frame: "upper",
  polygon: rectangle(x0, y0, x1, y1),
});
td.riskGeometry = {
  presetId: td.id,
  movable: true,
  parts: [
    body(-3.2, -1.31, 3.7, 1.31),
    ...[
      [3.45, -3.3],
      [-3.23, -3.3],
      [3.23, 3.3],
      [-3.45, 3.3],
    ].map((p) => foot(...p, 0.58, 0.58)),
    tail(-2.63, -1.095, -1.41, 1.295),
    load(-1.1, 0.36),
  ],
};
lt.riskGeometry = {
  presetId: lt.id,
  movable: true,
  parts: [
    body(-3.3725, -1.275, 5.9325, 1.275),
    ...[
      [4.526, 3.2],
      [-2.625, 3.2],
      [4.274, -3.2],
      [-2.895, -3.2],
    ].map((p) => foot(...p, 0.5, 0.5)),
    tail(-2.63, -1.095, -1.41, 1.295),
    load(-1.8, 0.36),
  ],
};
ma.riskGeometry = {
  presetId: ma.id,
  movable: true,
  parts: [
    body(-1.445, -0.64, 1.205, 0.64),
    ...[
      [2.445, 2.264],
      [2.445, -2.264],
      [-2.445, 2.212],
      [-2.445, -2.212],
    ].map((p) => foot(...p, 0.28, 0.28)),
    tail(-1.27, -0.70601, 0.62, 0.45),
    load(0, 0.25),
  ],
};
lr.riskGeometry = {
  presetId: lr.id,
  movable: true,
  parts: [
    body(-3.3, -2.5, 3.3, 2.5),
    foot(0, 2.05, 6.275, 0.9),
    foot(0, -2.05, 6.275, 0.9),
    tail(-4.7, -2.7675, 2.75, 2.7675),
    load(1.2, 0.45),
  ],
};
tw.riskGeometry = {
  presetId: tw.id,
  movable: false,
  parts: [
    body(-0.9, -0.9, 0.9, 0.9),
    foot(0, 0, 6.4, 5.38),
    tail(-14.6, -1.11, -0.9, 1.11),
    load(0, 0.5),
  ],
};
const catalog = {
  schemaVersion: "1.0.1",
  units: "metres",
  coordinateSystem: "map-xy-z-up",
  equipment: [sk, td, lt, ma, lr, tw],
};
fs.writeFileSync("data/equipment/catalog.json", `${JSON.stringify(catalog, null, 2)}\n`);
console.log("Wrote six-entry catalog; production/engine verification remains explicit");
