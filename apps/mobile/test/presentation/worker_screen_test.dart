import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gs_safety_mobile/features/safety_guidance/presentation/safety_primitives.dart';
import 'package:gs_safety_mobile/features/safety_guidance/presentation/safety_worker_screen.dart';
import 'package:gs_safety_mobile/theme/safety_theme.dart';

import 'worker_ui_fixtures.dart';

void main() {
  setUpAll(loadSafetyFonts);

  testWidgets('each worker action invokes only its own callback', (
    tester,
  ) async {
    final overlay = ValueNotifier(overlayFixture());
    addTearDown(overlay.dispose);
    final calls = <String>[];
    await tester.pumpWidget(
      MaterialApp(
        theme: SafetyTheme.dark(),
        home: SafetyWorkerScreen(
          data: workerFixture(),
          mapOverlay: overlay,
          onReplay: () => calls.add('replay'),
          onUnderstood: () => calls.add('understood'),
          onHelp: () => calls.add('help'),
          onArrival: () => calls.add('arrival'),
        ),
      ),
    );
    for (final label in ['안내 이해 확인', '다시 듣기', '도움 요청', '도착 확인']) {
      final button = find.byWidgetPredicate(
        (widget) => widget is SafetyActionButton && widget.label == label,
      );
      await tester.ensureVisible(button);
      await tester.tap(button);
      await tester.pump();
    }
    expect(calls, ['understood', 'replay', 'help', 'arrival']);
  });
  testWidgets('render receipt emits once per current guidance identity', (
    tester,
  ) async {
    final overlay = ValueNotifier(overlayFixture());
    addTearDown(overlay.dispose);
    final receipts = <String>[];
    Future<void> render(WorkerScreenData data) => tester.pumpWidget(
      MaterialApp(
        theme: SafetyTheme.dark(),
        home: SafetyWorkerScreen(
          data: data,
          mapOverlay: overlay,
          onReplay: () {},
          onUnderstood: () {},
          onHelp: () {},
          onArrival: () {},
          onDisplayed: (id, version) => receipts.add('$id:$version'),
        ),
      ),
    );

    await render(workerFixture());
    expect(receipts, ['GUIDANCE-WORKER-A-01:1']);
    overlay.value = overlayFixture(position: const MapPoint(66, 25));
    await tester.pump();
    await render(workerFixture());
    expect(receipts, hasLength(1));
    await render(workerFixture(version: 2));
    expect(receipts, ['GUIDANCE-WORKER-A-01:1', 'GUIDANCE-WORKER-A-01:2']);
    await render(workerFixture(version: 3, current: false));
    expect(receipts, hasLength(2));
  });

  testWidgets(
    'expired guide disables replay understanding and arrival separately',
    (tester) async {
      final overlay = ValueNotifier(overlayFixture(guidanceExpired: true));
      addTearDown(overlay.dispose);
      await tester.pumpWidget(
        MaterialApp(
          theme: SafetyTheme.dark(),
          home: SafetyWorkerScreen(
            data: workerFixture(current: false),
            mapOverlay: overlay,
            onReplay: () {},
            onUnderstood: () {},
            onHelp: () {},
            onArrival: () {},
          ),
        ),
      );
      final actions = tester
          .widgetList<SafetyActionButton>(find.byType(SafetyActionButton))
          .toList();
      expect(
        {for (final action in actions) action.label: action.onPressed != null},
        {
          '안내 이해 확인': false,
          '다시 듣기': false,
          '도움 요청': true,
          '도착 확인': false,
        },
      );
      expect(find.text('목적지: REFUGE-01'), findsNothing);
    },
  );

  for (final width in [375.0, 768.0, 1280.0]) {
    for (final language in ['ko', 'en']) {
      testWidgets('worker screen fits $width $language at 200 percent text', (
        tester,
      ) async {
        await tester.binding.setSurfaceSize(Size(width, 900));
        addTearDown(() => tester.binding.setSurfaceSize(null));
        final overlay = ValueNotifier(overlayFixture());
        addTearDown(overlay.dispose);
        await tester.pumpWidget(
          MaterialApp(
            theme: SafetyTheme.dark(),
            builder: (context, child) => MediaQuery(
              data: MediaQuery.of(
                context,
              ).copyWith(textScaler: const TextScaler.linear(2)),
              child: child!,
            ),
            home: SafetyWorkerScreen(
              data: workerFixture(
                language: language,
                workerId: 'WORKER-${'X' * 80}',
                notices: const [
                  WorkerNotice(
                    title: '위치 정보가 오래되었습니다',
                    detail: '마지막 위치와 최신 위치가 다를 수 있습니다. 연결 상태를 확인하세요.',
                    tone: SafetyTone.caution,
                  ),
                ],
              ),
              mapOverlay: overlay,
              onReplay: () {},
              onUnderstood: () {},
              onHelp: () {},
              onArrival: () {},
            ),
          ),
        );
        await tester.pump();
        expect(tester.takeException(), isNull);
        await tester.drag(
          find.byType(SingleChildScrollView).first,
          const Offset(0, -1600),
        );
        await tester.pump();
        expect(tester.takeException(), isNull);
      });
    }
  }
}
