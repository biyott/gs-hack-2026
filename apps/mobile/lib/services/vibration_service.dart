import 'package:vibration/vibration.dart';
import '../features/safety_guidance/application/guidance_ports.dart';

class VibrationService implements VibrationPort {
  @override
  Future<bool> isAvailable() => Vibration.hasVibrator();
  @override
  Future<void> vibrate() => Vibration.vibrate(duration: 350);
  @override
  Future<void> cancel() => Vibration.cancel();
}
