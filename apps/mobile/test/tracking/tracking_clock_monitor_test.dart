import 'package:flutter_test/flutter_test.dart';
import 'package:gs_safety_mobile/tracking/tracking_clock_monitor.dart';

void main() {
  late _Clocks clocks;
  late TrackingClockMonitor monitor;

  setUp(() {
    clocks = _Clocks();
    monitor = TrackingClockMonitor(
      now: () => clocks.wall,
      monotonicNow: () => clocks.monotonic,
    );
  });

  tearDown(() => monitor.dispose());

  test('normal progression stays stable across short and long intervals', () {
    expect(monitor.hasDiscontinuity(), isFalse);
    clocks.advance(const Duration(milliseconds: 1));
    expect(monitor.hasDiscontinuity(), isFalse);
    clocks.advance(const Duration(days: 3));
    expect(monitor.hasDiscontinuity(), isFalse);
  });

  test('detects a forward wall clock jump', () {
    clocks.advance(const Duration(seconds: 10));
    clocks.wall = clocks.wall.add(const Duration(seconds: 5));

    expect(monitor.hasDiscontinuity(), isTrue);
  });

  test('detects a backward wall clock jump', () {
    clocks.advance(const Duration(seconds: 10));
    clocks.wall = clocks.wall.subtract(const Duration(seconds: 5));

    expect(monitor.hasDiscontinuity(), isTrue);
  });

  test('tolerates jitter below and exactly at the threshold', () {
    clocks.advance(const Duration(seconds: 1));
    clocks.wall = clocks.wall.add(const Duration(milliseconds: 49));
    expect(monitor.hasDiscontinuity(), isFalse);
    clocks.wall = clocks.wall.add(const Duration(milliseconds: 1));
    expect(monitor.hasDiscontinuity(), isFalse);
    clocks.wall = clocks.wall.add(const Duration(microseconds: 1));
    expect(monitor.hasDiscontinuity(), isTrue);
  });

  test('detects cumulative drift without rebasing after each check', () {
    for (var interval = 0; interval < 5; interval += 1) {
      clocks.advance(const Duration(minutes: 1));
      clocks.wall = clocks.wall.subtract(const Duration(milliseconds: 10));
      expect(monitor.hasDiscontinuity(), isFalse);
    }
    clocks.advance(const Duration(minutes: 1));
    clocks.wall = clocks.wall.subtract(const Duration(milliseconds: 10));

    expect(monitor.hasDiscontinuity(), isTrue);
  });

  test('reset establishes a stable baseline after clock correction', () {
    clocks.advance(const Duration(minutes: 1));
    clocks.wall = clocks.wall.add(const Duration(minutes: 10));
    expect(monitor.hasDiscontinuity(), isTrue);

    monitor.reset();

    expect(monitor.hasDiscontinuity(), isFalse);
    clocks.advance(const Duration(hours: 1));
    expect(monitor.hasDiscontinuity(), isFalse);
    clocks.wall = clocks.wall.subtract(const Duration(seconds: 1));
    expect(monitor.hasDiscontinuity(), isTrue);
  });

  test('exposes signed residual below the discontinuity threshold', () {
    clocks.advance(const Duration(seconds: 10));
    clocks.wall = clocks.wall.add(const Duration(milliseconds: 20));
    expect(monitor.residual, const Duration(milliseconds: 20));
    expect(monitor.hasDiscontinuity(), isFalse);

    clocks.wall = clocks.wall.subtract(const Duration(milliseconds: 45));
    expect(monitor.residual, const Duration(milliseconds: -25));
    expect(monitor.hasDiscontinuity(), isFalse);

    monitor.reset();
    expect(monitor.residual, Duration.zero);
  });

  test('honors a custom threshold', () {
    final custom = TrackingClockMonitor(
      now: () => clocks.wall,
      monotonicNow: () => clocks.monotonic,
      threshold: const Duration(seconds: 1),
    );
    addTearDown(custom.dispose);
    clocks.wall = clocks.wall.add(const Duration(milliseconds: 750));
    expect(custom.hasDiscontinuity(), isFalse);
    clocks.wall = clocks.wall.add(const Duration(milliseconds: 251));
    expect(custom.hasDiscontinuity(), isTrue);
  });

  test('rejects a negative threshold', () {
    expect(
      () => TrackingClockMonitor(threshold: const Duration(microseconds: -1)),
      throwsArgumentError,
    );
  });
}

class _Clocks {
  DateTime wall = DateTime.utc(2026, 9, 21, 12);
  Duration monotonic = const Duration(hours: 2);

  void advance(Duration duration) {
    wall = wall.add(duration);
    monotonic += duration;
  }
}
