# C4 asset interaction retry v1.1 — source preparation only

No browser, API, server, model, Blender, device or retry execution was performed in this preparation. The new source is `c4-asset-interactions-v1.1.mjs`; original v1 and all saved evidence remain unchanged. A separate explicit parent retry decision and newly issued subgrant are still required.

Frozen new source SHA-256: `1f394a14be1e494492ee739a4ea5e2a0a50f1e30ee20c5f19dcad8791f53b18d` (245 physical lines, 243 pure lines). Preserved v1 SHA-256: `083c772dcd6619f03c349815031a478175eee2814d9fd563288e5c3a4ddcacc2`.

## Saved evidence and causal hypotheses

All evidence below was read from existing files in `evidence/qa/ui-device/candidate-cd8a2428/asset-browser/2026-09-21T17-56-50-874Z-5a632119/`; no live probe was used.

| Retained file | Observation | SHA-256 |
| --- | --- | --- |
| `liebherr-ltm1050-boomLengthM-3d.json` | 17:59:00.465Z; exactly 250 resource entries; maximum responseEnd 119474.5ms | `e7ddefe01ae2f955d72ec693f80f25baefc53a6be3e1c02d53f3fcf379d6e67d` |
| `liebherr-ltm1050-boomLengthM-2d.json` | 17:59:06.918Z; identical 250 entries and responseEnd | `7f36ae2bb5c637f7a5de364724ddb4c3ca33ef7f44c11b987e64bf708caba788` |
| `maeda-mc305-result.json` | ready3d resource predicate timed out at v1:138; no completed motions | `646e0a145dc416752e67070cc3b7c9efc4f88af29eeba77db86d5481a02ab0a3` |
| `liebherr-lr1100-result.json` | Same predicate timeout; no completed motions | `3d6e03cc4e63dd4a6773e2a09f7374e02d7fd001012adf5c9779387ebeb3aa6a` |
| `liebherr-172ecb-result.json` | Same predicate timeout; no completed motions | `c5c07c8c6cf655312af2c9ae7b48188e18039d18a0a1e4f4a94aa966cf827564` |
| `report.json` | Final report read at completedAt 18:02:00.578Z; all seven GLB response paths HTTP200 and frozen-byte matches | `6660808c0872e4fc2c01d3035f923adce58323027f1f2b0d3909beb84182baec` |

The later `sk1265-at6-hookHeightM-2d.json` at 18:01:43.862Z also retains those exact same 250 entries. Re-serialized resource arrays from all three captures have SHA-256 `8162d2b2b52e0c0cc48251de4ff48fe446e61f724bbe687f519e2164e3476738`. Their GLB entries contain the site, initial SK, Tadano and LTM only. The three later failed presets are absent. The response-body observations nevertheless record Maeda at 17:59:24.091Z, LR at 17:59:50.565Z, and 172ecb at 18:00:17.497Z as HTTP200 with matching frozen GLB bytes.

Three hypotheses remain distinguished:

1. **Resource timing buffer saturation — leading, strongly supported.** The frozen list remains exactly 250 entries across later captures, older assets remain visible to the predicate, and later successfully served asset bodies do not appear in that list. V1 did not configure the timing buffer or record its full event. The observed plateau supports this mechanism; the historical full event or actual configured capacity was not recorded, so those facts cannot be retroactively asserted.
2. **Missing, failed, or wrong GLB response — contradicted for the recorded requests.** The retained response bodies for all three failed presets are HTTP200 and match their frozen hashes. This does not independently prove rendering or articulation.
3. **Resource entry metadata/cache/path condition, or timing-list clearing — not fully excluded by v1.** The unchanged predicate also requires matching pathname, positive responseEnd and decodedBodySize. No later entries were retained to inspect those fields. A static search found no clearResourceTimings, setResourceTimingBufferSize or resourcetimingbufferfull calls in frozen app/src/tests/frontend, but this does not prove what every browser/runtime component did. New diagnostics retain the relevant exact per-path entries and buffer events. Scene-loading checks had already completed before the failed wait; screenshots and interaction checks still remain required after readiness.

The retry changes observation capacity and records evidence. It does not replace the readiness condition with response-body success or interpret the suspected harness cause as product acceptance.

## Exact bounded change

