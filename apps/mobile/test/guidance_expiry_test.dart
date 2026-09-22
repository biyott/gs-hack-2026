import 'package:flutter_test/flutter_test.dart';
import 'package:gs_safety_mobile/features/safety_guidance/models/guidance_event.dart';
import 'package:gs_safety_mobile/features/safety_guidance/models/guidance_state.dart';

import 'guidance_fixtures.dart';

void main() {
  late GuidanceRig rig;
  setUp(() {
    rig = GuidanceRig();
  });
  tearDown(() {
    rig.dispose();
  });

  testWidgets('scheduled expiry still fires when device UTC moves backward', (tester) async {
    rig.coordinator.accept(
      guidance(overrides: {'expiresAt': testTime.add(const Duration(seconds: 2)).toIso8601String()}),
    );
    rig.now = testTime.subtract(const Duration(hours: 1));
    await tester.pump(const Duration(milliseconds: 999));
    expect(rig.coordinator.state.validity, GuidanceValidity.valid);
    await tester.pump(const Duration(milliseconds: 1));
    expect(rig.coordinator.state.validity, GuidanceValidity.expired);
    expect(rig.coordinator.state.route, isEmpty);
    expect(rig.coordinator.state.destinationId, isNull);
    expect(rig.coordinator.state.playbackSpeech, SpeechStatus.cancelled);
  });

  testWidgets('replaced guidance keeps its own deadline after a backward UTC jump', (tester) async {
    rig.coordinator.accept(
      guidance(overrides: {'expiresAt': testTime.add(const Duration(seconds: 2)).toIso8601String()}),
    );
    await tester.pump(const Duration(milliseconds: 500));
    rig.now = testTime.add(const Duration(milliseconds: 1500));
    rig.coordinator.accept(
      guidance(
        version: 2,
        overrides: {'expiresAt': testTime.add(const Duration(seconds: 5)).toIso8601String()},
      ),
    );
    rig.now = testTime.subtract(const Duration(hours: 1));
    await tester.pump(const Duration(milliseconds: 500));
    expect(rig.coordinator.state.current?.guidanceVersion, 2);
    expect(rig.coordinator.state.validity, GuidanceValidity.valid);
    await tester.pump(const Duration(seconds: 3));
    expect(rig.coordinator.state.validity, GuidanceValidity.expired);
  });

  testWidgets('reset cancels the old deadline even when device UTC moves backward', (tester) async {
    rig.coordinator.accept(
      guidance(overrides: {'expiresAt': testTime.add(const Duration(seconds: 2)).toIso8601String()}),
    );
    rig.coordinator.reset(testContext);
    rig.now = testTime.subtract(const Duration(hours: 1));
    await tester.pump(const Duration(seconds: 2));
    expect(rig.coordinator.state.current, isNull);
    expect(rig.coordinator.state.validity, GuidanceValidity.waiting);
  });

  testWidgets('same-primary supplement retains the original elapsed deadline after UTC moves backward', (
    tester,
  ) async {
    rig.coordinator.accept(guidance(overrides: {'expiresAt': _expiresAt}));
    await tester.pump(const Duration(milliseconds: 500));
    rig.now = testTime.add(const Duration(milliseconds: 500));
    expect(rig.coordinator.accept(_supplement()), isNull);
    await tester.pump(const Duration(milliseconds: 500));
    expect(rig.coordinator.state.current?.guidanceVersion, 2);
    expect(rig.coordinator.state.validity, GuidanceValidity.expired);
    expect(rig.coordinator.state.route, isEmpty);
  });

  testWidgets('expired primary cannot be revived by a supplement after UTC moves backward', (tester) async {
    rig.coordinator.accept(guidance(overrides: {'expiresAt': _expiresAt}));
    await tester.pump(const Duration(seconds: 1));
    rig.now = testTime.add(const Duration(milliseconds: 500));
    expect(rig.coordinator.accept(_supplement()), GuidanceRejection.expired);
    await rig.coordinator.replay();
    await rig.coordinator.confirmUnderstanding();
    expect(rig.coordinator.state.validity, GuidanceValidity.expired);
    expect(rig.ack.values.where((value) => value.response == 'understood'), isEmpty);
    expect(rig.coordinator.accept(guidance(version: 3)), isNull);
    expect(rig.coordinator.state.current?.primaryGuidanceVersion, 3);
    expect(rig.coordinator.state.validity, GuidanceValidity.valid);
    await tester.pump(const Duration(minutes: 10));
    expect(rig.coordinator.state.validity, GuidanceValidity.expired);
  });

  testWidgets('synchronous expiry during state publication cannot launch its outputs afterward', (
    tester,
  ) async {
    rig.coordinator.addListener(() {
      if (rig.coordinator.state.validity != GuidanceValidity.valid) return;
      rig.now = testTime.add(const Duration(hours: 1));
      rig.coordinator.checkExpiry();
    });
    rig.coordinator.accept(guidance());
    await tester.pump();
    expect(rig.coordinator.state.validity, GuidanceValidity.expired);
    expect(rig.ack.values, isEmpty);
    expect(rig.speech.texts, isEmpty);
  });

  testWidgets('a supplement accepted during primary publication inherits its elapsed deadline', (
    tester,
  ) async {
    rig.coordinator.addListener(() {
      if (rig.coordinator.state.current?.guidanceVersion != 1) return;
      rig.coordinator.accept(_supplement());
    });
    rig.coordinator.accept(guidance(overrides: {'expiresAt': _expiresAt}));
    rig.now = testTime.add(const Duration(milliseconds: 500));
    await tester.pump(const Duration(seconds: 1));
    expect(rig.coordinator.state.current?.guidanceVersion, 2);
    expect(rig.coordinator.state.validity, GuidanceValidity.expired);
  });
}

String get _expiresAt => testTime.add(const Duration(seconds: 2)).toIso8601String();

GuidanceEvent _supplement() => guidance(
  version: 2,
  overrides: {
    'routeVersion': 1,
    'updateKind': 'supplement',
    'primaryGuidanceVersion': 1,
    'mode': 'rag-assisted',
    'supplementalExplanation': '검증된 보조 설명입니다.',
    'generatedAt': testTime.add(const Duration(milliseconds: 1)).toIso8601String(),
    'expiresAt': _expiresAt,
    'evidence': [
      {'documentId': 'EQ-001', 'documentVersion': '0.1.0', 'chunkId': 'EQ-001-step-1'},
    ],
  },
);
