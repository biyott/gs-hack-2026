import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import '../presentation/worker_ui_fixtures.dart';
import 'device_fixtures.dart';

void main() {
  setUpAll(loadSafetyFonts);
  for (final state in ['waiting', 'current', 'stale', 'uncertain']) {
    for (final scale in [1.0, 2.0]) {
      testWidgets('capture device $state text$scale', (tester) async {
        await tester.binding.setSurfaceSize(const Size(375, 900));
        addTearDown(() => tester.binding.setSurfaceSize(null));
        final fixture = DeviceFixture(state: state);
        addTearDown(fixture.dispose);
        await tester.pumpWidget(fixture.host(textScale: scale));
        await tester.pump();
        await expectLater(
          find.byKey(const Key('device-capture')),
          matchesGoldenFile('goldens/device-$state-${scale.toInt()}x.png'),
        );
        final position = tester
            .state<ScrollableState>(find.byType(Scrollable).first)
            .position;
        var page = 1;
        while (position.pixels < position.maxScrollExtent) {
          final previous = position.pixels;
          position.jumpTo((previous + 600).clamp(0, position.maxScrollExtent));
          await tester.pumpAndSettle();
          expect(position.pixels, greaterThan(previous));
          expect(page, lessThan(12));
          await expectLater(
            find.byKey(const Key('device-capture')),
            matchesGoldenFile(
              'goldens/device-$state-${scale.toInt()}x-scroll-$page.png',
            ),
          );
          page++;
        }
        expect(tester.takeException(), isNull);
      }, skip: !const bool.fromEnvironment('CAPTURE_UI'));
    }
  }
}
