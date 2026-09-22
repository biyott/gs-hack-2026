import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:gs_safety_mobile/features/safety_guidance/data/guidance_api_service.dart';
import 'package:gs_safety_mobile/services/native_device_service.dart';
import 'package:gs_safety_mobile/session/mobile_session_controller.dart';
import 'package:gs_safety_mobile/tracking/device_tracking_controller.dart';
import 'package:gs_safety_mobile/tracking/tracking_clock_monitor.dart';

class _Native extends NativeDeviceService {
  final stream = StreamController<NativeDeviceEvent>.broadcast(sync: true);
  final cameras = <NativeCctvSession>[];
  int stops = 0;
  Completer<NativeCameraPreview>? pending;
  @override
  Stream<NativeDeviceEvent> get events => stream.stream;
  @override
  Future<void> stopCctv() async {
    stops++;
  }

  @override
  Future<void> stopUwb() async {}
  @override
  Future<NativeCameraPreview> startCctv(NativeCctvSession session) async {
    cameras.add(session);
    return pending?.future ??
        const NativeCameraPreview(
          textureId: 7,
          width: 640,
          height: 480,
          rotationDegrees: 90,
        );
  }
}

class _Api extends GuidanceApiService {
  _Api() : super(Uri.parse('http://localhost:3000')) {
    token = 'test-session-token';
  }
  int clockRequests = 0;
  bool failClock = false;
  @override
  Future<Map<String, Object?>> request(
    String method,
    String path, {
    Map<String, Object?>? body,
    Map<String, String>? query,
  }) async {
    if (path != '/api/clock') return {};
    clockRequests++;
    if (failClock) throw const ApiFailure('Clock unavailable');
    return {'serverAt': DateTime.now().toUtc().toIso8601String()};
  }
}

class _Session extends MobileSessionController {
  _Session(_Native service) : super(native: service) {
    api = _Api();
    connected = true;
    deviceRole = 'CCTV';
    mode = 'equipment';
    capabilities = {'cameraAvailable': true, 'cameraPermissionGranted': true};
  }
  Map<String, Object?> current = {
    'mode': 'equipment',
    'run': {'runId': 'run-1', 'status': 'running'},
  };
  bool sessionForeground = true;
  @override
  bool get foreground => sessionForeground;
  void lifecycle({required bool foreground, required bool live}) {
    sessionForeground = foreground;
    connected = live;
    notifyListeners();
  }

  @override
  Map<String, Object?> get snapshot => current;
  void update(Map<String, Object?> next) {
    current = next;
    notifyListeners();
  }
}

