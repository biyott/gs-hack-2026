import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const output = resolve(process.argv[2] ?? "tests/frontend/artifacts/harness-lazy-image");
await mkdir(output, { recursive: true });
const server = createServer((request, response) => {
  if (request.url === "/image.svg") {
    response.writeHead(200, { "Content-Type": "image/svg+xml" });
    response.end('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"><rect width="120" height="80" fill="teal"/></svg>');
    return;
  }
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  response.end('<!doctype html><html lang="en"><head><title>Native lazy image self-check</title><link rel="icon" href="data:,"></head><body><h1>Native lazy image self-check</h1><div style="height:6000px"></div><img loading="lazy" src="/image.svg" width="120" height="80" alt="Harness-only test image"></body></html>');
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
try {
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Missing local server port");
  const scenarioPath = join(output, "scenario.json");
  await writeFile(scenarioPath, JSON.stringify({
    buildType: "harness-only-fixture", settleImages: true,
    sourceScope: ["tests/frontend/run-surface.mjs", "tests/frontend/browser-observations.mjs"],
    viewports: [{ width: 375, height: 812 }],
    routes: [{ id: "harness-self-check", path: "/", readySelector: "h1", states: [{ id: "native-lazy-image" }] }],
  }, null, 2));
  const child = spawn(process.execPath, ["tests/frontend/run-surface.mjs", "--base-url", `http://127.0.0.1:${address.port}`, "--scenario", scenarioPath, "--output-dir", output], { stdio: ["ignore", "pipe", "pipe"] });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => { stdout += chunk; });
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  const exitCode = await new Promise((done, reject) => { child.on("error", reject); child.on("close", done); });
  const report = JSON.parse(await readFile(join(output, "report.json"), "utf8"));
  const capture = report.captures[0];
  const asset = capture.observations.resources.find((entry) => new URL(entry.name).pathname === "/image.svg");
  const pass = exitCode === 0 && report.verdict === "PASS" && capture.observations.brokenImages.length === 0 && asset?.decodedBodySize > 0;
  const result = { kind: "harness-regression-only", pass, expected: "A valid offscreen native-lazy image loads before full-page capture", observed: { exitCode, verdict: report.verdict, brokenImages: capture.observations.brokenImages, imageResource: asset ?? null }, stdout, stderr };
  await writeFile(join(output, "self-check.json"), `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
  if (!pass) process.exitCode = 1;
} finally {
  server.closeAllConnections();
  await new Promise((done) => server.close(done));
}
