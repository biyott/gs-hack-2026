import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

import 'focus_fixture.dart';
import 'worker_ui_fixtures.dart';

const _capture = bool.fromEnvironment('CAPTURE_UI');

void main() {
  setUpAll(() async {
    if (_capture) await loadSafetyFonts();
  });
  for (final language in ['ko', 'en']) {
    for (final scale in [1.0, 2.0]) {
      testWidgets('capture native focus $language $scale', (tester) async {
        await tester.binding.setSurfaceSize(const Size(375, 900));
        addTearDown(() => tester.binding.setSurfaceSize(null));
        await tester.pumpWidget(
          focusFixture(language: language, textScale: scale),
        );
        await tester.pumpAndSettle();
        for (final control in focusControls) {
          await tester.sendKeyEvent(LogicalKeyboardKey.tab);
          await tester.pumpAndSettle();
          await tester.ensureVisible(find.byKey(Key(control)));
          await tester.pumpAndSettle();
          await expectLater(
            find.byKey(focusCaptureBoundary),
            matchesGoldenFile(
              'goldens/focus-$control-$language-375-${(scale * 100).toInt()}.png',
            ),
          );
          expect(tester.takeException(), isNull);
        }
      }, skip: !_capture);
    }
  }
}
