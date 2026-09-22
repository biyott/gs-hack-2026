import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const output = resolve(process.argv[2] ?? "tests/frontend/artifacts/harness-request-failure");
await mkdir(output, { recursive: true });
const server = createServer((request, response) => {
  if (request.url === "/abort") {
    response.writeHead(200, { "Content-Type": "text/plain" });
    response.write("pending");
    return;
  }
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  response.end(`<!doctype html><html lang="en"><head><title>Harness self-check</title><link rel="icon" href="data:,"></head><body><h1>Request failure self-check</h1><script>
    const controller = new AbortController();
    fetch('/abort', {signal: controller.signal}).then(async response => {
      controller.abort();
      try { await response.text(); } catch {}
      setTimeout(() => { document.body.dataset.ready = 'true'; }, 100);
    });
  </script></body></html>`);
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
try {
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Missing local server port");
  const scenarioPath = join(output, "scenario.json");
  await writeFile(scenarioPath, JSON.stringify({
    buildType: "harness-only-fixture",
    sourceScope: ["tests/frontend/run-surface.mjs", "tests/frontend/browser-observations.mjs"],
    viewports: [{ width: 375, height: 812 }],
    routes: [{ id: "harness-self-check", path: "/", readySelector: "body[data-ready='true']", states: [{ id: "aborted-request" }] }],
  }, null, 2));
  const child = spawn(process.execPath, ["tests/frontend/run-surface.mjs", "--base-url", `http://127.0.0.1:${address.port}`, "--scenario", scenarioPath, "--output-dir", output], { stdio: ["ignore", "pipe", "pipe"] });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => { stdout += chunk; });
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  const exitCode = await new Promise((done, reject) => { child.on("error", reject); child.on("close", done); });
  const report = JSON.parse(await readFile(join(output, "report.json"), "utf8"));
  const capture = report.captures[0];
  const pass = exitCode === 1 && report.verdict === "FAIL" && capture.events.requestFailures.length === 1 && capture.events.consoleErrors.length === 0 && capture.events.pageErrors.length === 0;
  const result = { kind: "harness-regression-only", pass, expected: "An aborted unallowlisted request fails the runner without console/page errors", observed: { exitCode, verdict: report.verdict, requestFailures: capture.events.requestFailures, consoleErrors: capture.events.consoleErrors, pageErrors: capture.events.pageErrors }, stdout, stderr };
  await writeFile(join(output, "self-check.json"), `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
  if (!pass) process.exitCode = 1;
} finally {
  server.closeAllConnections();
  await new Promise((done) => server.close(done));
}
