import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:gs_safety_mobile/features/safety_guidance/models/guidance_state.dart';
import 'package:gs_safety_mobile/session/mobile_session_controller.dart';

import 'guidance_fixtures.dart';
import 'session_controller_fixtures.dart';

void main() {
  late SessionServer server;
  late MobileSessionController controller;
  late FakeSpeech speech;
  late FakeAlert alert;

  setUp(() async {
    server = await SessionServer.open();
    speech = FakeSpeech();
    alert = FakeAlert();
    controller = MobileSessionController(
      native: SessionNative(),
      speech: speech,
      alert: alert,
      vibration: FakeVibration(),
    );
  });
  tearDown(() async {
    await controller.logout();
    controller.dispose();
    await server.close();
  });

  Future<void> publish(
    String status, {
    int? version,
    String runId = 'run-1',
    bool clearGuidance = false,
  }) async {
    server.revision++;
    final workers = server.value['workers']! as List<Object?>;
    final previous =
        (workers.first! as Map<String, Object?>)['currentGuidance'];
    final guidance = <String, Object?>{
      ...(version == null && previous is Map<String, Object?>
          ? previous
          : server.guide(version ?? 1)),
      'runId': runId,
    };
    final next = server.snapshot(guidance);
    next['run'] = {
      ...next['run']! as Map<String, Object?>,
      'status': status,
      'runId': runId,
    };
    if (clearGuidance) {
      next['workers'] = [
        for (final worker in next['workers']! as List<Object?>)
          {...worker! as Map<String, Object?>, 'currentGuidance': null},
      ];
    }
    server.value = next;
    for (final stream in server.streams) {
      server.emit(stream);
    }
  }

  Future<void> connect() async {
    await controller.connect(
      server: server.url,
      deviceRole: 'WORKER_1',
      mode: 'equipment',
      accessCode: 'test-code',
    );
    await until(() => controller.connected);
  }

  Future<void> observed(String status) => until(
    () =>
        (controller.snapshot['run'] as Map<String, Object?>?)?['status'] ==
        status,
  );

  test(
    'paused SSE cancels queued speech while retaining the current visual instruction',
    () async {
      alert.pending = Completer<void>();
      await connect();
      await until(() => alert.plays == 1);
      final previousStops = speech.stops;
      await publish('paused');
      await observed('paused');
      alert.pending!.complete();
      await settle();
      expect(speech.stops, greaterThan(previousStops));
      expect(speech.texts, isEmpty);
      expect(controller.workerData.guidanceCurrent, isTrue);
      expect(controller.workerData.canReplay, isFalse);
      expect(controller.guidance?.state.current?.guidanceVersion, 1);
    },
  );

  test(
    'paused fresh guidance is displayed and acknowledged silently and resumes without replay',
    () async {
      await publish('paused');
      await connect();
      await until(
        () => server.responses.any(
          (response) => response['response'] == 'received',
        ),
      );
      expect(controller.workerData.guidanceCurrent, isTrue);
      expect(controller.workerData.canReplay, isFalse);
      expect(speech.texts, isEmpty);
      expect(alert.plays, 0);
      await controller.guidance!.markDisplayed(
        guidanceId: 'guidance-1',
        guidanceVersion: 1,
      );
      expect(
        server.responses.any((response) => response['response'] == 'displayed'),
        isTrue,
      );
      await controller.guidance!.replay();
      expect(speech.texts, isEmpty);
      await publish('running');
      await observed('running');
      await settle();
      expect(speech.texts, isEmpty);
      expect(controller.workerData.canReplay, isTrue);
      await publish('running', version: 2);
      await until(() => speech.texts.length == 1);
    },
  );

  test(
    'pause and completion stop active speech without clearing guidance or receipts',
    () async {
      await connect();
      await until(() => speech.texts.length == 1);
      await controller.guidance!.markDisplayed(
        guidanceId: 'guidance-1',
        guidanceVersion: 1,
      );
      await publish('paused');
      await observed('paused');
      expect(controller.guidance?.state.playbackSpeech, SpeechStatus.cancelled);
      expect(
        controller.guidance?.state.acknowledgements['displayed'],
        AcknowledgementStatus.sent,
      );
      await publish('running');
      await observed('running');
      await settle();
      expect(speech.texts.length, 1);
      await publish('running', version: 2);
      await until(() => speech.texts.length == 2);
      await publish('completed');
      await observed('completed');
      expect(controller.guidance?.state.playbackSpeech, SpeechStatus.cancelled);
      expect(controller.workerData.guidanceCurrent, isTrue);
      expect(controller.workerData.canReplay, isFalse);
      await controller.guidance!.replay();
      expect(speech.texts.length, 2);
    },
  );

  test(
    'reset cancels queued old-run speech and permits a fresh run version',
    () async {
      alert.pending = Completer<void>();
      await connect();
      await until(() => alert.plays == 1);
      await publish('idle', runId: 'run-2', clearGuidance: true);
      await observed('idle');
      alert.pending!.complete();
      await settle();
      expect(speech.texts, isEmpty);
      expect(controller.guidance?.state.current, isNull);
      await publish('running', runId: 'run-2', version: 1);
      await until(() => speech.texts.length == 1);
      expect(controller.guidance?.state.current?.runId, 'run-2');
    },
  );
}

Future<void> until(bool Function() predicate) async {
  final deadline = DateTime.now().add(const Duration(seconds: 3));
  while (!predicate()) {
    if (DateTime.now().isAfter(deadline)) {
      throw TimeoutException('Expected run state was not reached');
    }
    await Future<void>.delayed(const Duration(milliseconds: 10));
  }
}
