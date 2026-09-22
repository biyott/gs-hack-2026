export async function performAction(page, action) {
  const locator = action.selector ? page.locator(action.selector) : null;
  const value = action.valueEnv ? process.env[action.valueEnv] ?? action.value : action.value;
  switch (action.kind) {
    case "click": await locator.click(); break;
    case "focus": await locator.focus(); break;
    case "hover": await locator.hover(); break;
    case "fill": await locator.fill(value); break;
    case "select": await locator.selectOption(action.value); break;
    case "press": await (locator ?? page.keyboard).press(action.value); break;
    case "check": await locator.check(); break;
    case "uncheck": await locator.uncheck(); break;
    case "wait-visible": await locator.waitFor({ state: "visible" }); break;
    case "wait-hidden": await locator.waitFor({ state: "hidden" }); break;
    case "wait-all-hidden": await page.waitForFunction((selector) => [...document.querySelectorAll(selector)].every((element) => { const box = element.getBoundingClientRect(); const style = getComputedStyle(element); return box.width === 0 || box.height === 0 || style.display === "none" || style.visibility === "hidden"; }), action.selector); break;
    case "wait-text": await locator.filter({ hasText: action.value }).waitFor({ state: "visible" }); break;
    case "wait-resource": await page.waitForFunction((path) => performance.getEntriesByType("resource").some((entry) => new URL(entry.name).pathname === path && entry.responseEnd > 0), action.value); break;
    case "drag-unobscured-canvas": {
      const stateVersionBefore = await page.locator(action.stateVersionSelector).innerText();
      const points = await locator.evaluate((canvas, distanceRatio) => {
        const box = canvas.getBoundingClientRect();
        for (const fy of [0.25, 0.5, 0.75]) for (const fx of [0.25, 0.5, 0.75]) {
          const x = box.left + box.width * fx;
          const y = box.top + box.height * fy;
          const distance = distanceRatio ? box.height * distanceRatio : 60;
          const endX = Math.min(x + distance, box.right - 8, innerWidth - 8);
          if (y > 0 && y < innerHeight && endX - x > 20 && document.elementFromPoint(x, y) === canvas && document.elementFromPoint(endX, y) === canvas) return { x, y, endX };
        }
        throw new Error("No unobscured canvas drag segment in the viewport");
      }, action.distanceRatio);
      const anchors = () => page.locator(action.projectionSelector).evaluateAll((lines) => lines.map((line) => [line.closest("[data-annotation-id]")?.getAttribute("data-annotation-id"), line.getAttribute("x1"), line.getAttribute("y1")]));
      const before = await anchors();
      if (!before.length) throw new Error("No projected annotations to verify orbit");
      await page.mouse.move(points.x, points.y);
      await page.mouse.down();
      try { await page.mouse.move(points.endX, points.y, { steps: 12 }); }
      finally { await page.mouse.up(); }
      await page.waitForFunction(({ selector, initial }) => JSON.stringify([...document.querySelectorAll(selector)].map((line) => [line.closest("[data-annotation-id]")?.getAttribute("data-annotation-id"), line.getAttribute("x1"), line.getAttribute("y1")])) !== initial, { selector: action.projectionSelector, initial: JSON.stringify(before) });
      const stateVersionAfter = await page.locator(action.stateVersionSelector).innerText();
      if (stateVersionBefore !== stateVersionAfter) throw new Error("Scene state changed during orbit check; retry only on a coordinated stable fixture");
      return { kind: action.kind, points, before, after: await anchors(), stateVersionBefore, stateVersionAfter };
    }
    case "scroll": await locator.scrollIntoViewIfNeeded(); break;
    case "expect-visible-unique": {
      const visible = page.locator(action.selector).filter({ visible: true });
      const count = await visible.count();
      if (count !== 1) throw new Error(`Expected one visible ${action.selector}; received ${count}`);
      const result = await visible.evaluate((element) => {
        const box = element.getBoundingClientRect();
        return { text: element.textContent?.trim(), bounds: { left: box.left, top: box.top, right: box.right, bottom: box.bottom }, inViewport: box.left >= 0 && box.top >= 0 && box.right <= innerWidth && box.bottom <= innerHeight };
      });
      if (result.text !== action.value) throw new Error(`Unexpected visible identity text: ${result.text}`);
      if (action.inViewport && !result.inViewport) throw new Error("Required identity is outside the viewport");
      return { kind: action.kind, selector: action.selector, count, ...result };
    }
    case "expect-map-scale": {
      const result = await locator.evaluate((label) => {
        const box = label.getBoundingClientRect();
        const map = label.closest("svg").getBoundingClientRect();
        const matrix = label.getScreenCTM();
        const fontSize = Number.parseFloat(getComputedStyle(label).fontSize);
        const screenScale = matrix ? Math.hypot(matrix.a, matrix.b) : 0;
        return { text: label.textContent?.trim(), fontSize, screenScale, screenFontSize: fontSize * screenScale, insideMap: box.left >= map.left - 1 && box.right <= map.right + 1 && box.top >= map.top - 1 && box.bottom <= map.bottom + 1 };
      });
      if (result.text !== "10 m" || !result.insideMap || Math.abs(result.screenFontSize - 12) > 0.5) throw new Error(`Unreadable or misplaced map scale: ${JSON.stringify(result)}`);
      return { kind: action.kind, ...result };
    }
    case "expect-text": {
      const text = await locator.innerText();
      if (!text.includes(action.value)) throw new Error(`Expected ${action.selector} to contain ${JSON.stringify(action.value)}; received ${JSON.stringify(text)}`);
      break;
    }
    case "expect-attribute": {
      const value = await locator.getAttribute(action.name);
      if (value !== action.value) throw new Error(`Expected ${action.selector} ${action.name}=${JSON.stringify(action.value)}; received ${JSON.stringify(value)}`);
      break;
    }
    default: throw new Error(`Unsupported action ${action.kind}`);
  }
}
