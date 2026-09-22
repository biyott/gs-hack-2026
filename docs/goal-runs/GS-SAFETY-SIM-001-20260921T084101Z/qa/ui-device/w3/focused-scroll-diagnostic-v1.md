# Focused-scroll diagnostic derivative v1 — preparation only

Status: **PREPARED / RUNTIME NOT RUN**. This separate QA module defaults to a next-candidate integration. It grants no execution authority. C3 remains on HOLD unless QA Lead explicitly issues a separate, narrowly scoped diagnostic grant; a proposed slot or this document is not such a grant. No original helper, candidate, report, or 155-state scenario was changed.

## Frozen inputs

- Derivative: `qa/ui-device/w3/focused-scroll-diagnostic-v1.mjs`, 210 lines.
- Derivative freeze SHA-256: `2f0144a57a046fe401edf8bcfe91afdf2d4800b6caab8bbf47b640711bf67438`.
- Source read: `/home/b/.cache/gs-safety-c3.eulo4t9w/tests/frontend/focused-scroll.mjs`.
- Source helper SHA-256: `54b92b43fc05389e9a43bd32380619cd8c9e753bfe71909765c03b849b2e010d`.
- Verification performed: `node --check` only; exit 0. No browser, server, test harness, runtime network, API, model, device, or Blender execution.

The source hash is an algorithm compatibility requirement, not a candidate identity. A later candidate must bind its own root, manifest/source identity, production BUILD_ID, process, database, synthetic fixture, grant, and evidence directory separately. If its focused helper has different bytes, this module refuses it: review the change and freeze a new derivative rather than overriding the hash. Freeze the caller, scenario, and this module before any authorized execution.

## Preserved decisions and additive observations

The original native owner traversal, root reset for nested owners, settle calls, 1 px tolerance, 100-frame limit, eight adjustment attempts, overlap/gap/stall checks, horizontal coverage, stable target size, and post-capture geometry comparison remain unchanged. The original error messages and ordering remain intact. The optional extra screenshot hook is observational and does not count as a successful coverage capture.

The original `visibilitySamples` array remains unchanged: x-major left/center/right by top/center/bottom, at the original four-pixel-or-quarter-span insets. Every positive intersection yields all nine raw `targetHit` and `hit` results. A nonpositive intersection still yields zero samples. `visible` remains `positive && samples.every(sample => sample.targetHit)`. An outside hit remains a failure, including an overlay hit. No rounded-corner exception, center-only substitute, revised tolerance, or alternate PASS decision exists.

Each returned initial observation and each observation immediately before `assertUsable` is written as one JSONL record and fsynced. This includes the post-screenshot `assertUsable`. The failing observation is durable before the original assertion throws, provided the sink succeeds. Fields include:

- Browser `observedAt`, separate Node `persistedAt`, target bounds, visible intersection rectangle, clip region, relative visible range, viewport/root offsets, and ancestor scroll offsets.
- All original raw samples, with separately indexed hit-element and ancestor identities, rectangles, computed corner radii, pointer-event/position/z-index/display/visibility metadata; target and ancestor identities/radii are also captured.
- Supplementary native/role/tabindex control rectangles, disabled/tabindex state, center-point hits, and whether those centers fall inside the observed target intersection. These never replace the nine target probes.
- Caller context, selector, phase, frame index, native movements, source/freeze hashes, candidate/build identity, and grant ID. No text content, form values, cookies, tokens, screenshots, or network bodies are read by this module.

`observedAt` marks the start of a synchronous DOM observation. These identities are descriptions, not stable DOM-node tokens. A replacement node with identical geometry can still satisfy the original geometry comparison. Screenshot time is separate from observation time; do not claim both were atomic.

## Interpretation boundaries

| Evidence | What can be stated | What remains independent |
| --- | --- | --- |
| Original target ranges, raw hits, owner offsets | Observed geometric coverage or the original failure at that frame | Readable text, truncation, and complete content review require the saved viewport PNGs and visual review; `readableContent` stays NOT_ASSESSED |
| Supplementary control center probes | Recorded control geometry and a hit at one center point | Click/keyboard operation, full control hit area, enabled behavior, labels, and resulting authoritative state require separately granted interaction evidence |
| Corner radii plus missed corner probes | Data that may support investigation of a decorative corner cutout | The hypothesis remains UNPROVEN; ancestor/overlay hits must be reviewed, and the original raw assertion still fails |

