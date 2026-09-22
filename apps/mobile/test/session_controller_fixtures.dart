import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:gs_safety_mobile/services/native_device_service.dart';

import 'guidance_fixtures.dart';

class SessionNative extends NativeDeviceService {
  final List<String> requestedRoles = [];
  Completer<void>? permissionsGate;
  int uwbStops = 0, cameraStops = 0;
  @override
  Future<Map<String, Object?>> capabilities() async => {'uwbHardware': false};
  @override
  Future<Map<String, Object?>> requestPermissions(String role) async {
    requestedRoles.add(role);
    await permissionsGate?.future;
    return {'camera': false};
  }

  @override
  Future<void> setScreenOn(bool enabled) async {}
  @override
  Future<void> stopUwb() async {
    uwbStops++;
  }

  @override
  Future<void> stopCctv() async {
    cameraStops++;
  }

  @override
  Future<void> dispose() async {}
}

class SessionServer {
  SessionServer(this.server) {
    initialGuide = guide(1);
    value = snapshot(initialGuide);
    server.listen(handle);
  }
  static Future<SessionServer> open() async =>
      SessionServer(await HttpServer.bind(InternetAddress.loopbackIPv4, 0));
  final HttpServer server;
  final List<HttpResponse> streams = [];
  final List<Map<String, Object?>> logins = [], responses = [];
  late final Map<String, Object?> initialGuide;
  late Map<String, Object?> value;
  int revision = 1, eventConnections = 0;
  Uri get url => Uri.parse('http://127.0.0.1:${server.port}');

  Map<String, Object?> guide(int version) => guidanceJson(
    version: version,
    overrides: {
      'mapId': 'SITE-CONSTRUCTION-01',
      'mapVersion': '1.0.0',
      'floorId': 'GROUND',
      'generatedAt': DateTime.now().toUtc().toIso8601String(),
      'expiresAt': DateTime.now()
          .add(const Duration(minutes: 5))
          .toUtc()
          .toIso8601String(),
      'waypoints': [
        {'nodeId': 'start', 'floorId': 'GROUND', 'x': 1, 'y': 2},
        {'nodeId': 'REFUGE-01', 'floorId': 'GROUND', 'x': 10, 'y': 8},
      ],
    },
  );

  Map<String, Object?> snapshot(
    Map<String, Object?> guidance, {
    double x = 1,
    String mapVersion = '1.0.0',
    String positionStatus = 'known',
  }) => {
    'contractVersion': '1.0.0',
    'streamId': 'b3527133-87ca-432d-ae8d-5f62d110056f',
    'sequence': revision,
    'mode': 'equipment',
    'run': {
      'runId': 'run-1',
      'mapId': 'SITE-CONSTRUCTION-01',
      'mapVersion': mapVersion,
      'version': revision,
      'status': 'running',
      'updatedAt': DateTime.now().toUtc().toIso8601String(),
    },
    'workers': [
      for (final id in ['WORKER-A', 'WORKER-B'])
        {
          'workerId': id,
          'profile': profileJson(overrides: {'workerId': id}),
          'position': {'x': x, 'y': 2},
          'positionSource': 'mock',
          'positionStatus': positionStatus,
          'lastObservedAt': DateTime.now().toUtc().toIso8601String(),
          'currentGuidance': id == 'WORKER-A' ? guidance : null,
          'response': <String, Object?>{},
        },
    ],
    'incidents': [
      {
        'incidentId': 'incident-1',
        'status': 'active',
        'supportStatus': 'none',
        'assignedTo': null,
        'firstGuidance': [initialGuide],
      },
    ],
    'hazards': <Object?>[],
    'cctv': <Object?>[],
  };

  Future<void> handle(HttpRequest request) async {
    final response = request.response;
    if (request.uri.path == '/api/events') {
      eventConnections++;
      response.headers.contentType = ContentType(
        'text',
        'event-stream',
        charset: 'utf-8',
      );
      response.bufferOutput = false;
      streams.add(response);
      response.done.then<void>(
        (_) => streams.remove(response),
        onError: (Object _) => streams.remove(response),
      );
      emit(response);
      return;
    }
    response.headers.contentType = ContentType.json;
    if (request.method == 'POST') {
      final data =
          jsonDecode(await utf8.decoder.bind(request).join())
              as Map<String, Object?>;
      if (request.uri.path == '/api/session') {
        logins.add(data);
        response.write(jsonEncode({'token': 'test-token'}));
      } else {
        responses.add(data);
        response.write('{}');
      }
    } else {
      response.write(
        jsonEncode(request.uri.path == '/api/simulation' ? value : {}),
      );
    }
    await response.close();
  }

  void emit(HttpResponse response) {
    response.add(
      utf8.encode('event: snapshot\ndata: ${jsonEncode(value)}\n\n'),
    );
  }

  Future<void> push({
    double x = 1,
    int? guidanceVersion,
    String mapVersion = '1.0.0',
    String positionStatus = 'known',
    Map<String, Object?>? guidance,
  }) async {
    revision++;
    final workers = value['workers']! as List<Object?>;
    final current =
        (workers.first! as Map<String, Object?>)['currentGuidance']!
            as Map<String, Object?>;
    value = snapshot(
      guidance ?? (guidanceVersion == null ? current : guide(guidanceVersion)),
      x: x,
      mapVersion: mapVersion,
      positionStatus: positionStatus,
    );
    for (final stream in streams) {
      emit(stream);
    }
  }

  Future<void> close() async {
    await Future.wait(
      List<HttpResponse>.of(streams).map((stream) => stream.close()),
    );
    await server.close(force: true);
  }
}
