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

  test(
    'accepts additive sequence HTTP and newer SSE state despite unchanged run revision and time',
    () async {
      server.snapshot = sequencedSnapshot(40);
      server.streamGate = Completer<void>();
      await repository.start('equipment');
      expect(errors, isEmpty);
      expect(snapshots, isEmpty, reason: 'Initial HTTP cannot establish the authoritative stream');
      await eventually(() => server.eventRequests == 1);
      server.streamGate?.complete();
      await eventually(() => snapshots.length == 1);
      server.streams.single.snapshot(sequencedSnapshot(41));
      await eventually(() => snapshots.length == 2);
      expect(snapshots.map((value) => value['sequence']), [40, 41]);
    },
  );

  test('duplicate and reversed sequence never replay a snapshot', () async {
    server.snapshot = sequencedSnapshot(10);
    await repository.start('equipment');
    expect(errors, isEmpty);
    await eventually(() => snapshots.length == 1);
    for (final sequence in [10, 9, 11, 11, 8, 12]) {
      server.streams.single.snapshot(sequencedSnapshot(sequence));
    }
    await eventually(() => snapshots.any((value) => value['sequence'] == 12));
    expect(snapshots.map((value) => value['sequence']), [10, 11, 12]);
    expect(repository.activeSubscriptions, 1);
  });

  test('publication sequence wins when reset changes run identity and regresses mutation revision', () async {
    server.snapshot = sequencedSnapshot(40);
    await repository.start('equipment');
    await eventually(() => snapshots.length == 1);
    final reset = sequencedSnapshot(41);
    reset['run'] = {...simulationSnapshot(0)['run']! as Map<String, Object?>, 'runId': 'new-run'};
    server.streams.single.snapshot(reset);
    await eventually(() => snapshots.length == 2);
    expect(snapshots.map((value) => (value['run']! as Map<String, Object?>)['version']), [7, 0]);
    expect(snapshots.map((value) => value['sequence']), [40, 41]);
    expect(errors, isEmpty);
  });

  for (final invalid in <String, Map<String, Object?>>{
    'missing stream id': sequencedSnapshot(2)..remove('streamId'),
    'empty stream id': {...sequencedSnapshot(2), 'streamId': ''},
    'missing sequence': sequencedSnapshot(2)..remove('sequence'),
    'negative sequence': sequencedSnapshot(-1),
    'fractional sequence': {...sequencedSnapshot(2), 'sequence': 2.5},
    'unsafe integer sequence': {...sequencedSnapshot(2), 'sequence': 9007199254740992},
    'persistence legacy sentinel': sequencedSnapshot(0, streamId: 'legacy'),
  }.entries) {
    test('${invalid.key} is rejected before delivering modern state', () async {
      server.snapshot = invalid.value;
      await repository.start('equipment');
      expect(snapshots, isEmpty);
      expect(errors, isNotEmpty);
      expect(server.eventRequests, 0);
    });
  }
}
