import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";

const [assetPath, reportPath] = process.argv.slice(2);
assert(assetPath && reportPath, "Expected GLB path and a fresh JSON report path");
const startedAt = new Date().toISOString();
const started = performance.now();
const bytes = fs.readFileSync(assetPath);
assert.equal(bytes.toString("ascii", 0, 4), "glTF");
const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
const node = (name) => {
  const found = gltf.nodes.find((entry) => entry.name === name);
  assert(found, `Missing ${name}`);
  return found;
};
const root = node("ROOT");
const slew = node("SLEW");
const pivot = node("BOOM_PIVOT");
const tip = node("BOOM_TIP");
const hook = node("HOOK");
const index = (entry) => gltf.nodes.indexOf(entry);
assert(root.children.includes(index(slew)));
assert(slew.children.includes(index(pivot)));
assert(slew.children.includes(index(hook)));
assert(pivot.children.includes(index(tip)));
assert.deepEqual(root.translation ?? [0, 0, 0], [0, 0, 0]);
for (const entry of [root, slew, pivot, tip, hook]) {
  assert.deepEqual(entry.scale ?? [1, 1, 1], [1, 1, 1]);
  assert.equal(entry.matrix, undefined);
}
for (const entry of [root, slew]) {
  assert.deepEqual(entry.rotation ?? [0, 0, 0, 1], [0, 0, 0, 1]);
}
assert.equal(slew.translation[0], 0);
assert.equal(slew.translation[2], 0);
assert.deepEqual(tip.translation, [32, 0, 0]);
const expectedForwardM = 1.2;
const actualForwardM = pivot.translation[0];
const errorM = actualForwardM - expectedForwardM;
const passed = Math.abs(errorM) < 0.00001;
const report = {
  startedAt,
  finishedAt: new Date().toISOString(),
  elapsedMs: performance.now() - started,
  method: "Node built-in GLB JSON parse and numeric assertions; no Blender/browser/runtime",
  assetPath,
  sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
  manufacturerDatum: {
    source: "LR 1100.1 EN 8503.02.03 v01.092022, page 8, 1200* boom pivot point",
    sourceSha256: "843ac3a7fb711bd2fede5dc5f5ba2b2798cfbf3cb52faeff4515cacf1e082e52",
    metricForwardM: expectedForwardM,
    sameFamilyUsLabel: "3 ft 11 in*",
    usLiteralConversionM: 1.1938,
    note: "Preserved unit-edition distinction; 1.2 m is the published metric datum. No new physical-precision requirement.",
  },
  actualForwardM,
  errorM,
  rootTranslation: root.translation ?? [0, 0, 0],
  slewTranslation: slew.translation,
  pivotTranslation: pivot.translation,
  hookTranslation: hook.translation,
  compensationFound: false,
  scope: "Functional boom-foot horizontal datum only; unknown manufacturer pivot height is not asserted",
  status: passed ? "passed" : "failed",
};
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
console.log(JSON.stringify(report));
assert(passed, `Published boom-foot offset is 1.2 m; GLB contains ${actualForwardM} m`);
