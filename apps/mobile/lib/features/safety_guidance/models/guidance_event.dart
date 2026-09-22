import 'json_read.dart';
import 'worker_profile.dart';

class GuidanceWaypoint {
  const GuidanceWaypoint({required this.x, required this.y, required this.nodeId, required this.floorId});
  final double x, y;
  final String nodeId, floorId;

  factory GuidanceWaypoint.fromJson(Map<String, Object?> json) {
    final read = JsonRead(json);
    return GuidanceWaypoint(
      x: read.number('x'),
      y: read.number('y'),
      nodeId: read.string('nodeId', nonEmpty: true),
      floorId: read.string('floorId', nonEmpty: true),
    );
  }
}

class GuidanceEvidence {
  const GuidanceEvidence({required this.documentId, required this.documentVersion, required this.chunkId});
  final String documentId, documentVersion, chunkId;

  factory GuidanceEvidence.fromJson(Map<String, Object?> json) {
    final read = JsonRead(json);
    return GuidanceEvidence(
      documentId: read.string('documentId', nonEmpty: true),
      documentVersion: read.string('documentVersion', nonEmpty: true),
      chunkId: read.string('chunkId', nonEmpty: true),
    );
  }
}

class GuidanceEvent {
  const GuidanceEvent._({
    required this.incidentId,
    required this.eventId,
    required this.runId,
    required this.workerId,
    required this.guidanceId,
    required this.guidanceVersion,
    required this.updateKind,
    required this.primaryGuidanceVersion,
    required this.simulationMode,
    required this.hazardIds,
    required this.hazardType,
    required this.priority,
    required this.actionCode,
    required this.routeVersion,
    required this.stepId,
    required this.mapId,
    required this.mapVersion,
    required this.floorId,
    required this.waypoints,
    required this.destinationId,
    required this.profileVersion,
    required this.profileSnapshot,
    required this.locale,
    required this.requestedLocale,
    required this.fallbackLocaleUsed,
    required this.templateCatalogVersion,
    required this.messageKey,
    required this.primaryMessageKey,
    required this.messageArgs,
    required this.primaryMessage,
    required this.managerExplanationKo,
    required this.supplementalExplanation,
    required this.evidence,
    required this.mode,
    required this.generatedAt,
    required this.expiresAt,
  });

  final String incidentId, eventId, runId, workerId, guidanceId;
  final int guidanceVersion;
  final String updateKind;
  final int primaryGuidanceVersion;
  final String simulationMode;
  final List<String> hazardIds;
  final String hazardType, priority, actionCode;
  final int? routeVersion;
  final String? stepId;
  final String mapId, mapVersion, floorId;
  final List<GuidanceWaypoint> waypoints;
  final String? destinationId;
  final int profileVersion;
  final WorkerProfile profileSnapshot;
  final String locale;
  final String? requestedLocale;
  final bool fallbackLocaleUsed;
  final String templateCatalogVersion, messageKey, primaryMessageKey;
  final Map<String, Object> messageArgs;
  final String primaryMessage, managerExplanationKo;
  final String? supplementalExplanation;
  final List<GuidanceEvidence> evidence;
  final String mode;
  final DateTime generatedAt, expiresAt;

