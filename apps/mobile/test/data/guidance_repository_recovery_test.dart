import 'dart:async';
import 'package:flutter_test/flutter_test.dart';
import 'package:gs_safety_mobile/features/safety_guidance/data/guidance_api_service.dart';
import 'package:gs_safety_mobile/features/safety_guidance/data/guidance_repository.dart';
import 'local_guidance_server.dart';

void main() {
  late LocalGuidanceServer server;
  late GuidanceApiService api;
  late GuidanceRepository repository;
  late List<Map<String, Object?>> snapshots;
  late List<String> connectionErrors;
  setUp(() async {
    server = await LocalGuidanceServer.start();
    api = GuidanceApiService(server.baseUrl)..token = 'local-test-token';
    snapshots = [];
    connectionErrors = [];
    repository = GuidanceRepository(
      api: api,
      onSnapshot: snapshots.add,
      onConnection: (_, error) {
        if (error != null) connectionErrors.add(error);
      },
    );
  });
  tearDown(() async {
    await repository.dispose();
    api.dispose();
    await server.close();
  });

  for (final invalid in <String, Map<String, Object?>>{
    'wrong mode': simulationSnapshot(2, mode: 'fire-gas'),
    'malformed run': {
      ...simulationSnapshot(2),
      'run': {'version': 'invalid'},
    },
    'wrong contract': {...simulationSnapshot(2), 'contractVersion': '99.0.0'},
  }.entries) {
    test('${invalid.key} reports disconnection and recovers instead of throwing from onData', () async {
      final uncaught = <Object>[];
      await captureAsyncErrors(() async {
        await repository.start('equipment');
        await eventually(() => snapshots.length == 1);
        server.snapshot = simulationSnapshot(3);
        server.streams.single.snapshot(invalid.value);
        await Future<void>.delayed(const Duration(milliseconds: 100));
        expect(uncaught, isEmpty, reason: 'Malformed server data must be routed into recovery');
        expect(connectionErrors, isNotEmpty);
        await eventually(() => server.snapshotRequests == 2 && server.eventRequests == 2);
        expect(snapshots, hasLength(2));
        expect((snapshots.last['run']! as Map<String, Object?>)['version'], 3);
        expect(repository.activeSubscriptions, 1);
      }, uncaught);
    });
  }

  test('malformed SSE JSON recovers through the same latest-snapshot path', () async {
    await repository.start('equipment');
    await eventually(() => snapshots.length == 1);
    server.snapshot = simulationSnapshot(4);
    server.streams.single.write('event: snapshot\ndata: {invalid json}\n\n');
    await eventually(() => server.snapshotRequests == 2 && server.eventRequests == 2);
    expect(connectionErrors, isNotEmpty);
    expect(snapshots, hasLength(2));
    expect((snapshots.last['run']! as Map<String, Object?>)['version'], 4);
  });

  test('malformed initial HTTP snapshot is rejected then recovered on retry', () async {
    server.snapshot = {'contractVersion': '1.0.0', 'mode': 'equipment', 'run': null};
    await repository.start('equipment');
    expect(connectionErrors, isNotEmpty);
    expect(snapshots, isEmpty);
    expect(server.eventRequests, 0);
    server.snapshot = simulationSnapshot(5);
    await eventually(() => snapshots.length == 1);
    expect(snapshots, hasLength(1));
  });
}

Future<void> captureAsyncErrors(Future<void> Function() body, List<Object> errors) {
  final done = Completer<void>();
  runZonedGuarded(
    () {
      body().then(done.complete, onError: done.completeError);
    },
    (error, _) {
      errors.add(error);
    },
  );
  return done.future;
}
