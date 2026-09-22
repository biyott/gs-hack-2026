import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:gs_safety_mobile/session/mobile_session_controller.dart';

import 'guidance_fixtures.dart';
import 'session_controller_fixtures.dart';

void main() {
  late SessionServer server;
  late MobileSessionController controller;
  late FakeSpeech speech;
  late SessionNative native;

  setUp(() async {
    server = await SessionServer.open();
    native = SessionNative();
    speech = FakeSpeech();
    controller = MobileSessionController(
      native: native,
      speech: speech,
      alert: FakeAlert(),
      vibration: FakeVibration(),
    );
  });
  tearDown(() async {
    await controller.logout();
    controller.dispose();
    await server.close();
  });

  Future<void> connect([String role = 'WORKER_1']) async {
    await controller.connect(
      server: server.url,
      deviceRole: role,
      mode: 'equipment',
      accessCode: 'test-code',
    );
    await eventually(() => controller.connected);
  }

  test(
    'maps role accounts and keeps one app subscription across role changes',
    () async {
      await connect();
      expect(server.logins.last, containsPair('actorId', 'worker-a'));
      expect(server.logins.last, containsPair('role', 'worker'));
      expect(controller.workerId, 'WORKER-A');
      final id = controller.deviceId;
      await connect('WORKER_2');
      expect(server.logins.last, containsPair('actorId', 'worker-b'));
      expect(controller.workerId, 'WORKER-B');
      expect(controller.activeSubscriptions, 1);
      await connect('EQUIPMENT');
      expect(server.logins.last, containsPair('role', 'device'));
      expect(server.logins.last.containsKey('workerId'), isFalse);
      expect(controller.workerId, isNull);
      expect(controller.deviceId, id);
      expect(controller.activeSubscriptions, 1);
      expect(native.requestedRoles, ['WORKER_1', 'WORKER_2', 'EQUIPMENT']);
    },
  );

  test(
    'position-only snapshots repaint the map without notifying the screen',
    () async {
      await connect();
      await eventually(
        () =>
            server.responses.length >= 2 &&
            controller.guidance?.state.acknowledgements.values.every(
                  (v) => v.name == 'sent',
                ) ==
                true,
      );
      var screens = 0;
      var maps = 0;
      controller.addListener(() => screens++);
      controller.mapOverlay.addListener(() => maps++);
      await server.push(x: 22);
      await eventually(() => controller.mapOverlay.value.ownPosition?.x == 22);
      expect(screens, 0);
      expect(maps, greaterThan(0));
      expect(speech.texts.length, 1);
    },
  );

  test(
    'pause closes live subscription and resume does not replay old guidance',
    () async {
      await connect();
      await eventually(() => speech.texts.length == 1);
      await controller.pause();
      expect(controller.foreground, isFalse);
      expect(controller.activeSubscriptions, 0);
      expect(controller.mapOverlay.value.hasVisibleRoute, isFalse);
      expect(native.uwbStops, greaterThan(0));
      expect(native.cameraStops, greaterThan(0));
      await controller.resume();
      await eventually(() => controller.connected);
      expect(controller.activeSubscriptions, 1);
      expect(speech.texts.length, 1);
      await server.push(guidanceVersion: 2);
      await eventually(() => speech.texts.length == 2);
      expect(
        controller.workerData.firstDeliveredText,
        server.initialGuide['primaryMessage'],
      );
      expect(server.eventConnections, 2);
    },
  );

  test('map mismatch blocks current instruction and route', () async {
    await connect();
    await server.push(mapVersion: '2.0.0');
    await eventually(() => !controller.mapOverlay.value.mapCompatible);
    expect(controller.workerData.guidanceCurrent, isFalse);
    expect(controller.workerData.canConfirmArrival, isFalse);
    expect(controller.mapOverlay.value.hasVisibleRoute, isFalse);
    expect(controller.error, contains('server map'));
  });

  test(
    'permission dialog interruption resumes an initially paused connection',
    () async {
      final gate = Completer<void>();
      native.permissionsGate = gate;
      final connecting = controller.connect(
        server: server.url,
        deviceRole: 'WORKER_1',
        mode: 'equipment',
        accessCode: 'test-code',
      );
      await eventually(() => native.requestedRoles.isNotEmpty);
      await controller.pause();
      gate.complete();
      await connecting;
      expect(controller.activeSubscriptions, 0);
      await controller.resume();
      await eventually(() => controller.connected);
      expect(controller.activeSubscriptions, 1);
    },
  );

  test(
    'stationary position-unknown guidance remains actionable without a position',
    () async {
      await connect();
      await server.push(
        positionStatus: 'unknown',
        guidance: {
          ...server.guide(2),
          'actionCode': 'POSITION_UNKNOWN',
          'waypoints': <Object?>[],
          'destinationId': null,
          'routeVersion': null,
          'stepId': null,
          'primaryMessage': '위치 확인을 위한 도움을 요청하세요.',
        },
      );
      await eventually(() => controller.workerData.guidanceVersion == 2);
      expect(controller.workerData.guidanceCurrent, isTrue);
      expect(controller.workerData.canRequestHelp, isTrue);
      expect(controller.mapOverlay.value.hasVisibleRoute, isFalse);
    },
  );

  test(
    'unknown position stops movement speech and removes actionable guidance',
    () async {
      await connect();
      await eventually(() => speech.texts.length == 1);
      final previousStops = speech.stops;
      await server.push(positionStatus: 'unknown', guidanceVersion: 2);
      await eventually(() => !controller.workerData.guidanceCurrent);
      expect(controller.workerData.canReplay, isFalse);
      expect(controller.mapOverlay.value.hasVisibleRoute, isFalse);
      expect(speech.stops, greaterThan(previousStops));
      expect(speech.texts.length, 1);
      expect(controller.error, contains('current position'));
    },
  );
}

Future<void> eventually(bool Function() condition) async {
  final deadline = DateTime.now().add(const Duration(seconds: 3));
  while (!condition()) {
    if (DateTime.now().isAfter(deadline)) fail('Condition was not reached');
    await Future<void>.delayed(const Duration(milliseconds: 10));
  }
}
