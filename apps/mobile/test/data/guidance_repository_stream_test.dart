import 'dart:async';
import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:gs_safety_mobile/features/safety_guidance/data/guidance_api_service.dart';
import 'package:gs_safety_mobile/features/safety_guidance/data/guidance_repository.dart';
import 'local_guidance_server.dart';

void main() {
  late LocalGuidanceServer server;
  late GuidanceApiService api;
  late GuidanceRepository repository;
  late List<Map<String, Object?>> snapshots;
  late List<String> errors;
  setUp(() async {
    server = await LocalGuidanceServer.start();
    api = GuidanceApiService(server.baseUrl)..token = 'local-test-token';
    snapshots = [];
    errors = [];
    repository = GuidanceRepository(
      api: api,
      onSnapshot: snapshots.add,
      onConnection: (_, error) {
        if (error != null) errors.add(error);
      },
    );
    server.snapshot = sequencedSnapshot(40);
    await repository.start('equipment');
    await eventually(() => snapshots.length == 1);
  });
  tearDown(() async {
    await repository.dispose();
    api.dispose();
    await server.close();
  });

  test('resume preserves the sequence watermark and drops delayed old-run HTTP after reset', () async {
    final reset = sequencedSnapshot(41);
    reset['run'] = {...simulationSnapshot(0)['run']! as Map<String, Object?>, 'runId': 'new-run'};
    server.streams.single.snapshot(reset);
    await eventually(() => snapshots.length == 2);
    server.snapshot = sequencedSnapshot(40);
    server.snapshotGate = Completer<void>();
    server.streamGate = Completer<void>();
    final resuming = repository.resume();
    await eventually(() => server.snapshotRequests == 2);
    server.snapshot = {...reset, 'sequence': 42};
    server.snapshotGate?.complete();
    await resuming;
    expect(snapshots.map((value) => value['sequence']), [40, 41]);
    expect((snapshots.last['run']! as Map<String, Object?>)['runId'], 'new-run');
    await eventually(() => server.eventRequests == 2);
    server.streamGate?.complete();
    await eventually(() => snapshots.length == 3);
    expect(snapshots.map((value) => value['sequence']), [40, 41, 42]);
  });

  test('new runtime from HTTP remains pending until first owned reconnect SSE establishes it', () async {
    server.snapshot = sequencedSnapshot(0, streamId: 'stream-b');
    server.streamGate = Completer<void>();
    await repository.resume();
    expect(snapshots.map((value) => value['streamId']), ['stream-a']);
    await eventually(() => server.eventRequests == 2);
    server.streamGate?.complete();
    await eventually(() => snapshots.length == 2);
    expect(snapshots.map((value) => value['streamId']), ['stream-a', 'stream-b']);
    expect(snapshots.last['sequence'], 0);
  });

  test('changed stream later in the same connection cannot replace its baseline', () async {
    server.streams.single.snapshot(sequencedSnapshot(1000, streamId: 'unowned-stream'));
    server.streams.single.snapshot(sequencedSnapshot(41));
    await eventually(() => snapshots.length == 2);
    expect(snapshots.map((value) => value['streamId']), ['stream-a', 'stream-a']);
    expect(snapshots.last['sequence'], 41);
  });

  test('a retired runtime cannot be revived by a later HTTP or SSE bootstrap', () async {
    server.snapshot = sequencedSnapshot(0, streamId: 'stream-b');
    await repository.resume();
    await eventually(() => snapshots.length == 2);
    server.snapshot = sequencedSnapshot(999);
    await repository.resume();
    await eventually(() => server.eventRequests == 3);
    server.streams.last.snapshot(sequencedSnapshot(1, streamId: 'stream-b'));
    await eventually(() => snapshots.length == 3);
    expect(snapshots.map((value) => value['streamId']), ['stream-a', 'stream-b', 'stream-b']);
    expect(snapshots.last['sequence'], 1);
  });

  test('switching simulation mode creates a separate sequence baseline', () async {
    server.snapshot = {...sequencedSnapshot(1), 'mode': 'fire-gas'};
    await repository.start('fire-gas');
    await eventually(() => snapshots.length == 2);
    expect(snapshots.last['mode'], 'fire-gas');
    expect(snapshots.last['sequence'], 1);
  });

  test('failed socket delayed server close cannot disconnect its owned replacement', () async {
    final old = server.streams.single;
    server.snapshot = sequencedSnapshot(0, streamId: 'stream-b');
    old.snapshot({...sequencedSnapshot(41), 'mode': 'fire-gas'});
    await eventually(() => server.eventRequests == 2 && snapshots.length == 2);
    final errorCount = errors.length;
    try {
      await old.response.close();
    } on HttpException {
      // The old client socket was already cancelled by recovery.
    } on SocketException {
      // The server completes the deliberately delayed old close after replacement.
    }
    server.streams.last.snapshot(sequencedSnapshot(1, streamId: 'stream-b'));
    await eventually(() => snapshots.length == 3);
    expect(snapshots.last['streamId'], 'stream-b');
    expect(errors, hasLength(errorCount));
    expect(repository.activeSubscriptions, 1);
    expect(server.eventRequests, 2);
  });

  test('rejected downstream snapshot validation does not consume its sequence', () async {
    await repository.dispose();
    var reject = true;
    snapshots.clear();
    repository = GuidanceRepository(
      api: api,
      onConnection: (_, _) {},
      onSnapshot: (value) {
        if (reject) throw const FormatException('Downstream snapshot validation failed');
        snapshots.add(value);
      },
    );
    await repository.start('equipment');
    await eventually(() => server.eventRequests == 2);
    await Future<void>.delayed(const Duration(milliseconds: 50));
    reject = false;
    await eventually(() => snapshots.length == 1);
    expect(snapshots.single['sequence'], 40);
  });
}
