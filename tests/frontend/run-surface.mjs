import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { loadPlaywright, launchBrowser } from "./browser-runtime.mjs";
import { performAction } from "./browser-actions.mjs";
import { walkFocusedTarget } from "./focused-scroll.mjs";
import { inspectPage, settleImages, sourceFingerprint, validatePng } from "./browser-observations.mjs";

const redactPrivateInput = (message) => String(message).replaceAll(process.env.QA_DEMO_ACCESS_CODE ?? "\0", "[REDACTED]");

const VIEWPORTS = [
  { width: 375, height: 812 }, { width: 390, height: 844 },
  { width: 768, height: 1024 }, { width: 1280, height: 720 }, { width: 1440, height: 900 },
];
const HELP = `Usage: node tests/frontend/run-surface.mjs --base-url http://127.0.0.1:3000 [options]
  --routes /,/design-system   Explicit route coverage; default /
  --scenario path.json       Route/state/action contract (see README.md)
  --build-type type          Declared development or production candidate
  --source-root path         Source tree served by the preview; default cwd
  --build-id value           Required matching .next/BUILD_ID for production
  --output-dir path          Default tests/frontend/artifacts/<UTC timestamp>
  --probe                    Runtime-only data page; never a product pass
  --validate-only            Parse contract locally without browser or requests
  --help                     Show this help
Browser: QA_BROWSER_CHANNEL or QA_BROWSER_EXECUTABLE; optional PLAYWRIGHT_MODULE_PATH.
`;

