import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gs_safety_mobile/features/safety_guidance/data/guidance_api_service.dart';

import '../presentation/worker_ui_fixtures.dart';
import 'connection_fixtures.dart';

const _capture = bool.fromEnvironment('CAPTURE_UI');

void main() {
  setUpAll(() async {
    if (_capture) await loadSafetyFonts();
  });

  for (final width in [375.0, 768.0, 1280.0]) {
    for (final language in ['ko', 'en']) {
      for (final scale in [1.0, 2.0]) {
        testWidgets('capture setup $width $language scale $scale', (
          tester,
        ) async {
          await tester.binding.setSurfaceSize(Size(width, 900));
          addTearDown(() => tester.binding.setSurfaceSize(null));
          final fixture = ConnectionFixture();
          addTearDown(fixture.dispose);
          await tester.pumpWidget(fixture.host(textScale: scale));
          await showConnectionLanguage(tester, language);
          await tester.pumpAndSettle();
          final name =
              'connection-$language-${width.toInt()}-${scale.toInt()}x';
          await expectLater(
            find.byKey(connectionBoundary),
            matchesGoldenFile('goldens/$name-top.png'),
          );
          await tester.ensureVisible(find.byType(FilledButton));
          await tester.pumpAndSettle();
          await expectLater(
            find.byKey(connectionBoundary),
            matchesGoldenFile('goldens/$name-bottom.png'),
          );
          if (width == 375 && scale == 2) {
            final roles = find.byType(DropdownButtonFormField<String>).last;
            await tester.ensureVisible(roles);
            await tester.tap(roles);
            await tester.pumpAndSettle();
            await expectLater(
              find.byKey(connectionBoundary),
              matchesGoldenFile('goldens/$name-role-menu.png'),
            );
          }
          expect(tester.takeException(), isNull);
        }, skip: !_capture);
      }
    }
  }

  testWidgets('capture pending and failed connection', (tester) async {
    await tester.binding.setSurfaceSize(const Size(375, 900));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    final fixture = ConnectionFixture();
    addTearDown(fixture.dispose);
    await tester.pumpWidget(fixture.host());
    await showConnectionLanguage(tester, 'en');
    await tester.ensureVisible(find.byType(FilledButton));
    await tester.tap(find.byType(FilledButton));
    await tester.pumpAndSettle();
    await expectLater(
      find.byKey(connectionBoundary),
      matchesGoldenFile('goldens/connection-en-375-pending.png'),
    );
    fixture.api.loginResult.completeError(const ApiFailure('Role is occupied'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.byType(FilledButton));
    await tester.pumpAndSettle();
    await expectLater(
      find.byKey(connectionBoundary),
      matchesGoldenFile('goldens/connection-en-375-error.png'),
    );
    expect(tester.takeException(), isNull);
  }, skip: !_capture);
}
