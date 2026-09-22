# First isolated helper-check outcomes

Two separately authorized synthetic HTML checks completed and released their browsers. Neither used an application, model, phone or actual camera. These are QA-harness results; product acceptance remains `NOT_RUN`.

| Helper | Actual UTC window, 2026-09-21 | Result |
|---|---|---|
| Radius-aware focus v1 | 17:12:34.397–17:12:38.140 | 4/12 assertions satisfied, 8 failed; exit 1 |
| Primary-text observer v2 | 17:13:37.953–17:13:41.059 | 13/13 assertions passed; exit 0 |

Radius v1 is not approved for final-candidate use. Every fixture retained `non-round-corner-shape`; this was the sole unsupported reason in ordinary 14px positive fixtures. The exact computed corner-shape strings were not saved by v1, so that missing evidence cannot be reconstructed. The raw hit decisions, geometry, radii and failures remain intact. Source-only hypothesis review is underway; QA Lead permits at most one separately frozen, explicitly granted harness/environment retry after a concrete correction. No retry has run.

Primary observer v2 passed the prepared ordinary-visible, outer-card-only, ancestor-clipped, foreign-overlay, hidden-primary, primary-own-clipping, hidden/transparent-destination, unsupported-shape, supplement-identity, locale-not-lineage, ambiguous-ID and native-details-reveal fixtures. Its original observer remains unchanged. A final-candidate component binding, actual dispatch join, clock correction/uncertainty and observed workload are still required. These tests do not establish actual visible latency, physical paint, Android behavior or the four-phone workload.

The immutable aggregate is `evidence/qa/ui-device/helper-check-outcomes-v1.json`. Raw packets are `evidence/qa/ui-device/radius-helper-check/2026-09-21T17-12-34-395Z/` and `evidence/qa/ui-device/primary-observer-v2/2026-09-21T17-13-37-951Z/`. Each retains its grant/freeze linkage, screenshots and case evidence. C3 product source and all earlier reports were preserved.
