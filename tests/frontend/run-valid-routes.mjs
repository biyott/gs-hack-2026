import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { pathToFileURL } from "node:url";
import { loadPlaywright, launchBrowser } from "./browser-runtime.mjs";
import { sourceFingerprint, validatePng, inspectPage } from "./browser-observations.mjs";
import { monitor, warmPage, switchView, assertEvents, redact } from "./valid-route-browser.mjs";
import { performAction } from "./browser-actions.mjs";
import { readSnapshot, validatedRoutes, sameRoutes, matchSvg, surfaceEvidence, matchSurface, parseRelease } from "./valid-route-evidence.mjs";

const HELP = `Usage: QA_DEMO_ACCESS_CODE=<private> node tests/frontend/run-valid-routes.mjs
  --base-url URL --source-root PATH --build-id ID --output-dir NEW_PATH --handoff-dir PATH
  [--handoff-timeout-ms 300000]
Requires an already released production candidate. This runner never refreshes fixtures.
Each width emits READY_FOR_FIXTURE_REFRESH and waits for its nonce-specific release JSON.
Eight viewport frames: 1440x900 then 390x844; equipment 2D/3D, fire-gas 2D/3D.
Mechanical success remains REVIEW_REQUIRED until the actual 3D route lines receive visual review.
`;
const VIEWPORTS = [{ width: 1440, height: 900 }, { width: 390, height: 844 }];
const MODES = ["equipment", "fire-gas"];
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;

function options(args) {
  const result = {};
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    if (!["--base-url", "--source-root", "--build-id", "--output-dir", "--handoff-dir", "--handoff-timeout-ms"].includes(key)) throw new Error(`Unknown option: ${key}`);
    const value = args[index + 1];
    if (!value || value.startsWith("--") || result[key]) throw new Error(`Missing or duplicated option: ${key}`);
    result[key] = value;
  }
  for (const key of ["--base-url", "--source-root", "--build-id", "--output-dir", "--handoff-dir"]) {
    if (!result[key]) throw new Error(`${key} is required.`);
  }
  const url = new URL(result["--base-url"]);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== "/") throw new Error("Use the preview HTTP(S) origin without credentials, query, or fragment.");
  const timeoutMs = Number(result["--handoff-timeout-ms"] ?? 300000);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 600000) throw new Error("Handoff timeout must be 1000–600000 ms.");
  if (!process.env.QA_DEMO_ACCESS_CODE) throw new Error("QA_DEMO_ACCESS_CODE must be supplied privately.");
  return { baseUrl: url.href, sourceRoot: resolve(result["--source-root"]), buildId: result["--build-id"], outputDir: resolve(result["--output-dir"]), handoffDir: resolve(result["--handoff-dir"]), timeoutMs };
}

async function handoff(options, window) {
  const stem = `${window.viewport.width}x${window.viewport.height}-${randomUUID()}`;
  const ready = { event: "READY_FOR_FIXTURE_REFRESH", nonce: stem.slice(stem.indexOf("-") + 1), viewport: window.viewport, readyAt: new Date().toISOString(), buildId: options.buildId, modes: MODES };
  const readyPath = join(options.handoffDir, `${stem}.ready.json`);
  const releasePath = join(options.handoffDir, `${stem}.release.json`);
  Object.assign(window, { ready, readyPath, releasePath });
  await writeFile(readyPath, json(ready), { flag: "wx" });
  console.log(json({ ...ready, readyPath, releasePath }).trim());
  const deadline = Date.now() + options.timeoutMs;
  while (Date.now() < deadline) {
    let contents;
    try { contents = await readFile(releasePath, "utf8"); }
    catch (error) { if (error.code !== "ENOENT") throw error; }
    if (contents !== undefined) {
      window.release = parseRelease(JSON.parse(contents), ready);
      return ready;
    }
    await delay(200);
  }
  throw new Error("Fixture-owner release timed out; no fixture writes were sent.");
}

async function awaitFresh(session, ready) {
  const deadline = Date.now() + 15000;
  let lastError;
  while (Date.now() < deadline) {
    const snapshot = await readSnapshot(session.page, session.mode);
    try {
      validatedRoutes(snapshot, { readyAt: ready.readyAt, at: Date.now() });
      await session.page.waitForFunction((run) => document.querySelector(".workspace-footer .mono")?.textContent?.trim() === run.runId && document.querySelector(".status-strip-version")?.textContent?.trim().endsWith(`· v${run.version}`), snapshot.run, { timeout: 1000 });
      return;
    } catch (error) { lastError = redact(error.message); }
    await delay(100);
  }
  throw new Error(`Fresh guidance/UI did not arrive: ${lastError}`);
}

