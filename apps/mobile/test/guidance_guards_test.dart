import 'package:flutter_test/flutter_test.dart';
import 'package:gs_safety_mobile/features/safety_guidance/models/guidance_event.dart';
import 'package:gs_safety_mobile/features/safety_guidance/models/guidance_state.dart';
import 'package:gs_safety_mobile/features/safety_guidance/models/worker_position.dart';

import 'guidance_fixtures.dart';

void main() {
  late GuidanceRig rig;
  setUp(() {
    rig = GuidanceRig();
  });
  tearDown(() {
    rig.dispose();
  });

  test('rejects another worker or run without receipt or output', () async {
    final otherWorker = guidance(
      overrides: {
        'workerId': 'WORKER-B',
        'profileSnapshot': profileJson(overrides: {'workerId': 'WORKER-B'}),
      },
    );
    expect(rig.coordinator.accept(otherWorker), GuidanceRejection.wrongWorker);
    expect(rig.coordinator.accept(guidance(overrides: {'runId': 'old-run'})), GuidanceRejection.wrongRun);
    await settle();
    expect(rig.ack.values, isEmpty);
    expect(rig.speech.texts, isEmpty);
    expect(rig.coordinator.state.current, isNull);
  });

  test('rejects duplicate and out-of-order versions without repeated modalities', () async {
    final current = guidance(version: 3);
    rig.coordinator.accept(current);
    await settle();
    expect(rig.coordinator.accept(current), GuidanceRejection.duplicate);
    expect(rig.coordinator.accept(guidance(version: 2)), GuidanceRejection.outOfOrder);
    await settle();
    expect(rig.speech.texts, hasLength(1));
    expect(rig.alert.plays, 1);
    expect(rig.vibration.vibrations, 1);
  });

  test('adopts only latest snapshot guidance', () async {
    rig.coordinator.adoptSnapshot([guidance(), guidance(version: 3), guidance(version: 2)]);
    await settle();
    expect(rig.coordinator.state.current?.guidanceVersion, 3);
    expect(rig.speech.texts, hasLength(1));
    expect(rig.ack.values.where((ack) => ack.response == 'received').single.guidanceVersion, 3);
  });

  test('new lower server priority remains authoritative', () {
    rig.coordinator.accept(guidance());
    rig.coordinator.accept(guidance(version: 2, overrides: {'priority': 'low'}));
    expect(rig.coordinator.state.current?.priority, 'low');
  });

  test('map mismatch removes route and cancels previous output', () async {
    rig.coordinator.accept(guidance());
    await settle();
    final stops = rig.speech.stops;
    expect(
      rig.coordinator.accept(guidance(version: 2, overrides: {'mapVersion': '2.0'})),
      GuidanceRejection.mapMismatch,
    );
    expect(rig.coordinator.state.route, isEmpty);
    expect(rig.coordinator.state.destinationId, isNull);
    expect(rig.coordinator.state.validity, GuidanceValidity.mapMismatch);
    expect(rig.speech.stops, greaterThan(stops));
  });

  test('profile mismatch cannot use prior route', () {
    rig.coordinator.accept(guidance());
    final mismatch = guidance(
      version: 2,
      overrides: {
        'profileVersion': 2,
        'profileSnapshot': profileJson(overrides: {'version': 2}),
      },
    );
    expect(rig.coordinator.accept(mismatch), GuidanceRejection.profileMismatch);
    expect(rig.coordinator.state.route, isEmpty);
  });

  test('expiry clears route and suppresses replay and responses', () async {
    rig.coordinator.accept(guidance());
    await settle();
    rig.now = testTime.add(const Duration(minutes: 10));
    rig.coordinator.checkExpiry();
    await rig.coordinator.replay();
    await rig.coordinator.confirmUnderstanding();
    expect(rig.coordinator.state.validity, GuidanceValidity.expired);
    expect(rig.coordinator.state.route, isEmpty);
    expect(rig.speech.texts, hasLength(1));
    expect(rig.ack.values.where((ack) => ack.response == 'understood'), isEmpty);
  });

  test('already expired event is never adopted', () {
    rig.now = testTime.add(const Duration(hours: 1));
    expect(rig.coordinator.accept(guidance()), GuidanceRejection.expired);
    expect(rig.coordinator.state.current, isNull);
  });

  testWidgets('scheduled expiry clears guidance without a new server event', (tester) async {
    rig.coordinator.accept(
      guidance(overrides: {'expiresAt': testTime.add(const Duration(seconds: 2)).toIso8601String()}),
    );
    rig.now = testTime.add(const Duration(seconds: 3));
    await tester.pump(const Duration(seconds: 2));
    expect(rig.coordinator.state.validity, GuidanceValidity.expired);
    expect(rig.coordinator.state.route, isEmpty);
    expect(rig.coordinator.state.playbackSpeech, SpeechStatus.cancelled);
  });

  test('nonroute action clears old route and destination', () {
    rig.coordinator.accept(guidance());
    rig.coordinator.accept(
      guidance(
        version: 2,
        overrides: {
          'actionCode': 'ROUTE_UNAVAILABLE',
          'routeVersion': null,
          'stepId': null,
          'destinationId': null,
          'waypoints': <Object?>[],
        },
      ),
    );
    expect(rig.coordinator.state.route, isEmpty);
    expect(rig.coordinator.state.destinationId, isNull);
  });

  test('invalid no-route payload is rejected at JSON boundary', () {
    expect(
      () => GuidanceEvent.fromJson(guidanceJson(overrides: {'actionCode': 'ROUTE_UNAVAILABLE'})),
      throwsFormatException,
    );
    expect(
      () => GuidanceEvent.fromJson(guidanceJson(overrides: {'waypoints': <Object?>[]})),
      throwsFormatException,
    );
  });

  test('high frequency position does not rebuild guidance or repeat speech', () async {
    rig.coordinator.accept(guidance());
    await settle();
    var rebuilds = 0;
    rig.coordinator.addListener(() {
      rebuilds++;
    });
    for (var index = 0; index < 100; index++) {
      rig.coordinator.updatePositions([
        WorkerPosition(
          workerId: 'WORKER-A',
          x: index.toDouble(),
          y: 2,
          positionSource: 'mock',
          positionStatus: 'known',
          lastObservedAt: rig.now,
        ),
      ]);
    }
    expect(rebuilds, 0);
    expect(rig.speech.texts, hasLength(1));
    expect(rig.coordinator.positions.value['WORKER-A']?.x, 99);
  });

  test('higher guidance version cannot regress the route version', () {
    rig.coordinator.accept(guidance(version: 3));
    expect(
      rig.coordinator.accept(guidance(version: 4, overrides: {'routeVersion': 2})),
      GuidanceRejection.outOfOrder,
    );
    expect(rig.coordinator.state.current?.routeVersion, 3);
  });

  test('empty authoritative snapshot clears current route without permitting old replay', () async {
    final old = guidance();
    rig.coordinator.accept(old);
    await settle();
    rig.coordinator.adoptSnapshot([]);
    expect(rig.coordinator.state.current, isNull);
    expect(rig.coordinator.state.route, isEmpty);
    expect(rig.coordinator.accept(old), GuidanceRejection.duplicate);
  });

  test('supplement cannot change primary route or wording', () {
    rig.coordinator.accept(guidance());
    expect(
      rig.coordinator.accept(
        guidance(
          version: 2,
          overrides: {
            'updateKind': 'supplement',
            'primaryGuidanceVersion': 1,
            'mode': 'rag-assisted',
            'supplementalExplanation': '보조 설명입니다.',
            'evidence': [
              {'documentId': 'EQ-001', 'documentVersion': '0.1.0', 'chunkId': 'EQ-001-step-1'},
            ],
            'primaryMessage': 'Unexpected changed primary',
          },
        ),
      ),
      GuidanceRejection.invalidSupplement,
    );
    expect(rig.coordinator.state.current?.guidanceVersion, 1);
  });
}
