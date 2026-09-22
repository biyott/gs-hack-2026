import 'dart:async';
import 'dart:math';

import 'package:flutter/foundation.dart';

import '../features/safety_guidance/application/guidance_coordinator.dart';
import '../features/safety_guidance/application/guidance_ports.dart';
import '../features/safety_guidance/data/guidance_api_service.dart';
import '../features/safety_guidance/data/guidance_repository.dart';
import '../features/safety_guidance/models/guidance_state.dart';
import '../features/safety_guidance/presentation/site_map_data.dart';
import '../features/safety_guidance/presentation/worker_view_data.dart';
import '../services/alert_sound_service.dart';
import '../services/native_device_service.dart';
import '../services/speech_service.dart';
import '../services/vibration_service.dart';
import 'session_guidance_binding.dart';
import 'session_map_adapter.dart';
import 'session_snapshot.dart';
import 'worker_screen_adapter.dart';

part 'mobile_session_lifecycle.dart';

class MobileSessionController extends ChangeNotifier {
  MobileSessionController({
    NativeDeviceService? native,
    SpeechPort? speech,
    AlertPort? alert,
    VibrationPort? vibration,
    GuidanceApiService Function(Uri)? apiFactory,
  }) : native = native ?? NativeDeviceService(),
       _speech = speech ?? SpeechService(),
       _vibration = vibration ?? VibrationService(),
       _apiFactory = apiFactory ?? GuidanceApiService.new {
    _alert = alert ?? AlertSoundService(this.native);
  }

  final NativeDeviceService native;
  final SpeechPort _speech;
  late final AlertPort _alert;
  final VibrationPort _vibration;
  final GuidanceApiService Function(Uri) _apiFactory;
  final String deviceId =
      'mobile-${List.generate(16, (_) => Random.secure().nextInt(256).toRadixString(16).padLeft(2, '0')).join()}';
  final ValueNotifier<SiteMapOverlay> mapOverlay = ValueNotifier(
    emptySessionMap,
  );
  GuidanceApiService? api;
  GuidanceRepository? _repository;
  SessionGuidanceBinding? _binding;
  SessionSnapshot? _snapshot;
  Map<String, Object?> capabilities = const {};
  Map<String, Object?> permissions = const {};
  NativeCameraPreview? preview;
  String? deviceRole, mode, workerId;
  String? _sessionError, _connectionError, _nativeError;
  bool connected = false, connecting = false;
  bool _disposed = false, _paused = false, _batching = false;
  int _epoch = 0;

  String? get error =>
      _sessionError ?? _binding?.error ?? _connectionError ?? _nativeError;
  Map<String, Object?> get snapshot => _snapshot?.raw ?? const {};
  GuidanceCoordinator? get guidance => _binding?.coordinator;
  Stream<NativeDeviceEvent> get nativeEvents => native.events;
  bool get foreground => !_paused && !_disposed;
  int get activeSubscriptions => _repository?.activeSubscriptions ?? 0;
  WorkerScreenData get workerData => workerScreenData(
    workerId: workerId,
    snapshot: _snapshot,
    state: guidance?.state ?? GuidanceState(),
    connected: connected,
    firstGuidance: _binding?.firstGuidance,
    error: error,
  );

  static String actorForRole(String role) => switch (role) {
    'WORKER_1' => 'worker-a',
    'WORKER_2' => 'worker-b',
    'EQUIPMENT' => 'equipment',
    'CCTV' => 'cctv',
    _ => throw const FormatException('Unknown device role'),
  };

  void _accept(Map<String, Object?> value) {
    final previous = _snapshot?.screenIdentity;
    final previousState = guidance?.state;
    _batching = true;
    try {
      _snapshot = SessionSnapshot(value, workerId);
      _sessionError = null;
      _binding?.accept(_snapshot!, connected);
    } on Object catch (failure) {
      _sessionError = failure.toString();
      guidance?.clearCurrent();
    } finally {
      _batching = false;
    }
    _updateMap();
    if (previous != _snapshot?.screenIdentity ||
        previousState != guidance?.state ||
        _sessionError != null) {
      _publish();
    }
  }

  void _connection(bool live, String? failure) {
    if (connected == live && _connectionError == failure) return;
    connected = live;
    _connectionError = failure;
    guidance?.setConnectionStatus(
      live ? GuidanceConnection.connected : GuidanceConnection.disconnected,
    );
    _updateMap();
    _publish();
  }

  void _guidanceChanged() {
    if (_batching || _disposed) return;
    _updateMap();
    _publish();
  }

  void _updateMap() {
    if (_disposed) return;
    try {
      mapOverlay.value = sessionMapOverlay(
        snapshot: _snapshot,
        state: guidance?.state ?? GuidanceState(),
        connected: connected,
      );
    } on Object catch (failure) {
      _sessionError = failure.toString();
      mapOverlay.value = emptySessionMap;
    }
  }

  void _publish() {
    if (!_disposed && !_batching) notifyListeners();
  }

  @override
  void dispose() {
    if (_disposed) return;
    _disposed = true;
    ++_epoch;
    unawaited(
      _closeSession().whenComplete(() => _nativeOperation(native.dispose)),
    );
    mapOverlay.dispose();
    super.dispose();
  }
}
