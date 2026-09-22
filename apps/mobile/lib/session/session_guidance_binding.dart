import 'package:flutter/foundation.dart';

import '../features/safety_guidance/application/guidance_coordinator.dart';
import '../features/safety_guidance/application/guidance_ports.dart';
import '../features/safety_guidance/data/guidance_api_service.dart';
import '../features/safety_guidance/models/guidance_context.dart';
import '../features/safety_guidance/models/guidance_event.dart';
import '../features/safety_guidance/models/guidance_state.dart';
import '../features/safety_guidance/presentation/site_map_data.dart';
import '../services/guidance_ack_service.dart';
import 'session_snapshot.dart';

class SessionGuidanceBinding {
  SessionGuidanceBinding({
    required this.api,
    required this.speech,
    required this.alert,
    required this.vibration,
    required this.onChanged,
  });

  final GuidanceApiService api;
  final SpeechPort speech;
  final AlertPort alert;
  final VibrationPort vibration;
  final VoidCallback onChanged;
  GuidanceCoordinator? coordinator;
  final Map<String, GuidanceEvent> _firstGuidance = {};
  String? error;

  GuidanceEvent? get firstGuidance {
    final current = coordinator?.state.current;
    return current == null
        ? null
        : _firstGuidance['${current.runId}:${current.incidentId}'];
  }

  void accept(SessionSnapshot snapshot, bool connected) {
    final workerId = snapshot.workerId;
    final profile = snapshot.profile;
    error = null;
    if (workerId == null || profile == null) return;
    final context = GuidanceContext(
      workerId: workerId,
      runId: snapshot.runId,
      mapId: SiteMapOverlay.expectedSiteId,
      mapVersion: SiteMapOverlay.expectedMapVersion,
      floorId: SiteMapOverlay.expectedFloorId,
      profileVersion: profile.version,
    );
    var current = coordinator;
    if (current == null) {
      current = GuidanceCoordinator(
        context: context,
        speech: speech,
        alert: alert,
        vibration: vibration,
        acknowledgements: GuidanceAckService(api),
      );
      coordinator = current;
      current.addListener(onChanged);
    } else if (current.context.runId != context.runId ||
        current.context.profileVersion != context.profileVersion ||
        current.context.workerId != context.workerId) {
      if (current.context.runId != context.runId) _firstGuidance.clear();
      current.reset(context);
    }
    current.setPlaybackEnabled(snapshot.run['status'] == 'running');
    current.setConnectionStatus(
      connected ? GuidanceConnection.connected : GuidanceConnection.connecting,
    );
    current.updatePositions(snapshot.positions);
    if (!snapshot.mapCompatible) {
      current.clearCurrent();
      error =
          'The server map does not match SITE-CONSTRUCTION-01 / 1.0.0 / GROUND';
      return;
    }
    final event = snapshot.event;
    if (event == null) {
      current.clearCurrent();
      return;
    }
    if (event.actionCode == 'FOLLOW_VALIDATED_ROUTE' &&
        !snapshot.supportsMovement(event)) {
      current.clearCurrent();
      error =
          'Movement guidance requires a current position and a valid site route';
      return;
    }
    final key = '${event.runId}:${event.incidentId}';
    final first = snapshot.firstGuidance(event.incidentId);
    if (first != null) _firstGuidance.putIfAbsent(key, () => first);
    final rejection = current.accept(event);
    if (rejection != null &&
        rejection != GuidanceRejection.duplicate &&
        rejection != GuidanceRejection.outOfOrder) {
      error = 'Current guidance was rejected: ${rejection.name}';
    }
  }

  void dispose() {
    coordinator?.removeListener(onChanged);
    coordinator?.dispose();
    coordinator = null;
    _firstGuidance.clear();
  }
}
