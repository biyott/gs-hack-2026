import 'package:flutter_test/flutter_test.dart';
import 'package:gs_safety_mobile/features/safety_guidance/data/guidance_api_service.dart';
import 'package:gs_safety_mobile/tracking/tracking_clock.dart';

void main() {
  final serverTime = DateTime.utc(2026, 9, 21, 12);

  test('uses the lowest RTT from three sequential clock probes', () async {
    final api = _ClockApi([
      {
        'serverAt': serverTime
            .add(const Duration(milliseconds: 20))
            .toIso8601String(),
      },
      {
        'serverAt': serverTime
            .add(const Duration(milliseconds: 90))
            .toIso8601String(),
      },
      {
        'serverAt': serverTime
            .add(const Duration(milliseconds: 130))
            .toIso8601String(),
      },
    ]);
    addTearDown(api.dispose);
    final deviceTimes = [80, 100, 160]
        .map((ms) => serverTime.add(Duration(minutes: 5, milliseconds: ms)))
        .iterator;
    final monotonicTimes = [
      0,
      80,
      80,
      100,
      100,
      160,
    ].map((ms) => Duration(milliseconds: ms)).iterator;

    final sync = await TrackingClockSync.synchronize(
      api,
      now: () => _next(deviceTimes),
      monotonicNow: () => _next(monotonicTimes),
    );

    expect(api.requests, List.filled(3, ('GET', '/api/clock')));
    expect(api.maxActiveRequests, 1);
    expect(sync.clockOffsetMs, -300010);
    expect(sync.clockUncertaintyMs, 20);
    expect(
      sync.clockSynchronizedAt,
      serverTime.add(const Duration(minutes: 5, milliseconds: 100)),
    );
    final captured = serverTime.add(const Duration(minutes: 5, seconds: 1));
    expect(
      sync.adjustedCapturedAt(captured),
      serverTime.add(const Duration(milliseconds: 990)),
    );
    expect(sync.captureMetadata(captured), {
      'deviceCapturedAt': '2026-09-21T12:05:01.000Z',
      'offsetMs': -300010.0,
      'uncertaintyMs': 20.0,
      'synchronizedAt': '2026-09-21T12:05:00.100Z',
    });
  });

  for (final skewSeconds in [-300, 300]) {
    test(
      'preserves a conservative lower bound for $skewSeconds second device skew',
      () async {
        final received = serverTime.add(
          Duration(seconds: skewSeconds, microseconds: 20251),
        );
        final api = _ClockApi(
          List.filled(3, {'serverAt': serverTime.toIso8601String()}),
        );
        addTearDown(api.dispose);
        var elapsed = Duration.zero;

        final sync = await TrackingClockSync.synchronize(
          api,
          now: () => received,
          monotonicNow: () {
            final value = elapsed;
            elapsed += const Duration(microseconds: 20501);
            return value;
          },
        );

        expect(sync.clockOffsetMs, -skewSeconds * 1000 - 20.251);
        expect(sync.clockUncertaintyMs, 20.501);
        expect(sync.adjustedCapturedAt(received).isAfter(serverTime), isFalse);
        expect(
          serverTime
              .difference(sync.adjustedCapturedAt(received))
              .inMicroseconds,
          lessThanOrEqualTo(1),
        );
      },
    );
  }

  test(
    'uses monotonic time despite device wall clock changes between probes',
    () async {
      final api = _ClockApi(
        List.filled(3, {'serverAt': serverTime.toIso8601String()}),
      );
      addTearDown(api.dispose);
      final deviceTimes = [
        serverTime.add(const Duration(days: 1)),
        serverTime.subtract(const Duration(days: 1)),
        serverTime.add(const Duration(days: 2)),
      ].iterator;
      final monotonicTimes = [
        0,
        100,
        100,
        110,
        110,
        150,
      ].map((ms) => Duration(milliseconds: ms)).iterator;

      final sync = await TrackingClockSync.synchronize(
        api,
        now: () => _next(deviceTimes),
        monotonicNow: () => _next(monotonicTimes),
      );

      expect(sync.clockUncertaintyMs, 10);
      expect(sync.clockOffsetMs, const Duration(days: 1).inMilliseconds);
    },
  );

  for (final timestamp in <Object?>[
    null,
    42,
    'not-a-time',
    '2026-09-21T12:00:00',
  ]) {
    test('rejects invalid server timestamp $timestamp', () async {
      final api = _ClockApi([
        {'serverAt': timestamp},
      ]);
      addTearDown(api.dispose);

      await expectLater(
        TrackingClockSync.synchronize(api),
        throwsFormatException,
      );
      expect(api.requests, [('GET', '/api/clock')]);
    });
  }

  test(
    'propagates a failed clock request without issuing further probes',
    () async {
      final api = _ClockApi(
        [],
        failure: const ApiFailure('Clock unavailable', status: 503),
      );
      addTearDown(api.dispose);

      await expectLater(
        TrackingClockSync.synchronize(api),
        throwsA(
          isA<ApiFailure>().having((error) => error.status, 'status', 503),
        ),
      );
      expect(api.requests, [('GET', '/api/clock')]);
    },
  );
}

T _next<T>(Iterator<T> values) {
  expect(values.moveNext(), isTrue);
  return values.current;
}

class _ClockApi extends GuidanceApiService {
  _ClockApi(this.responses, {this.failure})
    : super(Uri.parse('http://localhost'));

  final List<Map<String, Object?>> responses;
  final ApiFailure? failure;
  final List<(String, String)> requests = [];
  int _activeRequests = 0;
  int maxActiveRequests = 0;

  @override
  Future<Map<String, Object?>> request(
    String method,
    String path, {
    Map<String, Object?>? body,
    Map<String, String>? query,
  }) async {
    requests.add((method, path));
    _activeRequests += 1;
    if (_activeRequests > maxActiveRequests) {
      maxActiveRequests = _activeRequests;
    }
    await Future<void>.value();
    _activeRequests -= 1;
    final error = failure;
    if (error != null) throw error;
    return responses[requests.length - 1];
  }
}
