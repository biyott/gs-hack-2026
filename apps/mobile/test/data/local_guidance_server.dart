import 'dart:async';
import 'dart:convert';
import 'dart:io';

Map<String, Object?> simulationSnapshot(int version, {String mode = 'equipment'}) => {
  'contractVersion': '1.0.0',
  'streamId': '00000000-0000-4000-8000-000000000001',
  'sequence': version,
  'mode': mode,
  'run': {
    'runId': 'run-1',
    'scenarioId': 'test-scenario',
    'status': 'running',
    'virtualTimeMs': version * 1000,
    'speed': 1,
    'seed': 123,
    'version': version,
    'mapId': 'map-1',
    'mapVersion': '1.0',
    'startedAt': '2030-01-02T03:04:00.000Z',
    'updatedAt': DateTime.utc(2030, 1, 2, 3, 4, version).toIso8601String(),
  },
  'workers': <Object?>[],
  'hazards': <Object?>[],
  'closedEdgeIds': <Object?>[],
  'incidents': <Object?>[],
  'events': <Object?>[],
  'cctv': <Object?>[],
  'equipment': {
    'id': 'EQUIPMENT-A',
    'presetId': 'crane-1',
    'position': {'x': 0, 'y': 0},
    'headingDeg': 0,
    'speedMps': 0,
    'slewDeg': 0,
    'boomAngleDeg': 0,
    'boomLengthM': null,
    'trolleyM': null,
    'hookHeightM': null,
    'geometryVersion': 1,
    'positionSource': 'mock',
    'tableLinked': false,
  },
};

Map<String, Object?> sequencedSnapshot(int sequence, {String streamId = 'stream-a'}) => {
  ...simulationSnapshot(7),
  'streamId': streamId,
  'sequence': sequence,
};

class LocalGuidanceServer {
  LocalGuidanceServer._(this._server) {
    _requests = _server.listen((request) => unawaited(_handle(request)));
  }

  static Future<LocalGuidanceServer> start() async =>
      LocalGuidanceServer._(await HttpServer.bind(InternetAddress.loopbackIPv4, 0));

  final HttpServer _server;
  late final StreamSubscription<HttpRequest> _requests;
  Map<String, Object?> snapshot = simulationSnapshot(1);
  Completer<void>? snapshotGate;
  Completer<void>? streamGate;
  int snapshotRequests = 0;
  int eventRequests = 0;
  bool sendInitialSnapshot = true;
  final List<String?> authorization = [];
  final List<ServerEventStream> streams = [];
  Uri get baseUrl => Uri.parse('http://127.0.0.1:${_server.port}');
  int get openStreams => streams.where((stream) => !stream.closed).length;

  Future<void> _handle(HttpRequest request) async {
    authorization.add(request.headers.value(HttpHeaders.authorizationHeader));
    try {
      switch (request.uri.path) {
        case '/api/simulation':
          snapshotRequests++;
          final responseSnapshot = snapshot;
          await snapshotGate?.future;
          request.response.headers.contentType = ContentType.json;
          request.response.write(jsonEncode(responseSnapshot));
          await request.response.close();
        case '/api/events':
          eventRequests++;
          final stream = ServerEventStream(request.response);
          streams.add(stream);
          await streamGate?.future;
          stream.open();
          if (sendInitialSnapshot) stream.snapshot(snapshot);
        default:
          request.response.statusCode = HttpStatus.notFound;
          await request.response.close();
      }
    } on HttpException {
      // A stopped client deliberately aborts its in-flight transport.
    } on SocketException {
      // A stopped client deliberately aborts its in-flight transport.
    } on StateError {
      // The fixture may release a delayed response after its client closes.
    }
  }

  Future<void> close() async {
    if (snapshotGate case final gate? when !gate.isCompleted) gate.complete();
    if (streamGate case final gate? when !gate.isCompleted) gate.complete();
    for (final stream in streams) {
      await stream.close();
    }
    await _requests.cancel();
    await _server.close(force: true);
  }
}

class ServerEventStream {
  ServerEventStream(this.response);
  final HttpResponse response;
  Timer? _heartbeat;
  bool closed = false;

  void open() {
    if (closed) return;
    response.headers.contentType = ContentType('text', 'event-stream', charset: 'utf-8');
    response.bufferOutput = false;
    unawaited(response.done.then<void>((_) => _closed(), onError: (Object _) => _closed()));
    _heartbeat = Timer.periodic(const Duration(milliseconds: 20), (_) => write(': heartbeat\n\n'));
    write(': connected\n\n');
  }

  void snapshot(Map<String, Object?> value) => write('event: snapshot\ndata: ${jsonEncode(value)}\n\n');

  void write(String data) {
    if (closed) return;
    try {
      response.write(data);
    } on StateError {
      _closed();
    }
  }

  void _closed() {
    closed = true;
    _heartbeat?.cancel();
  }

  Future<void> close() async {
    if (closed) return;
    _closed();
    try {
      await response.close();
    } on HttpException {
      return;
    }
  }
}

Future<void> eventually(bool Function() predicate, {Duration timeout = const Duration(seconds: 4)}) async {
  final deadline = DateTime.now().add(timeout);
  while (!predicate()) {
    if (DateTime.now().isAfter(deadline)) throw TimeoutException('Condition did not become true', timeout);
    await Future<void>.delayed(const Duration(milliseconds: 10));
  }
}
