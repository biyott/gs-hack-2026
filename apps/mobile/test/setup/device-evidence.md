# Device readiness UI evidence

Goal GS-SAFETY-SIM-001 · run GS-SAFETY-SIM-001-20260921T084101Z.

Changes: visible current/stale/absent observation state and source/time; per-peer observation freshness; explicit required waiting roles and worker mapping; clock uncertainty with microsecond-derived three-decimal millisecond precision; unknown or greater-than-50-ms uncertainty labeled `Latency inconclusive`. A smaller uncertainty is not presented as a latency pass. Existing start, stop, capability refresh and role reselection actions are preserved. Optional lifecycle `onLogout` owns cleanup when supplied; fallback still awaits tracking stop before session logout, then worker-tools navigation returns.

Environment: Flutter 3.47.5 / Dart 3.13.4, Linux widget tester. Actual rendered widgets use controlled fixture states, bundled Noto Sans KR and Material Icons. No physical Android, camera, UWB, assistive-technology or live timing claim follows from these captures.

## Executed verification

From `apps/mobile`:

```sh
flutter test --concurrency=1 --update-goldens --dart-define=CAPTURE_UI=true test/setup/device_screen_test.dart test/setup/device_visual_capture_test.dart
flutter analyze lib/setup test/setup
```

Initial device-only result: 15/15 tests passed, analyzer no issues (`device-final.log`). Seven behavior/layout tests include 375px at 200% text, exact 50/50.001/null uncertainty boundaries, distinct start/stop/refresh callbacks, stop-completion before fallback logout, and lifecycle logout without duplicate fallback cleanup.

The four setup/device test files passed together: **42/42 passed** (`setup-final.log`); scoped setup analysis had no issues. After the later shared-focus and footer correction, the complete worker/setup capture suite ran again after production source freeze: **33/33 capture tests passed** (`post-freeze-capture.log`). All **60 setup PNGs** were regenerated: 28 connection captures plus 32 device captures. Each device state/scale advances at most 600 logical pixels through its 844-pixel body viewport until the footer, ensuring overlapping coverage of source/timestamp, clock, requirements, controls and role reselection. The current setup manifest capture time is `2026-09-21T11:00:36.061Z`, with 22 source/fixture/font hashes including the clock getter, deterministic clock-monitor input and shared focus border. The live app shell supplies the lifecycle `onLogout` callback to both root-device and worker-tools routes. Shared native-focus verification passed six tests and analyzer checks; see `../presentation/focus_evidence.md`.

## Failure history

- First capture/test run: ambiguous `Clock uncertainty` text finder matched both the metric and explanation (`Bad state: Too many elements`). This was a capture-harness failure, not a product layout failure.
- A first-selector workaround then failed on lazily built offscreen list children (`Bad state: No element`). The final finder uses the unique metric label or section title without eagerly requiring an existing first element, so scrolling can build the child. Final full device run passed.
- No debug instrumentation or temporary runtime changes remain. Fixture and capture files are retained verification assets.
- Initial independent visual review directly opened all 44 captures and returned REVISE: the Korean role helper split `선택할 수 / 있습니다`, and device detail split the numeric counter `장비 1 / 대와`. The copy was shortened or rephrased without changing role or measurement behavior. Source review also removed an inaccurate claim that profile confirmation is required for selecting the server profile language.
- Second independent review opened all 44 refreshed captures and returned REVISE: `두 / 작업자의` still split, clock values separated from their `ms` unit, and two device capture positions omitted source/time and bottom controls at 200%. The Korean requirement now uses two concise lines, the clock value has a dedicated short line, and device captures now traverse the full page with overlap.
- The expanded run exposed two nondeterministic fixture assertions after the core controller began including wall/monotonic residual in clock uncertainty. The UI fixture now injects fixed wall/monotonic clocks. This preserves the production getter and exact threshold behavior. The following analyzer suggestion converted the fixture constructor to a super parameter. Final combined tests and analyzer both pass.
- The full-scroll review then found a Korean footer phrase splitting `화면 / 켜짐`; it now has explicit short lines. Review also identified the shared theme's in-place focus border as insufficient for DESIGN §8 (2px accent ring with 3px offset). That shared focus treatment receives keyboard checks and focused captures. The tracking owner confirmed a semantic controller edit during the preceding capture run; those captures are superseded by a complete run after tracking and UI source freeze.

Independent source-integrity and visual/CJK verdicts are recorded after review. Capture generation alone is not a visual pass. See `connection-evidence.md` for the separate connection-screen baseline and correction history.

## Final setup verdict

Both fresh independent passes approve the current 60-image set, with high confidence and no blockers. `setup_gate_a` directly opened all 60 images, verified all 22 input hashes and DESIGN sections 1–8, decoded opaque/composited pixels, and checked that all 47 connection and 54 device transitive local Dart dependencies predated their respective captures. Source trace confirms the required freshness, clock, waiting-role, connection, focus and logout behavior. `setup_gate_b` directly opened all 60 images and verified the same manifest, complete 200% coverage, readable Korean/English content, intact number/unit pairs, and distinct current/stale/absent states.

This is a PASS for the software-rendered setup/device slice. Worker-specific copy review and physical-device acceptance remain separately tracked; these verdicts do not certify either.
