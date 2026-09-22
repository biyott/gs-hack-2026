import '../features/safety_guidance/data/guidance_api_service.dart';

class TrackingClockSync {
  const TrackingClockSync({
    required this.clockOffsetMs,
    required this.clockUncertaintyMs,
    required this.clockSynchronizedAt,
  });

  final double clockOffsetMs, clockUncertaintyMs;
  final DateTime clockSynchronizedAt;

  static Future<TrackingClockSync> synchronize(
    GuidanceApiService api, {
    DateTime Function()? now,
    Duration Function()? monotonicNow,
  }) async {
    final stopwatch = Stopwatch()..start();
    final wallClock = now ?? DateTime.now;
    final elapsed = monotonicNow ?? () => stopwatch.elapsed;
    TrackingClockSync? best;
    try {
      for (var probe = 0; probe < 3; probe += 1) {
        final started = elapsed();
        final response = await api.request('GET', '/api/clock');
        final received = wallClock().toUtc();
        final roundTrip = elapsed() - started;
        final value = response['serverAt'];
        final serverAt = value is String ? DateTime.tryParse(value) : null;
        if (serverAt == null || !serverAt.isUtc) {
          throw const FormatException('Invalid server clock timestamp');
        }
        if (roundTrip.isNegative) {
          throw StateError('The monotonic clock moved backwards');
        }
        final candidate = TrackingClockSync(
          // Using receipt time keeps adjusted captures below server time.
          clockOffsetMs: serverAt.difference(received).inMicroseconds / 1000,
          clockUncertaintyMs: roundTrip.inMicroseconds / 1000,
          clockSynchronizedAt: received,
        );
        if (best == null ||
            candidate.clockUncertaintyMs < best.clockUncertaintyMs) {
          best = candidate;
        }
      }
      return best!;
    } finally {
      stopwatch.stop();
    }
  }

  DateTime adjustedCapturedAt(DateTime deviceCapturedAt) => deviceCapturedAt
      .toUtc()
      .add(Duration(microseconds: (clockOffsetMs * 1000).floor()));

  Map<String, Object?> captureMetadata(DateTime deviceCapturedAt) => {
    'deviceCapturedAt': deviceCapturedAt.toUtc().toIso8601String(),
    'offsetMs': clockOffsetMs,
    'uncertaintyMs': clockUncertaintyMs,
    'synchronizedAt': clockSynchronizedAt.toUtc().toIso8601String(),
  };
}
