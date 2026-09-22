# C3 partial focus audit v1

Stored-evidence audit during QD008 HOLD. No browser, server, Blender, device or network execution; no product edits. Candidate sha256:1a7c95cd1a15df738492a368d36cc6cb98985ec1c2618b10e807c82076b247c4; BUILD_ID BLy4PJy6kc0sEf4JQFnE0.

Outcome: **19 INCONCLUSIVE helper assertions**, with confirmed missing failure telemetry. No concrete product visibility violation is established by this bounded review. This is neither a blanket PASS nor a product/runtime FAIL. The raw producer-helper report remains FAIL / productAcceptance NOT_RUN.

The immutable [JSON audit](/90-biyott@github/gs-hack-2026/docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/evidence/qa/ui-device/candidate-1a7c95cd/c3-partial-focus-audit-v1.json) records every selector, full available frame geometry, source hashes, PNG hashes and time-bound provenance. Original report SHA-256: 3d65c3fcefe74a1351f55911714dbc1b79084dc95c3f130ca33268caffd54708. Embedded scenario routes exactly match the supplied scenario.

## Findings

- Three connected-entry failures occur on the first target, `.entry-session`, at 768, 1280 and 1440 widths. No screenshot of those failed connected states was saved; their geometry is unavailable.
- Eight tracking failures occur on `#tracking .camera-panel`, after the toolbar completed successfully. The catch skips the later observations target. All eight saved toolbar PNGs were directly viewed: their camera cards visibly show disconnected/MOCK/no-frame states. They are not failure-frame evidence.
- Eight calibration failures retain partial `#tracking .calibration-panel` frames. Both modes leave an unpictured tail of 191.234375px at 375, 431.234375px at 390, 229.234375px at 768, and 357.234375px at 1280. Each last saved frame was directly viewed; readable inputs and labels appear, but complete reachability is unverified. A tall card crossing a viewport edge is not itself a defect.
- The helper samples nine points at a maximum 4px inset and requires every hit to belong to the target. Frozen panels have 14px rounded corners. A sample in a rounded cutout is a plausible helper explanation, **not a confirmed root cause**. Blank padding alone should pass. Nearest-ancestor scroll recovery is another source behavior needing failed geometry before attribution.
- `focused-scroll.mjs:82` throws a plain Error; `run-surface.mjs:175` saves only its message. Failed geometry, actual hit labels and exact failure timestamps do not survive. A captured frame may precede an after-capture failure; successful pre-capture geometry is never substituted for missing failure geometry.

All 16 last retained PNGs associated with tracking/calibration failures have verified PNG signatures, expected viewport dimensions and hashes matching the raw report; direct review found no missing compositor region. This limited inspection does not review every completed capture or establish full visual/accessibility acceptance. The separate hold-interrupted 1440 header/run-controls state is excluded from these 19 pre-HOLD assertions.

## Exact state inventory and time bounds

All times below are 2026-09-21 UTC. These are sequential bounds from saved neighboring captures, **not exact error timestamps**. Every row is INCONCLUSIVE_HELPER_ASSERTION.

| State | Failing target inferred from sequence | Failure bounded by saved evidence |
|---|---|---|
| equipment-panels-tracking-camera-and-observations-375x812 | #tracking .camera-panel | 16:29:56.323–16:29:56.626 |
| equipment-panels-calibration-all-fields-375x812 | #tracking .calibration-panel | 16:29:57.145–16:29:57.412 |
| fire-gas-panels-tracking-camera-and-observations-375x812 | #tracking .camera-panel | 16:30:17.505–16:30:17.807 |
| fire-gas-panels-calibration-all-fields-375x812 | #tracking .calibration-panel | 16:30:18.328–16:30:18.579 |
| equipment-panels-tracking-camera-and-observations-390x844 | #tracking .camera-panel | 16:30:45.288–16:30:45.606 |
| equipment-panels-calibration-all-fields-390x844 | #tracking .calibration-panel | 16:30:46.010–16:30:46.273 |
| fire-gas-panels-tracking-camera-and-observations-390x844 | #tracking .camera-panel | 16:31:05.904–16:31:06.222 |
| fire-gas-panels-calibration-all-fields-390x844 | #tracking .calibration-panel | 16:31:06.626–16:31:06.871 |
| entry-admin-admin-connected-768x1024 | .entry-session | 16:31:08.712–16:31:13.710 |
| equipment-panels-tracking-camera-and-observations-768x1024 | #tracking .camera-panel | 16:31:45.370–16:31:45.695 |
| equipment-panels-calibration-all-fields-768x1024 | #tracking .calibration-panel | 16:31:45.889–16:31:46.170 |
| fire-gas-panels-tracking-camera-and-observations-768x1024 | #tracking .camera-panel | 16:32:18.397–16:32:18.686 |
| fire-gas-panels-calibration-all-fields-768x1024 | #tracking .calibration-panel | 16:32:18.883–16:32:19.120 |
| entry-admin-admin-connected-1280x720 | .entry-session | 16:32:21.297–16:32:25.882 |
| equipment-panels-tracking-camera-and-observations-1280x720 | #tracking .camera-panel | 16:32:54.153–16:32:54.468 |
| equipment-panels-calibration-all-fields-1280x720 | #tracking .calibration-panel | 16:32:54.826–16:32:55.101 |
| fire-gas-panels-tracking-camera-and-observations-1280x720 | #tracking .camera-panel | 16:33:28.454–16:33:28.767 |
| fire-gas-panels-calibration-all-fields-1280x720 | #tracking .calibration-panel | 16:33:29.108–16:33:29.384 |
| entry-admin-admin-connected-1440x900 | .entry-session | 16:33:31.647–16:33:36.201 |

## Authorized next-candidate check

Under a future explicit runtime grant, capture error UTC, semantic state, selector, frame/phase, target/clip rectangles, all sample coordinates and hit labels, computed radii, scroll offsets and a safe failure screenshot. Keep the original strict result; determine whether failed points concern rounded empty corners or meaningful controls/content. Preserve the same user-visible reachability outcome. No C3 rerun was performed or authorized by this audit.
