# Worker presentation evidence

Goal: GS-SAFETY-SIM-001, goal run GS-SAFETY-SIM-001-20260921T084101Z.

Historical record: the sections below document presentation and focus review before the later bounded worker-priority correction. Candidate 2's verification and independent review are recorded in `priority_evidence.md` and `priority-review-b.md`; candidate 3's critical-destination correction is in `candidate3-ui-evidence.md`. The current semantics-only correction and manifest are recorded in `candidate4-ui-evidence.md`. Earlier verdicts remain intact and do not certify the later capture set.

Environment: Linux Flutter widget tester, Flutter 3.47.5 / Dart 3.13.4. SDK executable: `/home/b/.local/share/gs-safety-sdk/flutter/bin/flutter`. These are actual Flutter widget renders using fixture data. They do not establish physical Android operation, live server integration, audio, vibration, UWB, or assistive-technology behavior.

The exact images and UI source hashes are recorded in `capture-manifest.json`. The 30 PNGs in `goldens/` cover worker, map and component showcase in Korean/English at widths 375/768/1280; 200% text in both languages; map zoom; expiry, disconnected, map mismatch and voice-unavailable states, each with map inspection. All images have height 900. Bundled Noto Sans KR and Material Icons are loaded before capture.

## Executed checks

From `apps/mobile`:

```sh
flutter analyze lib/features/safety_guidance/presentation lib/theme lib/l10n test/presentation
flutter test --update-goldens --dart-define=CAPTURE_UI=true test/presentation
```

Result: scoped analyzer reported no issues; presentation suite passed 23 tests. Tests include action callback separation, post-render receipt deduplication, stale guidance action disabling, map identity/connection/expiry/position route guards, equal-meter XY projection with positive Y upward, and 80-character worker identifiers plus long notices at 200% text in both languages and all three widths.

Normal `flutter test` skips the opt-in capture tests. To compare the saved rendered baseline, omit `--update-goldens` while retaining `--dart-define=CAPTURE_UI=true`. These baselines are implementation regression artifacts, not a reference-image fidelity claim.

## Findings and correction history

- Initial scoped analysis reported three missing-brace lints. Braces were added; final scoped analysis passed.
- Preliminary source review found that zoom/pan could hide the scale. The scale now lives outside the transformed canvas and its meter span follows zoom.
- Preliminary source review found color-only danger/caution distinction. Danger now uses crosshatching, caution uses stripes, and the textual map summary includes severity.
- The first fixture renders had missing Latin/icon glyphs because tester fallback selected Ahem before the unavailable preferred font. The actual theme now explicitly selects the locally bundled Noto Sans KR fallback, and capture setup loads its font and Material Icons. The corrected PNGs contain readable Korean/Latin/icons. Initial defective fixture images were superseded; they are not pass evidence.
- Korean character-level wrapping split words. `SafetyText` now keeps Korean words together and provides the original unmodified semantic label.
- One test invocation used the repository root and failed because it has no Flutter pubspec. The invocation was corrected to `apps/mobile`; the successful command above records the actual test scope.

Independent visual review verdicts are recorded after review; screenshot generation alone is not a visual pass.

First independent round: both reviewers directly opened all 30 images and returned REVISE. A tablet-size scale/+X overlap was fixed by centering the stationary scale below the map. Failure fixtures incorrectly retained an active speech status; they now display unavailable speech for invalid/unavailable guidance. The English assistance button was aligned to the reviewed backend instruction (`Request assistance`). The integrity reviewer also identified a stale-position movement-eligibility issue in the separately owned session adapter; it was sent to the mobile integration lead.

During the fresh review, root `DESIGN.md` advanced to 1.0.1 for 3D articulation constraints. The visual reviewer confirmed that the UI tokens and sections were unchanged. The manifest was refreshed against that contract without rerendering identical UI code; image hashes and capture times remain unchanged.

Fresh visual/CJK pass (`visual_cjk_final`): PASS, high confidence, 30/30 images opened directly. No blocking findings. The reviewer verified all PNG signatures/dimensions/hashes, fully opaque decoded RGBA pixels, all 14 final source hashes, preserved Korean words at 200%, distinct failure states, readable scale/axes, and principal text/control contrast. This remains a fixture-render verdict and does not cover hardware, assistive technology, audio, vibration, or live integration.

