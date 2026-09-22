import '../features/safety_guidance/models/guidance_state.dart';
import '../features/safety_guidance/models/worker_position.dart';
import '../features/safety_guidance/presentation/site_map_data.dart';
import '../l10n/safety_strings.dart';
import 'session_snapshot.dart';

const emptySessionMap = SiteMapOverlay(
  siteId: SiteMapOverlay.expectedSiteId,
  mapVersion: SiteMapOverlay.expectedMapVersion,
  floorId: SiteMapOverlay.expectedFloorId,
  connected: false,
  positionFresh: false,
  guidanceCurrent: false,
);

SiteMapOverlay sessionMapOverlay({
  required SessionSnapshot? snapshot,
  required GuidanceState state,
  required bool connected,
}) {
  if (snapshot == null) return emptySessionMap;
  WorkerPosition? own;
  for (final position in snapshot.positions) {
    if (position.workerId == snapshot.workerId) own = position;
  }
  final strings = SafetyStrings.forLocale(
    state.current?.locale ?? snapshot.profile?.locale ?? 'ko',
  );
  return SiteMapOverlay(
    siteId: snapshot.mapId,
    mapVersion: snapshot.mapVersion,
    floorId: state.current?.floorId ?? SiteMapOverlay.expectedFloorId,
    connected: connected,
    positionFresh: own?.hasKnownPosition ?? false,
    ownPosition: own?.hasKnownPosition == true
        ? MapPoint(own!.x!, own.y!)
        : null,
    guidanceCurrent: state.canRespond,
    guidanceExpired: state.validity == GuidanceValidity.expired,
    route: List.unmodifiable(state.route.map((p) => MapPoint(p.x, p.y))),
    risks: List.unmodifiable(
      snapshot.hazards
          .where(
            (hazard) =>
                hazard['active'] == true &&
                hazard['floorId'] == SiteMapOverlay.expectedFloorId,
          )
          .map(
            (hazard) => MapRiskRegion(
              id: hazard['hazardId']! as String,
              vertices: List.unmodifiable(
                snapshotObjects(hazard['polygon']).map(
                  (p) => MapPoint(
                    (p['x']! as num).toDouble(),
                    (p['y']! as num).toDouble(),
                  ),
                ),
              ),
              level:
                  hazard['priority'] == 'low' || hazard['priority'] == 'medium'
                  ? MapRiskLevel.caution
                  : MapRiskLevel.danger,
              label: switch (hazard['hazardType']) {
                'fire' => strings.text('화재', 'Fire'),
                'gas' => strings.text('가스', 'Gas'),
                'equipment' => strings.equipment,
                'combined' => strings.text('복합 위험', 'Combined hazard'),
                _ => strings.hazardArea,
              },
            ),
          ),
    ),
  );
}