void main() {
  testWidgets(
    'camera handoff preserves signed calibration residual separately from RTT',
    (tester) async {
      var wall = DateTime.utc(2026, 9, 21, 12);
      final native = _Native();
      final session = _Session(native);
      final controller = DeviceTrackingController(
        session: session,
        clockMonitor: TrackingClockMonitor(
          now: () => wall,
          monotonicNow: () => Duration.zero,
        ),
      );
      var adjusted = false;
      controller.addListener(() {
        if (!adjusted && controller.state == TrackingState.starting) {
          adjusted = true;
          wall = wall.add(const Duration(milliseconds: 20));
        }
      });
      controller.initialize();
      try {
        await tester.pump();
        expect(native.cameras, hasLength(1));
        expect(native.cameras.single.clockBaselineResidualMs, 20);
        expect(
          native.cameras.single.clockUncertaintyMs,
          controller.clock!.clockUncertaintyMs,
        );
        expect(
          controller.clockUncertaintyMs,
          controller.clock!.clockUncertaintyMs + 20,
        );
      } finally {
        controller.dispose();
        await tester.pump();
        await native.stream.close();
        session.api?.dispose();
      }
    },
  );

  testWidgets(
    'small clock drift widens displayed uncertainty without changing the offset',
    (tester) async {
      var wall = DateTime.utc(2026, 9, 21, 12);
      var elapsed = Duration.zero;
      final native = _Native();
      final session = _Session(native);
      final controller = DeviceTrackingController(
        session: session,
        clockMonitor: TrackingClockMonitor(
          now: () => wall,
          monotonicNow: () => elapsed,
        ),
      )..initialize();
      try {
        await tester.pump();
        final baseline = controller.clock!.clockUncertaintyMs;
        final offset = controller.clock!.clockOffsetMs;
        wall = wall.add(const Duration(milliseconds: 290));
        elapsed += const Duration(milliseconds: 250);
        await tester.pump(const Duration(milliseconds: 250));
        expect(controller.clockUncertaintyMs, baseline + 40);
        expect(controller.clock!.clockOffsetMs, offset);
        expect(native.cameras, hasLength(1));
      } finally {
        controller.dispose();
        await tester.pump();
        await native.stream.close();
        session.api?.dispose();
      }
    },
  );

  testWidgets(
    'native upload clock discontinuity triggers resync and fresh capture',
    (tester) async {
      final native = _Native();
      final session = _Session(native);
      final controller = DeviceTrackingController(session: session)
        ..initialize();
      try {
        await tester.pump();
        native.stream.add(
          const NativeDeviceEvent('cctvState', {
            'state': 'error',
            'errorCode': 'clock_changed',
          }),
        );
        await tester.pump();
        expect(native.cameras, hasLength(2));
        expect((session.api! as _Api).clockRequests, 6);
        expect(controller.state, TrackingState.running);
      } finally {
        controller.dispose();
        await tester.pump();
        await native.stream.close();
        session.api?.dispose();
      }
    },
  );

  for (final jump in [
    const Duration(milliseconds: 100),
    const Duration(milliseconds: -100),
  ]) {
    testWidgets(
      'active ${jump.inMilliseconds}ms clock jump synchronizes and restarts capture',
      (tester) async {
        var wall = DateTime.utc(2026, 9, 21, 12);
        var monotonic = Duration.zero;
        final monitor = TrackingClockMonitor(
          now: () => wall,
          monotonicNow: () => monotonic,
        );
        final native = _Native();
        final session = _Session(native);
        final controller = DeviceTrackingController(
          session: session,
          clockMonitor: monitor,
        )..initialize();
        try {
          await tester.pump();
          expect(native.cameras, hasLength(1));
          wall = wall.add(jump).add(const Duration(milliseconds: 250));
          monotonic += const Duration(milliseconds: 250);
          await tester.pump(const Duration(milliseconds: 250));
          expect(
            native.cameras,
            hasLength(2),
            reason:
                'A changed device clock requires a new native capture session.',
          );
          expect((session.api! as _Api).clockRequests, 6);
          wall = wall.add(const Duration(seconds: 1));
          monotonic += const Duration(seconds: 1);
          await tester.pump(const Duration(seconds: 1));
          expect(
            native.cameras,
            hasLength(2),
            reason: 'Steady elapsed time must not trigger another restart.',
          );
        } finally {
          controller.dispose();
          await tester.pump();
          await native.stream.close();
          session.api?.dispose();
        }
      },
    );
  }

  testWidgets(
    'native foreground waits for session resume and owned SSE connection',
    (tester) async {
      final native = _Native();
      final session = _Session(native);
      final controller = DeviceTrackingController(session: session)
        ..initialize();
      addTearDown(() async {
        controller.dispose();
        await native.stream.close();
        session.api?.dispose();
      });
      await tester.pump();
      expect(native.cameras, hasLength(1));
      session.lifecycle(foreground: false, live: true);
      native.stream.add(
        const NativeDeviceEvent('lifecycle', {'state': 'suspended'}),
      );
      await tester.pump();
      native.stream.add(
        const NativeDeviceEvent('lifecycle', {'state': 'foreground'}),
      );
      await tester.pump();
      expect(
        native.cameras,
        hasLength(1),
        reason: 'A native foreground event cannot resume a paused session.',
      );
      expect(session.preview, isNull);
      session.lifecycle(foreground: true, live: false);
      await tester.pump();
      expect(
        native.cameras,
        hasLength(1),
        reason: 'Wait for the owned SSE connection.',
      );
      session.lifecycle(foreground: true, live: true);
      await tester.pump();
      expect(native.cameras, hasLength(2));
      expect(controller.state, TrackingState.running);
      controller.dispose();
      await tester.pump();
    },
  );

  testWidgets(
    'CCTV uses authenticated 8 FPS native upload and returns preview',
    (tester) async {
      final native = _Native();
      final session = _Session(native);
      final controller = DeviceTrackingController(session: session)
        ..initialize();
      await tester.pump();
      expect(native.cameras, hasLength(1));
      final camera = native.cameras.single;
      expect(camera.uploadUrl.path, '/api/tracking/frame');
      expect(camera.cameraId, 'CCTV-01');
      expect(camera.deviceId, session.deviceId);
      expect(camera.runId, 'run-1');
      expect(camera.targetFps, 8);
      expect(camera.bearerToken, 'test-session-token');
      expect((session.api! as _Api).clockRequests, 3);
      expect(camera.clockUncertaintyMs, greaterThanOrEqualTo(0));
      expect(
        controller.clockUncertaintyMs,
        greaterThanOrEqualTo(controller.clock!.clockUncertaintyMs),
      );
      expect(
        controller.clockUncertaintyMs,
        lessThanOrEqualTo(camera.clockUncertaintyMs + 50),
      );
      expect(session.preview?.textureId, 7);
      expect(controller.state, TrackingState.running);
      expect(controller.isFresh, isFalse);
      controller.dispose();
      await tester.pump();
      await native.stream.close();
      session.api?.dispose();
    },
  );

  testWidgets(
    'suspension stops capture and resume opens a fresh native camera',
    (tester) async {
      final native = _Native();
      final session = _Session(native);
      final controller = DeviceTrackingController(session: session)
        ..initialize();
      await tester.pump();
      await controller.setForeground(false);
      expect(controller.state, TrackingState.suspended);
      expect(session.preview, isNull);
      expect(native.cameras, hasLength(1));
      await controller.setForeground(true);
      expect(native.cameras, hasLength(2));
      expect((session.api! as _Api).clockRequests, 6);
      expect(native.stops, greaterThanOrEqualTo(3));
      controller.dispose();
      await tester.pump();
      await native.stream.close();
      session.api?.dispose();
    },
  );

  testWidgets(
    'server pause and reset stop and recreate the correct camera run',
    (tester) async {
      final native = _Native();
      final session = _Session(native);
      final controller = DeviceTrackingController(session: session)
        ..initialize();
      await tester.pump();
      session.update({
        'mode': 'equipment',
        'run': {'runId': 'run-1', 'status': 'paused'},
      });
      await tester.pump();
      expect(session.preview, isNull);
      expect(controller.state, TrackingState.idle);
      session.update({
        'mode': 'equipment',
        'run': {'runId': 'run-2', 'status': 'running'},
      });
      await tester.pump();
      expect(native.cameras.last.runId, 'run-2');
      native.stream.add(
        NativeDeviceEvent('cctvFrame', {
          'runId': 'run-1',
          'deviceId': session.deviceId,
          'state': 'uploaded',
          'capturedAt': DateTime.now().toUtc().toIso8601String(),
        }),
      );
      expect(controller.lastObservedAt, isNull);
      native.stream.add(
        NativeDeviceEvent('cctvFrame', {
          'runId': 'run-2',
          'deviceId': session.deviceId,
          'state': 'uploaded',
          'capturedAt': DateTime.now()
              .toUtc()
              .add(const Duration(hours: 12))
              .toIso8601String(),
          'captureClock': {
            'deviceCapturedAt': DateTime.now().toUtc().toIso8601String(),
          },
        }),
      );
      expect(controller.lastObservedAt, isNotNull);
      expect(controller.isFresh, isTrue);
      expect(controller.source, 'camera-marker');
      controller.dispose();
      await tester.pump();
      await native.stream.close();
      session.api?.dispose();
    },
  );

  testWidgets(
    'camera permission failure explains the blocker without starting',
    (tester) async {
      final native = _Native();
      final session = _Session(native)
        ..capabilities = {
          'cameraAvailable': true,
          'cameraPermissionGranted': false,
        };
      final controller = DeviceTrackingController(session: session)
        ..initialize();
      await tester.pump();
      expect(native.cameras, isEmpty);
      expect(controller.state, TrackingState.failed);
      expect(controller.error, contains('permission'));
      controller.dispose();
      await tester.pump();
      await native.stream.close();
      session.api?.dispose();
    },
  );

  testWidgets('late native start result cannot restore a suspended preview', (
    tester,
  ) async {
    final native = _Native()..pending = Completer<NativeCameraPreview>();
    final session = _Session(native);
    final controller = DeviceTrackingController(session: session)..initialize();
    await tester.pump();
    final paused = controller.setForeground(false);
    native.pending!.complete(
      const NativeCameraPreview(
        textureId: 99,
        width: 640,
        height: 480,
        rotationDegrees: 0,
      ),
    );
    await paused;
    expect(session.preview, isNull);
    expect(controller.state, TrackingState.suspended);
    controller.dispose();
    await tester.pump();
    await native.stream.close();
    session.api?.dispose();
  });

  testWidgets('clock failure prevents camera upload from starting', (
    tester,
  ) async {
    final native = _Native();
    final session = _Session(native);
    (session.api! as _Api).failClock = true;
    final controller = DeviceTrackingController(session: session)..initialize();
    await tester.pump();
    expect(native.cameras, isEmpty);
    expect(controller.state, TrackingState.failed);
    expect(controller.error, contains('synchronized'));
    controller.dispose();
    await tester.pump();
    await native.stream.close();
    session.api?.dispose();
  });
}
