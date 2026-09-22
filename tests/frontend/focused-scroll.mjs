const TOLERANCE = 1;
const MAX_FRAMES = 100;

async function settle(page) {
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
}

async function observe(locator) {
  return locator.evaluate((target) => {
    const rect = (box) => ({ left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height });
    const label = (node) => `${node.tagName.toLowerCase()}${node.id ? `#${node.id}` : ""}${[...node.classList].map((name) => `.${name}`).join("")}`;
    const bounds = rect(target.getBoundingClientRect());
    const viewport = { width: innerWidth, height: innerHeight, scrollX, scrollY };
    const clip = { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
    const ancestors = [];
    for (let node = target.parentElement; node; node = node.parentElement) {
      const style = getComputedStyle(node);
      const box = node.getBoundingClientRect();
      const root = node === document.scrollingElement;
      const clipping = { x: style.overflowX !== "visible", y: style.overflowY !== "visible" };
      const client = { left: box.left + node.clientLeft, top: box.top + node.clientTop };
      client.right = client.left + node.clientWidth;
      client.bottom = client.top + node.clientHeight;
      if (!root && (clipping.x || clipping.y)) {
        if (node.offsetWidth && Math.abs(box.width - node.offsetWidth) > 1) throw new Error("Transformed clipping ancestor is unsupported by focused coverage");
        if (clipping.x) { clip.left = Math.max(clip.left, client.left); clip.right = Math.min(clip.right, client.right); }
        if (clipping.y) { clip.top = Math.max(clip.top, client.top); clip.bottom = Math.min(clip.bottom, client.bottom); }
      }
      ancestors.push({ label: label(node), bounds: rect(box), clipBounds: client, overflowX: style.overflowX, overflowY: style.overflowY, root, scrollTop: node.scrollTop, scrollLeft: node.scrollLeft, scrollHeight: node.scrollHeight, scrollWidth: node.scrollWidth, clientHeight: node.clientHeight, clientWidth: node.clientWidth });
    }
    const occluders = [];
    const horizontal = { left: Math.max(bounds.left, clip.left), right: Math.min(bounds.right, clip.right) };
    for (const node of document.querySelectorAll("*")) {
      if (node.contains(target) || target.contains(node)) continue;
      const style = getComputedStyle(node);
      if (!["fixed", "sticky"].includes(style.position) || style.visibility !== "visible" || style.display === "none") continue;
      const box = node.getBoundingClientRect();
      const left = Math.max(horizontal.left, box.left), right = Math.min(horizontal.right, box.right);
      const top = Math.max(clip.top, box.top), bottom = Math.min(clip.bottom, box.bottom);
      if (right <= left || bottom <= top) continue;
      const hit = document.elementFromPoint((left + right) / 2, (top + bottom) / 2);
      if (!hit || !node.contains(hit)) continue;
      occluders.push({ label: label(node), position: style.position, bounds: rect(box) });
      if (box.top <= clip.top + 1) clip.top = Math.max(clip.top, box.bottom);
      else if (box.bottom >= clip.bottom - 1) clip.bottom = Math.min(clip.bottom, box.top);
      else throw new Error(`Interior fixed/sticky occluder prevents focused coverage: ${label(node)}`);
    }
    const visible = { left: Math.max(bounds.left, clip.left), right: Math.min(bounds.right, clip.right), top: Math.max(bounds.top, clip.top), bottom: Math.min(bounds.bottom, clip.bottom) };
    const positive = visible.right > visible.left && visible.bottom > visible.top;
    const samples = [];
    if (positive) {
      const insetX = Math.min(4, (visible.right - visible.left) / 4);
      const insetY = Math.min(4, (visible.bottom - visible.top) / 4);
      for (const x of [visible.left + insetX, (visible.left + visible.right) / 2, visible.right - insetX]) {
        for (const y of [visible.top + insetY, (visible.top + visible.bottom) / 2, visible.bottom - insetY]) {
          const hit = document.elementFromPoint(x, y);
          samples.push({ x, y, targetHit: hit !== null && (hit === target || target.contains(hit)), hit: hit ? label(hit) : null });
        }
      }
    }
    return { targetBounds: bounds, viewport, clipRegion: { ...clip, width: clip.right - clip.left, height: clip.bottom - clip.top }, visibleTargetRange: { left: visible.left - bounds.left, right: visible.right - bounds.left, top: visible.top - bounds.top, bottom: visible.bottom - bounds.top }, ancestors, occluders, visibilitySamples: samples, visible: positive && samples.every((sample) => sample.targetHit) };
  });
}

async function move(locator, delta) {
  return locator.evaluate((target, requested) => {
    for (let node = target.parentElement; node; node = node.parentElement) {
      if (node === document.scrollingElement || node === document.body) continue;
      const style = getComputedStyle(node);
      if (!/^(auto|scroll|overlay)$/.test(style.overflowY) || node.scrollHeight <= node.clientHeight) continue;
      const before = node.scrollTop;
      node.scrollBy({ top: requested, behavior: "instant" });
      return [{ target: node.id || node.className || node.tagName, before, after: node.scrollTop, applied: node.scrollTop - before }];
    }
    const before = scrollY;
    window.scrollBy({ top: requested, behavior: "instant" });
    return [{ target: "window", before, after: scrollY, applied: scrollY - before }];
  }, delta);
}

function assertUsable(evidence) {
  if (!evidence.visible) throw new Error("Focused target is invisible or obscured after native scrolling");
  const range = evidence.visibleTargetRange;
  if (range.left > TOLERANCE || range.right < evidence.targetBounds.width - TOLERANCE) throw new Error("Focused target is horizontally clipped; vertical coverage cannot prove the complete target");
}

function sameGeometry(before, after) {
  const values = (evidence) => [evidence.targetBounds, evidence.clipRegion, evidence.viewport, evidence.ancestors.map((ancestor) => [ancestor.scrollLeft, ancestor.scrollTop])];
  return JSON.stringify(values(before)) === JSON.stringify(values(after));
}

/** Capture unchanged viewport PNGs in captureFrame; it must not scroll or mutate the page. */
export async function walkFocusedTarget(page, selector, captureFrame) {
  if (typeof selector !== "string" || !selector || typeof captureFrame !== "function") throw new Error("Focused capture requires one selector and a capture callback");
  const locator = page.locator(selector);
  await locator.waitFor({ state: "visible" });
  if (await locator.count() !== 1) throw new Error(`Focused selector must match exactly one target: ${selector}`);
  const scrollPolicy = await locator.evaluate((target) => {
    const rootBefore = { x: scrollX, y: scrollY };
    for (let node = target.parentElement; node; node = node.parentElement) {
      if (node === document.scrollingElement || node === document.body) continue;
      if (!/^(auto|scroll|overlay)$/.test(getComputedStyle(node).overflowY) || node.scrollHeight <= node.clientHeight) continue;
      window.scrollTo({ left: 0, top: 0, behavior: "instant" });
      return { owner: `${node.tagName.toLowerCase()}${node.id ? `#${node.id}` : ""}${[...node.classList].map((name) => `.${name}`).join("")}`, preserveRootOrigin: true, rootBefore, rootAfter: { x: scrollX, y: scrollY } };
    }
    return { owner: "window", preserveRootOrigin: false, rootBefore, rootAfter: rootBefore };
  });
  await settle(page);
  const initial = await observe(locator);
  const size = { width: initial.targetBounds.width, height: initial.targetBounds.height };
  if (size.width <= 0 || size.height <= 0) throw new Error("Focused target has no measurable area");
  const frames = [];
  const ranges = [];
  let coveredTo = 0;
  let desiredTop = 0;
  for (let frameIndex = 0; frameIndex < MAX_FRAMES; frameIndex += 1) {
    const movements = [];
    let evidence = await observe(locator);
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const delta = evidence.targetBounds.top + desiredTop - evidence.clipRegion.top;
      if (Math.abs(delta) <= TOLERANCE) break;
      const moved = await move(locator, delta);
      movements.push(...moved);
      await settle(page);
      evidence = await observe(locator);
      if (moved.every((movement) => Math.abs(movement.applied) <= TOLERANCE)) break;
    }
    assertUsable(evidence);
    if (scrollPolicy.preserveRootOrigin && (evidence.viewport.scrollX !== 0 || evidence.viewport.scrollY !== 0)) throw new Error("Nested focused scrolling displaced the document origin");
    if (Math.abs(size.width - evidence.targetBounds.width) > TOLERANCE || Math.abs(size.height - evidence.targetBounds.height) > TOLERANCE) throw new Error("Focused target size changed during coverage");
    const range = evidence.visibleTargetRange;
    if (range.top > coveredTo + TOLERANCE) throw new Error(`Focused coverage has a gap before frame ${frameIndex}`);
    if (range.bottom <= coveredTo + TOLERANCE) throw new Error(`Focused native scrolling stalled before frame ${frameIndex}`);
    const previous = ranges.at(-1);
    if (previous && coveredTo - range.top < Math.min(16, (previous.bottom - previous.top) * 0.1)) throw new Error(`Focused frame ${frameIndex} lacks sufficient overlap with its predecessor`);
    const frame = { selector, frameIndex, ...evidence, scrollPolicy, nativeScrollMovements: movements, coverageBeforeCapture: { coveredTo, targetHeight: size.height, ranges: structuredClone(ranges) }, startedAt: new Date().toISOString() };
    const captureResult = await captureFrame(frame);
    const after = await observe(locator);
    assertUsable(after);
    if (!sameGeometry(evidence, after)) throw new Error("Focused target or scroll geometry changed while its screenshot was captured");
    const completed = { ...frame, completedAt: new Date().toISOString(), afterCapture: after, ...(captureResult === undefined ? {} : { captureResult }) };
    frames.push(completed);
    ranges.push({ top: range.top, bottom: range.bottom, frameIndex });
    coveredTo = Math.max(coveredTo, range.bottom);
    if (coveredTo >= size.height - TOLERANCE) return { selector, frames, coverage: { complete: true, targetWidth: size.width, targetHeight: size.height, coveredTo, ranges, tolerancePx: TOLERANCE, proof: "Native viewport and overflow clipping geometry, overlapping vertical ranges and sampled hit tests; independent visual review remains required." } };
    const overlap = Math.min(80, (range.bottom - range.top) * 0.2);
    desiredTop = Math.max(0, coveredTo - overlap);
  }
  throw new Error(`Focused coverage exceeded ${MAX_FRAMES} frames for ${selector}`);
}
