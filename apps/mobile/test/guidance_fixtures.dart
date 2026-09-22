import 'dart:async';

import 'package:gs_safety_mobile/features/safety_guidance/application/guidance_coordinator.dart';
import 'package:gs_safety_mobile/features/safety_guidance/application/guidance_ports.dart';
import 'package:gs_safety_mobile/features/safety_guidance/models/guidance_context.dart';
import 'package:gs_safety_mobile/features/safety_guidance/models/guidance_event.dart';

final testTime = DateTime.utc(2030, 1, 2, 3, 4);
const testContext = GuidanceContext(
  workerId: 'WORKER-A',
  runId: 'run-1',
  mapId: 'map-1',
  mapVersion: '1.0',
  floorId: 'ground',
  profileVersion: 1,
);

Map<String, Object?> guidanceJson({int version = 1, Map<String, Object?> overrides = const {}}) => {
  'incidentId': 'incident-1',
  'eventId': 'event-$version',
  'runId': 'run-1',
  'workerId': 'WORKER-A',
  'guidanceId': 'guidance-1',
  'guidanceVersion': version,
  'updateKind': 'primary',
  'primaryGuidanceVersion': version,
  'simulationMode': 'equipment',
  'hazardIds': ['hazard-1'],
  'hazardType': 'equipment',
  'priority': 'critical',
  'actionCode': 'FOLLOW_VALIDATED_ROUTE',
  'routeVersion': version,
  'stepId': 'step-1',
  'mapId': 'map-1',
  'mapVersion': '1.0',
  'floorId': 'ground',
  'waypoints': [
    {'nodeId': 'start', 'floorId': 'ground', 'x': 1, 'y': 2},
    {'nodeId': 'REFUGE-01', 'floorId': 'ground', 'x': 10, 'y': 8},
  ],
  'destinationId': 'REFUGE-01',
  'profileVersion': 1,
  'profileSnapshot': profileJson(),
  'locale': 'ko',
  'requestedLocale': 'ko',
  'fallbackLocaleUsed': false,
  'templateCatalogVersion': '1.0.0',
  'messageKey': 'guidance.follow_route',
  'primaryMessageKey': 'guidance.follow_route',
  'messageArgs': <String, Object?>{},
  'primaryMessage': '화면의 검증된 경로를 따라 이동하세요.',
  'managerExplanationKo': '검증된 경로를 안내했습니다.',
  'supplementalExplanation': null,
  'evidence': <Object?>[],
  'mode': 'template',
  'generatedAt': testTime.add(Duration(milliseconds: version)).toIso8601String(),
  'expiresAt': testTime.add(const Duration(minutes: 10)).toIso8601String(),
  ...overrides,
};

Map<String, Object?> profileJson({Map<String, Object?> overrides = const {}}) => {
  'workerId': 'WORKER-A',
  'version': 1,
  'preferredLocale': 'ko',
  'locale': 'ko',
  'canUseStairs': null,
  'speedMps': null,
  'needsAssistance': null,
  'needsCompanion': null,
  'notificationPreferences': {'voice': true, 'vibration': true},
  'confirmedAt': null,
  ...overrides,
};

GuidanceEvent guidance({int version = 1, Map<String, Object?> overrides = const {}}) =>
    GuidanceEvent.fromJson(guidanceJson(version: version, overrides: overrides));

class FakeSpeech implements SpeechPort {
  final List<Completer<void>> completions = [];
  final List<String> texts = [];
  final List<String> locales = [];
  int stops = 0;
  bool available = true;
  bool fails = false;
  @override
  Future<void> stop() async {
    stops++;
  }

  @override
  Future<bool> isLanguageAvailable(String locale) async => available;
  @override
  Future<void> speak(String text, String locale) {
    texts.add(text);
    locales.add(locale);
    if (fails) return Future.error(StateError('voice failed'));
    final completion = Completer<void>();
    completions.add(completion);
    return completion.future;
  }
}

class FakeAlert implements AlertPort {
  int plays = 0;
  int stops = 0;
  Completer<void>? pending;
  @override
  Future<void> stop() async {
    stops++;
  }

  @override
  Future<void> play() {
    plays++;
    return pending?.future ?? Future.value();
  }
}

class FakeVibration implements VibrationPort {
  int vibrations = 0;
  int cancellations = 0;
  bool available = true;
  @override
  Future<bool> isAvailable() async => available;
  @override
  Future<void> vibrate() async {
    vibrations++;
  }

  @override
  Future<void> cancel() async {
    cancellations++;
  }
}

class FakeAck implements AckPort {
  final List<GuidanceAcknowledgement> values = [];
  final Set<String> failures = {};
  Completer<void>? pending;
  @override
  Future<void> send(GuidanceAcknowledgement acknowledgement) async {
    values.add(acknowledgement);
    if (failures.contains(acknowledgement.response)) throw StateError('offline');
    await (pending?.future ?? Future<void>.value());
  }
}

class GuidanceRig {
  GuidanceRig() {
    coordinator = GuidanceCoordinator(
      context: testContext,
      speech: speech,
      alert: alert,
      vibration: vibration,
      acknowledgements: ack,
      now: () => now,
    );
  }
  final speech = FakeSpeech();
  final alert = FakeAlert();
  final vibration = FakeVibration();
  final ack = FakeAck();
  DateTime now = testTime.add(const Duration(seconds: 1));
  late final GuidanceCoordinator coordinator;
  void dispose() => coordinator.dispose();
}

Future<void> settle() async {
  for (var turn = 0; turn < 10; turn++) {
    await Future<void>.delayed(Duration.zero);
  }
}
