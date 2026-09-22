import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { build } from "esbuild";
import { chromium } from "playwright";
import { instrumentAudio } from "./alert-audio-instrumentation.mjs";
import { runAudioScenarios } from "./alert-audio-scenarios.mjs";

const label = process.argv[2] ?? "green";
const scenarioFilter = process.argv[3];
const sourceFiles = [
  "src/client/use-alert-audio.ts",
  "src/client/alert-policy.ts",
  "src/client/store.ts",
];
const sourceHashes = Object.fromEntries(
  await Promise.all(
    sourceFiles.map(async (path) => [
      path,
      createHash("sha256")
        .update(await readFile(path))
        .digest("hex"),
    ]),
  ),
);
const bundle = await build({
  entryPoints: ["tests/frontend/alert-audio-entry.tsx"],
  bundle: true,
  write: false,
  platform: "browser",
  format: "iife",
  define: { "process.env.NODE_ENV": '"development"' },
});
const javascript = bundle.outputFiles[0]?.text;
assert.ok(javascript);
const server = createServer((request, response) => {
  response.setHeader(
    "Content-Type",
    request.url === "/bundle.js" ? "text/javascript" : "text/html",
  );
  response.end(
    request.url === "/bundle.js"
      ? javascript
      : '<!doctype html><html lang="en"><title>Audio lifecycle harness</title><div id="root"></div><script src="/bundle.js"></script></html>',
  );
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
assert.ok(address && typeof address !== "string");
const browser = await chromium.launch({
  executablePath: "/home/b/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome",
  headless: true,
  args: ["--no-sandbox"],
});
const results = [];
const now = new Date("2026-09-21T12:00:00.000Z");
const publish = (page, input) =>
  page.evaluate((value) => window.alertHarness.publish(value), input);
const events = (page) => page.evaluate(() => window.audioProbe.events);
async function scenario(name, exercise) {
  if (scenarioFilter && !name.includes(scenarioFilter)) return;
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.clock.install({ time: now });
  await page.clock.pauseAt(now);
  await page.addInitScript(instrumentAudio);
  await page.goto(`http://127.0.0.1:${address.port}`, { waitUntil: "load" });
  await page.getByRole("button", { name: "Sound off" }).click();
  await publish(page, { empty: true });
  await page.evaluate(() => window.audioProbe.clear());
  try {
    await exercise(page);
    assert.deepEqual(errors, []);
    results.push({ name, status: "pass", events: await events(page) });
  } catch (error) {
    if (!(error instanceof Error)) throw error;
    results.push({
      name,
      status: "fail",
      error: error.message,
      events: await events(page),
      errors,
    });
  } finally {
    await page.close();
  }
}
try {
  await runAudioScenarios(scenario);
} finally {
  await browser.close();
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}
await mkdir(".omo/evidence/alert-audio", { recursive: true });
await writeFile(
  `.omo/evidence/alert-audio/browser-${label}.json`,
  JSON.stringify(
    {
      capturedAt: new Date().toISOString(),
      chromiumVersion: browser.version(),
      sourceHashes,
      limitation:
        "Synthetic platform audio instrumentation; actual Chromium hook/store lifecycle, no physical audio claim.",
      results,
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify(
    results.map(({ name, status, error }) => ({ name, status, error })),
    null,
    2,
  ),
);
if (results.some((result) => result.status === "fail")) process.exitCode = 1;
