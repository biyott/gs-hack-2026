import '../features/safety_guidance/application/guidance_ports.dart';
import 'native_device_service.dart';

class AlertSoundService implements AlertPort {
  AlertSoundService(this.native);
  final NativeDeviceService native;
  bool available = true;
  int _generation = 0;

  @override
  Future<void> play() async {
    final generation = ++_generation;
    try {
      final result = await native.playWarningBeep();
      if (generation == _generation) available = result;
    } on Object {
      if (generation == _generation) available = false;
    }
  }

  @override
  Future<void> stop() {
    _generation++;
    return native.stopWarningBeep();
  }
}
