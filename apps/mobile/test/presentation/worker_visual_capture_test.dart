import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gs_safety_mobile/features/safety_guidance/presentation/safety_component_showcase.dart';
import 'package:gs_safety_mobile/features/safety_guidance/presentation/safety_site_map.dart';
import 'package:gs_safety_mobile/features/safety_guidance/presentation/safety_worker_screen.dart';
import 'package:gs_safety_mobile/theme/safety_theme.dart';

import 'worker_ui_fixtures.dart';

const _capture = bool.fromEnvironment('CAPTURE_UI');
const _boundary = Key('visual-capture');

void main() {
  setUpAll(() async {
    if (!_capture) return;
    await loadSafetyFonts();
  });

  for (final width in [375.0, 768.0, 1280.0]) {
    for (final language in ['ko', 'en']) {
      testWidgets('capture worker and showcase $width $language', (
        tester,
      ) async {
        await tester.binding.setSurfaceSize(Size(width, 900));
        addTearDown(() => tester.binding.setSurfaceSize(null));
        final overlay = ValueNotifier(overlayFixture());
        addTearDown(overlay.dispose);
        await tester.pumpWidget(
          _host(SafetyComponentShowcase(language: language)),
        );
        await tester.pump(const Duration(milliseconds: 200));
        await expectLater(
          find.byKey(_boundary),
          matchesGoldenFile('goldens/showcase-$language-${width.toInt()}.png'),
        );
        expect(tester.takeException(), isNull);

        await tester.pumpWidget(
          _host(
            SafetyWorkerScreen(
              data: workerFixture(language: language),
              mapOverlay: overlay,
              onReplay: () {},
              onUnderstood: () {},
              onHelp: () {},
              onArrival: () {},
            ),
          ),
        );
        await tester.pump();
        await expectLater(
          find.byKey(_boundary),
          matchesGoldenFile('goldens/worker-$language-${width.toInt()}.png'),
        );
        await tester.ensureVisible(find.byType(SafetySiteMap));
        await tester.pump();
        await expectLater(
          find.byKey(_boundary),
          matchesGoldenFile('goldens/map-$language-${width.toInt()}.png'),
        );
        if (width == 375) {
          await tester.tap(
            find.widgetWithIcon(OutlinedButton, Icons.zoom_in_outlined),
          );
          await tester.pump();
          await expectLater(
            find.byKey(_boundary),
            matchesGoldenFile('goldens/map-zoom-$language-375.png'),
          );
        }
        expect(tester.takeException(), isNull);
      }, skip: !_capture);
    }
  }

  for (final state in [
    'expired',
    'disconnected',
    'map-mismatch',
    'voice-unavailable',
  ]) {
    testWidgets('capture safety state $state', (tester) async {
      await tester.binding.setSurfaceSize(const Size(375, 900));
      addTearDown(() => tester.binding.setSurfaceSize(null));
      final connected = state != 'disconnected';
      final current = state == 'voice-unavailable';
      final overlay = ValueNotifier(
        overlayFixture(
          connected: connected,
          guidanceCurrent: current,
          guidanceExpired: state == 'expired',
          mapVersion: state == 'map-mismatch' ? '2.0.0' : '1.0.0',
        ),
      );
      addTearDown(overlay.dispose);
      final notices = <String, WorkerNotice>{
        'expired': const WorkerNotice(
          title: '안내 만료',
          detail: '새 안내가 필요합니다. 이전 경로는 표시되지 않습니다.',
          tone: SafetyTone.caution,
        ),
        'disconnected': const WorkerNotice(
          title: '서버 연결 끊김',
          detail: '마지막 수신 10:42:12. 최신 안내를 확인할 수 없습니다.',
          tone: SafetyTone.offline,
        ),
        'map-mismatch': const WorkerNotice(
          title: '지도 버전 불일치',
          detail: '서버 지도 v2.0.0과 앱 지도 v1.0.0이 다릅니다.',
          tone: SafetyTone.danger,
        ),
        'voice-unavailable': const WorkerNotice(
          title: '음성 사용 불가',
          detail: '화면 안내와 가능한 진동은 계속 제공됩니다.',
          tone: SafetyTone.caution,
        ),
      };
      await tester.pumpWidget(
        _host(
          SafetyWorkerScreen(
            data: workerFixture(
              current: current,
              speechStatus: state == 'voice-unavailable'
                  ? WorkerDeliveryStatus.unavailable
                  : WorkerDeliveryStatus.active,
              connected: connected,
              notices: [notices[state]!],
            ),
            mapOverlay: overlay,
            onReplay: () {},
            onUnderstood: () {},
            onHelp: () {},
            onArrival: () {},
            onChangeRole: () {},
            onLocaleToggle: () {},
            onDeviceTools: () {},
          ),
        ),
      );
      await tester.pump();
      await expectLater(
        find.byKey(_boundary),
        matchesGoldenFile('goldens/state-$state-375.png'),
      );
      await tester.ensureVisible(find.byType(SafetySiteMap));
      await tester.pump();
      await expectLater(
        find.byKey(_boundary),
        matchesGoldenFile('goldens/state-map-$state-375.png'),
      );
      expect(tester.takeException(), isNull);
    }, skip: !_capture);
  }

  for (final language in ['ko', 'en']) {
    testWidgets('capture 200 percent text $language', (tester) async {
      await tester.binding.setSurfaceSize(const Size(375, 900));
      addTearDown(() => tester.binding.setSurfaceSize(null));
      final overlay = ValueNotifier(overlayFixture());
      addTearDown(overlay.dispose);
      await tester.pumpWidget(
        _host(
          SafetyWorkerScreen(
            data: workerFixture(language: language),
            mapOverlay: overlay,
            onReplay: () {},
            onUnderstood: () {},
            onHelp: () {},
            onArrival: () {},
          ),
          textScale: 2,
        ),
      );
      await tester.pump();
      await expectLater(
        find.byKey(_boundary),
        matchesGoldenFile('goldens/large-text-$language-375.png'),
      );
      expect(tester.takeException(), isNull);
    }, skip: !_capture);
  }
}

Widget _host(Widget child, {double textScale = 1}) => RepaintBoundary(
  key: _boundary,
  child: MaterialApp(
    debugShowCheckedModeBanner: false,
    theme: SafetyTheme.dark(),
    builder: (context, child) => MediaQuery(
      data: MediaQuery.of(
        context,
      ).copyWith(textScaler: TextScaler.linear(textScale)),
      child: child!,
    ),
    home: child,
  ),
);
