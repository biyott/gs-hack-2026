import 'package:flutter_test/flutter_test.dart';
import 'package:gs_safety_mobile/features/safety_guidance/models/guidance_state.dart';

import 'guidance_fixtures.dart';

void main() {
  late GuidanceRig rig;
  setUp(() => rig = GuidanceRig());
  tearDown(() => rig.dispose());

  test('disabled playback preserves new guidance and independent responses without outputs', () async {
    rig.coordinator.setPlaybackEnabled(false);
    expect(rig.coordinator.accept(guidance()), isNull);
    await settle();
    await rig.coordinator.markDisplayed(guidanceId: 'guidance-1', guidanceVersion: 1);
    await rig.coordinator.confirmUnderstanding();
    await rig.coordinator.replay();
    await rig.coordinator.replay(supplemental: true);
    expect(rig.coordinator.state.validity, GuidanceValidity.valid);
    expect(rig.coordinator.state.message, isNotEmpty);
    expect(rig.coordinator.state.route, isNotEmpty);
    expect(rig.ack.values.map((value) => value.response), ['received', 'displayed', 'understood']);
    expect(rig.alert.plays, 0);
    expect(rig.speech.texts, isEmpty);
    expect(rig.vibration.vibrations, 0);
  });

  test('enabling playback does not replay a silently accepted or duplicated primary', () async {
    final event = guidance();
    rig.coordinator.setPlaybackEnabled(false);
    rig.coordinator.accept(event);
    await settle();
    rig.coordinator.setPlaybackEnabled(true);
    expect(rig.coordinator.accept(event), GuidanceRejection.duplicate);
    await settle();
    expect(rig.speech.texts, isEmpty);
    expect(rig.alert.plays, 0);
    expect(rig.vibration.vibrations, 0);
    rig.coordinator.accept(guidance(version: 2));
    await settle();
    expect(rig.speech.texts, hasLength(1));
    expect(rig.alert.plays, 1);
    expect(rig.vibration.vibrations, 1);
  });

  test('disabling cancels active output once and ignores its late completion', () async {
    rig.coordinator.accept(guidance());
    await settle();
    rig.coordinator.setPlaybackEnabled(false);
    final stopped = rig.speech.stops;
    final cancelled = rig.vibration.cancellations;
    var notifications = 0;
    rig.coordinator.addListener(() => notifications++);
    rig.coordinator.setPlaybackEnabled(false);
    expect(rig.speech.stops, stopped);
    expect(rig.vibration.cancellations, cancelled);
    expect(notifications, 0);
    rig.speech.completions.single.complete();
    await settle();
    expect(rig.coordinator.state.playbackSpeech, SpeechStatus.cancelled);
    expect(rig.ack.values.where((value) => value.response == 'voice-completed'), isEmpty);
    expect(rig.coordinator.state.validity, GuidanceValidity.valid);
  });

  test('disabling during preparation cannot start an alert afterward', () async {
    rig.coordinator.addListener(() {
      if (rig.coordinator.state.speech == SpeechStatus.preparing) {
        rig.coordinator.setPlaybackEnabled(false);
      }
    });
    rig.coordinator.accept(guidance());
    await settle();
    expect(rig.alert.plays, 0);
    expect(rig.speech.texts, isEmpty);
    expect(rig.coordinator.state.playbackSpeech, SpeechStatus.cancelled);
  });

  test('disabling during the playing notification cannot start speech afterward', () async {
    rig.coordinator.addListener(() {
      if (rig.coordinator.state.speech == SpeechStatus.playing) {
        rig.coordinator.setPlaybackEnabled(false);
      }
    });
    rig.coordinator.accept(guidance());
    await settle();
    expect(rig.speech.texts, isEmpty);
    expect(rig.coordinator.state.playbackSpeech, SpeechStatus.cancelled);
    expect(rig.ack.values.where((value) => value.response == 'voice-started'), isEmpty);
  });
}