Fresh design-system/functional integrity pass (`visual_integrity_final`): PASS, high confidence, 30/30 current images opened directly and all 14 source hashes matched. No blocking findings. It verified real token-driven widgets, static/dynamic repaint separation, route validity gates, identity-guarded display receipts, and the mobile lead's `supportsMovement` guard for movement guidance while stationary guidance remains independently eligible. The reviewer did not rerun the already recorded test/analyzer commands.

Initial presentation verdict: both independent passes approved that capture set. Scoped analyzer: no issues. Presentation test run: 23 passed. Product integration and physical-device acceptance remain separately owned by the mobile and QA leads.

## Shared focus correction and fresh verification

Subsequent setup review found that the shared in-place focus border did not implement DESIGN section 8's 2px accent ring with 3px offset. The theme now uses native state-resolved border classes that draw the ring outside unchanged controls and preserve the input-label notch. `SafetyActionButton` inherits that shared shape while retaining its action/urgent colors. Keyboard traversal, activation, entry and selection, exact painted ring/gap pixels, unchanged geometry, and contrast are verified by six passing focus tests; see `focus_evidence.md`.

After all production source froze, the complete worker/setup capture suite passed 33 tests (`../setup/post-freeze-capture.log`), and all 30 worker images were regenerated. Their SHA-256 hashes are identical to the previously approved 30 images. Twenty-four additional captures show native focused controls in both languages at 100% and 200%. The current presentation manifest contains 54 images and 22 source/fixture/font hashes, with DESIGN sections 1–8 hashed separately from unrelated 3D contract changes. Fresh independent review covers all 54 current images; its final verdict is recorded below.

Current integrity pass (`worker_focus_gate_a`): PASS, high confidence, 54/54 images opened and 22/22 source hashes verified, with valid per-surface freshness and no blockers. Native focus, map guards, repaint separation, actions and post-frame display receipts pass source inspection.

Current visual/CJK pass (`worker_focus_gate_b`): REVISE, high confidence, 54/54 images opened. All 24 focused-control images are visually clean. The remaining finding is Korean auxiliary phrases wrapping across lines in legacy fallback/map-mismatch copy (`확인할 수 / 없습니다`, `표시하지 / 않습니다`) and corresponding fixture notices. No clipping, missing glyphs or compositing defect was found. The mobile lead requested a production/fixture hold because the APK had already built; no edits followed this finding. The precise finding and visual-qa skill rationale were sent to the lead for severity disposition. This record does not silently promote the current worker CJK result to PASS.

Coordinator clarification: this is an optional editorial suggestion concerning natural line wrapping without clipping or meaning loss; no mandatory acceptance criterion was waived, and final QA judgment remains pending. The root decided against an unnecessary cosmetic rebuild, without granting a CJK or QA acceptance exception. The mobile lead independently inspected `state-disconnected-375.png` and confirmed readable, unclipped text. The frozen source and fixtures are preserved. The independent CJK review remains REVISE and is not rewritten.

The finding concerns Korean at 375 × 900 logical pixels, 100% text scale, in these retained artifacts:

- `goldens/state-disconnected-375.png`: prominent `확인할 수 / 없습니다` and the analogous disconnected notice.
- `goldens/state-expired-375.png`: the same prominent phrase and notice `표시되지 / 않습니다`.
- `goldens/state-map-mismatch-375.png`: the same prominent unavailable-guidance phrase.
- `goldens/state-map-map-mismatch-375.png`: map summary `표시하지 / 않습니다`.

Reviewer rationale: visual-qa `SKILL.md`, Step 3 Pass B, explicitly flags a connective or auxiliary expression split mid-phrase (example: `쓸 수 / 있지만`) as blocking. This independent rationale remains recorded for the pending final QA judgment. Exact skill source: `/mnt/c/Users/biyot/.codex/plugins/cache/sisyphuslabs/omo/4.19.4/skills/visual-qa/SKILL.md`.
