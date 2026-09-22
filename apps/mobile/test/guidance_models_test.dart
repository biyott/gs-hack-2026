import 'package:flutter_test/flutter_test.dart';
import 'package:gs_safety_mobile/features/safety_guidance/models/guidance_event.dart';
import 'package:gs_safety_mobile/features/safety_guidance/models/worker_position.dart';
import 'package:gs_safety_mobile/features/safety_guidance/models/worker_profile.dart';

import 'guidance_fixtures.dart';

const _evidence = [
  {'documentId': 'manual', 'documentVersion': '2', 'chunkId': 'chunk-3'},
];

void main() {
  test('preserves complete guidance, profile, evidence and supplement lineage', () {
    final json = guidanceJson(
      version: 4,
      overrides: {
        'updateKind': 'supplement',
        'primaryGuidanceVersion': 2,
        'requestedLocale': 'vi',
        'fallbackLocaleUsed': true,
        'messageArgs': {'destination': 'REFUGE-01', 'distance': 5.5, 'assisted': true},
        'supplementalExplanation': 'Keep the marked access lane clear.',
        'evidence': _evidence,
        'mode': 'rag-assisted',
        'profileSnapshot': profileJson(
          overrides: {
            'preferredLocale': 'vi',
            'canUseStairs': false,
            'speedMps': {'min': 0.2, 'max': 0.8},
            'needsAssistance': true,
            'needsCompanion': false,
            'notificationPreferences': {'voice': true, 'vibration': false},
            'confirmedAt': '2030-01-02T12:04:00+09:00',
          },
        ),
      },
    );
    final event = GuidanceEvent.fromJson(json);
    expect(event.guidanceVersion, 4);
    expect(event.updateKind, 'supplement');
    expect(event.primaryGuidanceVersion, 2);
    expect(event.simulationMode, json['simulationMode']);
    expect(event.hazardIds, json['hazardIds']);
    expect(event.hazardType, json['hazardType']);
    expect(event.priority, json['priority']);
    expect(event.actionCode, json['actionCode']);
    expect(event.routeVersion, 4);
    expect(event.stepId, json['stepId']);
    expect(event.mapId, json['mapId']);
    expect(event.mapVersion, json['mapVersion']);
    expect(event.floorId, json['floorId']);
    expect(event.waypoints.first.x, 1);
    expect(event.waypoints.first.y, 2);
    expect(event.waypoints.last.nodeId, 'REFUGE-01');
    expect(event.waypoints.last.floorId, 'ground');
    expect(event.destinationId, json['destinationId']);
    expect(event.profileVersion, 1);
    expect(event.profileSnapshot.workerId, event.workerId);
    expect(event.profileSnapshot.version, event.profileVersion);
    expect(event.profileSnapshot.preferredLocale, 'vi');
    expect(event.profileSnapshot.locale, 'ko');
    expect(event.profileSnapshot.canUseStairs, isFalse);
    expect(event.profileSnapshot.speedMps?.min, 0.2);
    expect(event.profileSnapshot.speedMps?.max, 0.8);
    expect(event.profileSnapshot.needsAssistance, isTrue);
    expect(event.profileSnapshot.needsCompanion, isFalse);
    expect(event.profileSnapshot.notificationPreferences.voice, isTrue);
    expect(event.profileSnapshot.notificationPreferences.vibration, isFalse);
    expect(event.profileSnapshot.confirmedAt, testTime);
    expect(event.locale, json['locale']);
    expect(event.requestedLocale, 'vi');
    expect(event.fallbackLocaleUsed, isTrue);
    expect(event.templateCatalogVersion, json['templateCatalogVersion']);
    expect(event.messageKey, json['messageKey']);
    expect(event.primaryMessageKey, json['primaryMessageKey']);
    expect(event.messageArgs, json['messageArgs']);
    expect(event.primaryMessage, json['primaryMessage']);
    expect(event.managerExplanationKo, json['managerExplanationKo']);
    expect(event.supplementalExplanation, json['supplementalExplanation']);
    expect(event.evidence.single.documentId, 'manual');
    expect(event.evidence.single.documentVersion, '2');
    expect(event.evidence.single.chunkId, 'chunk-3');
    expect(event.mode, 'rag-assisted');
    expect(event.generatedAt, testTime.add(const Duration(milliseconds: 4)));
    expect(event.expiresAt, testTime.add(const Duration(minutes: 10)));
  });

  test('rejects invalid or absent lineage fields', () {
    for (final overrides in <Map<String, Object?>>[
      {'updateKind': 'primary', 'primaryGuidanceVersion': 1},
      {'updateKind': 'supplement', 'primaryGuidanceVersion': 2},
      {'updateKind': 'supplement', 'primaryGuidanceVersion': 3},
      {'updateKind': 'unrecognized'},
      {'primaryGuidanceVersion': 0},
      {'primaryGuidanceVersion': 1.5},
    ]) {
      final json = guidanceJson(
        version: 2,
        overrides: {
          'mode': 'rag-assisted',
          'supplementalExplanation': 'Context',
          'evidence': _evidence,
          ...overrides,
        },
      );
      expect(() => GuidanceEvent.fromJson(json), throwsFormatException);
    }
    for (final field in ['updateKind', 'primaryGuidanceVersion']) {
      final json = guidanceJson()..remove(field);
      expect(() => GuidanceEvent.fromJson(json), throwsFormatException);
    }
  });

  test('supplement requires RAG mode, explanation and evidence', () {
    for (final invalid in <Map<String, Object?>>[
      {'mode': 'template'},
      {'supplementalExplanation': null},
      {'evidence': <Object?>[]},
    ]) {
      final json = guidanceJson(
        version: 2,
        overrides: {
          'updateKind': 'supplement',
          'primaryGuidanceVersion': 1,
          'mode': 'rag-assisted',
          'supplementalExplanation': 'Context',
          'evidence': _evidence,
          ...invalid,
        },
      );
      expect(() => GuidanceEvent.fromJson(json), throwsFormatException);
    }
  });

  test('copies input collections and exposes unmodifiable arrays and maps', () {
    final hazards = ['hazard-1'];
    final args = <String, Object?>{'destination': 'REFUGE-01'};
    final point = <String, Object?>{'nodeId': 'start', 'floorId': 'ground', 'x': 1, 'y': 2};
    final event = guidance(
      overrides: {
        'hazardIds': hazards,
        'messageArgs': args,
        'waypoints': [
          point,
          {'nodeId': 'end', 'floorId': 'ground', 'x': 3, 'y': 4},
        ],
        'evidence': _evidence,
      },
    );
    hazards.add('later-hazard');
    args['destination'] = 'changed';
    point['x'] = 99;
    expect(event.hazardIds, ['hazard-1']);
    expect(event.messageArgs['destination'], 'REFUGE-01');
    expect(event.waypoints.first.x, 1);
    expect(() => event.hazardIds.add('new'), throwsUnsupportedError);
    expect(() => event.waypoints.clear(), throwsUnsupportedError);
    expect(() => event.evidence.clear(), throwsUnsupportedError);
    expect(() => event.messageArgs['destination'] = 'new', throwsUnsupportedError);
    expect(() => event.profileSnapshot.toJson().clear(), throwsUnsupportedError);
    expect(
      () => event.profileSnapshot.notificationPreferences.toJson().clear(),
      throwsUnsupportedError,
    );
  });

  test('requires nullable fields while preserving explicit unknown profile data', () {
    final profile = WorkerProfile.fromJson(profileJson());
    expect(profile.canUseStairs, isNull);
    expect(profile.speedMps, isNull);
    expect(profile.needsAssistance, isNull);
    expect(profile.needsCompanion, isNull);
    expect(profile.confirmedAt, isNull);
    for (final field in [
      'requestedLocale',
      'supplementalExplanation',
      'routeVersion',
      'stepId',
      'destinationId',
    ]) {
      final json = guidanceJson()..remove(field);
      expect(() => GuidanceEvent.fromJson(json), throwsFormatException);
    }
    for (final field in [
      'preferredLocale',
      'canUseStairs',
      'speedMps',
      'needsAssistance',
      'needsCompanion',
      'confirmedAt',
    ]) {
      final json = profileJson()..remove(field);
      expect(() => WorkerProfile.fromJson(json), throwsFormatException);
    }
  });

  test('rejects nonfinite coordinates without inventing an unknown position', () {
    for (final coordinate in [double.nan, double.infinity, double.negativeInfinity]) {
      expect(
        () => GuidanceWaypoint.fromJson({
          'nodeId': 'start',
          'floorId': 'ground',
          'x': coordinate,
          'y': 1,
        }),
        throwsFormatException,
      );
      expect(
        () => WorkerPosition.fromJson({
          'workerId': 'WORKER-A',
          'position': {'x': 1, 'y': coordinate},
          'positionSource': 'video',
          'positionStatus': 'known',
          'lastObservedAt': testTime.toIso8601String(),
        }),
        throwsFormatException,
      );
    }
    final unknown = WorkerPosition.fromJson({
      'workerId': 'WORKER-A',
      'position': null,
      'positionSource': 'uwb',
      'positionStatus': 'unknown',
      'lastObservedAt': null,
    });
    expect(unknown.x, isNull);
    expect(unknown.y, isNull);
    expect(unknown.hasKnownPosition, isFalse);
  });

  test('rejects malformed dates, missing offsets and invalid expiry ordering', () {
    for (final timestamp in [
      'not-a-date',
      '2030-01-02T03:04:00',
      '2030-02-30T03:04:00Z',
      '2030-01-02T24:04:00Z',
      '2030-01-02T03:04:00+25:00',
    ]) {
      expect(() => guidance(overrides: {'generatedAt': timestamp}), throwsFormatException);
    }
    final generated = testTime.add(const Duration(milliseconds: 1));
    for (final expires in [generated, generated.subtract(const Duration(seconds: 1))]) {
      expect(
        () => guidance(overrides: {'expiresAt': expires.toIso8601String()}),
        throwsFormatException,
      );
    }
  });
}
