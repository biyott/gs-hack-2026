import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:gs_safety_mobile/session/app_lifecycle_coordinator.dart';

void main() {
  test(
    'slow tracking invalidation does not delay audio and SSE suspension',
    () async {
      final rig = LifecycleRig();
      final stopping = Completer<void>();
      rig.trackingStop = stopping.future;
      final paused = rig.coordinator.pause();
      await pumpEventQueue();
      final beforeRelease = List<String>.of(rig.calls);
      stopping.complete();
      await paused;
      expect(beforeRelease, ['tracking:false', 'session:pause']);
      rig.coordinator.dispose();
    },
  );

  test(
    'rapid pause then resume waits for both pause operations before resuming',
    () async {
      final rig = LifecycleRig();
      final stopping = Completer<void>();
      rig.trackingStop = stopping.future;
      final paused = rig.coordinator.pause();
      final resumed = rig.coordinator.resume();
      await pumpEventQueue();
      final beforeRelease = List<String>.of(rig.calls);
      stopping.complete();
      await Future.wait([paused, resumed]);
      expect(beforeRelease, ['tracking:false', 'session:pause']);
      expect(rig.calls, [
        'tracking:false',
        'session:pause',
        'session:resume',
        'tracking:true',
      ]);
      rig.coordinator.dispose();
    },
  );

  test('late resume cannot restart tracking after a newer pause', () async {
    final rig = LifecycleRig();
    await rig.coordinator.pause();
    rig.calls.clear();
    final resuming = Completer<void>();
    rig.sessionResume = resuming.future;
    final resumed = rig.coordinator.resume();
    await pumpEventQueue();
    final paused = rig.coordinator.pause();
    await pumpEventQueue();
    resuming.complete();
    await Future.wait([paused, resumed]);
    expect(rig.calls, ['session:resume', 'tracking:false', 'session:pause']);
    rig.coordinator.dispose();
  });

  test(
    'logout stops native work and invalidates registration before token logout',
    () async {
      final rig = LifecycleRig();
      final invalidating = Completer<void>();
      rig.trackingStop = invalidating.future;
      final logout = rig.coordinator.logout();
      await pumpEventQueue();
      final beforeRelease = List<String>.of(rig.calls);
      invalidating.complete();
      await logout;
      expect(beforeRelease, ['tracking:stop', 'session:pause']);
      expect(rig.calls.last, 'session:logout');
      rig.coordinator.dispose();
    },
  );

  test('logout prevents an obsolete resume from restarting tracking', () async {
    final rig = LifecycleRig();
    await rig.coordinator.pause();
    rig.calls.clear();
    final resuming = Completer<void>();
    rig.sessionResume = resuming.future;
    final resumed = rig.coordinator.resume();
    await pumpEventQueue();
    await rig.coordinator.logout();
    resuming.complete();
    await resumed;
    expect(rig.calls, isNot(contains('tracking:true')));
    rig.coordinator.dispose();
  });
}

class LifecycleRig {
  final calls = <String>[];
  Future<void> trackingStop = Future.value(), sessionResume = Future.value();
  late final coordinator = AppLifecycleCoordinator(
    setTrackingForeground: (foreground) async {
      calls.add('tracking:$foreground');
      if (!foreground) await trackingStop;
    },
    pauseSession: () async {
      calls.add('session:pause');
    },
    resumeSession: () async {
      calls.add('session:resume');
      await sessionResume;
    },
    stopTracking: () async {
      calls.add('tracking:stop');
      await trackingStop;
    },
    logoutSession: () async {
      calls.add('session:logout');
    },
  );
}
