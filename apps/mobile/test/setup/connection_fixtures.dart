import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gs_safety_mobile/features/safety_guidance/data/guidance_api_service.dart';
import 'package:gs_safety_mobile/session/mobile_session_controller.dart';
import 'package:gs_safety_mobile/setup/connection_screen.dart';
import 'package:gs_safety_mobile/theme/safety_theme.dart';

import '../guidance_fixtures.dart';
import '../session_controller_fixtures.dart';

const connectionBoundary = Key('connection-capture');

class ConnectionFixture {
  ConnectionFixture() {
    session = MobileSessionController(
      native: SessionNative(),
      speech: FakeSpeech(),
      alert: FakeAlert(),
      vibration: FakeVibration(),
      apiFactory: (server) {
        requestedServer = server;
        return api;
      },
    );
  }

  final api = ConnectionApi();
  late final MobileSessionController session;
  Uri? requestedServer;

  void dispose() => session.dispose();

  Widget host({double textScale = 1}) => RepaintBoundary(
    key: connectionBoundary,
    child: MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: SafetyTheme.dark(),
      supportedLocales: const [Locale('ko'), Locale('en')],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      builder: (context, child) => MediaQuery(
        data: MediaQuery.of(
          context,
        ).copyWith(textScaler: TextScaler.linear(textScale)),
        child: child!,
      ),
      home: ListenableBuilder(
        listenable: session,
        builder: (_, _) => ConnectionScreen(session: session),
      ),
    ),
  );
}

class ConnectionApi extends GuidanceApiService {
  ConnectionApi() : super(Uri.parse('http://localhost:3000'));

  final loginResult = Completer<Map<String, Object?>>();
  final logins = <Map<String, String?>>[];

  @override
  Future<Map<String, Object?>> login({
    required String role,
    required String actorId,
    required String deviceRole,
    String? workerId,
    String? accessCode,
  }) {
    logins.add({
      'role': role,
      'actorId': actorId,
      'deviceRole': deviceRole,
      'workerId': workerId,
      'accessCode': accessCode,
    });
    return loginResult.future;
  }
}

List<String> clippedConnectionText(WidgetTester tester) => [
  for (final element in find.byType(RichText).evaluate())
    if (element.renderObject case final RenderParagraph paragraph)
      if (paragraph.didExceedMaxLines ||
          paragraph.computeMaxIntrinsicHeight(paragraph.size.width) >
              paragraph.size.height + 1)
        paragraph.text.toPlainText(),
];

Future<void> showConnectionLanguage(
  WidgetTester tester,
  String language,
) async {
  if (language == 'en') {
    await tester.tap(find.widgetWithText(TextButton, 'English'));
    await tester.pumpAndSettle();
  }
}
