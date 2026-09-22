class TrackingClockMonitor {
  TrackingClockMonitor({
    DateTime Function()? now,
    Duration Function()? monotonicNow,
    this.threshold = const Duration(milliseconds: 50),
  }) : _now = now ?? DateTime.now {
    if (threshold.isNegative) {
      throw ArgumentError.value(threshold, 'threshold', 'Must be nonnegative');
    }
    if (monotonicNow == null) _stopwatch.start();
    _monotonicNow = monotonicNow ?? () => _stopwatch.elapsed;
    reset();
  }

  final Duration threshold;
  final DateTime Function() _now;
  final Stopwatch _stopwatch = Stopwatch();
  late final Duration Function() _monotonicNow;
  late DateTime _wallBaseline;
  late Duration _monotonicBaseline;

  Duration get residual {
    final wallElapsed = _now().toUtc().difference(_wallBaseline);
    final monotonicElapsed = _monotonicNow() - _monotonicBaseline;
    return wallElapsed - monotonicElapsed;
  }

  bool hasDiscontinuity() => residual.abs() > threshold;

  void reset() {
    _wallBaseline = _now().toUtc();
    _monotonicBaseline = _monotonicNow();
  }

  void dispose() => _stopwatch.stop();
}
