import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import '../presentation/worker_ui_fixtures.dart';
import 'connection_fixtures.dart';

const _capture = bool.fromEnvironment('CAPTURE_UI');

void main() {
  setUpAll(() async {
    if (_capture) await loadSafetyFonts();
  });

  for (final width in [375.0, 768.0, 1280.0]) {
    for (final language in ['ko', 'en']) {
      for (final scale in width == 375 ? [1.0, 2.0] : [2.0]) {
        testWidgets('capture server choices $width $language $scale', (
          tester,
        ) async {
          await tester.binding.setSurfaceSize(Size(width, 900));
          addTearDown(() => tester.binding.setSurfaceSize(null));
          final fixture = ConnectionFixture();
          addTearDown(fixture.dispose);
          await tester.pumpWidget(fixture.host(textScale: scale));
          await showConnectionLanguage(tester, language);
          await tester.pumpAndSettle();
          final name = 'server-$language-${width.toInt()}-${scale.toInt()}x';

          Future<void> capture(String state) async {
            expect(tester.takeException(), isNull);
            expect(clippedConnectionText(tester), isEmpty);
            final path = Directory.current.uri.resolve(
              '../../.omo/evidence/mobile-server-selector/$name-$state.png',
            );
            await expectLater(
              find.byKey(connectionBoundary),
              matchesGoldenFile(path),
            );
          }

          Future<void> openOptions() async {
            final selector = find.byKey(const Key('server-option'));
            await tester.ensureVisible(selector);
            await tester.tap(selector);
            await tester.pumpAndSettle();
          }

          Future<void> choose(String label) async {
            await tester.tap(
              find
                  .byWidgetPredicate(
                    (widget) =>
                        widget is Text && widget.semanticsLabel == label,
                  )
                  .last,
            );
            await tester.pumpAndSettle();
          }

          await capture('default');
          await openOptions();
          await capture('menu');
          await choose(language == 'ko' ? '기존 IP' : 'Existing IP');
          await capture('existing-ip');
          await openOptions();
          await choose(language == 'ko' ? '수동 입력' : 'Manual input');
          final manual = find.byKey(const Key('manual-server-address'));
          await tester.ensureVisible(manual);
          await tester.enterText(manual, 'http://demo.local:3000');
          await tester.pumpAndSettle();
          await capture('manual');
          await tester.enterText(manual, 'invalid-address');
          await tester.ensureVisible(find.byType(FilledButton));
          await tester.tap(find.byType(FilledButton));
          await tester.pumpAndSettle();
          await tester.ensureVisible(manual);
          await tester.pumpAndSettle();
          await capture('invalid');
          expect(fixture.api.logins, isEmpty);
        }, skip: !_capture);
      }
    }
  }
}
