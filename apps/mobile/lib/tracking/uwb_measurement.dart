import '../services/native_device_service.dart';
import 'tracking_clock.dart';

/// A radio observation; no map position is inferred on the phone.
class UwbMeasurement {
  const UwbMeasurement({
    required this.peerAddress,
    required this.workerId,
    required this.sessionEpoch,
    required this.sequence,
    required this.capturedAt,
    required this.distanceM,
    required this.azimuthRad,
    required this.elevationRad,
    required this.uncertaintyM,
  });

  factory UwbMeasurement.fromEvent(
    NativeDeviceEvent event, {
    required String? workerId,
  }) {
    final data = event.data;
    final address = data['peerAddress'];
    final epoch = data['sessionEpoch'];
    final sequence = data['sequence'];
    final captured = data['capturedAt'];
    if (event.type != 'uwbMeasurement' ||
        address is! String ||
        epoch is! String ||
        sequence is! int ||
        sequence < 0 ||
        captured is! String) {
      throw const FormatException('Invalid UWB observation identity');
    }
    final time = DateTime.tryParse(captured);
    if (time == null || !time.isUtc) {
      throw const FormatException('UWB capture time must include a UTC offset');
    }
    return UwbMeasurement(
      peerAddress: address.toUpperCase(),
      workerId: workerId,
      sessionEpoch: epoch,
      sequence: sequence,
      capturedAt: time,
      distanceM: _number(data, 'distanceM', 0, 100),
      azimuthRad: _number(
        data,
        'azimuthRad',
        -3.141592653589793,
        3.141592653589793,
      ),
      elevationRad: _number(
        data,
        'elevationRad',
        -1.5707963267948966,
        1.5707963267948966,
      ),
      uncertaintyM: _number(data, 'uncertaintyM', 0, double.infinity),
    );
  }

  final String peerAddress, sessionEpoch;
  final String? workerId;
  final int sequence;
  final DateTime capturedAt;
  final double? distanceM, azimuthRad, elevationRad, uncertaintyM;
  String get source => 'uwb';
  String get status => distanceM == null
      ? 'unavailable'
      : azimuthRad == null
      ? 'distance-only'
      : 'measured';

  Map<String, Object?> toUpload(
    String deviceId, {
    required TrackingClockSync clock,
    double clockResidualMs = 0,
  }) {
    final worker = workerId;
    if (worker != 'WORKER-A' && worker != 'WORKER-B') {
      throw const FormatException('The UWB peer has no worker mapping');
    }
    if (!clockResidualMs.isFinite) {
      throw const FormatException('The capture clock residual must be finite');
    }
    return {
      'deviceId': deviceId,
      'workerId': worker,
      'source': 'live',
      'capturedAt': clock.adjustedCapturedAt(capturedAt).toIso8601String(),
      'captureClock': {
        ...clock.captureMetadata(capturedAt),
        'uncertaintyMs': clock.clockUncertaintyMs + clockResidualMs.abs(),
      },
      'sequence': sequence,
      'sessionEpoch': sessionEpoch,
      'distanceM': distanceM,
      'azimuthRad': azimuthRad,
      'elevationRad': elevationRad,
      'uncertaintyM': uncertaintyM,
    };
  }

  static double? _number(
    Map<String, Object?> data,
    String key,
    double minimum,
    double maximum,
  ) {
    final value = data[key];
    if (value == null) return null;
    if (value is! num ||
        !value.isFinite ||
        value < minimum ||
        value > maximum) {
      throw FormatException('Invalid UWB $key');
    }
    return value.toDouble();
  }
}
