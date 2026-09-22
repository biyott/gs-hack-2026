import 'dart:math' as math;

import 'package:flutter_test/flutter_test.dart';
import 'package:gs_safety_mobile/services/native_device_service.dart';
import 'package:gs_safety_mobile/tracking/tracking_clock.dart';
import 'package:gs_safety_mobile/tracking/uwb_measurement.dart';

final synchronizedClock = TrackingClockSync(
  clockOffsetMs: 0,
  clockUncertaintyMs: 12.5,
  clockSynchronizedAt: DateTime.utc(2026, 9, 21, 8, 15),
);

NativeDeviceEvent observation([Map<String, Object?> overrides = const {}]) =>
    NativeDeviceEvent('uwbMeasurement', {
      'peerAddress': 'aa:01',
      'sessionEpoch': 'equipment-epoch-7',
      'sequence': 42,
      'capturedAt': '2026-09-21T08:15:30.123Z',
      'distanceM': 4.5,
      'azimuthRad': 0.25,
      'elevationRad': -0.1,
      'uncertaintyM': 0.2,
      ...overrides,
    });

void main() {
  test('unavailable observations preserve every nullable radio value', () {
    final measurement = UwbMeasurement.fromEvent(
      observation({
        'distanceM': null,
        'azimuthRad': null,
        'elevationRad': null,
        'uncertaintyM': null,
      }),
      workerId: 'WORKER-A',
    );

    expect(measurement.distanceM, isNull);
    expect(measurement.azimuthRad, isNull);
    expect(measurement.elevationRad, isNull);
    expect(measurement.uncertaintyM, isNull);
    expect(measurement.status, 'unavailable');
    expect(measurement.source, 'uwb');
    final upload = measurement.toUpload(
      'equipment-device',
      clock: synchronizedClock,
    );
    for (final key in [
      'distanceM',
      'azimuthRad',
      'elevationRad',
      'uncertaintyM',
    ]) {
      expect(upload.containsKey(key), isTrue, reason: key);
      expect(upload[key], isNull, reason: key);
    }
  });

  test('distance-only observations never synthesize an angle or position', () {
    final measurement = UwbMeasurement.fromEvent(
      observation({
        'azimuthRad': null,
        'elevationRad': null,
        'x': 12.0,
        'y': 18.0,
      }),
      workerId: 'WORKER-B',
    );

    expect(measurement.status, 'distance-only');
    expect(measurement.distanceM, 4.5);
    expect(measurement.azimuthRad, isNull);
    final upload = measurement.toUpload(
      'equipment-device',
      clock: synchronizedClock,
    );
    expect(upload['azimuthRad'], isNull);
    expect(upload['elevationRad'], isNull);
    expect(upload.containsKey('x'), isFalse);
    expect(upload.containsKey('y'), isFalse);
  });

  test('mapped equipment peers retain their exact worker and observation', () {
    const peerWorkers = {'AA:01': 'WORKER-B', 'BB:02': 'WORKER-A'};
    for (final peer in peerWorkers.entries) {
      final measurement = UwbMeasurement.fromEvent(
        observation({'peerAddress': peer.key.toLowerCase()}),
        workerId: peer.value,
      );

      expect(measurement.peerAddress, peer.key);
      expect(measurement.status, 'measured');
      expect(
        measurement.toUpload('equipment-device', clock: synchronizedClock),
        {
          'source': 'live',
          'deviceId': 'equipment-device',
          'workerId': peer.value,
          'capturedAt': '2026-09-21T08:15:30.123Z',
          'captureClock': {
            'deviceCapturedAt': '2026-09-21T08:15:30.123Z',
            'offsetMs': 0.0,
            'uncertaintyMs': 12.5,
            'synchronizedAt': '2026-09-21T08:15:00.000Z',
          },
          'sequence': 42,
          'sessionEpoch': 'equipment-epoch-7',
          'distanceM': 4.5,
          'azimuthRad': 0.25,
          'elevationRad': -0.1,
          'uncertaintyM': 0.2,
        },
      );
    }
  });

  for (final worker in <String?>[null, '', 'WORKER-C', 'EQUIPMENT-1']) {
    test('upload rejects unsupported worker mapping $worker', () {
      final measurement = UwbMeasurement.fromEvent(
        observation(),
        workerId: worker,
      );

      expect(measurement.workerId, worker);
      expect(
        () =>
            measurement.toUpload('equipment-device', clock: synchronizedClock),
        throwsFormatException,
      );
    });
  }

  const invalidNumbers = <String, List<Object>>{
    'distanceM': [-0.01, 100.01, double.nan, double.infinity, -double.infinity],
    'azimuthRad': [
      -math.pi - 0.01,
      math.pi + 0.01,
      double.nan,
      double.infinity,
    ],
    'elevationRad': [
      -math.pi / 2 - 0.01,
      math.pi / 2 + 0.01,
      double.nan,
      -double.infinity,
    ],
    'uncertaintyM': [-0.01, double.nan, double.infinity, -double.infinity],
  };
  for (final field in invalidNumbers.entries) {
    for (final value in [...field.value, '1.0', true]) {
      test('rejects ${field.key}=$value', () {
        expect(
          () => UwbMeasurement.fromEvent(
            observation({field.key: value}),
            workerId: 'WORKER-A',
          ),
          throwsFormatException,
        );
      });
    }
  }

  test('inclusive radio bounds and integer samples are accepted', () {
    for (final sign in [-1, 1]) {
      final measurement = UwbMeasurement.fromEvent(
        observation({
          'distanceM': sign == -1 ? 0 : 100,
          'azimuthRad': sign * math.pi,
          'elevationRad': sign * math.pi / 2,
          'uncertaintyM': 0,
        }),
        workerId: 'WORKER-A',
      );

      expect(measurement.distanceM, sign == -1 ? 0.0 : 100.0);
      expect(measurement.azimuthRad, sign * math.pi);
      expect(measurement.elevationRad, sign * math.pi / 2);
      expect(measurement.uncertaintyM, 0.0);
    }
  });

  for (final timestamp in <Object?>[
    null,
    123,
    '',
    'not-a-time',
    '2026-09-21T08:15:30.123',
  ]) {
    test('rejects missing or invalid capture timestamp $timestamp', () {
      expect(
        () => UwbMeasurement.fromEvent(
          observation({'capturedAt': timestamp}),
          workerId: 'WORKER-A',
        ),
        throwsFormatException,
      );
    });
  }

  test('capture timestamps with offsets preserve the instant in UTC', () {
    final measurement = UwbMeasurement.fromEvent(
      observation({'capturedAt': '2026-09-21T17:15:30.123+09:00'}),
      workerId: 'WORKER-A',
    );

    expect(measurement.capturedAt, DateTime.utc(2026, 9, 21, 8, 15, 30, 123));
    expect(
      measurement.toUpload(
        'equipment-device',
        clock: synchronizedClock,
      )['capturedAt'],
      '2026-09-21T08:15:30.123Z',
    );
  });

  for (final residual in [40.0, -40.0]) {
    test(
      'residual $residual ms widens uncertainty without moving capture time',
      () {
        final measurement = UwbMeasurement.fromEvent(
          observation(),
          workerId: 'WORKER-A',
        );
        final clock = TrackingClockSync(
          clockOffsetMs: 4500,
          clockUncertaintyMs: 12.5,
          clockSynchronizedAt: DateTime.utc(2026, 9, 21, 8, 15),
        );

        final upload = measurement.toUpload(
          'equipment-device',
          clock: clock,
          clockResidualMs: residual,
        );

        expect(upload['source'], 'live');
        expect(upload['capturedAt'], '2026-09-21T08:15:34.623Z');
        expect(upload['captureClock'], {
          'deviceCapturedAt': '2026-09-21T08:15:30.123Z',
          'offsetMs': 4500.0,
          'uncertaintyMs': 52.5,
          'synchronizedAt': '2026-09-21T08:15:00.000Z',
        });
      },
    );
  }

  for (final skew in [
    (offset: 4500.0, corrected: '2026-09-21T08:15:34.623Z'),
    (offset: -12500.0, corrected: '2026-09-21T08:15:17.623Z'),
  ]) {
    test(
      'upload corrects ${skew.offset}ms skew and preserves device capture time',
      () {
        final measurement = UwbMeasurement.fromEvent(
          observation(),
          workerId: 'WORKER-A',
        );
        final clock = TrackingClockSync(
          clockOffsetMs: skew.offset,
          clockUncertaintyMs: 12.5,
          clockSynchronizedAt: DateTime.utc(2026, 9, 21, 8, 15),
        );

        final upload = measurement.toUpload('equipment-device', clock: clock);

        expect(upload['capturedAt'], skew.corrected);
        expect(upload['captureClock'], {
          'deviceCapturedAt': '2026-09-21T08:15:30.123Z',
          'offsetMs': skew.offset,
          'uncertaintyMs': 12.5,
          'synchronizedAt': '2026-09-21T08:15:00.000Z',
        });
        expect(
          measurement.capturedAt,
          DateTime.utc(2026, 9, 21, 8, 15, 30, 123),
        );
      },
    );
  }
}
