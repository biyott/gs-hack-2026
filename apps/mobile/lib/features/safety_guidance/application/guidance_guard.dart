import '../models/guidance_context.dart';
import '../models/guidance_event.dart';
import '../models/guidance_state.dart';
import 'guidance_equivalence.dart';

class GuidanceGuard {
  final Set<String> _events = {};
  final Map<String, int> _versions = {};
  GuidanceEvent? _latest;

  GuidanceRejection? check(GuidanceEvent event, GuidanceContext context, DateTime now) {
    if (event.workerId != context.workerId) return GuidanceRejection.wrongWorker;
    if (event.runId != context.runId) return GuidanceRejection.wrongRun;
    if (_events.contains(event.eventId)) return GuidanceRejection.duplicate;
    final version = _versions[event.guidanceId];
    if (version != null && event.guidanceVersion <= version) {
      return GuidanceRejection.outOfOrder;
    }
    final latest = _latest;
    if (latest != null &&
        event.guidanceId == latest.guidanceId &&
        event.updateKind == 'supplement' &&
        !isSupplementOnly(latest, event)) {
      return GuidanceRejection.invalidSupplement;
    }
    if (latest != null && event.generatedAt.isBefore(latest.generatedAt)) {
      return GuidanceRejection.outOfOrder;
    }
    if (latest != null &&
        event.guidanceId == latest.guidanceId &&
        latest.routeVersion != null &&
        event.routeVersion != null &&
        event.routeVersion! < latest.routeVersion!) {
      return GuidanceRejection.outOfOrder;
    }
    if (latest != null &&
        event.generatedAt == latest.generatedAt &&
        event.guidanceId != latest.guidanceId &&
        event.guidanceVersion <= latest.guidanceVersion) {
      return GuidanceRejection.outOfOrder;
    }
    if (!event.expiresAt.isAfter(now)) return GuidanceRejection.expired;
    if (event.generatedAt.isAfter(now.add(const Duration(seconds: 5)))) {
      return GuidanceRejection.future;
    }
    if (event.mapId != context.mapId ||
        event.mapVersion != context.mapVersion ||
        event.floorId != context.floorId ||
        event.waypoints.any((point) => point.floorId != context.floorId)) {
      return GuidanceRejection.mapMismatch;
    }
    if (event.profileVersion != context.profileVersion ||
        event.profileSnapshot.workerId != context.workerId) {
      return GuidanceRejection.profileMismatch;
    }
    return null;
  }

  void record(GuidanceEvent event) {
    _events.add(event.eventId);
    _versions[event.guidanceId] = event.guidanceVersion;
    _latest = event;
  }

  void clear() {
    _events.clear();
    _versions.clear();
    _latest = null;
  }
}
