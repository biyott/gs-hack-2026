import 'dart:async';

import '../models/guidance_event.dart';
import '../models/guidance_state.dart';
import 'guidance_catalog.dart';
import 'guidance_ports.dart';

class GuidancePlayback {
  GuidancePlayback({required this.speech, required this.alert, required this.vibration});
  final SpeechPort speech;
  final AlertPort alert;
  final VibrationPort vibration;
  bool enabled = true;
  int _generation = 0;

  Future<void> cancel() async {
    _generation++;
    await Future.wait([_settle(speech.stop), _settle(alert.stop), _settle(vibration.cancel)]);
  }

  Future<void> play({
    required GuidanceEvent event,
    required GuidanceText text,
    required void Function(SpeechStatus) onSpeech,
    required void Function(VibrationStatus) onVibration,
    bool supplemental = false,
  }) async {
    if (!enabled) return;
    final stopped = cancel();
    final generation = _generation;
    bool current() => enabled && generation == _generation;
    await stopped;
    if (!current()) return;
    if (!supplemental) unawaited(_vibrate(event, current, onVibration));
    if (!event.profileSnapshot.notificationPreferences.voice) {
      onSpeech(SpeechStatus.disabled);
      return;
    }
    onSpeech(SpeechStatus.preparing);
    if (!current()) return;
    try {
      if (!supplemental) {
        await alert.play();
        if (!current()) return;
      }
      final available = await speech.isLanguageAvailable(text.locale);
      if (!current()) return;
      if (!available) {
        onSpeech(SpeechStatus.unsupported);
        return;
      }
      onSpeech(SpeechStatus.playing);
      if (!current()) return;
      await speech.speak(text.message, text.locale);
      if (current()) onSpeech(SpeechStatus.completed);
    } catch (_) {
      if (current()) onSpeech(SpeechStatus.failed);
    }
  }

  Future<void> _vibrate(
    GuidanceEvent event,
    bool Function() current,
    void Function(VibrationStatus) report,
  ) async {
    if (!event.profileSnapshot.notificationPreferences.vibration) {
      report(VibrationStatus.disabled);
      return;
    }
    try {
      final available = await vibration.isAvailable();
      if (!current()) return;
      if (!available) {
        report(VibrationStatus.unavailable);
        return;
      }
      await vibration.vibrate();
      if (current()) report(VibrationStatus.active);
    } catch (_) {
      if (current()) report(VibrationStatus.failed);
    }
  }

  Future<void> _settle(Future<void> Function() operation) async {
    try {
      await operation();
    } catch (_) {
      // Cancellation failures must not stop the independent outputs from clearing.
    }
  }
}
