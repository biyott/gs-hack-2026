import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gs_safety_mobile/tracking/tracking_clock.dart';

import '../presentation/worker_ui_fixtures.dart';
import 'device_fixtures.dart';

void main() {
  setUpAll(loadSafetyFonts);

  for (final state in ['current', 'stale', 'waiting', 'uncertain']) {
    testWidgets('device $state displays provenance at375 and200percent', (
      tester,
    ) async {
      await tester.binding.setSurfaceSize(const Size(375, 900));
      addTearDown(() => tester.binding.setSurfaceSize(null));
      final fixture = DeviceFixture(state: state);
      addTearDown(fixture.dispose);
      await tester.pumpWidget(fixture.host(textScale: 2));
      await tester.pump();
      expect(tester.takeException(), isNull);
      if (state == 'current' || state == 'stale') {
        expect(find.textContaining('Latest input is $state'), findsOneWidget);
      }
      if (state == 'waiting') {
        await tester.scrollUntilVisible(
          find.textContaining('WORKER-B'),
          300,
          scrollable: find.byType(Scrollable).first,
        );
        expect(find.textContaining('WORKER-A'), findsOneWidget);
        expect(find.textContaining('WORKER-B'), findsOneWidget);
      }
      if (state == 'uncertain') {
        await tester.scrollUntilVisible(
          find.textContaining('Latency inconclusive'),
          300,
          scrollable: find.byType(Scrollable).first,
        );
        expect(find.textContaining('72.500 ms'), findsOneWidget);
      }
      expect(tester.takeException(), isNull);
    });
  }

  testWidgets(
    'clock threshold is strictly above50 and unknown stays inconclusive',
    (tester) async {
      final fixture = DeviceFixture();
      addTearDown(fixture.dispose);
      for (final uncertainty in <double?>[50, 50.001, null]) {
        fixture.tracking.clock = uncertainty == null
            ? null
            : TrackingClockSync(
                clockOffsetMs: 0,
                clockUncertaintyMs: uncertainty,
                clockSynchronizedAt: DateTime.utc(2026),
              );
        await tester.pumpWidget(fixture.host());
        await tester.pump();
        await tester.scrollUntilVisible(
          find.textContaining('Clock uncertainty:'),
          200,
          scrollable: find.byType(Scrollable).first,
        );
        expect(
          find.textContaining('Latency inconclusive'),
          uncertainty == 50 ? findsNothing : findsOneWidget,
        );
      }
    },
  );

  testWidgets(
    'device start stop refresh stay distinct and stop precedes role logout',
    (tester) async {
      final fixture = DeviceFixture();
      addTearDown(fixture.dispose);
      await tester.pumpWidget(fixture.host());
      for (final text in ['Start', 'Stop', 'Refresh']) {
        final target = find.textContaining('/ $text');
        await tester.scrollUntilVisible(
          target,
          300,
          scrollable: find.byType(Scrollable).first,
        );
        await tester.tap(target);
        await tester.pump();
      }
      expect(fixture.native.calls, [
        'tracking.start',
        'tracking.stop.begin',
        'tracking.stop.end',
        'native.capabilities',
      ]);
      fixture.native.calls.clear();
      fixture.tracking.stopGate = Completer<void>();
      final reselect = find.textContaining('Reselect role');
      await tester.scrollUntilVisible(
        reselect,
        300,
        scrollable: find.byType(Scrollable).first,
      );
      await tester.tap(reselect);
      await tester.pump();
      expect(fixture.native.calls, ['tracking.stop.begin']);
      expect(fixture.session.connected, isTrue);
      fixture.tracking.stopGate!.complete();
      await tester.pump();
      expect(fixture.native.calls.take(2), [
        'tracking.stop.begin',
        'tracking.stop.end',
      ]);
      expect(fixture.native.calls, contains('native.stopUwb'));
      expect(fixture.session.connected, isFalse);
    },
  );

  testWidgets(
    'provided lifecycle logout owns cleanup without duplicate fallback',
    (tester) async {
      final fixture = DeviceFixture();
      addTearDown(fixture.dispose);
      await tester.pumpWidget(
        fixture.host(
          onLogout: () async => fixture.native.calls.add('lifecycle.logout'),
        ),
      );
      final reselect = find.textContaining('Reselect role');
      await tester.scrollUntilVisible(
        reselect,
        300,
        scrollable: find.byType(Scrollable).first,
      );
      await tester.tap(reselect);
      await tester.pump();
      expect(fixture.native.calls, ['lifecycle.logout']);
    },
  );
}
