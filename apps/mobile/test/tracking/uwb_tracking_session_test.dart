import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:gs_safety_mobile/features/safety_guidance/data/guidance_api_service.dart';
import 'package:gs_safety_mobile/services/native_device_service.dart';
import 'package:gs_safety_mobile/tracking/tracking_clock.dart';
import 'package:gs_safety_mobile/tracking/tracking_state.dart';
import 'package:gs_safety_mobile/tracking/uwb_measurement.dart';
import 'package:gs_safety_mobile/tracking/uwb_tracking_session.dart';

typedef ApiCall = ({
  String method,
  String path,
  Map<String, Object?>? body,
  Map<String, String>? query,
});

class FakeNative extends NativeDeviceService {
  final starts = <NativeUwbSession>[];
  bool rejectStart = false;
  int generation = 7;

  @override
  Future<Map<String, Object?>> prepareUwb(String role) async => {
    'role': role,
    'generation': generation,
    'address': role == 'EQUIPMENT' ? 'CC:03' : 'AA:01',
  };

  @override
  Future<void> startUwb(NativeUwbSession session) async {
    starts.add(session);
    if (rejectStart) throw StateError('Native ranging failed');
  }
}

class FakeApi extends GuidanceApiService {
  FakeApi(String role) : super(Uri.parse('http://localhost')) {
    config = {
      'status': 'ready',
      'config': {
        'sessionEpoch': 'epoch-7',
        'sessionId': 27,
        'configId': 2,
        'sessionKeyHex': '0123456789abcdef',
        'peerAddresses': role == 'EQUIPMENT' ? ['AA:01', 'BB:02'] : ['CC:03'],
        'channel': 9,
        'preambleIndex': 10,
        'updateRateType': 2,
      },
      'peerWorkers': role == 'EQUIPMENT'
          ? {'AA:01': 'WORKER-B', 'BB:02': 'WORKER-A'}
          : <String, Object?>{},
    };
  }

  late Map<String, Object?> config;
  final calls = <ApiCall>[];
  Completer<Map<String, Object?>>? uploadResult;
  bool rejectRegistration = false;
  List<ApiCall> get uploads =>
      calls.where((call) => call.path == '/api/tracking/uwb').toList();
  int get configRequests => calls.where((call) => call.method == 'GET').length;

  @override
  Future<Map<String, Object?>> request(
    String method,
    String path, {
    Map<String, Object?>? body,
    Map<String, String>? query,
  }) async {
    calls.add((method: method, path: path, body: body, query: query));
    if (method == 'POST' && path == '/api/uwb/prepare' && rejectRegistration) {
      throw const ApiFailure('Registration failed');
    }
    if (method == 'GET') return config;
    final result = uploadResult;
    if (path == '/api/tracking/uwb' && result != null) return result.future;
    return {};
  }
}

class SessionFixture {
  SessionFixture([
    String role = 'EQUIPMENT',
    double Function()? clockResidualMs,
  ]) : api = FakeApi(role) {
    session = UwbTrackingSession(
      native: native,
      api: api,
      role: role,
      deviceId: 'device-7',
      clock: TrackingClockSync(
        clockOffsetMs: 4500,
        clockUncertaintyMs: 12.5,
        clockSynchronizedAt: DateTime.utc(2026, 9, 21, 8, 15),
      ),
      clockResidualMs: clockResidualMs,
      onStatus: (state, error, waiting) => states.add(state),
      onMeasurement: measurements.add,
      pollInterval: const Duration(seconds: 1),
    );
    addTearDown(() {
      session.dispose();
      api.dispose();
    });
  }

  final FakeNative native = FakeNative();
  final FakeApi api;
  final states = <TrackingState>[];
  final measurements = <UwbMeasurement>[];
  late final UwbTrackingSession session;
}

NativeDeviceEvent measurement({
  String peer = 'AA:01',
  String epoch = 'epoch-7',
  int generation = 7,
  int sequence = 1,
}) => NativeDeviceEvent('uwbMeasurement', {
  'peerAddress': peer,
  'sessionEpoch': epoch,
  'generation': generation,
  'sequence': sequence,
  'capturedAt': '2026-09-21T08:15:30.123Z',
  'distanceM': 4.5,
  'azimuthRad': null,
  'elevationRad': null,
  'uncertaintyM': 0.2,
});

NativeDeviceEvent nativeState(
  String state, {
  String? peer,
  int generation = 7,
}) => NativeDeviceEvent('uwbState', {
  'state': state,
  'generation': generation,
  'sessionEpoch': 'epoch-7',
  'peerAddress': peer,
});

