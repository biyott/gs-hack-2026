import 'dart:async';

import 'package:flutter/services.dart';

import '../features/safety_guidance/data/guidance_api_service.dart';
import '../services/native_device_service.dart';
import 'tracking_state.dart';
import 'tracking_clock.dart';
import 'uwb_measurement.dart';
import 'uwb_pairing.dart';

class UwbTrackingSession {
  UwbTrackingSession({
    required this.native,
    required this.api,
    required this.role,
    required this.deviceId,
    required this.clock,
    this.clockResidualMs,
    required this.onStatus,
    required this.onMeasurement,
    this.pollInterval = const Duration(seconds: 1),
  });

  final NativeDeviceService native;
  final GuidanceApiService api;
  final String role, deviceId;
  final TrackingClockSync clock;
  final double Function()? clockResidualMs;
  final TrackingStatusChanged onStatus;
  final void Function(UwbMeasurement) onMeasurement;
  final Duration pollInterval;
  final Map<String, Map<String, Object?>> _pending = {};
  final Map<String, int> _sequences = {};
  Timer? _poll;
  UwbReady? _ready;
  int? _nativeGeneration;
  bool _disposed = false, _uploading = false, _registered = false;
  final Set<String> _initialized = {};
  String? get sessionEpoch => _ready?.session.sessionEpoch;
  TrackingState get _rangingState =>
      _initialized.length == _ready?.session.peerAddresses.length
      ? TrackingState.running
      : TrackingState.starting;

  Future<void> start() async {
    onStatus(TrackingState.preparing, null, const []);
    try {
      final prepared = await native.prepareUwb(role);
      if (_disposed) return;
      final generation = prepared['generation'];
      if (prepared['role'] != role || generation is! int) {
        throw const FormatException(
          'Native UWB role preparation did not match',
        );
      }
      _nativeGeneration = generation;
      _registered = true;
      await api.request(
        'POST',
        '/api/uwb/prepare',
        body: {...prepared, 'deviceId': deviceId},
      );
      if (!_disposed) await _configure();
    } on Object catch (failure) {
      _fail(failure);
    }
  }

  Future<void> _configure() async {
    try {
      final response = await api.request('GET', '/api/uwb/config');
      if (_disposed) return;
      final pairing = UwbPairing.fromJson(response, role);
      switch (pairing) {
        case UwbWaiting(:final roles):
          onStatus(TrackingState.waiting, null, roles);
          _poll = Timer(pollInterval, () => unawaited(_configure()));
        case UwbUnsupported(:final reason):
          onStatus(TrackingState.failed, reason, const []);
        case UwbReady():
          _ready = pairing;
          onStatus(TrackingState.starting, null, const []);
          await native.startUwb(pairing.session);
      }
    } on Object catch (failure) {
      _fail(failure);
    }
  }

  void accept(NativeDeviceEvent event) {
    if (_disposed) return;
    final ready = _ready;
    final data = event.data;
    if (event.type == 'uwbState' &&
        data['state'] == 'unavailable' &&
        data['generation'] == null) {
      _fail(const FormatException('UWB availability was lost'));
      return;
    }
    if (data['generation'] != _nativeGeneration) return;
    if (ready != null && data['sessionEpoch'] != ready.session.sessionEpoch) {
      return;
    }
    if (event.type == 'uwbState') {
      if (data['state'] == 'failed' ||
          data['state'] == 'unavailable' ||
          data['state'] == 'stopped') {
        _poll?.cancel();
        _ready = null;
        _pending.clear();
        onStatus(
          TrackingState.failed,
          'UWB ranging stopped. Check UWB availability and retry.',
          const [],
        );
      } else if (data['state'] == 'initialized' && ready != null) {
        final peer = data['peerAddress'];
        if (peer is String &&
            ready.session.peerAddresses.contains(peer.toUpperCase())) {
          _initialized.add(peer.toUpperCase());
          if (_initialized.length == ready.session.peerAddresses.length) {
            onStatus(TrackingState.running, null, const []);
          }
        }
      } else if (data['state'] == 'disconnected') {
        _ready = null;
        _pending.clear();
        onStatus(
          TrackingState.failed,
          'A UWB peer disconnected. Reconnect all three role phones.',
          const [],
        );
      }
      return;
    }
    if (event.type != 'uwbMeasurement' ||
        ready == null ||
        data['sessionEpoch'] != ready.session.sessionEpoch) {
      return;
    }
    final address = data['peerAddress'];
    if (address is! String) return;
    final peer = address.toUpperCase();
    if (!ready.session.peerAddresses.contains(peer)) return;
    try {
      final measurement = UwbMeasurement.fromEvent(
        event,
        workerId: ready.peerWorkers[peer],
      );
      final previousSequence = _sequences[peer];
      if (previousSequence != null &&
          measurement.sequence <= previousSequence) {
        return;
      }
      _sequences[peer] = measurement.sequence;
      _initialized.add(peer);
      if (_initialized.length == ready.session.peerAddresses.length) {
        onStatus(TrackingState.running, null, const []);
      }
      onMeasurement(measurement);
      if (role != 'EQUIPMENT') return;
      _pending[peer] = measurement.toUpload(
        deviceId,
        clock: clock,
        clockResidualMs: clockResidualMs?.call() ?? 0,
      );
      if (!_uploading) unawaited(_upload());
    } on FormatException {
      onStatus(
        _rangingState,
        'A malformed native UWB observation was rejected.',
        const [],
      );
    }
  }

  Future<void> _upload() async {
    _uploading = true;
    try {
      while (!_disposed && _ready != null && _pending.isNotEmpty) {
        final peer = _pending.keys.first;
        final observation = _pending.remove(peer)!;
        try {
          await api.request('POST', '/api/tracking/uwb', body: observation);
          if (!_disposed && _ready != null) {
            onStatus(_rangingState, null, const []);
          }
        } on Object {
          if (!_disposed && _ready != null) {
            onStatus(
              _rangingState,
              'UWB upload failed. Check the server connection.',
              const [],
            );
          }
        }
      }
    } finally {
      _uploading = false;
    }
  }

  void _fail(Object failure) {
    if (_disposed) return;
    _poll?.cancel();
    _ready = null;
    _pending.clear();
    final message = switch (failure) {
      PlatformException(code: 'permission_denied') =>
        'UWB permission is required. Grant it in Android settings.',
      PlatformException(code: 'uwb_unsupported') =>
        'This device has no available Android UWB hardware.',
      PlatformException(code: 'uwb_disabled') =>
        'Enable UWB and leave airplane mode before retrying.',
      PlatformException(code: 'foreground_required') =>
        'Keep the role app visible and unlocked.',
      FormatException() =>
        'The UWB configuration is invalid. Reconnect all three role phones.',
      _ =>
        'UWB setup failed. Check permissions, the server connection, and all three roles.',
    };
    onStatus(TrackingState.failed, message, const []);
  }

  Future<void> invalidate() async {
    dispose();
    final generation = _nativeGeneration;
    if (!_registered || generation == null) return;
    _registered = false;
    await api.request(
      'DELETE',
      '/api/uwb/prepare',
      query: {'generation': generation.toString()},
    );
  }

  void dispose() {
    _disposed = true;
    _poll?.cancel();
    _ready = null;
    _pending.clear();
    _sequences.clear();
  }
}