function options(args) {
  const values = {};
  for (let index = 0; index < args.length; index += 1) {
    const key = args[index];
    if (["--probe", "--help", "--validate-only"].includes(key)) values[key] = true;
    else if (["--base-url", "--routes", "--scenario", "--output-dir", "--build-type", "--source-root", "--build-id"].includes(key)) {
      const value = args[++index];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${key}`);
      values[key] = value;
    } else throw new Error(`Unknown option: ${key}`);
  }
  if (values["--build-type"] && !["development", "production"].includes(values["--build-type"])) throw new Error("--build-type must be development or production.");
  return values;
}

function validateContract(contract) {
  if (!Array.isArray(contract.routes) || !contract.routes.length) throw new Error("Scenario routes must be a nonempty array.");
  if (new Set(contract.routes.map(({ id }) => id)).size !== contract.routes.length) throw new Error("Route IDs must be unique to preserve evidence files.");
  for (const route of contract.routes) {
    if (!/^[a-z0-9-]+$/.test(route.id) || typeof route.path !== "string" || !route.path.startsWith("/")) throw new Error("Routes require a safe id and absolute path.");
    if (!Array.isArray(route.states) || !route.states.length) throw new Error(`No states supplied for ${route.id}`);
    if (new Set(route.states.map(({ id }) => id)).size !== route.states.length) throw new Error(`State IDs must be unique within ${route.id}.`);
    for (const state of route.states) {
      if (!/^[a-z0-9-]+$/.test(state.id)) throw new Error(`Invalid state id in ${route.id}`);
      if (state.afterActionMs !== undefined && (!Number.isFinite(state.afterActionMs) || state.afterActionMs < 0 || state.afterActionMs > 5000)) throw new Error("afterActionMs must be 0–5000.");
      if (state.focusTarget !== undefined && (![].concat(state.focusTarget).length || [].concat(state.focusTarget).some((selector) => typeof selector !== "string" || !selector.trim()))) throw new Error("focusTarget must contain nonempty selectors.");
    }
  }
  const viewports = contract.viewports ?? VIEWPORTS;
  if (!viewports.length || viewports.some(({ width, height }) => !Number.isInteger(width) || !Number.isInteger(height) || width < 200 || height < 200)) throw new Error("Invalid viewports.");
  if (new Set(viewports.map(({ width, height }) => `${width}x${height}`)).size !== viewports.length) throw new Error("Viewport dimensions must be unique to preserve evidence files.");
  return { ...contract, viewports };
}

async function main() {
  const args = options(process.argv.slice(2));
  if (args["--help"]) { console.log(HELP); return; }
  const probe = args["--probe"] === true;
  if (!probe && !args["--validate-only"] && !args["--base-url"]) throw new Error("--base-url is required for product captures.");
  const baseUrl = args["--base-url"] ?? "http://127.0.0.1";
  if (!["http:", "https:"].includes(new URL(baseUrl).protocol)) throw new Error("Use an HTTP(S) base URL.");
  const defaultRoutes = (args["--routes"] ?? "/").split(",").map((path, index) => ({ id: path === "/" ? "home" : `route-${index}`, path, states: [{ id: "rest" }] }));
  const contract = validateContract(args["--scenario"] ? JSON.parse(await readFile(args["--scenario"], "utf8")) : { routes: defaultRoutes });
  if (args["--build-type"]) contract.buildType = args["--build-type"];
  const expectedSemanticStates = contract.routes.reduce((count, route) => count + route.states.length * contract.viewports.length, 0);
  if (args["--validate-only"]) { console.log(JSON.stringify({ verdict: "CONTRACT_PARSED_ONLY", browserLaunched: false, expectedSemanticStates, viewports: contract.viewports, routes: contract.routes.map(({ id, states }) => ({ id, states: states.map(({ id, focusTarget }) => ({ id, focusTarget })) })) }, null, 2)); return; }
  const sourceRoot = resolve(args["--source-root"] ?? process.cwd());
  const buildId = await readFile(join(sourceRoot, ".next/BUILD_ID"), "utf8").then((value) => value.trim()).catch(() => null);
  if (contract.buildType === "production" && (!args["--build-id"] || buildId !== args["--build-id"])) throw new Error("Production capture requires --build-id matching the actual source-root .next/BUILD_ID.");
  if (contract.buildType === "production") {
    const actions = contract.routes.flatMap((route) => [...(route.setupActions ?? []), ...route.states.flatMap((state) => state.actions ?? [])]);
    for (const action of actions) if (action.valueEnv && !process.env[action.valueEnv]) throw new Error(`Production input requires environment variable ${action.valueEnv}; no credential fallback is used.`);
  }
  const startedAt = new Date().toISOString();
  const outputDir = resolve(args["--output-dir"] ?? join("tests/frontend/artifacts", startedAt.replace(/[:.]/g, "-")));
  await mkdir(outputDir, { recursive: true });
  if ((await readdir(outputDir)).length) throw new Error("Output directory is not empty; preserve previous evidence and choose a fresh path.");
  const before = await sourceFingerprint(sourceRoot, contract.sourceScope);
  const { chromium } = await loadPlaywright();
  const browser = await launchBrowser(chromium);
  const report = { kind: probe ? "runtime-readiness" : "producer-browser-check", buildType: contract.buildType ?? "unspecified", sourceRoot, buildId, suppliedBuildId: args["--build-id"] ?? null, startedAt, baseUrl: probe ? null : baseUrl, browserVersion: browser.version(), nodeVersion: process.version, contract, sourceBefore: before, semanticStates: [], expectedSemanticStates, captures: [], limitations: ["Build type and source root identify the supplied candidate; deployment provenance is supplied by the server owner, not inferred from browser rendering.", "Producer browser checks do not satisfy independent G0 acceptance.", "Screenshot layout/CJK/compositing requires independent visual review.", "No physical Android, UWB, camera accuracy, actual model, Blender-source or handoff evidence is produced."] };
  try {
    for (const viewport of contract.viewports) {
      for (const route of contract.routes) {
        const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: contract.reducedMotion ?? "no-preference", locale: "ko-KR" });
        const page = await context.newPage();
        page.setDefaultTimeout(15000);
        const events = { consoleErrors: [], pageErrors: [], requestFailures: [], httpErrors: [], mutations: [] };
        let currentState = null;
        const sameEndpoint = (url, path) => { try { const actual = new URL(url); return actual.origin === new URL(baseUrl).origin && actual.pathname === path; } catch { return false; } };
        page.on("console", (message) => {
          if (message.type() !== "error") return;
          const location = message.location();
          const expected = (contract.expectedHttpErrors ?? []).some((rule) => (!rule.beforeMutation || events.mutations.length === 0) && sameEndpoint(location.url, rule.path) && new RegExp(`\\b${rule.status}\\b`).test(message.text()) && events.consoleErrors.filter((event) => event.expected && event.location.url === location.url).length < (rule.maxOccurrences ?? 1));
          events.consoleErrors.push({ at: new Date().toISOString(), text: redactPrivateInput(message.text()), location, expected });
        });
        page.on("pageerror", (error) => events.pageErrors.push({ at: new Date().toISOString(), message: redactPrivateInput(error.message) }));
        page.on("requestfailed", (request) => {
          const error = request.failure()?.errorText;
          const expected = (contract.expectedRequestFailures ?? []).some((rule) => rule.state === currentState && rule.method === request.method() && rule.error === error && sameEndpoint(request.url(), rule.path) && Object.entries(rule.query ?? {}).every(([key, value]) => new URL(request.url()).searchParams.get(key) === value) && events.requestFailures.filter((event) => event.expected && event.state === rule.state && sameEndpoint(event.url, rule.path)).length < (rule.maxOccurrences ?? 1));
          events.requestFailures.push({ url: request.url(), method: request.method(), error, state: currentState, expected });
        });
        page.on("request", (request) => {
          if (["GET", "HEAD", "OPTIONS"].includes(request.method())) return;
          const allowed = contract.allowedMutations === undefined || contract.allowedMutations.some((rule) => rule.method === request.method() && sameEndpoint(request.url(), rule.path));
          events.mutations.push({ method: request.method(), url: request.url(), allowed });
        });
        page.on("response", (response) => {
          if (response.status() < 400) return;
          const method = response.request().method();
          const expected = (contract.expectedHttpErrors ?? []).some((rule) => (!rule.beforeMutation || events.mutations.length === 0) && rule.method === method && rule.status === response.status() && sameEndpoint(response.url(), rule.path) && events.httpErrors.filter((event) => event.expected && event.url === response.url()).length < (rule.maxOccurrences ?? 1));
          events.httpErrors.push({ url: response.url(), method, status: response.status(), expected });
        });
        let navigationError = null;
        try {
          if (probe) await page.setContent('<!doctype html><html lang="ko"><head><title>Browser readiness probe</title></head><body><main><h1>브라우저 실행 확인 / Browser runtime</h1><button type="button">실행 가능 / Ready</button></main></body></html>');
          else {
            const response = await page.goto(new URL(route.path, baseUrl).href, { waitUntil: "domcontentloaded" });
            if (!response?.ok()) throw new Error(`Navigation returned ${response?.status() ?? "no response"}`);
          }
          if (route.readySelector) await page.locator(route.readySelector).waitFor({ state: "visible" });
          await page.evaluate(() => document.fonts.ready);
          for (const action of route.setupActions ?? []) {
            if (action.eventPhase !== undefined) currentState = action.eventPhase;
            await performAction(page, action);
          }
        } catch (error) { navigationError = redactPrivateInput(error.message); }
        for (const state of route.states) {
          currentState = state.id;
          const id = `${route.id}-${state.id}-${viewport.width}x${viewport.height}`;
          const capture = { id, route: route.path, state: state.id, viewport, startedAt: new Date().toISOString(), actionError: navigationError };
          try {
            if (!navigationError) {
              for (const action of state.actions ?? []) {
                const result = await performAction(page, action);
                if (result) (capture.actionResults ??= []).push(result);
              }
              if (contract.settleImages) await settleImages(page);
              if (state.afterActionMs) await page.waitForTimeout(state.afterActionMs);
              else await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
            }
          } catch (error) { capture.actionError = redactPrivateInput(error.message); }
          const recordFrame = async (frame, fullPage) => {
            frame.observations = await inspectPage(page);
            const screenshot = join(outputDir, `${frame.id}.png`);
            await page.screenshot({ path: screenshot, fullPage: false, caret: "initial" });
            frame.screenshot = await validatePng(screenshot, viewport.width, viewport.height);
            if (fullPage) {
              const fullPageScreenshot = join(outputDir, `${frame.id}-full.png`);
              await page.screenshot({ path: fullPageScreenshot, fullPage: true, caret: "initial" });
              frame.fullPageScreenshot = fullPageScreenshot;
            }
            frame.events = structuredClone(events);
            frame.completedAt = new Date().toISOString();
            frame.verdict = frame.actionError || frame.observations.horizontalOverflow || frame.observations.brokenImages.length || events.consoleErrors.some((event) => !event.expected) || events.pageErrors.length || events.httpErrors.some((event) => !event.expected) || events.requestFailures.some((event) => !event.expected) || events.mutations.some((event) => !event.allowed) || !frame.screenshot.signatureValid || !frame.screenshot.dimensionsMatch ? "FAIL" : "PASS";
            report.captures.push(frame);
            await writeFile(join(outputDir, `${frame.id}.json`), `${JSON.stringify(frame, null, 2)}\n`);
          };
          const semanticState = { id, state: state.id, viewport, focusCoverage: [], captureIds: [], error: capture.actionError };
          if (state.focusTarget && !capture.actionError) {
            try {
              for (const [targetIndex, selector] of [].concat(state.focusTarget).entries()) {
                semanticState.focusCoverage.push(await walkFocusedTarget(page, selector, async (focusEvidence) => {
                  const frame = { ...capture, id: `${id}-target-${targetIndex + 1}-frame-${focusEvidence.frameIndex + 1}`, startedAt: new Date().toISOString(), focusEvidence, targetIndex };
                  await recordFrame(frame, false);
                  semanticState.captureIds.push(frame.id);
                }));
              }
            } catch (error) { semanticState.error = redactPrivateInput(error.message); }
          } else {
            await recordFrame(capture, !state.focusTarget);
            semanticState.captureIds.push(capture.id);
          }
          if (!semanticState.captureIds.length && !semanticState.error) semanticState.error = "No frame captured for semantic state";
          report.semanticStates.push(semanticState);
        }
        await context.close();
      }
    }
  } catch (error) {
    report.executionError = redactPrivateInput(error.message);
  } finally {
    await browser.close();
    report.sourceAfter = await sourceFingerprint(sourceRoot, contract.sourceScope);
    report.sourceChangedDuringCapture = report.sourceBefore.sha256 !== report.sourceAfter.sha256;
    report.completedAt = new Date().toISOString();
    report.browserClosedAt = new Date().toISOString();
    report.pngCount = report.captures.reduce((count, capture) => count + 1 + (capture.fullPageScreenshot ? 1 : 0), 0);
    report.verdict = report.executionError || report.sourceChangedDuringCapture || report.captures.some((capture) => capture.verdict === "FAIL") || report.semanticStates.some((state) => state.error) || report.semanticStates.length !== expectedSemanticStates ? "FAIL" : "PASS";
    report.productAcceptance = "NOT_RUN";
    await writeFile(join(outputDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify({ verdict: report.verdict, kind: report.kind, captures: report.captures.length, sourceChangedDuringCapture: report.sourceChangedDuringCapture, report: join(outputDir, "report.json") }, null, 2));
    if (report.verdict === "FAIL") process.exitCode = 1;
  }
}

main().catch((error) => { console.error(redactPrivateInput(error.stack ?? error.message)); process.exitCode = 1; });
