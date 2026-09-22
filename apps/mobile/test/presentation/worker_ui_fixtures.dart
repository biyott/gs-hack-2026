import 'package:flutter/services.dart';
import 'package:gs_safety_mobile/features/safety_guidance/presentation/safety_worker_screen.dart';

Future<void> loadSafetyFonts() async {
  final text = FontLoader('Noto Sans KR');
  text.addFont(rootBundle.load('assets/fonts/NotoSansKR-Variable.ttf'));
  await text.load();
  final icons = FontLoader('MaterialIcons');
  icons.addFont(rootBundle.load('fonts/MaterialIcons-Regular.otf'));
  await icons.load();
}

SiteMapOverlay overlayFixture({
  bool connected = true,
  bool positionFresh = true,
  bool guidanceCurrent = true,
  bool guidanceExpired = false,
  String mapVersion = '1.0.0',
  MapPoint? position = const MapPoint(65, 25),
  List<MapPoint> route = const [
    MapPoint(65, 25),
    MapPoint(65, 8),
    MapPoint(125, 8),
  ],
}) => SiteMapOverlay(
  siteId: SiteMapOverlay.expectedSiteId,
  mapVersion: mapVersion,
  floorId: SiteMapOverlay.expectedFloorId,
  connected: connected,
  positionFresh: positionFresh,
  guidanceCurrent: guidanceCurrent,
  guidanceExpired: guidanceExpired,
  ownPosition: position,
  route: route,
  risks: const [
    MapRiskRegion(
      id: 'HZ-1',
      vertices: [
        MapPoint(45, 19),
        MapPoint(75, 19),
        MapPoint(75, 32),
        MapPoint(45, 32),
      ],
      level: MapRiskLevel.danger,
      label: '장비 접근 / Equipment approach',
    ),
  ],
);

WorkerScreenData workerFixture({
  String language = 'ko',
  bool current = true,
  bool connected = true,
  String guidanceId = 'GUIDANCE-WORKER-A-01',
  String workerId = 'WORKER-A',
  int version = 1,
  WorkerDeliveryStatus speechStatus = WorkerDeliveryStatus.active,
  List<WorkerNotice> notices = const [],
}) => WorkerScreenData(
  workerId: workerId,
  language: language,
  actionText: language == 'ko'
      ? '표시된 경로를 따라 지정된 회피 지점으로 이동하세요.'
      : 'Follow the displayed route to the designated refuge point.',
  actionTone: SafetyTone.danger,
  connected: connected,
  guidanceCurrent: current,
  positionSource: language == 'ko'
      ? '시나리오 합성 위치'
      : 'Synthetic scenario position',
  guidanceId: guidanceId,
  guidanceVersion: version,
  incidentId: 'INCIDENT-01',
  lastUpdatedLabel: '10:42:12',
  expiresAtLabel: '10:42:32',
  destinationLabel: 'REFUGE-01',
  canReplay: speechStatus != WorkerDeliveryStatus.unavailable,
  canUnderstand: true,
  canRequestHelp: connected,
  canConfirmArrival: true,
  notices: notices,
  delivery: [
    WorkerStatusItem(
      label: language == 'ko' ? '화면 표시' : 'Screen shown',
      status: WorkerDeliveryStatus.confirmed,
    ),
    WorkerStatusItem(
      label: language == 'ko' ? '음성 실행' : 'Speech playback',
      status: current ? speechStatus : WorkerDeliveryStatus.unavailable,
    ),
    WorkerStatusItem(
      label: language == 'ko' ? '기기 수신' : 'Device receipt',
      status: WorkerDeliveryStatus.confirmed,
    ),
    WorkerStatusItem(
      label: language == 'ko' ? '이해 확인' : 'Understanding',
      status: WorkerDeliveryStatus.pending,
    ),
    WorkerStatusItem(
      label: language == 'ko' ? '지원 담당자 수락' : 'Support acceptance',
      status: WorkerDeliveryStatus.pending,
    ),
    WorkerStatusItem(
      label: language == 'ko' ? '도착 확인' : 'Arrival',
      status: WorkerDeliveryStatus.pending,
    ),
  ],
);
