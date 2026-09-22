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
  });
  tearDown(() async {
    await repository.dispose();
    api.dispose();
    await server.close();
  });

  test('one active stream remains after repeated sequential starts', () async {
    await repository.start('equipment');
    await eventually(() => snapshots.length == 1);
    await repository.start('equipment');
    await eventually(() => server.eventRequests == 2 && server.openStreams == 1);
    expect(repository.activeSubscriptions, 1);
    server.streams.last.snapshot(simulationSnapshot(2));
    await eventually(() => snapshots.length == 2);
    expect(server.authorization, everyElement('Bearer local-test-token'));
  });

  test('overlapping start calls establish only one active subscription', () async {
    server.snapshotGate = Completer<void>();
    final first = repository.start('equipment');
    final second = repository.start('equipment');
    await eventually(() => server.snapshotRequests >= 1);
    server.snapshotGate?.complete();
    await Future.wait([first, second]);
    await eventually(() => server.eventRequests >= 1);
    await Future<void>.delayed(const Duration(milliseconds: 100));
    expect(server.openStreams, 1, reason: 'A local counter must not conceal a second live socket');
    expect(repository.activeSubscriptions, 1);
  });

  test('stop discards an in-flight HTTP snapshot and does not open SSE', () async {
    server.snapshotGate = Completer<void>();
    final starting = repository.start('equipment');
    await eventually(() => server.snapshotRequests == 1);
    await repository.stop();
    server.snapshotGate?.complete();
    await starting;
    await Future<void>.delayed(const Duration(milliseconds: 50));
    expect(snapshots, isEmpty);
    expect(server.eventRequests, 0);
    expect(repository.activeSubscriptions, 0);
  });

  test('immediate stop supersedes start before its first awaited cleanup completes', () async {
    final starting = repository.start('equipment');
    await repository.stop();
    await starting;
    await Future<void>.delayed(const Duration(milliseconds: 50));
    expect(snapshots, isEmpty);
    expect(server.eventRequests, 0);
    expect(repository.activeSubscriptions, 0);
  });

  test('stop discards a delayed SSE socket before its headers arrive', () async {
    server.streamGate = Completer<void>();
    await repository.start('equipment');
    await eventually(() => server.eventRequests == 1);
    await repository.stop();
    server.streamGate?.complete();
    await Future<void>.delayed(const Duration(milliseconds: 50));
    server.streams.single.snapshot(simulationSnapshot(2));
    await Future<void>.delayed(const Duration(milliseconds: 50));
    expect(snapshots, isEmpty);
    expect(repository.activeSubscriptions, 0);
    expect(errors, isEmpty);
  });

  test('disconnect fetches the latest snapshot before replacing the SSE stream', () async {
    await repository.start('equipment');
    await eventually(() => snapshots.length == 1);
    server.snapshot = simulationSnapshot(5);
    await server.streams.single.close();
    await eventually(() => server.snapshotRequests == 2 && server.eventRequests == 2);
    expect(snapshots.map(snapshotVersion), [1, 5]);
    expect(errors, isNotEmpty);
    expect(repository.activeSubscriptions, 1);
    expect(server.openStreams, 1);
  });

  test('resume fetches latest state and never replays intermediate history', () async {
    await repository.start('equipment');
    await eventually(() => snapshots.length == 1);
    await repository.stop();
    server.snapshot = simulationSnapshot(7);
    await repository.resume();
    await eventually(() => server.eventRequests == 2);
    expect(snapshots.map(snapshotVersion), [1, 7]);
    server.streams.last.snapshot(simulationSnapshot(6));
    await Future<void>.delayed(const Duration(milliseconds: 50));
    expect(snapshots.map(snapshotVersion), [1, 7]);
  });

  test('a queued reconnect is cancelled by stop', () async {
    await repository.start('equipment');
    await eventually(() => server.eventRequests == 1);
    await server.streams.single.close();
    await eventually(() => errors.isNotEmpty);
    await repository.stop();
    await Future<void>.delayed(const Duration(milliseconds: 1100));
    expect(server.snapshotRequests, 1);
    expect(server.eventRequests, 1);
    expect(repository.activeSubscriptions, 0);
  });
}

int snapshotVersion(Map<String, Object?> snapshot) =>
    (snapshot['run']! as Map<String, Object?>)['version']! as int;
