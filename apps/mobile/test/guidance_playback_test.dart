import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
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

  test('publishes screen immediately without waiting for HTTP or alert', () async {
    rig.ack.pending = Completer<void>();
    rig.alert.pending = Completer<void>();
    rig.coordinator.accept(guidance());
    expect(rig.coordinator.state.current?.guidanceVersion, 1);
    expect(rig.coordinator.state.message, '화면의 검증된 경로를 따라 이동하세요.');
    await settle();
    expect(rig.speech.texts, isEmpty);
    expect(rig.vibration.vibrations, 1);
    rig.alert.pending?.complete();
    await settle();
    expect(rig.speech.texts.single, rig.coordinator.state.message);
    expect(rig.ack.values.map((ack) => ack.response), contains('voice-started'));
    rig.ack.pending?.complete();
  });

  test('old completion cannot mutate new instruction or acknowledge completion', () async {
    rig.coordinator.accept(guidance());
    await settle();
    final old = rig.speech.completions.single;
    final stops = rig.speech.stops;
    rig.coordinator.accept(guidance(version: 2));
    expect(rig.speech.stops, greaterThan(stops));
    await settle();
    old.complete();
    await settle();
    expect(rig.coordinator.state.current?.guidanceVersion, 2);
    expect(rig.coordinator.state.speech, SpeechStatus.playing);
    expect(rig.ack.values.where((ack) => ack.response == 'voice-completed'), isEmpty);
    rig.speech.completions.last.complete();
    await settle();
    expect(rig.coordinator.state.speech, SpeechStatus.completed);
    expect(rig.ack.values.where((ack) => ack.response == 'voice-completed').single.guidanceVersion, 2);
  });

  test('late alert completion never starts replaced speech', () async {
    final oldAlert = Completer<void>();
    rig.alert.pending = oldAlert;
    rig.coordinator.accept(guidance());
    await settle();
    rig.alert.pending = null;
    rig.coordinator.accept(guidance(version: 2));
    await settle();
    oldAlert.complete();
    await settle();
    expect(rig.speech.texts, hasLength(1));
    expect(rig.coordinator.state.current?.guidanceVersion, 2);
  });

  test('RAG update keeps urgent speech running and does not replay it', () async {
    rig.coordinator.accept(guidance());
    await settle();
    final stops = rig.speech.stops;
    rig.coordinator.accept(
      guidance(
        version: 2,
        overrides: {
          'routeVersion': 1,
          'mode': 'rag-assisted',
          'updateKind': 'supplement',
          'primaryGuidanceVersion': 1,
          'generatedAt': testTime.add(const Duration(milliseconds: 1)).toIso8601String(),
          'supplementalExplanation': '검증된 절차에 대한 보조 설명입니다.',
          'evidence': [
            {'documentId': 'EQ-001', 'documentVersion': '0.1.0', 'chunkId': 'EQ-001-step-1'},
          ],
        },
      ),
    );
    await settle();
    expect(rig.speech.stops, stops);
    expect(rig.speech.texts, hasLength(1));
    expect(rig.coordinator.state.playbackGuidanceVersion, 1);
    expect(rig.coordinator.state.playbackSpeech, SpeechStatus.playing);
    await rig.coordinator.replay(supplemental: true);
    expect(rig.speech.texts, hasLength(1));
    rig.speech.completions.first.complete();
    await settle();
    expect(rig.coordinator.state.playbackSpeech, SpeechStatus.completed);
    expect(rig.coordinator.state.speech, SpeechStatus.idle);
    expect(rig.ack.values.where((ack) => ack.response == 'voice-completed').single.guidanceVersion, 1);
    unawaited(rig.coordinator.replay(supplemental: true));
    await settle();
    expect(rig.speech.texts.last, '검증된 절차에 대한 보조 설명입니다.');
    expect(rig.alert.plays, 1);
  });

  test('voice failure preserves display and vibration', () async {
    rig.speech.fails = true;
    rig.coordinator.accept(guidance());
    await settle();
    expect(rig.coordinator.state.speech, SpeechStatus.failed);
    expect(rig.coordinator.state.message, isNotEmpty);
    expect(rig.vibration.vibrations, 1);
    expect(rig.ack.values.map((ack) => ack.response), contains('voice-failed'));
  });

  test('unsupported voice is separately recorded', () async {
    rig.speech.available = false;
    rig.coordinator.accept(guidance());
    await settle();
    expect(rig.coordinator.state.speech, SpeechStatus.unsupported);
    expect(rig.coordinator.state.message, isNotEmpty);
    expect(rig.ack.values.map((ack) => ack.response), contains('voice-unsupported'));
  });

  test('unknown language falls back to identical English screen and TTS', () async {
    rig.coordinator.accept(
      guidance(
        overrides: {
          'requestedLocale': 'de',
          'profileSnapshot': profileJson(overrides: {'preferredLocale': 'de'}),
        },
      ),
    );
    await settle();
    expect(rig.coordinator.state.locale, 'en');
    expect(rig.coordinator.state.usedLocaleFallback, isTrue);
    expect(rig.speech.locales.single, 'en');
    expect(rig.speech.texts.single, rig.coordinator.state.message);
    expect(rig.speech.texts.single, startsWith('Follow'));
  });

  test('regional Korean locale remains supported', () async {
    rig.coordinator.accept(guidance(overrides: {'requestedLocale': 'ko_KR'}));
    await settle();
    expect(rig.coordinator.state.usedLocaleFallback, isFalse);
    expect(rig.speech.locales.single, 'ko');
  });

  test('disabled notification preferences do not run modalities', () async {
    rig.coordinator.accept(
      guidance(
        overrides: {
          'profileSnapshot': profileJson(
            overrides: {
              'notificationPreferences': {'voice': false, 'vibration': false},
            },
          ),
        },
      ),
    );
    await settle();
    expect(rig.speech.texts, isEmpty);
    expect(rig.alert.plays, 0);
    expect(rig.vibration.vibrations, 0);
    expect(rig.coordinator.state.speech, SpeechStatus.disabled);
  });

  test('disconnect hides route and cancels output without resetting dedupe', () async {
    final event = guidance();
    rig.coordinator.accept(event);
    await settle();
    rig.coordinator.setConnectionStatus(GuidanceConnection.disconnected);
    expect(rig.coordinator.state.route, isEmpty);
    expect(rig.coordinator.state.playbackSpeech, SpeechStatus.cancelled);
    rig.coordinator.setConnectionStatus(GuidanceConnection.connected);
    expect(rig.coordinator.accept(event), GuidanceRejection.duplicate);
    await settle();
    expect(rig.speech.texts, hasLength(1));
  });
}
