import 'dart:async';

import 'package:flutter/services.dart';

/// The app owns one instance and one broadcast stream across role changes.
class NativeDeviceService {
  NativeDeviceService({MethodChannel? commands, EventChannel? events})
    : _commands = commands ?? const MethodChannel('gs_safety/native_device'),
      _eventChannel = events ?? const EventChannel('gs_safety/native_events');

  final MethodChannel _commands;
  final EventChannel _eventChannel;
  StreamSubscription<NativeDeviceEvent>? _subscription;
  late final _eventController = StreamController<NativeDeviceEvent>.broadcast(
    onListen: _listen,
  );
  bool _disposed = false;

  Stream<NativeDeviceEvent> get events => _eventController.stream;

  void _listen() {
    if (_disposed || _subscription != null) return;
    _subscription = _eventChannel
        .receiveBroadcastStream()
        .map(NativeDeviceEvent.fromPlatform)
        .listen(_eventController.add, onError: _eventController.addError);
  }

  Future<Map<String, Object?>> capabilities() => _map('capabilities');

  Future<Map<String, Object?>> requestPermissions(String role) =>
      _map('requestPermissions', {'role': role});

  Future<void> setScreenOn(bool enabled) =>
      _commands.invokeMethod<void>('setScreenOn', {'enabled': enabled});

  Future<Map<String, Object?>> prepareUwb(String role) =>
      _map('prepareUwb', {'role': role});

  Future<void> startUwb(NativeUwbSession session) =>
      _commands.invokeMethod<void>('startUwb', session.toPlatform());

  Future<void> stopUwb() => _commands.invokeMethod<void>('stopUwb');

  Future<bool> playWarningBeep({int durationMs = 160}) async =>
      await _commands.invokeMethod<bool>('playWarningBeep', {
        'durationMs': durationMs,
      }) ??
      false;

  Future<void> stopWarningBeep() =>
      _commands.invokeMethod<void>('stopWarningBeep');

  Future<NativeCameraPreview> startCctv(NativeCctvSession session) async =>
      NativeCameraPreview.fromPlatform(
        await _map('startCctv', session.toPlatform()),
      );

  Future<void> stopCctv() => _commands.invokeMethod<void>('stopCctv');

  Future<void> dispose() async {
    if (_disposed) return;
    _disposed = true;
    await _subscription?.cancel();
    await _eventController.close();
    await _commands.invokeMethod<void>('dispose');
  }

  Future<Map<String, Object?>> _map(
    String command, [
    Map<String, Object?>? arguments,
  ]) async =>
      platformMap(await _commands.invokeMethod<Object?>(command, arguments));
}

Map<String, Object?> platformMap(Object? value) {
  if (value is! Map<Object?, Object?>) {
    throw const FormatException('Native payload must be a map');
  }
  final result = <String, Object?>{};
  for (final entry in value.entries) {
    final key = entry.key;
    if (key is! String) {
      throw const FormatException('Native payload key must be a string');
    }
    result[key] = entry.value;
  }
  return Map.unmodifiable(result);
}

class NativeDeviceEvent {
  const NativeDeviceEvent(this.type, this.data);

  factory NativeDeviceEvent.fromPlatform(Object? value) {
    final data = platformMap(value);
    final type = data['type'];
    const kinds = {
      'uwbState',
      'uwbMeasurement',
      'cctvState',
      'cctvFrame',
      'capabilities',
      'lifecycle',
      'audioState',
    };
    if (type is! String || !kinds.contains(type)) {
      throw const FormatException('Unknown native event type');
    }
    if (type == 'uwbMeasurement') {
      for (final key in ['peerAddress', 'sessionEpoch']) {
        final identity = data[key];
        if (identity is! String || identity.isEmpty) {
          throw FormatException('Native UWB $key is required');
        }
      }
      final sequence = data['sequence'];
      if (sequence is! int || sequence < 0) {
        throw const FormatException('Native UWB sequence is required');
      }
      for (final key in ['distanceM', 'azimuthRad', 'elevationRad']) {
        final measurement = data[key];
        if (measurement != null &&
            (measurement is! num || !measurement.isFinite)) {
          throw FormatException('Invalid native $key');
        }
      }
    }
    return NativeDeviceEvent(type, data);
  }

  final String type;
  final Map<String, Object?> data;
}

class NativeUwbSession {
  const NativeUwbSession({
    required this.sessionEpoch,
    required this.sessionId,
    required this.configId,
    required this.sessionKeyHex,
    required this.peerAddresses,
    required this.channel,
    required this.preambleIndex,
    this.updateRateType = 1,
  });

  final String sessionEpoch;
  final int sessionId;
  final int configId;
  final String sessionKeyHex;
  final List<String> peerAddresses;
  final int channel;
  final int preambleIndex;
  final int updateRateType;

  Map<String, Object?> toPlatform() => {
    'sessionEpoch': sessionEpoch,
    'sessionId': sessionId,
    'configId': configId,
    'sessionKeyHex': sessionKeyHex,
    'peerAddresses': List<String>.of(peerAddresses),
    'channel': channel,
    'preambleIndex': preambleIndex,
    'updateRateType': updateRateType,
  };
}

class NativeCctvSession {
  const NativeCctvSession({
    required this.uploadUrl,
    required this.deviceId,
    required this.cameraId,
    required this.runId,
    required this.clockOffsetMs,
    required this.clockUncertaintyMs,
    required this.clockSynchronizedAt,
    this.clockBaselineResidualMs = 0,
    this.bearerToken,
    this.targetFps = 8,
  });

  final Uri uploadUrl;
  final String deviceId;
  final String cameraId;
  final String runId;
  final double clockOffsetMs;
  final double clockUncertaintyMs;
  final DateTime clockSynchronizedAt;
  final double clockBaselineResidualMs;
  final String? bearerToken;
  final int targetFps;

  Map<String, Object?> toPlatform() => {
    'uploadUrl': uploadUrl.toString(),
    'deviceId': deviceId,
    'cameraId': cameraId,
    'runId': runId,
    'clockOffsetMs': clockOffsetMs,
    'clockUncertaintyMs': clockUncertaintyMs,
    'clockSynchronizedAt': clockSynchronizedAt.toUtc().toIso8601String(),
    'clockBaselineResidualMs': clockBaselineResidualMs,
    'bearerToken': bearerToken,
    'targetFps': targetFps,
  };
}

class NativeCameraPreview {
  const NativeCameraPreview({
    required this.textureId,
    required this.width,
    required this.height,
    required this.rotationDegrees,
  });

  factory NativeCameraPreview.fromPlatform(Map<String, Object?> data) {
    final textureId = data['textureId'];
    final width = data['width'];
    final height = data['height'];
    final rotation = data['rotationDegrees'];
    if (textureId is! int ||
        width is! int ||
        height is! int ||
        rotation is! int) {
      throw const FormatException('Invalid native camera preview');
    }
    return NativeCameraPreview(
      textureId: textureId,
      width: width,
      height: height,
      rotationDegrees: rotation,
    );
  }

  final int textureId;
  final int width;
  final int height;
  final int rotationDegrees;
}
