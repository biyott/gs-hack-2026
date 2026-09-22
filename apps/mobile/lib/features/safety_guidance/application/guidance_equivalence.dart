import '../models/guidance_event.dart';

bool isSupplementOnly(GuidanceEvent? previous, GuidanceEvent next) {
  if (previous == null ||
      next.updateKind != 'supplement' ||
      previous.primaryGuidanceVersion != next.primaryGuidanceVersion ||
      previous.guidanceId != next.guidanceId ||
      previous.incidentId != next.incidentId ||
      previous.runId != next.runId ||
      previous.workerId != next.workerId ||
      previous.simulationMode != next.simulationMode ||
      previous.hazardType != next.hazardType ||
      !_sameJson(previous.hazardIds, next.hazardIds) ||
      previous.priority != next.priority ||
      previous.actionCode != next.actionCode ||
      previous.primaryMessage != next.primaryMessage ||
      previous.locale != next.locale ||
      previous.requestedLocale != next.requestedLocale ||
      previous.fallbackLocaleUsed != next.fallbackLocaleUsed ||
      previous.templateCatalogVersion != next.templateCatalogVersion ||
      previous.messageKey != next.messageKey ||
      previous.primaryMessageKey != next.primaryMessageKey ||
      previous.managerExplanationKo != next.managerExplanationKo ||
      !_sameJson(previous.messageArgs, next.messageArgs) ||
      !_sameJson(previous.profileSnapshot.toJson(), next.profileSnapshot.toJson()) ||
      previous.profileVersion != next.profileVersion ||
      previous.routeVersion != next.routeVersion ||
      previous.stepId != next.stepId ||
      previous.mapId != next.mapId ||
      previous.mapVersion != next.mapVersion ||
      previous.floorId != next.floorId ||
      previous.destinationId != next.destinationId ||
      previous.generatedAt != next.generatedAt ||
      previous.expiresAt != next.expiresAt ||
      previous.waypoints.length != next.waypoints.length) {
    return false;
  }
  for (var index = 0; index < previous.waypoints.length; index++) {
    final before = previous.waypoints[index];
    final after = next.waypoints[index];
    if (before.x != after.x ||
        before.y != after.y ||
        before.nodeId != after.nodeId ||
        before.floorId != after.floorId) {
      return false;
    }
  }
  return true;
}

bool _sameJson(Object? before, Object? after) {
  if (before == after) return true;
  if (before is Map<String, Object?> && after is Map<String, Object?>) {
    return before.length == after.length &&
        before.entries.every(
          (entry) => after.containsKey(entry.key) && _sameJson(entry.value, after[entry.key]),
        );
  }
  if (before is List<Object?> && after is List<Object?>) {
    if (before.length != after.length) return false;
    for (var index = 0; index < before.length; index++) {
      if (!_sameJson(before[index], after[index])) return false;
    }
    return true;
  }
  return false;
}
