import 'package:flutter_tts/flutter_tts.dart';

import '../features/safety_guidance/application/guidance_ports.dart';

class SpeechService implements SpeechPort {
  final FlutterTts _tts = FlutterTts();
  int _generation = 0;

  String _tag(String locale) => locale == 'ko' ? 'ko-KR' : 'en-US';

  @override
  Future<bool> isLanguageAvailable(String locale) async {
    final generation = _generation;
    final available = await _tts.isLanguageAvailable(_tag(locale));
    if (generation != _generation || available != true) return false;
    await _tts.awaitSpeakCompletion(true);
    if (generation != _generation) return false;
    await _tts.setQueueMode(0);
    if (generation != _generation) return false;
    final language = await _tts.setLanguage(_tag(locale));
    return generation == _generation && language != 0;
  }

  @override
  Future<void> speak(String text, String locale) async {
    final generation = _generation;
    final result = await _tts.speak(text);
    if (generation == _generation && result == 0) {
      throw StateError('Speech engine could not start');
    }
  }

  @override
  Future<void> stop() async {
    _generation++;
    await _tts.stop();
  }
}
