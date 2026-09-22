import 'json_read.dart';

class WorkerPosition {
  const WorkerPosition({
    required this.workerId,
    required this.x,
    required this.y,
    required this.positionSource,
    required this.positionStatus,
    required this.lastObservedAt,
  });

  final String workerId;
  final double? x;
  final double? y;
  final String positionSource;
  final String positionStatus;
  final DateTime? lastObservedAt;

  bool get hasKnownPosition => positionStatus == 'known' && x != null && y != null;

  factory WorkerPosition.fromJson(Map<String, Object?> json) {
    final read = JsonRead(json);
    final point = read.nullableObject('position');
    final coordinates = point == null ? null : JsonRead(point);
    return WorkerPosition(
      workerId: read.string('workerId', nonEmpty: true),
      x: coordinates?.number('x'),
      y: coordinates?.number('y'),
      positionSource: read.enumString('positionSource', {'mock', 'video', 'uwb', 'manual'}),
      positionStatus: read.enumString('positionStatus', {'known', 'unknown', 'stale'}),
      lastObservedAt: read.nullableDateTime('lastObservedAt'),
    );
  }

  Map<String, Object?> toJson() => Map.unmodifiable({
    'workerId': workerId,
    'position': x == null || y == null ? null : Map<String, Object?>.unmodifiable({'x': x, 'y': y}),
    'positionSource': positionSource,
    'positionStatus': positionStatus,
    'lastObservedAt': lastObservedAt?.toUtc().toIso8601String(),
  });
}
