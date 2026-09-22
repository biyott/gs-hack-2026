# Native focus ring evidence

The shared Flutter theme implements DESIGN.md section 8: a 2 logical pixel accent ring, separated from the control by a 3 logical pixel gap. The ring is painted outside the existing control shape, so focus does not change layout. The button shape receives native `WidgetState.focused`; input borders receive native `InputDecorator` focus, including dropdown fields. Floating input labels retain their border notch.

`SafetyActionButton` inherits the theme shape while keeping its urgent/action colors. Button `copyWith` preserves focus when Flutter applies a component's custom side. No screenshot substitutes or fake focus state are used.

Validation from `apps/mobile`:

```sh
/home/b/.local/share/gs-safety-sdk/flutter/bin/flutter analyze lib/theme test/presentation/focus_fixture.dart test/presentation/focus_ring_test.dart test/presentation/focus_visual_capture_test.dart
/home/b/.local/share/gs-safety-sdk/flutter/bin/flutter test --concurrency=1 --dart-define=CAPTURE_UI=true --update-goldens test/presentation/focus_ring_test.dart test/presentation/focus_visual_capture_test.dart
```

- Analyzer: no issues.
- Tests: 6 passed (2 behavior/contrast tests and 4 capture scenarios).
- Native Tab traversal visits filled, outlined, text, urgent worker, text field, and dropdown controls. Enter activates all four button callbacks; text input accepts a server address; Enter / ArrowDown / Enter selects English in the dropdown.
- Rendered pixels verify both accent ring pixels, all three gap pixels, and the background immediately outside the ring. Unfocused controls have no ring. Control rectangles are unchanged by focus.
- Accent contrast against base/panel/raised/hover surfaces is 10.26:1 / 9.31:1 / 8.11:1 / 6.62:1, exceeding the 3:1 requirement.
- All 24 PNGs validate as 375 × 900: `goldens/focus-{filled,outlined,text,urgent,field,dropdown}-{ko,en}-375-{100,200}.png`. Each capture follows a real Tab event, with bundled Noto Sans KR and Material Icons loaded. Dropdown density matches production (`isDense: false`).

These are software-rendered Flutter widget captures, not physical Android hardware evidence. The coordinating agent owns the independent dual visual review together with the fresh worker/setup capture set.
