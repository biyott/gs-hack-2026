import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gs_safety_mobile/features/safety_guidance/data/guidance_api_service.dart';

import '../presentation/worker_ui_fixtures.dart';
import 'connection_fixtures.dart';

void main() {
  setUpAll(loadSafetyFonts);

  testWidgets('invalid server stays in the form without starting a session', (
    tester,
  ) async {
    final fixture = ConnectionFixture();
    addTearDown(fixture.dispose);
    await tester.pumpWidget(fixture.host());
    for (final server in [
      'not-a-server',
      'http://user:pass@demo.local',
      'https://demo.local?code=secret',
      'https://demo.local#setup',
    ]) {
      await tester.enterText(find.byType(TextFormField).first, server);
      await tester.ensureVisible(find.byType(FilledButton));
      await tester.tap(find.byType(FilledButton));
      await tester.pumpAndSettle();
      expect(find.text('서버 주소를 확인하세요'), findsOneWidget);
      expect(fixture.api.logins, isEmpty);
    }
  });

  testWidgets('selected mode role and code reach a disabled pending session', (
    tester,
  ) async {
    final fixture = ConnectionFixture();
    addTearDown(fixture.dispose);
    await tester.pumpWidget(fixture.host());
    await showConnectionLanguage(tester, 'en');
    await tester.enterText(
      find.byType(TextFormField).first,
      '  http://demo.local:3000  ',
    );
    final dropdowns = find.byType(DropdownButtonFormField<String>);
    await tester.tap(dropdowns.first);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Fire & gas').last);
    await tester.pumpAndSettle();
    await tester.tap(dropdowns.last);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Worker 2 · WORKER-B').last);
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextFormField).last, 'demo-code');
    await tester.ensureVisible(find.byType(FilledButton));
    await tester.tap(find.byType(FilledButton));
    await tester.pumpAndSettle();
    expect(fixture.requestedServer, Uri.parse('http://demo.local:3000'));
    expect(fixture.session.mode, 'fire-gas');
    expect(fixture.api.logins.single, {
      'role': 'worker',
      'actorId': 'worker-b',
      'deviceRole': 'WORKER_2',
      'workerId': 'WORKER-B',
      'accessCode': 'demo-code',
    });
    expect(
      tester.widget<FilledButton>(find.byType(FilledButton)).onPressed,
      isNull,
    );

    fixture.api.loginResult.completeError(const ApiFailure('Role is occupied'));
    await tester.pumpAndSettle();
    expect(find.text('Role is occupied'), findsOneWidget);
    expect(
      tester.widget<FilledButton>(find.byType(FilledButton)).onPressed,
      isNotNull,
    );
  });

  for (final width in [375.0, 768.0, 1280.0]) {
    for (final language in ['ko', 'en']) {
      for (final scale in [1.0, 2.0]) {
        testWidgets('connection text fits $width $language at scale $scale', (
          tester,
        ) async {
          await tester.binding.setSurfaceSize(Size(width, 900));
          addTearDown(() => tester.binding.setSurfaceSize(null));
          final fixture = ConnectionFixture();
          addTearDown(fixture.dispose);
          await tester.pumpWidget(fixture.host(textScale: scale));
          await showConnectionLanguage(tester, language);
          await tester.pumpAndSettle();
          expect(tester.takeException(), isNull);
          expect(clippedConnectionText(tester), isEmpty);
          await tester.ensureVisible(find.byType(FilledButton));
          await tester.pumpAndSettle();
          expect(tester.takeException(), isNull);
          expect(clippedConnectionText(tester), isEmpty);
          final roles = find.byType(DropdownButtonFormField<String>).last;
          await tester.ensureVisible(roles);
          await tester.tap(roles);
          await tester.pumpAndSettle();
          expect(tester.takeException(), isNull);
          expect(clippedConnectionText(tester), isEmpty);
          await tester.tap(
            find.byWidgetPredicate((widget) {
              return widget is Text &&
                  widget.semanticsLabel ==
                      (language == 'ko' ? '현장 카메라' : 'Site camera');
            }).last,
          );
          await tester.pumpAndSettle();
          expect(tester.takeException(), isNull);
        });
      }
    }
  }
}