An error inside `observe` before it returns—such as an unsupported transformed clipping ancestor or interior fixed/sticky occluder—has **no guaranteed returned geometry or nine-point record**. Locator timeout, detached evaluation, and other evaluator errors have the same limitation. This derivative specifically closes the returned-observation visibility-assertion gap. Sink or screenshot errors propagate; callers must preserve them as diagnostic failures, never silently drop data or report complete coverage.

## Caller integration contract

`openFocusedDiagnosticSink({ outputPath, sourceHelperPath, sourceHelperSha256, freezeSha256, binding })` returns `{ write(event), close() }`. Required `binding` fields are `candidateId`, `buildId`, `runGrantId`, `sourceRoot`, and `readOnlyCandidateConfirmed: true`. The sink validates absolute paths, resolves the exact helper inside the candidate, checks both hashes, rejects output inside that candidate, opens a new 0600 file with `wx`, and rechecks both hashes on close. The boolean records the caller's attestation; it is not an operating-system read-only mount or a substitute for the caller's full before/after candidate checks.

`walkFocusedTarget(page, selector, captureFrame, { sink, context, beforeAssertion? })` retains the original first three arguments. `context` should contain only public case identifiers, viewport, route/state IDs, and target index. Do not pass credentials, token-bearing URLs, arbitrary process records, or private fixture contents. Create the owned output directory before opening the sink. Use one sink per serial run and close it in `finally`; the caller must preserve both an original capture error and a close/revalidation error if both occur. The module does not automatically emit an assertion-error event: the caller must durably record the exact thrown error, selector/case, and last known phase/frame before reporting failure.

Before calling either export, the separately reviewed caller must validate a real run-only grant, candidate/process/build binding, fresh owned output, permitted selectors/viewports, synthetic-only provenance, absence of real frames/senders, and resource exclusivity. This module neither starts a browser nor verifies those runtime prerequisites. The current frozen runner imports its own `./focused-scroll.mjs` with three arguments; merely adding this file does **not** wire diagnostics into any run. A separate QA-owned caller must import this module and pass the fourth argument, while importing other utilities from its explicitly bound frozen root. Do not replace or patch the candidate's original helper or runner.

The optional `beforeAssertion(event)` runs after the raw JSONL write+fsync, for phases `before-assertUsable` and `after-capture-before-assertUsable`. It receives a cloned event, so changes to that object cannot change the original assertion evidence. The callback may save an unchanged viewport PNG and return its path/hash/timestamps; that return value is written and fsynced as a separate `diagnosticCapture` event before the original assertion proceeds. It must not scroll, focus, click, change styles/DOM, mask elements, or perform API calls. It must propagate screenshot errors. It must not add its PNG to successful coverage `captureIds` or treat a failing frame as accepted coverage.

For example, inside an already granted and bound QA caller (illustrative integration only):

```js
const sink = await openFocusedDiagnosticSink({
  outputPath, sourceHelperPath, sourceHelperSha256, freezeSha256, binding,
});
let failure;
try {
  const coverage = await walkFocusedTarget(page, selector, captureFrame, {
    sink, context: { caseId, viewport, targetIndex },
    beforeAssertion: async (event) => {
      const path = uniqueDiagnosticPngPath(event); // Owned fresh output; never candidate paths.
      const startedAt = new Date().toISOString();
      await page.screenshot({ path, fullPage: false, caret: "initial" });
      return { path, startedAt, completedAt: new Date().toISOString() };
    },
  });
  // Preserve the original caller's successful-frame and coverage bookkeeping.
} catch (error) {
  failure = error;
  try { await sink.write({ phase: "caller-error", selector, caseId, name: error.name, message: error.message }); }
  catch (sinkError) { failure = new AggregateError([error, sinkError], "Focused walk and error sink failed"); }
} finally {
  try { await sink.close(); }
  catch (closeError) { failure = failure ? new AggregateError([failure, closeError], "Focused walk and close failed") : closeError; }
}
if (failure) throw failure;
```

The authorized caller should independently validate/hash each PNG and record its own source/build checks and cleanup. It must still execute the original post-capture observation/assertion and geometry comparison, and preserve semantic failure rather than manufacturing a capture when the original assertion rejects. Neither a saved diagnostic nor successful syntax parsing changes historical failures or establishes runtime, product, visual, accessibility, Android, or performance acceptance.

## Static validation command

```bash
node --check /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/focused-scroll-diagnostic-v1.mjs
sha256sum /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/focused-scroll-diagnostic-v1.mjs /home/b/.cache/gs-safety-c3.eulo4t9w/tests/frontend/focused-scroll.mjs
```

No live command is authorized by this preparation document.
