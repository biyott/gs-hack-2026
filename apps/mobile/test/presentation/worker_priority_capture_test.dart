import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'worker_priority_fixture.dart';
import 'worker_ui_fixtures.dart';

const _capture = bool.fromEnvironment('CAPTURE_UI');

void main() {
  setUpAll(() async {
    if (_capture) await loadSafetyFonts();
  });

  for (final language in ['ko', 'en']) {
    for (final scale in [1.0, 2.0]) {
      testWidgets('capture worker priorities $language $scale', (tester) async {
        await tester.binding.setSurfaceSize(const Size(375, 850));
        addTearDown(() => tester.binding.setSurfaceSize(null));
        final overlay = ValueNotifier(priorityOverlay(language));
        addTearDown(overlay.dispose);
        await tester.pumpWidget(
          priorityWorkerHost(
            overlay: overlay,
            language: language,
            version: language == 'ko' ? 1 : 2,
            textScale: scale,
          ),
        );
        await tester.pumpAndSettle();
        final suffix = '$language-375-${(scale * 100).toInt()}';
        await _captureState(tester, 'first-screen-$suffix');

        await tester.ensureVisible(find.byKey(const Key('worker-route-map')));
        await tester.pumpAndSettle();
        await _captureState(tester, 'full-route-$suffix');

        await tester.ensureVisible(find.byKey(const Key('worker-details')));
        await tester.pumpAndSettle();
        await tester.tap(find.byKey(const Key('worker-details')));
        await tester.pumpAndSettle();
        await _captureState(tester, 'details-$suffix');
        final settings = find.widgetWithIcon(
          OutlinedButton,
          Icons.settings_outlined,
        );
        await tester.ensureVisible(settings);
        await tester.pumpAndSettle();
        await _captureState(tester, 'details-controls-$suffix');
        expect(find.byType(BottomSheet), findsOneWidget);
        expect(tester.takeException(), isNull);
      }, skip: !_capture);
    }
  }
}

Future<void> _captureState(WidgetTester tester, String name) async {
  expect(tester.takeException(), isNull);
  await expectLater(
    find.byKey(priorityCaptureBoundary),
    matchesGoldenFile('goldens/priority-$name.png'),
  );
}