The fixed retry list is only `maeda-mc305`, `liebherr-lr1100`, `liebherr-172ecb`. These declare 4, 3 and 3 motions respectively, so the retry requires exactly three results and ten completed motions. Tadano, LTM and SK do not enter the retry interaction loop. Initial navigation can still load the currently selected SK preset; such incidental responses are retained, but no SK baseline, motion or orbit is repeated by this script.

The script calls `performance.setResourceTimingBufferSize(2000)` in a context init script registered before `context.newPage()`. The same init script records `resourcetimingbufferfull` event timestamps, monotonic time, actual entry counts, and last responseEnd. It neither clears entries nor changes the application code.

Before each ready3d sequence, after success, and in its catch path before rethrowing the original error, the script awaits a saved `resource-timing.json` update. Each record contains the preset/phase, actual resource count, timeOrigin/now, maximum responseEnd, configured capacity, observed buffer-full events, and exact site/current-preset timing entries including byte counts. If diagnostic evaluation itself fails, a separate awaited `resource-timing-errors.json` preserves that error and the original error; no count is invented and the error is not treated as success. These diagnostics cover the ready3d pathway, not arbitrary failures after a destroyed browser context.

The existing ready3d wait predicate and HTTP200/frozen-body hash assertion are unchanged. Canvas presence, absent scene-loading/failure, declared slider counts, min/max/0.1 step, Home→ArrowRight→Apply, non-no-op motion, authoritative before/after pose and advancing versions, paired actual 3D/2D captures, full-view bounds, table-linked limits, and actual orbit verification remain the v1 checks. All six catalog entries and seven source asset hashes are still authenticated. Final retry loaded-asset validation requires the site and three retried crane paths; incidental initial assets are recorded without pretending this retry retested all six cranes.

The same C4 candidate, BUILD_ID, fresh parent-window process/DB provenance, private PIN handling, synthetic-frame guard, mutation restrictions, frozen-source fingerprints, and grant-expiry cleanup remain. `routeInvalidationCoverage` stays `NOT_IMPLEMENTED`, `fixtureRestored` stays false, and `productAcceptance` stays `NOT_RUN`. A successful collection ends at `REVIEW_REQUIRED` and needs independent stored-image review and a separate evidence join with v1.

## One-attempt subgrant and exact deferred command

The existing asset grant schema remains, with `phase: ASSET-BROWSER`, plus these requirements:

- New `id` matching `W3A-C4-ASSET-RETRY-[A-Za-z0-9-]+` and `maxAttempts:1`.
- `scriptSha256` exactly the new v1.1 hash above; updated grant dates and hashes must bind the existing authorized C4 process/provenance and canonical binding.
- Explicit parent retry decision and released exclusive browser window; the old grant does not authorize this retry.

Before any browser launch the script claims `evidence/qa/ui-device/candidate-cd8a2428/asset-browser-retry-v1.1/single-attempt.json` with exclusive creation. It is permanent, even if the attempt later fails. A new grant ID cannot bypass that one-attempt claim. Every attempt's artifacts use a fresh timestamp/UUID directory under `asset-browser-retry-v1.1`; v1 output is preserved.

The following command is prepared, not executed. The new grant filename is reserved for the parent's future grant:

```bash
node /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/c4-asset-interactions-v1.1.mjs --binding /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/candidate-binding-c4.v2.json --grant /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/ui-device/candidate-cd8a2428/w3a-assets-retry-grant-01.json --process /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/ui-device/candidate-cd8a2428/w3a-process-01.json
```

Estimated runtime is approximately 3–5 minutes, unmeasured for v1.1, based on the preserved per-preset recipe. Only the parent may authorize the actual interval. No automatic retry or completed-preset rerun is included.

## Source verification

`node --check /90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/ui-device/w3/c4-asset-interactions-v1.1.mjs` returned exit0. The old source hash remains unchanged. Static diff review confirms the ready3d predicate, served-byte assertion and motion/capture body are preserved. Independent reviewer `/root/qa_lead/qa_ui_device/w3_browser_scenarios/c4_adapter_frozen_review` returned FINAL STATIC_READY for the hash-bound code and companion note: `codeQualityStatus:CLEAR`, `recommendation:APPROVE`, `blockers:[]`. The reviewer independently confirmed the three saved v1:138 timeout results, cautious plateau interpretation, ten-motion scope, exact predicate/hash preservation, permanent claim and deferred grant boundary. No runtime/API/browser/test was executed by the reviewer. This is source readiness only, not runtime evidence or permission.