void main() {
  test(
    'equipment uploads each observation with its exact peer worker mapping',
    () async {
      final fixture = SessionFixture();
      await fixture.session.start();

      fixture.session.accept(measurement(peer: 'aa:01'));
      await pumpEventQueue();
      fixture.session.accept(measurement(peer: 'bb:02'));
      await pumpEventQueue();

      expect(fixture.measurements.map((value) => value.workerId), [
        'WORKER-B',
        'WORKER-A',
      ]);
      expect(fixture.api.uploads.map((call) => call.method), ['POST', 'POST']);
      expect(fixture.api.uploads.first.body, {
        'source': 'live',
        'deviceId': 'device-7',
        'workerId': 'WORKER-B',
        'capturedAt': '2026-09-21T08:15:34.623Z',
        'captureClock': {
          'deviceCapturedAt': '2026-09-21T08:15:30.123Z',
          'offsetMs': 4500.0,
          'uncertaintyMs': 12.5,
          'synchronizedAt': '2026-09-21T08:15:00.000Z',
        },
        'sequence': 1,
        'sessionEpoch': 'epoch-7',
        'distanceM': 4.5,
        'azimuthRad': null,
        'elevationRad': null,
        'uncertaintyM': 0.2,
      });
      expect(fixture.api.uploads.last.body?['workerId'], 'WORKER-A');
      expect(
        fixture.measurements.first.capturedAt,
        DateTime.utc(2026, 9, 21, 8, 15, 30, 123),
      );
    },
  );

  test('queued observations retain clock residual from capture time', () async {
    var residual = 0.0;
    final fixture = SessionFixture('EQUIPMENT', () => residual);
    fixture.api.uploadResult = Completer<Map<String, Object?>>();
    await fixture.session.start();
    fixture.session.accept(measurement());
    expect(fixture.api.uploads, hasLength(1));

    residual = 40;
    fixture.session.accept(measurement(peer: 'BB:02'));
    expect(fixture.api.uploads, hasLength(1));
    residual = 0;
    fixture.api.uploadResult!.complete({});
    await pumpEventQueue();

    expect(fixture.api.uploads, hasLength(2));
    expect(fixture.api.uploads.first.body?['captureClock'], {
      'deviceCapturedAt': '2026-09-21T08:15:30.123Z',
      'offsetMs': 4500.0,
      'uncertaintyMs': 12.5,
      'synchronizedAt': '2026-09-21T08:15:00.000Z',
    });
    expect(fixture.api.uploads.last.body?['captureClock'], {
      'deviceCapturedAt': '2026-09-21T08:15:30.123Z',
      'offsetMs': 4500.0,
      'uncertaintyMs': 52.5,
      'synchronizedAt': '2026-09-21T08:15:00.000Z',
    });
    expect(
      fixture.api.uploads.last.body?['capturedAt'],
      '2026-09-21T08:15:34.623Z',
    );
    expect(fixture.api.uploads.last.body?['source'], 'live');
  });

  for (final role in ['WORKER_1', 'WORKER_2']) {
    test(
      '$role displays its controller range locally without uploading',
      () async {
        final fixture = SessionFixture(role);
        await fixture.session.start();

        fixture.session.accept(measurement(peer: 'CC:03'));
        await pumpEventQueue();

        expect(fixture.measurements.single.distanceM, 4.5);
        expect(fixture.measurements.single.workerId, isNull);
        expect(fixture.api.uploads, isEmpty);
        expect(fixture.states.last, TrackingState.running);
      },
    );
  }

  test(
    'old epoch, old generation, and unknown peer observations are ignored',
    () async {
      final fixture = SessionFixture();
      await fixture.session.start();

      fixture.session.accept(measurement(epoch: 'epoch-6'));
      fixture.session.accept(measurement(generation: 6));
      fixture.session.accept(measurement(peer: 'DD:04'));
      fixture.session.accept(nativeState('failed', generation: 6));
      await pumpEventQueue();

      expect(fixture.measurements, isEmpty);
      expect(fixture.api.uploads, isEmpty);
      expect(fixture.states.last, TrackingState.starting);
    },
  );

  test(
    'duplicate and lower sequences are ignored independently per peer',
    () async {
      final fixture = SessionFixture();
      await fixture.session.start();

      for (final event in [
        measurement(sequence: 2),
        measurement(sequence: 2),
        measurement(sequence: 1),
        measurement(peer: 'BB:02', sequence: 1),
        measurement(sequence: 3),
      ]) {
        fixture.session.accept(event);
        await pumpEventQueue();
      }

      expect(fixture.measurements.map((value) => value.sequence), [2, 1, 3]);
      expect(fixture.api.uploads, hasLength(3));
    },
  );

  test(
    'ready config stays starting until every native peer initializes',
    () async {
      final fixture = SessionFixture();
      await fixture.session.start();

      expect(fixture.native.starts, hasLength(1));
      expect(fixture.states, [TrackingState.preparing, TrackingState.starting]);
      fixture.session.accept(nativeState('initialized', peer: 'AA:01'));
      fixture.session.accept(nativeState('initialized', peer: 'AA:01'));
      fixture.session.accept(nativeState('initialized', peer: 'DD:04'));
      expect(fixture.states.last, TrackingState.starting);
      fixture.session.accept(nativeState('initialized', peer: 'BB:02'));
      expect(fixture.states.last, TrackingState.running);
    },
  );

  testWidgets('waiting GET polling stops when the session is disposed', (
    tester,
  ) async {
    final fixture = SessionFixture();
    fixture.api.config = {
      'status': 'waiting',
      'missingRoles': ['WORKER_2'],
    };
    await fixture.session.start();
    expect(fixture.states.last, TrackingState.waiting);
    expect(fixture.api.configRequests, 1);
    await tester.pump(const Duration(seconds: 1));
    expect(fixture.api.configRequests, 2);

    fixture.session.dispose();
    await tester.pump(const Duration(seconds: 5));

    expect(fixture.api.configRequests, 2);
    expect(fixture.native.starts, isEmpty);
  });

  test(
    'native availability loss without session metadata stops ranging',
    () async {
      final fixture = SessionFixture();
      await fixture.session.start();
      fixture.session.accept(nativeState('initialized', peer: 'AA:01'));
      fixture.session.accept(nativeState('initialized', peer: 'BB:02'));
      expect(fixture.states.last, TrackingState.running);

      fixture.session.accept(
        NativeDeviceEvent.fromPlatform({
          'type': 'uwbState',
          'state': 'unavailable',
          'reason': 1,
        }),
      );
      fixture.session.accept(measurement());
      await pumpEventQueue();

      expect(
        {
          'state': fixture.states.last,
          'epoch': fixture.session.sessionEpoch,
          'measurements': fixture.measurements.length,
          'uploads': fixture.api.uploads.length,
        },
        {
          'state': TrackingState.failed,
          'epoch': null,
          'measurements': 0,
          'uploads': 0,
        },
      );
    },
  );

  for (final state in ['failed', 'unavailable', 'disconnected', 'stopped']) {
    test('$state prevents further observation display and upload', () async {
      final fixture = SessionFixture();
      await fixture.session.start();
      fixture.session.accept(nativeState(state));

      fixture.session.accept(measurement());
      await pumpEventQueue();

      expect(fixture.measurements, isEmpty);
      expect(fixture.api.uploads, isEmpty);
      expect(fixture.session.sessionEpoch, isNull);
      expect(fixture.states.last, TrackingState.failed);
    });

    test('$state cannot resume after an in-flight upload completes', () async {
      final fixture = SessionFixture();
      fixture.api.uploadResult = Completer<Map<String, Object?>>();
      await fixture.session.start();
      fixture.session.accept(measurement());
      fixture.session.accept(measurement(peer: 'BB:02'));
      expect(fixture.api.uploads, hasLength(1));

      fixture.session.accept(nativeState(state));
      fixture.api.uploadResult!.complete({});
      await pumpEventQueue();

      expect(fixture.api.uploads, hasLength(1));
      expect(fixture.states.last, TrackingState.failed);
    });
  }

  test(
    'registered session invalidation DELETEs preparation exactly once',
    () async {
      final fixture = SessionFixture();
      await fixture.session.start();

      fixture.native.generation = 8;
      await fixture.session.invalidate();
      await fixture.session.invalidate();
      fixture.session.accept(measurement());

      final deletions = fixture.api.calls.where(
        (call) => call.method == 'DELETE',
      );
      expect(deletions.single.path, '/api/uwb/prepare');
      expect(deletions.single.query, {'generation': '7'});
      expect(fixture.api.uploads, isEmpty);
    },
  );

  test('unstarted sessions do not invalidate server preparation', () async {
    final unstarted = SessionFixture();
    await unstarted.session.invalidate();
    expect(unstarted.api.calls, isEmpty);
  });

  test(
    'failed registration attempts still invalidate possible server preparation',
    () async {
      final rejected = SessionFixture();
      rejected.api.rejectRegistration = true;
      await rejected.session.start();

      await rejected.session.invalidate();

      expect(rejected.states.last, TrackingState.failed);
      expect(
        rejected.api.calls.where((call) => call.method == 'DELETE').single.path,
        '/api/uwb/prepare',
      );
    },
  );

  test(
    'native startup failure prevents subsequent observations and uploads',
    () async {
      final fixture = SessionFixture();
      fixture.native.rejectStart = true;
      await fixture.session.start();
      expect(fixture.states.last, TrackingState.failed);

      fixture.session.accept(measurement());
      await pumpEventQueue();

      expect(fixture.measurements, isEmpty);
      expect(fixture.api.uploads, isEmpty);
      expect(fixture.states.last, TrackingState.failed);
    },
  );
}
