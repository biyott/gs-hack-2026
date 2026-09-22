import { CatalogEvidence, readJson, readSnapshot } from "./valid-route-evidence.mjs";
import { settleImages } from "./browser-observations.mjs";
import { performAction } from "./browser-actions.mjs";

export function redact(message) {
  return String(message).replaceAll(process.env.QA_DEMO_ACCESS_CODE ?? "\0", "[REDACTED]");
}

export function monitor(page, options) {
  const origin = new URL(options.baseUrl).origin;
  const state = { phase: "warming", events: [], preloginSessionRequests: 0 };
  const preloginRequests = new WeakSet();
  const endpoint = (url, path) => {
    const parsed = new URL(url);
    return parsed.origin === origin && parsed.pathname === path;
  };
  const urlLabel = (url) => {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}${parsed.searchParams.has("mode") ? `?mode=${encodeURIComponent(parsed.searchParams.get("mode"))}` : ""}`;
  };
  const add = (kind, value) => state.events.push({ at: new Date().toISOString(), phase: state.phase, kind, ...value });
  const count = (kind) => state.events.filter((event) => event.kind === kind && event.expected).length;
  page.on("request", (request) => {
    if (state.phase === "warming" && request.method() === "GET" && endpoint(request.url(), "/api/session")) {
      preloginRequests.add(request);
      state.preloginSessionRequests += 1;
    }
    if (["GET", "HEAD", "OPTIONS"].includes(request.method())) return;
    const expected = state.phase === "login" && request.method() === "POST" && endpoint(request.url(), "/api/session") && count("mutation") === 0;
    add("mutation", { method: request.method(), url: urlLabel(request.url()), expected });
  });
  page.on("response", (response) => {
    if (response.status() < 400) return;
    const expected = preloginRequests.has(response.request()) && response.status() === 401 && count("http-error") < 2;
    add("http-error", { status: response.status(), url: urlLabel(response.url()), expected });
  });
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const location = message.location();
    const expected = location.url && endpoint(location.url, "/api/session") && /\b401\b/.test(message.text()) && count("console-error") < Math.min(2, state.preloginSessionRequests);
    add("console-error", { text: redact(message.text()), expected: Boolean(expected) });
  });
  page.on("pageerror", (error) => add("page-error", { message: redact(error.message), expected: false }));
  page.on("requestfailed", (request) => {
    const error = request.failure()?.errorText;
    const actual = new URL(request.url());
    const streamAbort = request.method() === "GET" && endpoint(request.url(), "/api/events")
      && actual.searchParams.size === 1 && error === "net::ERR_ABORTED";
    const reason = streamAbort && state.phase === "selecting-mode" && options.mode === "fire-gas" && actual.searchParams.get("mode") === "equipment"
      ? "startup-equipment-stream-closed-for-fire-gas-selection"
      : streamAbort && state.phase === "closing" && actual.searchParams.get("mode") === options.mode
        ? "current-mode-stream-closed-during-context-cleanup" : null;
    const expected = reason !== null && !state.events.some((event) => event.expected && event.reason === reason);
    add("request-failure", { method: request.method(), url: urlLabel(request.url()), error, reason, expected });
  });
  return state;
}

export function assertEvents(state) {
  if (state.events.some((event) => !event.expected)) throw new Error("Unexpected browser error or mutation; see retained event evidence.");
}

export async function switchView(page, view) {
  await page.getByRole("button", { name: view === "2d" ? "2D 지도" : "3D 현장", exact: true }).click();
  await page.locator(view === "2d" ? "[data-testid='site-map'] .map-ground" : "[data-testid='site-canvas'] canvas").waitFor({ state: "visible" });
  await page.waitForFunction(() => !document.querySelector(".scene-loading, .scene-failure"));
  await page.locator(".site-stage__viewport").evaluate((element) => element.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" }));
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

export async function warmPage(session, options) {
  const { page, state } = session;
  let loginAttempts = 0;
  await page.route("**/*", (route) => {
    const request = route.request();
    const actual = new URL(request.url());
    const login = state.phase === "login" && request.method() === "POST"
      && actual.origin === new URL(options.baseUrl).origin && actual.pathname === "/api/session";
    const allowedLogin = login && ++loginAttempts === 1;
    return ["GET", "HEAD", "OPTIONS"].includes(request.method()) || allowedLogin ? route.continue() : route.abort("blockedbyclient");
  });
  const response = await page.goto(options.baseUrl, { waitUntil: "domcontentloaded" });
  if (!response?.ok()) throw new Error(`Navigation failed: HTTP ${response?.status()}.`);
  await page.locator("button[type='submit']:not(:disabled)").waitFor();
  await page.locator("label:has-text('역할') select").selectOption("observer");
  await page.locator("input[type='password']").fill(process.env.QA_DEMO_ACCESS_CODE);
  state.phase = "login";
  await page.locator("button[type='submit']").click();
  await page.locator(`[data-testid='mode-${options.mode}']:not(:disabled)`).waitFor();
  if (!(await page.locator(".entry-session").innerText()).includes("observer · observer")) throw new Error("Observer identity was not confirmed.");
  state.phase = "selecting-mode";
  await page.locator(`[data-testid='mode-${options.mode}']`).click();
  await page.waitForFunction(() => document.querySelector("[data-testid='connection-state']")?.textContent?.includes("실시간 연결"));
  state.phase = "observing";
  for (const selector of ["scenario-select", "run-toggle", ...(options.mode === "equipment" ? ["equipment-select"] : [])]) {
    if (!(await page.locator(`[data-testid='${selector}']`).isDisabled())) throw new Error(`Observer control ${selector} is unexpectedly writable.`);
  }
  const identity = await performAction(page, { kind: "expect-visible-unique", selector: ".console-header .status-synthetic", value: "시뮬레이션 / SIMULATION", inViewport: true });
  const snapshot = await readSnapshot(page, options.mode);
  const catalog = CatalogEvidence.parse(await readJson(page, "/api/catalog"));
  const preset = catalog.equipment.find((entry) => entry.id === snapshot.equipment.presetId);
  if (!preset || !catalog.maps.some((map) => map.mapId === snapshot.run.mapId && map.mapVersion === snapshot.run.mapVersion)) throw new Error("Selected map/equipment is absent from the real catalog.");
  const assetPaths = ["/assets/site/hvo-demo.glb", preset.assetUrl];
  await switchView(page, "3d");
  await page.waitForFunction((paths) => paths.every((path) => performance.getEntriesByType("resource").some((entry) => new URL(entry.name).pathname === path && entry.decodedBodySize > 0 && entry.responseEnd > 0)), assetPaths);
  await page.locator("select[aria-label='카메라 모드']").selectOption("full");
  await switchView(page, "2d");
  await switchView(page, "3d");
  await switchView(page, "2d");
  await page.evaluate(() => document.fonts.ready);
  await settleImages(page);
  assertEvents(state);
  return { snapshot, identity, assetPaths, resources: await page.evaluate((paths) => performance.getEntriesByType("resource").filter((entry) => paths.includes(new URL(entry.name).pathname)).map((entry) => ({ path: new URL(entry.name).pathname, decodedBodySize: entry.decodedBodySize, responseEnd: entry.responseEnd })), assetPaths) };
}
