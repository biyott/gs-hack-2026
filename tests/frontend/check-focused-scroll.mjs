import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { loadPlaywright, launchBrowser } from "./browser-runtime.mjs";
import { walkFocusedTarget } from "./focused-scroll.mjs";

const output = resolve(process.argv[2] ?? "tests/frontend/artifacts/harness-focused-scroll");
const fixture = `<!doctype html><html><head><meta charset="utf-8"><style>
* { box-sizing:border-box } html,body { margin:0 } .console-shell { height:100vh; display:grid; grid-template-rows:64px minmax(0,1fr); overflow:hidden }
.console-header { height:64px; background:#123; color:white; z-index:40 }
.console-layout { min-height:0; overflow:auto } .context-rail { padding:16px }
.before { height:1100px } .target { height:1300px; background:#cde; border:1px solid #123; padding:16px } .after { height:400px }
.document-overflow { height:2000px }
@media(min-width:1280px) { .console-layout { display:grid; grid-template-columns:1fr 340px; overflow:hidden } .context-rail { grid-column:2; min-height:0; overflow:auto } }
@media(max-width:767px) { .console-shell { height:auto; display:block; overflow:visible } .console-header { position:sticky; top:0 } .console-layout,.context-rail { overflow:visible } .document-overflow { display:none } }
</style></head><body><div class="console-shell"><header class="console-header">SIMULATION — offline scroll algorithm fixture</header><div class="console-layout"><aside class="context-rail"><div class="before"></div><article class="target">A deliberately tall capture target</article><div class="after"></div></aside></div></div><div class="document-overflow"></div></body></html>`;
const scenarios = [
  { width:375, height:812, initialRootY:0, owner:"window" },
  { width:768, height:1024, initialRootY:0, owner:"div.console-layout" },
  { width:1280, height:720, initialRootY:0, owner:"aside.context-rail" },
  { width:768, height:1024, initialRootY:64, owner:"div.console-layout" },
  { width:1280, height:720, initialRootY:64, owner:"aside.context-rail" },
];
const report = { kind:"scroll-algorithm-regression-only", productAcceptance:"NOT_RUN", fixture:"about:blank inline HTML; offline context; every request aborted; no server", hypotheses:["scrollIntoView walks document ancestors despite a nested scroll owner", "remaining delta falls back to root after nested owner clamps", "preexisting root displacement survives without a nested-owner origin invariant"], startedAt:new Date().toISOString(), cases:[] };
await mkdir(output, { recursive:true });
const { chromium } = await loadPlaywright();
const browser = await launchBrowser(chromium);
try {
  for (const scenario of scenarios) {
    const context = await browser.newContext({ viewport:{width:scenario.width,height:scenario.height}, offline:true, serviceWorkers:"block" });
    const requests = [];
    await context.route("**/*", (route) => route.abort());
    const page = await context.newPage();
    page.on("request", (request) => requests.push(request.url()));
    const result = { ...scenario, frames:[], requests, passed:false };
    try {
      await page.setContent(fixture);
      await page.evaluate((y) => window.scrollTo(0,y), scenario.initialRootY);
      result.initialRootYObserved = await page.evaluate(() => scrollY);
      result.coverage = (await walkFocusedTarget(page, ".target", async (evidence) => {
        const header = await page.locator(".console-header").boundingBox();
        const frame = { frameIndex:evidence.frameIndex, rootY:evidence.viewport.scrollY, range:evidence.visibleTargetRange, header, scrollOwners:evidence.ancestors.filter((ancestor) => ancestor.scrollTop !== 0).map(({label,scrollTop}) => ({label,scrollTop})), movements:evidence.nativeScrollMovements };
        result.frames.push(frame);
        if (scenario.owner === "window") assert.ok(frame.rootY > 0, "Mobile document must scroll to the lower target");
        else assert.equal(frame.rootY, 0, `Nested ${scenario.owner} scrolling must retain document scrollY=0`);
        assert.ok(header && header.y >= 0 && header.y + header.height <= scenario.height, "Fixture masthead must remain within the viewport");
      })).coverage;
      assert.ok(result.coverage.complete, "Target must receive complete overlap coverage");
      assert.ok(result.frames.length >= 2, "Tall target must require multiple actual viewport frames");
      if (scenario.owner !== "window") assert.ok(result.frames.some((frame) => frame.scrollOwners.some((owner) => owner.label === scenario.owner && owner.scrollTop > 0)), "Actual nested owner must scroll");
      assert.equal(requests.length, 0, "Offline inline fixture must produce no browser requests");
      result.passed = true;
    } catch (error) {
      result.error = error.message;
    } finally {
      await context.close();
      result.contextClosedAt = new Date().toISOString();
      report.cases.push(result);
    }
  }
} finally {
  await browser.close();
  report.browserClosedAt = new Date().toISOString();
  report.passed = report.cases.length === scenarios.length && report.cases.every((result) => result.passed);
  await writeFile(join(output,"self-check.json"), `${JSON.stringify(report,null,2)}\n`);
}
console.log(JSON.stringify({kind:report.kind,passed:report.passed,cases:report.cases.map(({width,initialRootY,passed,error,frames}) => ({width,initialRootY,passed,error,frames:frames.length,rootYs:frames.map((frame) => frame.rootY)})),browserClosedAt:report.browserClosedAt,report:join(output,"self-check.json")},null,2));
if (!report.passed) process.exitCode = 1;
