class AppLifecycleCoordinator {
  AppLifecycleCoordinator({
    required this.setTrackingForeground,
    required this.pauseSession,
    required this.resumeSession,
    required this.stopTracking,
    required this.logoutSession,
  });

  final Future<void> Function(bool) setTrackingForeground;
  final Future<void> Function() pauseSession,
      resumeSession,
      stopTracking,
      logoutSession;
  Future<void> _settling = Future.value();
  Future<void> _resuming = Future.value();
  bool _foreground = true, _disposed = false;
  int _generation = 0;

  Future<void> pause() {
    if (_disposed || !_foreground) return _settling;
    _foreground = false;
    ++_generation;
    final tracking = setTrackingForeground(false);
    final session = pauseSession();
    return _settling = Future.wait([_settling, tracking, session]).then((_) {});
  }

  Future<void> resume() {
    if (_disposed || _foreground) return _resuming;
    _foreground = true;
    return _resuming = _resume(++_generation);
  }

  Future<void> _resume(int generation) async {
    await _settling;
    if (!_current(generation)) return;
    await resumeSession();
    if (_current(generation)) await setTrackingForeground(true);
  }

  Future<void> logout() {
    if (_disposed) return _settling;
    ++_generation;
    final tracking = stopTracking();
    final session = pauseSession();
    return _settling = Future.wait([
      _settling,
      tracking,
      session,
    ]).then((_) => logoutSession());
  }

  bool _current(int generation) =>
      !_disposed && generation == _generation && _foreground;

  void dispose() {
    _disposed = true;
    ++_generation;
  }
}
