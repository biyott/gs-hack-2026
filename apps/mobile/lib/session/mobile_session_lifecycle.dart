part of 'mobile_session_controller.dart';

extension MobileSessionLifecycle on MobileSessionController {
  Future<void> connect({
    required Uri server,
    required String deviceRole,
    required String mode,
    String? accessCode,
    String? actorId,
  }) async {
    final epoch = ++_epoch;
    await _closeSession();
    if (!_current(epoch)) return;
    connecting = true;
    _paused = false;
    _sessionError = _connectionError = _nativeError = null;
    this.deviceRole = deviceRole;
    this.mode = mode;
    _publish();
    try {
      final defaultActor = MobileSessionController.actorForRole(deviceRole);
      final actor = actorId ?? defaultActor;
      if (mode != 'equipment' && mode != 'fire-gas') {
        throw const FormatException('Unknown simulation mode');
      }
      workerId = switch (deviceRole) {
        'WORKER_1' => 'WORKER-A',
        'WORKER_2' => 'WORKER-B',
        _ => null,
      };
      final client = _apiFactory(server);
      api = client;
      await client.login(
        role: workerId == null ? 'device' : 'worker',
        actorId: actor,
        workerId: workerId,
        deviceRole: deviceRole,
        accessCode: accessCode,
      );
      if (!_current(epoch)) return;
      await refreshCapabilities();
      if (!_current(epoch)) return;
      await _nativeOperation(() async {
        permissions = await native.requestPermissions(deviceRole);
        capabilities = {...capabilities, ...permissions};
      });
      if (!_current(epoch)) return;
      _binding = SessionGuidanceBinding(
        api: client,
        speech: _speech,
        alert: _alert,
        vibration: _vibration,
        onChanged: _guidanceChanged,
      );
      _repository = GuidanceRepository(
        api: client,
        onSnapshot: (value) {
          if (_current(epoch) && !_paused) _accept(value);
        },
        onConnection: (live, failure) {
          if (_current(epoch)) _connection(live, failure);
        },
      );
      if (!_paused) {
        await _nativeOperation(() => native.setScreenOn(true));
        if (_current(epoch) && !_paused) await _repository?.start(mode);
      }
    } on Object catch (failure) {
      if (_current(epoch)) {
        _sessionError = failure.toString();
        await _closeSession();
      }
    } finally {
      if (_current(epoch)) {
        connecting = false;
        _publish();
      }
    }
  }

  Future<void> refreshCapabilities() async {
    await _nativeOperation(() async {
      capabilities = await native.capabilities();
      permissions = capabilities;
      _nativeError = null;
    });
    _publish();
  }

  void setPreview(NativeCameraPreview? value) {
    preview = value;
    _publish();
  }

  Future<void> pause() async {
    _paused = true;
    guidance?.suspend();
    await _repository?.stop();
    await _stopOutputs();
    _connection(false, null);
  }

  Future<void> resume() async {
    if (_disposed || !_paused || api?.token == null) return;
    final epoch = _epoch;
    final selectedMode = mode;
    if (selectedMode == null) return;
    _paused = false;
    await refreshCapabilities();
    if (!_current(epoch) || _paused) return;
    await _nativeOperation(() => native.setScreenOn(true));
    if (_current(epoch) && !_paused) await _repository?.start(selectedMode);
  }

  Future<void> logout() async {
    ++_epoch;
    _sessionError = _connectionError = null;
    await _closeSession();
    deviceRole = mode = workerId = null;
    connecting = false;
    _publish();
  }

  Future<void> _closeSession() async {
    final repository = _repository;
    final client = api;
    _repository = null;
    api = null;
    _binding?.dispose();
    _binding = null;
    _snapshot = null;
    connected = false;
    await repository?.dispose();
    await _stopOutputs();
    if (client != null) {
      try {
        if (client.token != null) await client.logout();
      } on Object catch (failure) {
        _sessionError ??= failure.toString();
      } finally {
        client.dispose();
      }
    }
    _updateMap();
  }

  Future<void> _stopOutputs() async {
    preview = null;
    await Future.wait(
      [
        _speech.stop,
        _alert.stop,
        _vibration.cancel,
        native.stopUwb,
        native.stopCctv,
        () => native.setScreenOn(false),
      ].map(_nativeOperation),
    );
  }

  Future<void> _nativeOperation(Future<void> Function() operation) async {
    try {
      await operation();
    } on Object catch (failure) {
      _nativeError = failure.toString();
    }
  }

  bool _current(int epoch) => !_disposed && epoch == _epoch;
}
