import '../features/safety_guidance/data/guidance_api_service.dart';
import '../services/native_device_service.dart';
import 'tracking_state.dart';
import 'tracking_clock.dart';

class CctvTrackingSession {
  CctvTrackingSession({
    required this.native,
    required this.api,
    required this.deviceId,
    required this.runId,
    required this.clock,
    required this.onStatus,
    required this.onPreview,
    required this.onFrame,
    this.clockReady,
    this.clockResidualMs,
  });

  final NativeDeviceService native;
  final GuidanceApiService api;
  final String deviceId, runId;
  final TrackingClockSync clock;
  final TrackingStatusChanged onStatus;
  final void Function(NativeCameraPreview?) onPreview;
  final void Function(Map<String, Object?>, DateTime?) onFrame;
  final bool Function()? clockReady;
  final double Function()? clockResidualMs;
  bool _disposed = false;

  Future<void> start() async {
    onStatus(TrackingState.starting, null, const []);
    if (_disposed || !(clockReady?.call() ?? true)) return;
    try {
      final preview = await native.startCctv(
        NativeCctvSession(
          uploadUrl: api.uri('/api/tracking/frame'),
          deviceId: deviceId,
          cameraId: 'CCTV-01',
          runId: runId,
          bearerToken: api.token,
          targetFps: 8,
          clockOffsetMs: clock.clockOffsetMs,
          clockUncertaintyMs: clock.clockUncertaintyMs,
          clockBaselineResidualMs: clockResidualMs?.call() ?? 0,
          clockSynchronizedAt: clock.clockSynchronizedAt,
        ),
      );
      if (_disposed) return;
      onPreview(preview);
      onStatus(TrackingState.running, null, const []);
    } on Object {
      if (!_disposed) {
        onStatus(
          TrackingState.failed,
          'Camera startup failed. Check camera permission and keep the app visible.',
          const [],
        );
      }
    }
  }

  void accept(NativeDeviceEvent event) {
    if (_disposed) return;
    final data = event.data;
    if (event.type == 'cctvFrame') {
      if (data['runId'] != runId || data['deviceId'] != deviceId) return;
      if (data['state'] == 'uploaded') {
        final captureClock = data['captureClock'];
        final captured = captureClock is Map<Object?, Object?>
            ? captureClock['deviceCapturedAt']
            : data['capturedAt'];
        onFrame(
          Map.unmodifiable(data),
          captured is String ? DateTime.tryParse(captured) : null,
        );
        onStatus(TrackingState.running, null, const []);
      } else {
        onFrame(Map.unmodifiable(data), null);
        onStatus(
          TrackingState.running,
          'Camera frame upload failed. Check the server connection.',
          const [],
        );
      }
    } else if (event.type == 'cctvState' && data['state'] == 'error') {
      onPreview(null);
      onStatus(
        TrackingState.failed,
        'Camera capture stopped. Retry while this app is visible.',
        const [],
      );
    }
  }

  void dispose() {
    _disposed = true;
  }
}