async function captureFrame(session, request, report) {
  const { ready, view, viewport, outputDir, paired } = request;
  const page = session.page;
  const frame = { id: `${session.mode}-valid-route-${view}-${viewport.width}x${viewport.height}`, mode: session.mode, view, viewport, verdict: "FAIL", readyAt: ready.readyAt };
  report.captures.push(frame);
  try {
    await switchView(page, view);
    frame.authoritativeBefore = await readSnapshot(page, session.mode);
    if (frame.authoritativeBefore.equipment.presetId !== session.warm.snapshot.equipment.presetId) throw new Error("Equipment changed after asset warming; begin a new readiness window.");
    const routes = validatedRoutes(frame.authoritativeBefore, { readyAt: ready.readyAt, at: Date.now() });
    if (paired) sameRoutes(paired.routes, routes);
    frame.surfaceBefore = await surfaceEvidence(page);
    matchSurface(frame.authoritativeBefore, frame.surfaceBefore);
    if (view === "2d") {
      matchSvg(routes, frame.surfaceBefore.svgRoutes);
      frame.mapScale = await performAction(page, { kind: "expect-map-scale", selector: "[data-testid='map-scale-label']" });
    }
    frame.routes = routes;
    frame.observations = await inspectPage(page);
    if (frame.observations.horizontalOverflow || frame.observations.brokenImages.length) throw new Error("Layout overflow or undecoded image detected.");
    assertEvents(session.state);
    frame.screenshotStartedAt = new Date().toISOString();
    validatedRoutes(frame.authoritativeBefore, { readyAt: ready.readyAt, at: Date.parse(frame.screenshotStartedAt) });
    const path = join(outputDir, `${frame.id}.png`);
    await page.screenshot({ path, fullPage: false, caret: "initial" });
    frame.screenshotEndedAt = new Date().toISOString();
    frame.screenshot = await validatePng(path, viewport.width, viewport.height);
    validatedRoutes(frame.authoritativeBefore, { readyAt: ready.readyAt, at: Date.parse(frame.screenshotEndedAt) });
    if (!frame.screenshot.signatureValid || !frame.screenshot.dimensionsMatch) throw new Error("PNG validation failed.");
    frame.authoritativeAfter = await readSnapshot(page, session.mode);
    sameRoutes(routes, validatedRoutes(frame.authoritativeAfter, { readyAt: ready.readyAt, at: Date.parse(frame.screenshotEndedAt) }));
    frame.surfaceAfter = await surfaceEvidence(page);
    matchSurface(frame.authoritativeAfter, frame.surfaceAfter);
    if (view === "2d") matchSvg(routes, frame.surfaceAfter.svgRoutes);
    frame.remainingLifetimeMs = routes.map(({ workerId, currentGuidance }) => ({ workerId, start: Date.parse(currentGuidance.expiresAt) - Date.parse(frame.screenshotStartedAt), end: Date.parse(currentGuidance.expiresAt) - Date.parse(frame.screenshotEndedAt) }));
    frame.routeProof = view === "2d" ? { kind: "authoritative-svg-points", visualReview: "PENDING" } : { kind: "manual-visible-3d-line-review", status: "PENDING", paired2d: paired.id, machineReadableThreeRouteIdentity: false, transform: "[waypoint.x, 0.5, -waypoint.y]" };
    assertEvents(session.state);
    frame.verdict = "MECHANICAL_PASS";
    return frame;
  } catch (error) { frame.error = redact(error.message); throw error; }
  finally {
    frame.events = structuredClone(session.state.events);
    await writeFile(join(outputDir, `${frame.id}.json`), json(frame), { flag: "wx" });
  }
}

