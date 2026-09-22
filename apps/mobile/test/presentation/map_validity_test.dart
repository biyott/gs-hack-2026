import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gs_safety_mobile/features/safety_guidance/presentation/site_map_data.dart';
import 'package:gs_safety_mobile/features/safety_guidance/presentation/site_map_painters.dart';

import 'worker_ui_fixtures.dart';

void main() {
  test('only a current, connected, matching and fresh route is visible', () {
    expect(overlayFixture().hasVisibleRoute, isTrue);
    expect(overlayFixture(connected: false).hasVisibleRoute, isFalse);
    expect(overlayFixture(positionFresh: false).hasVisibleRoute, isFalse);
    expect(overlayFixture(guidanceCurrent: false).hasVisibleRoute, isFalse);
    expect(overlayFixture(guidanceExpired: true).hasVisibleRoute, isFalse);
    expect(overlayFixture(mapVersion: '2.0.0').hasVisibleRoute, isFalse);
    expect(overlayFixture(position: null).hasVisibleRoute, isFalse);
    expect(
      overlayFixture(position: const MapPoint(145, 25)).hasVisibleRoute,
      isFalse,
    );
    expect(
      overlayFixture(
        route: const [MapPoint(65, 25), MapPoint(double.nan, 8)],
      ).hasVisibleRoute,
      isFalse,
    );
    expect(
      overlayFixture(route: const [MapPoint(65, 25)]).hasVisibleRoute,
      isFalse,
    );
  });

  test(
    'projection maps logical positive Y upward with a common meter scale',
    () {
      final p = MapProjection(const Size(375, 256));
      final origin = p.project(const MapPoint(0, 0));
      final x = p.project(const MapPoint(10, 0));
      final y = p.project(const MapPoint(0, 10));
      expect(x.dx, greaterThan(origin.dx));
      expect(y.dy, lessThan(origin.dy));
      expect(x.dx - origin.dx, closeTo(origin.dy - y.dy, 0.00001));
    },
  );
}
