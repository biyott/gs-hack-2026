import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gs_safety_mobile/features/safety_guidance/data/guidance_api_service.dart';
import 'package:gs_safety_mobile/setup/server_address_field.dart';

import '../presentation/worker_ui_fixtures.dart';
import 'connection_fixtures.dart';

void main() {
  setUpAll(loadSafetyFonts);

  testWidgets('server choices start with the default GS server', (
    tester,
  ) async {
    final fixture = ConnectionFixture();
    addTearDown(fixture.dispose);
    await tester.pumpWidget(fixture.host());
    final dropdown = tester
        .widget<DropdownButtonFormField<ServerAddressOption>>(
          find.byKey(const Key('server-option')),
        );
    expect(dropdown.initialValue, ServerAddressOption.gsServer);
    final choices = tester.widget<DropdownButton<ServerAddressOption>>(
      find.byType(DropdownButton<ServerAddressOption>),
    );
    expect(choices.items!.map((item) => item.value), [
      ServerAddressOption.gsServer,
      ServerAddressOption.existingIp,
      ServerAddressOption.manual,
    ]);
    expect(find.text('http://gs-safety:30080'), findsOneWidget);
    expect(find.byKey(const Key('manual-server-address')), findsNothing);
    await connect(tester);
    expect(fixture.requestedServer, Uri.parse('http://gs-safety:30080'));
  });

  testWidgets('second server choice connects to the existing IP', (
    tester,
  ) async {
    final fixture = ConnectionFixture();
    addTearDown(fixture.dispose);
    await tester.pumpWidget(fixture.host());
    await selectServer(tester, ServerAddressOption.existingIp);
    expect(find.text('http://100.95.210.25:3000'), findsOneWidget);
    expect(find.byKey(const Key('manual-server-address')), findsNothing);
    await connect(tester);
    expect(fixture.requestedServer, Uri.parse('http://100.95.210.25:3000'));
  });

  testWidgets('manual address survives switching without overriding a preset', (
    tester,
  ) async {
    final fixture = ConnectionFixture();
    addTearDown(fixture.dispose);
    await tester.pumpWidget(fixture.host());
    await selectServer(tester, ServerAddressOption.manual);
    const address = '  https://demo.local:3443  ';
    await tester.enterText(
      find.byKey(const Key('manual-server-address')),
      address,
    );
    await selectServer(tester, ServerAddressOption.existingIp);
    await selectServer(tester, ServerAddressOption.manual);
    expect(
      tester
          .widget<TextFormField>(find.byKey(const Key('manual-server-address')))
          .controller!
          .text,
      address,
    );
    await selectServer(tester, ServerAddressOption.gsServer);
    await connect(tester);
    expect(fixture.requestedServer, Uri.parse('http://gs-safety:30080'));
  });

  testWidgets('manual HTTPS address is trimmed before connecting', (
    tester,
  ) async {
    final fixture = ConnectionFixture();
    addTearDown(fixture.dispose);
    await tester.pumpWidget(fixture.host());
    await selectServer(tester, ServerAddressOption.manual);
    await tester.enterText(
      find.byKey(const Key('manual-server-address')),
      '  https://demo.local:3443  ',
    );
    await connect(tester);
    expect(fixture.requestedServer, Uri.parse('https://demo.local:3443'));
  });

  testWidgets('invalid server stays in the form without starting a session', (
    tester,
  ) async {
    final fixture = ConnectionFixture();
    addTearDown(fixture.dispose);
    await tester.pumpWidget(fixture.host());
    await selectServer(tester, ServerAddressOption.manual);
    for (final server in [
      '',
      'not-a-server',
      'ftp://demo.local',
      'http://user:pass@demo.local',
      'https://demo.local?code=secret',
      'https://demo.local#setup',
    ]) {
      await tester.enterText(
        find.byKey(const Key('manual-server-address')),
        server,
      );
      await connect(tester);
      expect(find.text('서버 주소를 확인하세요'), findsOneWidget);
      expect(fixture.api.logins, isEmpty);
    }
  });

  for (final code in ['', '   ']) {
    testWidgets('blank code ${code.length} uses the default demo code', (
      tester,
    ) async {
      final fixture = ConnectionFixture();
      addTearDown(fixture.dispose);
      await tester.pumpWidget(fixture.host());
      await tester.enterText(find.byKey(const Key('demo-access-code')), code);
      await connect(tester);
      expect(fixture.api.logins.single['accessCode'], '2026');
    });
  }

  testWidgets('selected mode role and code reach a disabled pending session', (
    tester,
  ) async {
    final fixture = ConnectionFixture();
    addTearDown(fixture.dispose);
    await tester.pumpWidget(fixture.host());
    await showConnectionLanguage(tester, 'en');
    await selectServer(tester, ServerAddressOption.manual);
    await tester.enterText(
      find.byKey(const Key('manual-server-address')),
      '  http://demo.local:3000  ',
    );
    await tester.ensureVisible(find.byKey(const Key('simulation-mode')));
    await tester.tap(find.byKey(const Key('simulation-mode')));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Fire & gas').last);
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.byKey(const Key('device-role')));
    await tester.tap(find.byKey(const Key('device-role')));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Worker 2 · WORKER-B').last);
    await tester.pumpAndSettle();
    await tester.enterText(
      find.byKey(const Key('demo-access-code')),
      'demo-code',
    );
    await connect(tester);
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
          await tester.ensureVisible(find.byKey(const Key('server-option')));
          await tester.tap(find.byKey(const Key('server-option')));
          await tester.pumpAndSettle();
          expect(tester.takeException(), isNull);
          expect(clippedConnectionText(tester), isEmpty);
          await tester.tap(serverMenuItem(ServerAddressOption.manual));
          await tester.pumpAndSettle();
          expect(
            find.byKey(const Key('manual-server-address')),
            findsOneWidget,
          );
          expect(tester.takeException(), isNull);
          expect(clippedConnectionText(tester), isEmpty);
          await tester.ensureVisible(find.byType(FilledButton));
          await tester.pumpAndSettle();
          expect(tester.takeException(), isNull);
          expect(clippedConnectionText(tester), isEmpty);
          final roles = find.byKey(const Key('device-role'));
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

Finder serverMenuItem(ServerAddressOption option) => find.descendant(
  of: find
      .byWidgetPredicate(
        (widget) =>
            widget is DropdownMenuItem<ServerAddressOption> &&
            widget.value == option,
      )
      .last,
  matching: find.byWidgetPredicate((widget) => widget is Text),
);

Future<void> selectServer(
  WidgetTester tester,
  ServerAddressOption option,
) async {
  final dropdown = find.byKey(const Key('server-option'));
  await tester.ensureVisible(dropdown);
  await tester.tap(dropdown);
  await tester.pumpAndSettle();
  await tester.tap(serverMenuItem(option));
  await tester.pumpAndSettle();
}

Future<void> connect(WidgetTester tester) async {
  await tester.ensureVisible(find.byType(FilledButton));
  await tester.tap(find.byType(FilledButton));
  await tester.pumpAndSettle();
}
