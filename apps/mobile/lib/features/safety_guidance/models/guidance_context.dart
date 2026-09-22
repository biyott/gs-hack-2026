class GuidanceContext {
  const GuidanceContext({
    required this.workerId,
    required this.runId,
    required this.mapId,
    required this.mapVersion,
    required this.floorId,
    required this.profileVersion,
  });

  final String workerId;
  final String runId;
  final String mapId;
  final String mapVersion;
  final String floorId;
  final int profileVersion;
}
