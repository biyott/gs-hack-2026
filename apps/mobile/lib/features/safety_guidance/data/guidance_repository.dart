import 'dart:async';
import 'dart:io';

import '../models/json_read.dart';
import 'guidance_api_service.dart';
import 'guidance_sse_service.dart';

typedef SnapshotListener = void Function(Map<String, Object?> snapshot);

/// Application-scoped latest-state subscription; no event replay or audio here.
class GuidanceRepository {
  GuidanceRepository({required this.api, required this.onSnapshot, required this.onConnection});
  final GuidanceApiService api;
  final SnapshotListener onSnapshot;
  final void Function(bool connected, String? error) onConnection;
  GuidanceSseService? _sse;
  StreamSubscription<Map<String, Object?>>? _subscription;
  Timer? _retry;
  int _epoch = 0;
  int _connection = 0;
  int _attempt = 0;
  String? _mode;
  String? _streamId;
  int _sequence = -1;
  final Set<String> _retiredStreams = {};
  bool _disposed = false;
  int get activeSubscriptions => _subscription == null ? 0 : 1;

  Future<void> start(String mode) async {
    final stopping = stop();
    final epoch = _epoch;
    await stopping;
    if (_disposed || epoch != _epoch) return;
    if (_mode != mode) {
      _streamId = null;
      _sequence = -1;
      _retiredStreams.clear();
    }
    _mode = mode;
    await _connect(epoch);
  }

  Future<void> _connect(int epoch) async {
    if (epoch != _epoch || _disposed) return;
    final connection = ++_connection;
    onConnection(false, null);
    try {
      final mode = _mode;
      final token = api.token;
      if (mode == null || token == null) return;
      final snapshot = await api.request('GET', '/api/simulation', query: {'mode': mode});
      if (!_owns(epoch, connection)) return;
      _accept(snapshot);
      if (!_owns(epoch, connection)) return;
      _sse = GuidanceSseService();
      var bootstrap = true;
      _subscription = _sse!
          .snapshots(api.uri('/api/events', {'mode': mode}), token)
          .listen(
            (data) {
              if (!_owns(epoch, connection)) return;
              try {
                _accept(data, bootstrap: bootstrap);
                if (!_owns(epoch, connection)) return;
                bootstrap = false;
                _attempt = 0;
                onConnection(true, null);
              } on Object catch (error) {
                _lost(epoch, connection, error);
              }
            },
            onError: (Object error) => _lost(epoch, connection, error),
            onDone: () => _lost(epoch, connection, const ApiFailure('Live connection ended')),
            cancelOnError: true,
          );
    } on Object catch (error) {
      _lost(epoch, connection, error);
    }
  }

  void _accept(Map<String, Object?> snapshot, {bool bootstrap = false}) {
    if (snapshot['contractVersion'] != '1.0.0' || snapshot['mode'] != _mode) {
      throw const FormatException('Unsupported snapshot contract or mode');
    }
    final read = JsonRead(snapshot);
    final streamId = read.string('streamId', nonEmpty: true);
    final sequence = read.integer('sequence');
    final run = JsonRead(read.object('run'));
    run.string('runId', nonEmpty: true);
    run.dateTime('updatedAt');
    if (sequence < 0 || streamId == 'legacy' || run.integer('version') < 0) {
      throw const FormatException('Invalid snapshot publication metadata');
    }
    if (streamId == _streamId && sequence <= _sequence) return;
    if (streamId != _streamId && (!bootstrap || _retiredStreams.contains(streamId))) return;
    onSnapshot(snapshot);
    final previous = _streamId;
    if (previous != null && previous != streamId) _retiredStreams.add(previous);
    _streamId = streamId;
    _sequence = sequence;
  }

  bool _owns(int epoch, int connection) => !_disposed && epoch == _epoch && connection == _connection;

  void _lost(int epoch, int connection, Object error) {
    if (!_owns(epoch, connection) || _retry != null) return;
    _connection++;
    _sse?.close();
    _sse = null;
    unawaited(_cancelClosed(_subscription));
    _subscription = null;
    onConnection(false, error.toString());
    _attempt = (_attempt + 1).clamp(1, 4);
    _retry = Timer(Duration(seconds: 1 << (_attempt - 1)), () {
      _retry = null;
      unawaited(_connect(epoch));
    });
  }

  Future<void> stop() async {
    _epoch++;
    _retry?.cancel();
    _retry = null;
    final sse = _sse;
    final subscription = _subscription;
    _sse = null;
    _subscription = null;
    sse?.close();
    await _cancelClosed(subscription);
    onConnection(false, null);
  }

  Future<void> resume() async {
    final mode = _mode;
    if (mode != null) await start(mode);
  }

  Future<void> _cancelClosed(StreamSubscription<Map<String, Object?>>? value) async {
    try {
      await value?.cancel();
    } on HttpException {
      // Force-closing the owned HTTP client can complete cancellation with this error.
    } on SocketException {
      // A socket already closed by the lifecycle has no remaining subscription.
    }
  }

  Future<void> dispose() async {
    _disposed = true;
    await stop();
  }
}
