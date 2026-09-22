import 'package:flutter/foundation.dart';

@immutable
class MapPoint {
  const MapPoint(this.x, this.y);

  final double x;
  final double y;

  bool get isFinite => x.isFinite && y.isFinite;
  bool get isOnSite => isFinite && x >= 0 && x <= 140 && y >= 0 && y <= 50;
}

enum MapRiskLevel { danger, caution }

/// Polygon coordinates come from the server hazard snapshot, in local meters.
@immutable
class MapRiskRegion {
  const MapRiskRegion({
    required this.id,
    required this.vertices,
    required this.level,
    required this.label,
  });

  final String id;
  final List<MapPoint> vertices;
  final MapRiskLevel level;
  final String label;
}

@immutable
class SiteMapOverlay {
  const SiteMapOverlay({
    required this.siteId,
    required this.mapVersion,
    required this.floorId,
    required this.connected,
    required this.positionFresh,
    required this.guidanceCurrent,
    this.guidanceExpired = false,
    this.ownPosition,
    this.route = const [],
    this.risks = const [],
  });

  static const expectedSiteId = 'SITE-CONSTRUCTION-01';
  static const expectedMapVersion = '1.0.0';
  static const expectedFloorId = 'GROUND';

  final String siteId;
  final String mapVersion;
  final String floorId;
  final bool connected;
  final bool positionFresh;
  final bool guidanceCurrent;
  final bool guidanceExpired;
  final MapPoint? ownPosition;
  final List<MapPoint> route;
  final List<MapRiskRegion> risks;

  bool get mapCompatible =>
      siteId == expectedSiteId &&
      mapVersion == expectedMapVersion &&
      floorId == expectedFloorId;

  bool get hasVisibleRoute =>
      mapCompatible &&
      connected &&
      positionFresh &&
      ownPosition?.isOnSite == true &&
      guidanceCurrent &&
      !guidanceExpired &&
      route.length >= 2 &&
      route.every((point) => point.isOnSite);
}
