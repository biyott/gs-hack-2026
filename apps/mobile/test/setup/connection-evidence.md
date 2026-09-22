# Connection setup verification

Scope: `lib/setup/connection_screen.dart` and `test/setup/connection_*`. The connection API, controller, and worker locale contract are unchanged. The setup language switch changes setup copy; guidance and speech continue to use the worker profile language from the server, now explained in the form.

## Reproduced defects and fix

The baseline loaded the bundled Noto Sans KR and Material Icons fonts and rendered the actual Flutter screen at 375, 768, and 1280 logical pixels, in Korean and English, at 100% and 200% text.

Three layout causes were tested: fixed AppBar height, single-line InputDecoration helper text, and dense DropdownButtonFormField selected-item height. The baseline produced seven failing layout cases. At 375px/200%, the clipped-text result included the simulation header, language button, server helper, access-code helper, and selected worker role. At 375px/100%, the English access-code helper was already clipped. Both language buttons clipped at 200% at all widths.

The corrected screen uses a scaled toolbar with a two-line simulation title, wrapping helper widgets, and non-dense dropdowns. Korean copy uses the existing SafetyText primitive. URL validation now rejects credentials, query strings, and fragments before opening a session, matching GuidanceApiService validation.

Baseline log: `/tmp/gs-connection-before.log`. Representative red output:

```text
connection text fits 375.0 ko at scale 2.0
Expected: empty
Actual: [
  '같은 네트워크에 있는 서버 주소',
  '작업자 1 · WORKER-A',
  '서버 운영자가 지정한 코드를 입력하세요',
  'GS SAFETY · SIMULATION',
  'English'
]
00:14 +19 -7: Some tests failed.
```

## Verification

```sh
flutter test --concurrency=1 --update-goldens --dart-define=CAPTURE_UI=true \
  test/setup/connection_screen_test.dart \
  test/setup/connection_visual_capture_test.dart
flutter analyze lib/setup/connection_screen.dart \
  test/setup/connection_fixtures.dart \
  test/setup/connection_screen_test.dart \
  test/setup/connection_visual_capture_test.dart
```

Result: **27 tests passed; analyzer clean**. Fourteen functional/layout tests cover rejected URLs, forwarding the selected mode/role/access code, disabling pending Connect, displaying failure and allowing retry, all viewport/language/text-scale combinations, and opening/selecting from role menus without clipped text or layout exceptions. Thirteen capture cases produce 28 PNGs under `goldens/connection-*.png`.

Final test log: `/tmp/gs-connection-after.log`.

```text
00:27 +27: All tests passed!
Analyzing 4 items...
No issues found! (ran in 5.0s)
```

Capture coverage:

- Top and bottom of the real screen at 375/768/1280px, Korean/English, 100%/200% text: 24 PNGs.
- Open role menu at 375px/200%, Korean/English: 2 PNGs.
- Pending and failed connection at 375px, English: 2 PNGs.

The fixture uses the real MobileSessionController with test native/audio ports and a controlled GuidanceApiService response. It uses the same ListenableBuilder subscription as the app shell, so loading/error rebuilds are exercised. Captures are Flutter engine widget renders; they do not establish physical Android behavior, keyboard behavior, native permissions, or hardware support.

Independent visual verdict is tracked by the parent UI reviewer over the full setup/device capture set. This record does not self-certify that gate.

The initial independent review returned REVISE for a Korean auxiliary phrase split at 375px/200% and an inaccurate claim that locale selection requires profile confirmation. Both helpers were rephrased. The subsequent combined 42-test run and 60 regenerated captures are recorded in `setup-final.log` and `capture-manifest.json`; final independent verdicts are recorded in `device-evidence.md`.