async function main() {
  if (process.argv.slice(2).includes("--help")) { console.log(HELP); return; }
  const config = options(process.argv.slice(2));
  await mkdir(dirname(config.outputDir), { recursive: true });
  await mkdir(config.outputDir);
  const report = { kind: "production-valid-route-evidence", buildType: "production", baseUrl: config.baseUrl, sourceRoot: config.sourceRoot, expectedBuildId: config.buildId, startedAt: new Date().toISOString(), windows: [], captures: [], errors: [], browserLaunched: false, browserClosed: false, productAcceptance: "NOT_RUN", visualReview: "PENDING", limitations: ["BUILD_ID verifies the supplied source tree; preview deployment provenance still requires the server owner's candidate manifest.", "Anonymous Drei lines require independent inspection of visible 3D routes against paired 2D/server evidence; canvas presence is not route proof.", "Unexpected writes are blocked and fail the run. Responses are not mocked or substituted.", "No fixture writes, DOM injection, timestamp changes, physical devices, or independent G0 acceptance are provided."], sourceReferences: ["app/api/simulation/route.ts", "src/components/scene/scene-data.ts", "src/components/scene/geometry.ts", "src/components/scene/SceneOverlays.tsx", "packages/contracts/src/coordinates.ts"] };
  let browser;
  const openSessions = new Set();
  try {
    report.sourceBefore = await sourceFingerprint(config.sourceRoot);
    report.observedBuildId = (await readFile(join(config.sourceRoot, ".next/BUILD_ID"), "utf8")).trim();
    if (report.observedBuildId !== config.buildId) throw new Error("Actual .next/BUILD_ID differs from --build-id.");
    await mkdir(config.handoffDir, { recursive: true });
    browser = await launchBrowser((await loadPlaywright()).chromium);
    report.browserLaunched = true;
    report.browserVersion = browser.version();
    for (const viewport of VIEWPORTS) {
      const window = { viewport, sessions: [] };
      report.windows.push(window);
      const sessions = [];
      for (const mode of MODES) {
        const context = await browser.newContext({ viewport, deviceScaleFactor: 1, locale: "ko-KR" });
        const session = { context, page: await context.newPage(), mode };
        openSessions.add(session);
        session.page.setDefaultTimeout(15000);
        session.state = monitor(session.page, { baseUrl: config.baseUrl, mode });
        const stored = { mode, events: session.state.events };
        window.sessions.push(stored);
        stored.warm = await warmPage(session, { baseUrl: config.baseUrl, mode });
        session.warm = stored.warm;
        sessions.push(session);
      }
      const ready = await handoff(config, window);
      for (const session of sessions) {
        await awaitFresh(session, ready);
        await session.page.locator("select[aria-label='카메라 모드']").selectOption("full");
        await session.page.locator(".site-stage__viewport[data-camera-mode='full']").waitFor();
        const paired = await captureFrame(session, { ready, view: "2d", viewport, outputDir: config.outputDir }, report);
        await captureFrame(session, { ready, view: "3d", viewport, outputDir: config.outputDir, paired }, report);
      }
      for (const session of sessions) {
        session.state.phase = "closing";
        await session.context.close();
        openSessions.delete(session);
        assertEvents(session.state);
      }
      window.closedAt = new Date().toISOString();
    }
  } catch (error) { report.errors.push(redact(error.message)); }
  finally {
    for (const session of openSessions) {
      if (session.state) session.state.phase = "closing";
      await session.context.close().catch((error) => report.errors.push(redact(error.message)));
    }
    if (browser) await browser.close().then(() => { report.browserClosed = true; }, (error) => report.errors.push(redact(error.message)));
    report.sourceAfter = await sourceFingerprint(config.sourceRoot).catch((error) => { report.errors.push(redact(error.message)); return null; });
    report.sourceChangedDuringCapture = !report.sourceBefore || !report.sourceAfter || report.sourceBefore.sha256 !== report.sourceAfter.sha256;
    report.browserClosedAt = report.browserClosed ? new Date().toISOString() : null;
    report.completedAt = new Date().toISOString();
    const unexpectedEvents = report.windows.some((window) => window.sessions.some((session) => session.events.some((event) => !event.expected)));
    report.automatedVerdict = report.errors.length || unexpectedEvents || report.sourceChangedDuringCapture || report.captures.length !== 8 || report.captures.some((frame) => frame.verdict !== "MECHANICAL_PASS") ? "FAIL" : "PASS";
    report.verdict = report.automatedVerdict === "PASS" ? "REVIEW_REQUIRED" : "FAIL";
    await writeFile(join(config.outputDir, "report.json"), json(report), { flag: "wx" });
    console.log(json({ verdict: report.verdict, captures: report.captures.length, browserClosed: report.browserClosed, report: join(config.outputDir, "report.json") }).trim());
    if (report.automatedVerdict === "FAIL") process.exitCode = 1;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => { console.error(redact(error.message)); process.exitCode = 1; });
}
