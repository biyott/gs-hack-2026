import 'dart:async';

import 'package:flutter/foundation.dart';

import '../services/native_device_service.dart';
import '../session/mobile_session_controller.dart';
import 'cctv_tracking_session.dart';
import 'tracking_state.dart';
import 'tracking_clock.dart';
import 'tracking_clock_monitor.dart';
import 'uwb_measurement.dart';
import 'uwb_tracking_session.dart';

export 'tracking_state.dart';
export 'uwb_measurement.dart';

class DeviceTrackingController extends ChangeNotifier {
  DeviceTrackingController({
    required this.session,
    TrackingClockMonitor? clockMonitor,
  }) : _clockMonitor = clockMonitor ?? TrackingClockMonitor();
  final MobileSessionController session;
  final TrackingClockMonitor _clockMonitor;
  final Map<String, UwbMeasurement> _measurements = {};
  StreamSubscription<NativeDeviceEvent>? _events;
  UwbTrackingSession? _uwb;
  CctvTrackingSession? _cctv;
  Timer? _freshness;
  Future<void> _transition = Future.value();
  TrackingState state = TrackingState.idle;
  String? error;
  List<String> waitingRoles = const [];
  Map<String, Object?> lastFrame = const {};
  DateTime? lastObservedAt;
  TrackingClockSync? clock;
  double? get clockUncertaintyMs => clock == null
      ? null
      : clock!.clockUncertaintyMs +
            _clockMonitor.residual.abs().inMicroseconds / 1000;
  bool _foreground = true, _disposed = false, _enabled = true;
  bool _initialized = false, _wasFresh = false;
  int? _lastClockUncertaintyMs;
  int _generation = 0;
  String? _identity;

  String get source => session.deviceRole == 'CCTV' ? 'camera-marker' : 'uwb';
  String get status => state.name;
  bool get isRunning => state == TrackingState.running;
  Map<String, UwbMeasurement> get latestMeasurements =>
      Map.unmodifiable(_measurements);
  bool get isFresh {
    final observed = lastObservedAt;
    if (observed == null || !_foreground || state != TrackingState.running) {
      return false;
    }
    final age = DateTime.now().toUtc().difference(observed).inMilliseconds;
    return age >= 0 && age <= 1000;
  }

  void initialize() {
    if (_initialized || _disposed) return;
    _initialized = true;
    session.addListener(_reconcile);
    _events = session.nativeEvents.listen(
      _event,
      onError: (Object _) {
        _status(
          TrackingState.failed,
          'The Android tracking event stream is unavailable.',
          const [],
        );
      },
    );
    _freshness = Timer.periodic(const Duration(milliseconds: 250), (_) {
      if (_checkClockDiscontinuity()) return;
      final fresh = isFresh;
      final uncertainty = clockUncertaintyMs?.ceil();
      if (fresh != _wasFresh || uncertainty != _lastClockUncertaintyMs) {
        _wasFresh = fresh;
        _lastClockUncertaintyMs = uncertainty;
        _publish();
      }
    });
    _reconcile();
  }

  bool _checkClockDiscontinuity() {
    if (!_foreground ||
        !session.foreground ||
        !_enabled ||
        _identity == null ||
        clock == null ||
        !_clockMonitor.hasDiscontinuity()) {
      return false;
    }
    _resynchronizeClock();
    return true;
  }

  void _resynchronizeClock() {
    _clockMonitor.reset();
    unawaited(_schedule());
    _status(
      TrackingState.preparing,
      'Device clock changed. Synchronizing tracking again.',
      const [],
    );
  }

  Map<String, Object?> get _run {
    final value = session.snapshot['run'];
    return value is Map<String, Object?> ? value : const {};
  }

  String? get _currentIdentity {
    if (!_foreground ||
        !session.foreground ||
        !session.connected ||
        session.api?.token == null ||
        session.deviceRole == null ||
        _run['runId'] is! String ||
        _run['status'] == 'paused' ||
        _run['status'] == 'completed') {
      return null;
    }
    if (session.snapshot['mode'] != session.mode) return null;
    return '${identityHashCode(session.api)}:${session.deviceRole}:${session.mode}:${_run['runId']}';
  }

  void _reconcile() {
    if (_disposed) return;
    final next = _currentIdentity;
    if (next == _identity) return;
    _identity = next;
    _enabled = true;
    unawaited(_schedule());
  }

  Future<void> start() {
    _enabled = true;
    _identity = _currentIdentity;
    return _schedule();
  }

  Future<void> stop() {
    _enabled = false;
    return _schedule();
  }

  Future<void> setForeground(bool foreground) {
    if (_disposed || foreground == _foreground) return _transition;
    _foreground = foreground;
    _identity = _currentIdentity;
    if (foreground) _enabled = true;
    return _schedule();
  }

