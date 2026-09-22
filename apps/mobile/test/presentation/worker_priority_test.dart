import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gs_safety_mobile/features/safety_guidance/presentation/safety_primitives.dart';

import 'worker_priority_fixture.dart';
import 'worker_ui_fixtures.dart';

void main() {
  setUpAll(loadSafetyFonts);

  for (final language in ['ko', 'en']) {
    for (final height in [850.0, 900.0]) {
      testWidgets(
        'urgent route and Help are initially visible $language $height',
        (tester) async {
          await tester.binding.setSurfaceSize(Size(375, height));
          addTearDown(() => tester.binding.setSurfaceSize(null));
          final overlay = ValueNotifier(priorityOverlay(language));
          addTearDown(overlay.dispose);
          final version = language == 'ko' ? 1 : 2;
          final data = priorityWorkerData(language: language, version: version);
          await tester.pumpWidget(
            priorityWorkerHost(
              overlay: overlay,
              language: language,
              version: version,
            ),
          );
          await tester.pumpAndSettle();
          final viewport = Rect.fromLTWH(0, 0, 375, height);
          final help = find.byWidgetPredicate(
            (widget) => widget is SafetyActionButton && widget.urgent,
          );
          final helpRect = tester.getRect(help);
          expect(
            viewport.contains(helpRect.topLeft) &&
                viewport.contains(helpRect.bottomRight),
            isTrue,
            reason: 'Help must be fully visible before scrolling: $helpRect',
          );
          final canvas = tester.getRect(
            find.byKey(const Key('worker-route-map')),
          );
          expect(
            canvas.overlaps(viewport),
            isTrue,
            reason:
                'The route canvas must be visible before scrolling: $canvas',
          );
          expect(canvas.intersect(viewport).height, greaterThan(0));
          expect(canvas.bottom, lessThanOrEqualTo(helpRect.top));
          expect(
            _visibleRect(tester, _text(data.actionText), viewport),
            isTrue,
          );
          expect(
            tester.widget<Text>(_text(data.actionText)).style!.fontSize,
            24,
          );
          expect(_textContaining(data.guidanceId!), findsNothing);
          expect(_textContaining(priorityIncidentId), findsNothing);
          expect(_text(data.profileLabel!), findsNothing);
          expect(
            _text(language == 'ko' ? '역할 변경' : 'Change role'),
            findsNothing,
          );
          expect(
            _text(language == 'ko' ? '기기 기능 확인' : 'Device capabilities'),
            findsNothing,
          );
          for (final text in [
            data.positionSource,
            data.expiresAtLabel!,
            'v$version',
            language == 'ko' ? '연결됨' : 'Connected',
          ]) {
            final finder = _textContaining(text).first;
            expect(
              _visibleRect(tester, finder, viewport),
              isTrue,
              reason: text,
            );
          }
          _expectTarget(tester, find.byKey(const Key('worker-help')), viewport);
          _expectTarget(
            tester,
            find.byKey(const Key('worker-details')),
            viewport,
            minimum: 44,
          );
          expect(tester.takeException(), isNull);
        },
      );
    }

    for (final scale in [1.0, 2.0]) {
      testWidgets(
        'Details preserves traceability and callbacks $language $scale',
        (tester) async {
          await tester.binding.setSurfaceSize(const Size(375, 850));
          addTearDown(() => tester.binding.setSurfaceSize(null));
          final overlay = ValueNotifier(priorityOverlay(language));
          addTearDown(overlay.dispose);
          final calls = <String>[];
          await tester.pumpWidget(
            priorityWorkerHost(
              overlay: overlay,
              language: language,
              textScale: scale,
              onAction: calls.add,
            ),
          );
          await tester.pumpAndSettle();
          final details = find.byKey(const Key('worker-details'));
          final detailsLabel = language == 'ko' ? '상세 정보' : 'Details';
          expect(find.byTooltip(detailsLabel), findsOneWidget);
          expect(tester.getSemantics(details).flagsCollection.isButton, isTrue);
          await tester.tap(details);
          await tester.pumpAndSettle();
          final data = priorityWorkerData(language: language);
          for (final text in [
            data.guidanceId!,
            priorityIncidentId,
            data.profileLabel!,
          ]) {
            final finder = _textContaining(text).first;
            await tester.ensureVisible(finder);
            await tester.pumpAndSettle();
            expect(
              _visibleRect(tester, finder, const Rect.fromLTWH(0, 0, 375, 850)),
              isTrue,
            );
          }
          final close = find.byTooltip(language == 'ko' ? '닫기' : 'Close');
          expect(close, findsOneWidget);
          for (final action in [
            (language == 'ko' ? '역할 변경' : 'Change role', 'role'),
            (
              language == 'ko' ? '기기 기능 확인' : 'Device capabilities',
              'capabilities',
            ),
          ]) {
            if (find.byType(BottomSheet).evaluate().isEmpty) {
              await tester.tap(details);
              await tester.pumpAndSettle();
            }
            final button = find.ancestor(
              of: _text(action.$1),
              matching: find.byType(OutlinedButton),
            );
            await tester.ensureVisible(button);
            await tester.pumpAndSettle();
            expect(tester.getSize(button).height, greaterThanOrEqualTo(44));
            await tester.tap(button);
            await tester.pumpAndSettle();
            expect(calls.where((call) => call == action.$2), hasLength(1));
          }
          if (find.byType(BottomSheet).evaluate().isEmpty) {
            await tester.tap(details);
            await tester.pumpAndSettle();
          }
          await tester.ensureVisible(close);
          await tester.tap(close);
          await tester.pumpAndSettle();
          expect(find.byType(BottomSheet), findsNothing);
          expect(_textContaining(data.guidanceId!), findsNothing);
          expect(calls, ['role', 'capabilities']);
          expect(tester.takeException(), isNull);
        },
      );
    }

    for (final height in [850.0, 900.0]) {
      testWidgets(
        '200 percent content scrolls with Help fixed $language $height',
        (tester) async {
          await tester.binding.setSurfaceSize(Size(375, height));
          addTearDown(() => tester.binding.setSurfaceSize(null));
          final overlay = ValueNotifier(priorityOverlay(language));
          addTearDown(overlay.dispose);
          final calls = <String>[];
          await tester.pumpWidget(
            priorityWorkerHost(
              overlay: overlay,
              language: language,
              textScale: 2,
              onAction: calls.add,
            ),
          );
          await tester.pumpAndSettle();
          final viewport = Rect.fromLTWH(0, 0, 375, height);
          final help = find.byKey(const Key('worker-help'));
          _expectTarget(tester, help, viewport);
          final helpRect = tester.getRect(help);
          final map = find.byKey(const Key('worker-route-map'));
          await tester.ensureVisible(map);
          await tester.pumpAndSettle();
          expect(tester.getRect(map).overlaps(viewport), isTrue);
          for (final action in ['understood', 'replay', 'arrival']) {
            final label = switch ((language, action)) {
              ('ko', 'understood') => '안내 이해 확인',
              ('ko', 'replay') => '다시 듣기',
              ('ko', _) => '도착 확인',
              (_, 'understood') => 'I understand',
              (_, 'replay') => 'Replay guidance',
              (_, _) => 'Confirm arrival',
            };
            final button = find.ancestor(
              of: _text(label),
              matching: find.byType(SafetyActionButton),
            );
            await tester.ensureVisible(button);
            await tester.pumpAndSettle();
            _expectTarget(tester, button, viewport);
            await tester.tap(button);
            await tester.pumpAndSettle();
            expect(tester.getRect(help), helpRect);
            expect(tester.takeException(), isNull);
          }
          await tester.tap(help);
          expect(calls, ['understood', 'replay', 'arrival', 'help']);
        },
      );
    }
  }

  testWidgets('Details keyboard focus returns after closing', (tester) async {
    await tester.binding.setSurfaceSize(const Size(375, 850));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    final overlay = ValueNotifier(priorityOverlay('en'));
    addTearDown(overlay.dispose);
    await tester.pumpWidget(
      priorityWorkerHost(overlay: overlay, language: 'en'),
    );
    await tester.pumpAndSettle();
    final details = find.byKey(const Key('worker-details'));
    for (var index = 0; index < 8; index++) {
      await tester.sendKeyEvent(LogicalKeyboardKey.tab);
      await tester.pumpAndSettle();
      if (_isFocused(tester, details)) break;
    }
    expect(_isFocused(tester, details), isTrue);
    await tester.sendKeyEvent(LogicalKeyboardKey.enter);
    await tester.pumpAndSettle();
    expect(find.byType(BottomSheet), findsOneWidget);
    await tester.tap(find.byTooltip('Close'));
    await tester.pumpAndSettle();
    expect(find.byType(BottomSheet), findsNothing);
    expect(_isFocused(tester, details), isTrue);
  });
}

Finder _text(String value) => find.byWidgetPredicate(
  (widget) => widget is Text && (widget.semanticsLabel ?? widget.data) == value,
);

Finder _textContaining(String value) => find.byWidgetPredicate(
  (widget) => switch (widget) {
    Text() => (widget.semanticsLabel ?? widget.data ?? '').contains(value),
    SelectableText() => (widget.data ?? '').contains(value),
    _ => false,
  },
);

bool _visibleRect(WidgetTester tester, Finder finder, Rect viewport) {
  final rect = tester.getRect(finder);
  return viewport.contains(rect.topLeft) && viewport.contains(rect.bottomRight);
}

bool _isFocused(WidgetTester tester, Finder finder) =>
    tester.getSemantics(finder).flagsCollection.isFocused.toBoolOrNull() ??
    false;

void _expectTarget(
  WidgetTester tester,
  Finder finder,
  Rect viewport, {
  double minimum = 56,
}) {
  expect(_visibleRect(tester, finder, viewport), isTrue);
  expect(tester.getSize(finder).height, greaterThanOrEqualTo(minimum));
  expect(tester.getSize(finder).width, greaterThanOrEqualTo(minimum));
}
