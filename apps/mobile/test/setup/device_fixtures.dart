import 'dart:async';

import 'package:flutter/material.dart';
import 'package:gs_safety_mobile/services/native_device_service.dart';
import 'package:gs_safety_mobile/session/mobile_session_controller.dart';
import 'package:gs_safety_mobile/setup/device_screen.dart';
import 'package:gs_safety_mobile/theme/safety_theme.dart';
import 'package:gs_safety_mobile/tracking/device_tracking_controller.dart';
import 'package:gs_safety_mobile/tracking/tracking_clock.dart';
import 'package:gs_safety_mobile/tracking/tracking_clock_monitor.dart';

import '../guidance_fixtures.dart';

class DeviceFixtureNative extends NativeDeviceService {
  final calls = <String>[];
  @override
  Future<void> stopUwb() async => calls.add('native.stopUwb');
  @override
  Future<void> stopCctv() async => calls.add('native.stopCctv');
  @override
  Future<void> setScreenOn(bool enabled) async {}
  @override
  Future<void> dispose() async {}
  @override
  Future<Map<String, Object?>> capabilities() async {
    calls.add('native.capabilities');
    return {'uwbHardware': true, 'uwbPermissionGranted': true};
  }
}

class DeviceFixtureTracking extends DeviceTrackingController {
  DeviceFixtureTracking({
    required super.session,
    required this.calls,
  }) : super(
         clockMonitor: TrackingClockMonitor(
           now: () => DateTime.utc(2026, 9, 21, 9, 40),
           monotonicNow: () => Duration.zero,
         ),
       );
  final List<String> calls;
  bool fresh = false;
  Completer<void>? stopGate;
  @override
  bool get isFresh => fresh;
  @override
  Future<void> start() async => calls.add('tracking.start');
  @override
  Future<void> stop() async {
    calls.add('tracking.stop.begin');
    await stopGate?.future;
    calls.add('tracking.stop.end');
  }
}

class DeviceFixture {
  DeviceFixture({String role = 'EQUIPMENT', String state = 'waiting'}) {
    session =
        MobileSessionController(
            native: native,
            speech: FakeSpeech(),
            alert: FakeAlert(),
            vibration: FakeVibration(),
          )
          ..connected = true
          ..deviceRole = role
          ..capabilities = {'uwbHardware': true, 'uwbPermissionGranted': true};
    tracking = DeviceFixtureTracking(session: session, calls: native.calls);
    if (state == 'waiting') {
      tracking.state = TrackingState.waiting;
      tracking.waitingRoles = ['WORKER_1', 'WORKER_2'];
    } else {
      tracking.state = TrackingState.running;
      tracking.fresh = state == 'current';
      tracking.lastObservedAt = DateTime.utc(2026, 9, 21, 9, 40, 12);
    }
    tracking.clock = TrackingClockSync(
      clockOffsetMs: 0,
      clockUncertaintyMs: state == 'uncertain' ? 72.5 : 12,
      clockSynchronizedAt: DateTime.utc(2026, 9, 21, 9, 40),
    );
  }

  final native = DeviceFixtureNative();
  late final MobileSessionController session;
  late final DeviceFixtureTracking tracking;

  Widget host({double textScale = 1, Future<void> Function()? onLogout}) =>
      RepaintBoundary(
        key: const Key('device-capture'),
        child: MaterialApp(
          debugShowCheckedModeBanner: false,
          theme: SafetyTheme.dark(),
          builder: (context, child) => MediaQuery(
            data: MediaQuery.of(
              context,
            ).copyWith(textScaler: TextScaler.linear(textScale)),
            child: child!,
          ),
          home: DeviceScreen(
            session: session,
            tracking: tracking,
            onLogout: onLogout,
          ),
        ),
      );

  void dispose() {
    tracking.dispose();
    session.dispose();
  }
}