  Future<void> _schedule() {
    final generation = ++_generation;
    final previous = _uwb;
    _uwb = null;
    previous?.dispose();
    _cctv?.dispose();
    _cctv = null;
    final stopping = _stopNative();
    _measurements.clear();
    lastObservedAt = null;
    clock = null;
    lastFrame = const {};
    _status(
      _foreground ? TrackingState.idle : TrackingState.suspended,
      null,
      const [],
    );
    _transition = _transition.then((_) async {
      await stopping;
      try {
        await previous?.invalidate();
      } on Object {
        if (_current(generation)) {
          _status(
            TrackingState.failed,
            'Could not clear the previous server UWB session. Reconnect all roles.',
            const [],
          );
        }
        return;
      }
      if (!_current(generation) || !_enabled || _identity == null) return;
      await _activate(generation);
    });
    return _transition;
  }

  Future<void> _activate(int generation) async {
    final api = session.api;
    final role = session.deviceRole;
    final runId = _run['runId'];
    if (api == null || role == null || runId is! String) return;
    final capabilities = {...session.capabilities, ...session.permissions};
    final capabilityError = trackingCapabilityError(capabilities, role);
    if (capabilityError != null) {
      _status(TrackingState.failed, capabilityError, const []);
      return;
    }
    _status(TrackingState.preparing, null, const []);
    _clockMonitor.reset();
    final TrackingClockSync synchronized;
    try {
      synchronized = await TrackingClockSync.synchronize(api);
    } on Object {
      if (_current(generation)) {
        _status(
          TrackingState.failed,
          'Device time could not be synchronized with the server. Retry the connection.',
          const [],
        );
      }
      return;
    }
    if (!_current(generation)) return;
    if (_clockMonitor.hasDiscontinuity()) {
      _status(
        TrackingState.failed,
        'Device clock changed during synchronization. Retry tracking.',
        const [],
      );
      return;
    }
    clock = synchronized;
    if (role != 'CCTV') {
      final uwb = UwbTrackingSession(
        native: session.native,
        api: api,
        role: role,
        deviceId: session.deviceId,
        clock: synchronized,
        clockResidualMs: () => _clockMonitor.residual.inMicroseconds / 1000,
        onStatus: (state, error, roles) {
          if (_current(generation)) _status(state, error, roles);
        },
        onMeasurement: (measurement) {
          if (!_current(generation)) return;
          _measurements[measurement.workerId ?? measurement.peerAddress] =
              measurement;
          lastObservedAt = measurement.capturedAt;
          _publish();
        },
      );
      _uwb = uwb;
      await uwb.start();
      return;
    }
    final cctv = CctvTrackingSession(
      native: session.native,
      api: api,
      deviceId: session.deviceId,
      runId: runId,
      clock: synchronized,
      clockReady: () => !_checkClockDiscontinuity(),
      clockResidualMs: () => _clockMonitor.residual.inMicroseconds / 1000,
      onPreview: (preview) {
        if (_current(generation)) session.setPreview(preview);
      },
      onStatus: (state, error, roles) {
        if (_current(generation)) _status(state, error, roles);
      },
      onFrame: (frame, captured) {
        if (!_current(generation)) return;
        lastFrame = frame;
        if (captured != null) lastObservedAt = captured;
      },
    );
    _cctv = cctv;
    await cctv.start();
  }

  void _event(NativeDeviceEvent event) {
    if (_disposed) return;
    if (event.type == 'lifecycle') {
      unawaited(setForeground(event.data['state'] == 'foreground'));
      return;
    }
    if (event.type == 'cctvState' &&
        event.data['errorCode'] == 'clock_changed' &&
        _cctv != null &&
        clock != null &&
        _foreground &&
        session.foreground) {
      _resynchronizeClock();
      return;
    }
    if (_checkClockDiscontinuity()) return;
    _uwb?.accept(event);
    _cctv?.accept(event);
  }

  Future<void> _stopNative() async {
    session.setPreview(null);
    final outcomes = await Future.wait([
      _stopOne(session.native.stopUwb),
      _stopOne(session.native.stopCctv),
    ]);
    if (outcomes.any((success) => !success) && !_disposed) {
      error = 'Android tracking cleanup did not complete. Reopen the role app.';
      _publish();
    }
  }

  Future<bool> _stopOne(Future<void> Function() operation) async {
    try {
      await operation();
      return true;
    } on Object {
      return false;
    }
  }

  bool _current(int generation) => !_disposed && generation == _generation;
  void _status(TrackingState next, String? failure, List<String> roles) {
    state = next;
    error = failure;
    waitingRoles = List.unmodifiable(roles);
    _publish();
  }

  void _publish() {
    if (!_disposed) notifyListeners();
  }

  @override
  void dispose() {
    if (_disposed) return;
    session.removeListener(_reconcile);
    _disposed = true;
    ++_generation;
    _freshness?.cancel();
    _clockMonitor.dispose();
    unawaited(_events?.cancel());
    final previous = _uwb;
    _uwb = null;
    previous?.dispose();
    _cctv?.dispose();
    _cctv = null;
    unawaited(
      _transition.then((_) async {
        try {
          await previous?.invalidate();
        } on Object {
          /* Session may already be closed. */
        }
      }),
    );
    unawaited(_stopNative());
    super.dispose();
  }
}
