import 'dart:convert';

import '../features/safety_guidance/data/guidance_api_service.dart';
import '../features/safety_guidance/models/guidance_event.dart';
import '../features/safety_guidance/models/worker_position.dart';
import '../features/safety_guidance/models/worker_profile.dart';
import '../features/safety_guidance/presentation/site_map_data.dart';

List<Map<String, Object?>> snapshotObjects(Object? value) {
  if (value is! List<Object?>) throw const FormatException('Expected a list');
  return value.map(jsonObject).toList(growable: false);
}

class SessionSnapshot {
  SessionSnapshot(this.raw, this.workerId) {
    run = jsonObject(raw['run']);
    workers = snapshotObjects(raw['workers']);
    incidents = snapshotObjects(raw['incidents']);
    hazards = snapshotObjects(raw['hazards']);
    positions = workers.map(WorkerPosition.fromJson).toList(growable: false);
    for (final candidate in workers) {
      if (candidate['workerId'] == workerId) worker = candidate;
    }
    final ownWorker = worker;
    if (workerId != null && ownWorker == null) {
      throw const FormatException(
        'The selected worker is missing from the snapshot',
      );
    }
    if (ownWorker != null) {
      profile = WorkerProfile.fromJson(jsonObject(ownWorker['profile']));
      if (profile?.workerId != workerId) {
        throw const FormatException(
          'Worker profile identity does not match the selected worker',
        );
      }
      final current = ownWorker['currentGuidance'];
      if (current != null) event = GuidanceEvent.fromJson(jsonObject(current));
    }
  }

  final Map<String, Object?> raw;
  final String? workerId;
  late final Map<String, Object?> run;
  late final List<Map<String, Object?>> workers, incidents, hazards;
  late final List<WorkerPosition> positions;
  Map<String, Object?>? worker;
  WorkerProfile? profile;
  GuidanceEvent? event;

  String get runId => run['runId']! as String;
  String get mapId => run['mapId']! as String;
  String get mapVersion => run['mapVersion']! as String;
  bool get mapCompatible =>
      mapId == SiteMapOverlay.expectedSiteId &&
      mapVersion == SiteMapOverlay.expectedMapVersion;

  bool supportsMovement(GuidanceEvent guidance) {
    final known = positions.where((position) => position.workerId == workerId);
    if (known.isEmpty || !known.first.hasKnownPosition) return false;
    final own = known.first;
    return MapPoint(own.x!, own.y!).isOnSite &&
        guidance.waypoints.length >= 2 &&
        guidance.waypoints.every(
          (point) => MapPoint(point.x, point.y).isOnSite,
        );
  }

  Map<String, Object?>? incident(String? id) {
    for (final candidate in incidents) {
      if (candidate['incidentId'] == id) return candidate;
    }
    return null;
  }

  GuidanceEvent? firstGuidance(String incidentId) {
    final record = incident(incidentId);
    if (record == null) return null;
    for (final candidate in snapshotObjects(record['firstGuidance'])) {
      if (candidate['workerId'] == workerId) {
        return GuidanceEvent.fromJson(candidate);
      }
    }
    return null;
  }

  /// Excludes coordinates, observation clocks, and simulation ticks.
  String get screenIdentity => jsonEncode({
    'runId': runId,
    'mapId': mapId,
    'mapVersion': mapVersion,
    'status': run['status'],
    if (worker != null)
      'worker': {
        for (final key in [
          'workerId',
          'profile',
          'positionSource',
          'positionStatus',
          'currentGuidance',
          'response',
        ])
          key: worker![key],
      },
    'incidents': [
      for (final entry in incidents)
        {
          for (final key in [
            'incidentId',
            'status',
            'supportStatus',
            'assignedTo',
            'firstGuidance',
          ])
            key: entry[key],
        },
    ],
    if (workerId == null) 'cctv': raw['cctv'],
  });
}