  factory GuidanceEvent.fromJson(Map<String, Object?> json) {
    final read = JsonRead(json);
    final event = GuidanceEvent._(
      incidentId: read.string('incidentId', nonEmpty: true),
      eventId: read.string('eventId', nonEmpty: true),
      runId: read.string('runId', nonEmpty: true),
      workerId: read.string('workerId', nonEmpty: true),
      guidanceId: read.string('guidanceId', nonEmpty: true),
      guidanceVersion: read.integer('guidanceVersion', positive: true),
      updateKind: read.enumString('updateKind', {'primary', 'supplement'}),
      primaryGuidanceVersion: read.integer('primaryGuidanceVersion', positive: true),
      simulationMode: read.enumString('simulationMode', {'equipment', 'fire-gas'}),
      hazardIds: read.list('hazardIds', (value) {
        if (value is! String || value.isEmpty) {
          throw const FormatException('hazardIds must contain non-empty strings');
        }
        return value;
      }),
      hazardType: read.enumString('hazardType', {
        'equipment',
        'fire',
        'gas',
        'combined',
        'position-unknown',
        'sensor-unknown',
      }),
      priority: read.enumString('priority', {'critical', 'high', 'medium', 'low'}),
      actionCode: read.enumString('actionCode', _actionCodes),
      routeVersion: read.nullableInteger('routeVersion', positive: true),
      stepId: read.nullableString('stepId', nonEmpty: true),
      mapId: read.string('mapId', nonEmpty: true),
      mapVersion: read.string('mapVersion', nonEmpty: true),
      floorId: read.string('floorId', nonEmpty: true),
      waypoints: read.list(
        'waypoints',
        (value) => GuidanceWaypoint.fromJson(JsonRead.objectValue(value, 'waypoints[]')),
      ),
      destinationId: read.nullableString('destinationId', nonEmpty: true),
      profileVersion: read.integer('profileVersion', positive: true),
      profileSnapshot: WorkerProfile.fromJson(read.object('profileSnapshot')),
      locale: read.enumString('locale', {'ko', 'en'}),
      requestedLocale: read.nullableString('requestedLocale'),
      fallbackLocaleUsed: read.boolean('fallbackLocaleUsed'),
      templateCatalogVersion: read.string('templateCatalogVersion', nonEmpty: true),
      messageKey: read.string('messageKey', nonEmpty: true),
      primaryMessageKey: read.string('primaryMessageKey', nonEmpty: true),
      messageArgs: read.scalarMap('messageArgs'),
      primaryMessage: read.string('primaryMessage'),
      managerExplanationKo: read.string('managerExplanationKo'),
      supplementalExplanation: read.nullableString('supplementalExplanation'),
      evidence: read.list(
        'evidence',
        (value) => GuidanceEvidence.fromJson(JsonRead.objectValue(value, 'evidence[]')),
      ),
      mode: read.enumString('mode', {'template', 'rag-assisted'}),
      generatedAt: read.dateTime('generatedAt'),
      expiresAt: read.dateTime('expiresAt'),
    );
    event._validate();
    return event;
  }

  void _validate() {
    if (updateKind == 'primary' && primaryGuidanceVersion != guidanceVersion) {
      throw const FormatException('Primary guidance must reference its own version');
    }
    if (updateKind == 'supplement' && primaryGuidanceVersion >= guidanceVersion) {
      throw const FormatException('Supplement must reference an earlier primary version');
    }
    if (updateKind == 'supplement' &&
        (mode != 'rag-assisted' || supplementalExplanation == null || evidence.isEmpty)) {
      throw const FormatException('Supplement requires an evidenced RAG explanation');
    }
    if (messageKey != primaryMessageKey) {
      throw const FormatException('Compatibility message keys must match');
    }
    if (waypoints.isEmpty && (destinationId != null || routeVersion != null || stepId != null)) {
      throw const FormatException('A non-route action must clear route, step and destination');
    }
    if (_stationaryActions.contains(actionCode) && waypoints.isNotEmpty) {
      throw const FormatException('This action cannot carry a movement route');
    }
    if (actionCode == 'FOLLOW_VALIDATED_ROUTE' &&
        (waypoints.length < 2 || destinationId == null || routeVersion == null || stepId == null)) {
      throw const FormatException('Validated movement requires a route, destination and current step');
    }
    if (profileSnapshot.version != profileVersion) {
      throw const FormatException('Profile snapshot version must match guidance');
    }
    if (profileSnapshot.workerId != workerId) {
      throw const FormatException('Profile snapshot worker must match guidance');
    }
    if (!expiresAt.isAfter(generatedAt)) {
      throw const FormatException('Guidance expiry must follow generation');
    }
  }

  static const _actionCodes = {
    'ALERT_HAZARD',
    'FOLLOW_VALIDATED_ROUTE',
    'GUIDANCE_UPDATED',
    'ROUTE_UNAVAILABLE',
    'POSITION_UNKNOWN',
    'SENSOR_UNKNOWN',
    'REQUEST_ASSISTANCE',
    'SHELTER_PER_SCENARIO',
    'CONFIRM_UNDERSTANDING',
    'CONFIRM_ARRIVAL',
    'AWAIT_REOPEN_AUTHORIZATION',
  };
  static const _stationaryActions = {
    'POSITION_UNKNOWN',
    'ROUTE_UNAVAILABLE',
    'SENSOR_UNKNOWN',
    'SHELTER_PER_SCENARIO',
    'AWAIT_REOPEN_AUTHORIZATION',
  };
}
