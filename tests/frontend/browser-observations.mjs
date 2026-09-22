import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";

export async function sourceFingerprint(root, scope) {
  const paths = [];
  async function visit(path) {
    const entries = await readdir(path, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      const filename = join(path, entry.name);
      if (entry.isDirectory()) await visit(filename);
      else if (/\.(?:tsx?|jsx?|css|mjs|json)$/.test(entry.name)) paths.push(filename);
    }
  }
  if (scope) {
    for (const path of scope) {
      const filename = join(root, path);
      if ((await stat(filename)).isDirectory()) await visit(filename);
      else paths.push(filename);
    }
  } else {
    await Promise.all([visit(join(root, "app")), visit(join(root, "src")), visit(join(root, "packages"))]);
    paths.push(...["DESIGN.md", "package.json", "package-lock.json", "pnpm-lock.yaml", "next.config.ts", "next.config.mjs", ".next/BUILD_ID"].map((path) => join(root, path)));
  }
  const files = [];
  for (const filename of paths.sort()) {
    const content = await readFile(filename).catch(() => null);
    if (content) files.push({ path: relative(root, filename), sha256: createHash("sha256").update(content).digest("hex") });
  }
  return { sha256: createHash("sha256").update(JSON.stringify(files)).digest("hex"), files };
}

export async function inspectPage(page) {
  return page.evaluate(() => {
    const describe = (element) => ({
      tag: element.tagName.toLowerCase(),
      id: element.id || null,
      testId: element.getAttribute("data-testid"),
      text: (element.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 160),
    });
    const visible = (element) => {
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && box.width > 0 && box.height > 0;
    };
    const elements = [...document.body.querySelectorAll("*")].filter(visible);
    const viewportWidth = document.documentElement.clientWidth;
    const outsideViewport = elements.filter((element) => {
      const box = element.getBoundingClientRect();
      return box.left < -1 || box.right > viewportWidth + 1;
    }).map((element) => ({ ...describe(element), left: element.getBoundingClientRect().left, right: element.getBoundingClientRect().right }));
    const clippedText = elements.filter((element) => {
      if (![...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())) return false;
      const style = getComputedStyle(element);
      return ((["hidden", "clip"].includes(style.overflowX) && element.scrollWidth > element.clientWidth + 1)
        || (["hidden", "clip"].includes(style.overflowY) && element.scrollHeight > element.clientHeight + 1));
    }).map(describe);
    const images = [...document.images].filter((image) => !image.complete || image.naturalWidth === 0).map((image) => ({ src: image.currentSrc, alt: image.alt }));
    const controls = [...document.querySelectorAll("button, input, select, textarea, a[href]")].filter(visible).map((element) => {
      const box = element.getBoundingClientRect();
      return { ...describe(element), label: element.getAttribute("aria-label"), associatedLabels: [...(element.labels ?? [])].map((label) => label.innerText), role: element.getAttribute("role"), disabled: element.matches(":disabled"), width: box.width, height: box.height };
    });
    const canvases = [...document.querySelectorAll("canvas")].map((canvas) => ({ width: canvas.width, height: canvas.height, clientWidth: canvas.clientWidth, clientHeight: canvas.clientHeight }));
    return {
      title: document.title,
      language: document.documentElement.lang,
      url: location.href,
      viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
      document: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
      horizontalOverflow: document.documentElement.scrollWidth > viewportWidth + 1,
      outsideViewport,
      clippedText,
      brokenImages: images,
      controls,
      canvases,
      resources: performance.getEntriesByType("resource").map((entry) => ({ name: entry.name, initiatorType: entry.initiatorType, duration: entry.duration, transferSize: entry.transferSize, encodedBodySize: entry.encodedBodySize, decodedBodySize: entry.decodedBodySize, responseEnd: entry.responseEnd })),
      scene: {
        cameraMode: document.querySelector(".site-stage__viewport")?.getAttribute("data-camera-mode") ?? null,
        selectedEquipment: document.querySelector('[data-testid="equipment-select"] option:checked')?.textContent ?? null,
        selectedEquipmentDetails: document.querySelector('[data-testid="selected-equipment-name"]')?.textContent ?? null,
        stateVersion: document.querySelector(".status-strip-version")?.textContent ?? null,
        runId: document.querySelector(".workspace-footer .mono")?.textContent ?? null,
        positionStatus: document.querySelector(".stage-position-status")?.textContent ?? null,
        hazardIds: [...document.querySelectorAll("[data-hazard-id]")].map((element) => element.getAttribute("data-hazard-id")),
        routeVersions: [...document.querySelectorAll("[data-route-version]")].map((element) => element.getAttribute("data-route-version")),
      },
      bodyText: document.body.innerText,
      headings: [...document.querySelectorAll("h1,h2,h3")].map(describe),
      activeElement: document.activeElement ? describe(document.activeElement) : null,
      fonts: { status: document.fonts.status, body: getComputedStyle(document.body).fontFamily },
    };
  });
}

export async function settleImages(page) {
  return page.evaluate(async () => {
    const pending = [...document.images].filter((image) => !image.complete || image.naturalWidth === 0);
    if (!pending.length) return;
    const containers = [...document.querySelectorAll("*")].filter((element) => element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth);
    const positions = containers.map((element) => ({ element, top: element.scrollTop, left: element.scrollLeft }));
    const windowPosition = { left: scrollX, top: scrollY };
    try {
      for (const image of pending) {
        image.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
        await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
        let timer;
        try {
          await Promise.race([image.decode(), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`Image did not decode: ${image.alt}`)), 15000); })]);
        } finally { clearTimeout(timer); }
      }
    } finally {
      for (const { element, top, left } of positions) element.scrollTo({ top, left, behavior: "instant" });
      window.scrollTo({ ...windowPosition, behavior: "instant" });
      await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
    }
  });
}

export async function validatePng(path, width, height) {
  const data = await readFile(path);
  const signatureValid = data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const actualWidth = data.readUInt32BE(16);
  const actualHeight = data.readUInt32BE(20);
  return { path, signatureValid, width: actualWidth, height: actualHeight, dimensionsMatch: actualWidth === width && actualHeight === height, bytes: data.length, sha256: createHash("sha256").update(data).digest("hex") };
}
