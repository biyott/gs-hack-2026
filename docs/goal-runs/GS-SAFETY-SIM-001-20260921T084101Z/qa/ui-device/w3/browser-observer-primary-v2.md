# Primary-text observer v2 preparation

This separately named QA derivative preserves `browser-observer.mjs`. It is source preparation only until an explicit helper-check grant and, separately, a final-candidate runtime grant. It does not change product code or G0 thresholds.

`installPrimaryUiObserver(context)` installs an inert observer before navigation. `startPrimaryUiWindow(page, phase)` begins a named warmup or measurement phase; `stopPrimaryUiWindow(page)` stops it and returns raw evidence. The observer records current `.guidance-record:not(.guidance-original)` and its actual `.guidance-primary` text, not outer-card intersection.

Each observation retains worker, guidance ID, envelope version, incident/run and primary lineage parsed from the frozen component's dedicated metadata; supplemental lineage requires the complete dedicated paragraph, and ambiguous slash-separated IDs remain unqualified. These DOM fields must still be matched to the authoritative immutable dispatch envelope. A candidate with different markup requires a fresh binding before use.

The record contains primary bounds; text-node line rectangles; viewport and ancestor clipping; each nested text ancestor's hidden/opacity/clip/transform state; sampled text hit coordinates/elements; font metadata; foreground state; failed reasons; and a readable-region limitation. Hidden/clipped text, missing identities, foreign hit targets and unsupported shape/transforms remain unqualified. Native details `open`, layout-affecting attributes, text changes, scroll and resize queue a new observation. Complete readability and every-pixel occlusion are not established by these DOM checks.

The endpoint is `primary-text-DOM-and-sampled-hit-test-at-requestAnimationFrame`. Each record separates the rAF callback timestamp from the actual observation interval and completed-observation monotonic timestamp. UTC/timeOrigin are retained, while clock correction/uncertainty stay null until independently bound. This is a render-related DOM proxy, not physical paint. A late or missing observation must not be manufactured into exact first-visible time. Join the actual primary/supplement envelope and dispatch clock before computing any latency or bound.

The frame collector preserves raw cadence, phase and document visibility. The cumulative geometry-probe cost is retained because instrumentation can affect cadence. This is not physical Android, camera capture/display, audibility/haptic, or full four-phone workload evidence.

## Prepared helper-only checks

`test-primary-observer-v2.mjs` uses synthetic data-URL HTML with no application or model process. It blocks HTTP requests and creates fresh contexts for thirteen cases: ordinary visible primary; outer-card-only intersection; ancestor clipping; foreign overlay; hidden primary; own primary clipping; hidden/transparent destination span; unsupported shape; supplement lineage; locale text that resembles lineage; ambiguous IDs; and native details closing to reveal a previously clipped primary. The checks assert both qualification and identity/reason behavior. No fixture runtime has occurred during preparation.

The exact invocation, after a matching frozen receipt and QA Lead grant exist, is:

```sh
node docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/test-primary-observer-v2.mjs --grant <explicit-helper-grant.json> --freeze <primary-observer-freeze-v2.json>
```

The grant requires `phase: QA-HELPER-CHECK`, `grantedBy: /root/qa_lead`, `syntheticOnly: true`, `applicationAllowed: false`, `modelAllowed: false`, and `notBefore`/`notAfter` UTC bounds. The checker also closes within 45 seconds or the grant deadline. Its result describes this QA helper only; product acceptance remains `NOT_RUN`. Static syntax checking and independent source review precede freezing. The same final-candidate component/selector binding must be checked again before actual performance collection.
