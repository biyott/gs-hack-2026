import 'package:flutter/material.dart';
import 'package:gs_safety_mobile/features/safety_guidance/presentation/safety_worker_screen.dart';
import 'package:gs_safety_mobile/theme/safety_theme.dart';

import 'worker_ui_fixtures.dart';

const priorityCaptureBoundary = Key('priority-capture');
const priorityIncidentId = 'a2b03099-e99d-4559-b286-1a808afdc131';
const priorityRunId = '224c53f2-c66d-4a24-b23b-6c604327affa';

WorkerScreenData priorityWorkerData({String language = 'ko', int version = 1}) {
  final ko = language == 'ko';
  final workerId = ko ? 'WORKER-A' : 'WORKER-B';
  final fixture = workerFixture(language: language);
  return WorkerScreenData(
    workerId: workerId,
    language: language,
    actionText: ko
        ? '표시된 유효 경로를 따라 REFUGE-01(으)로 이동하세요.'
        : 'Follow the displayed validated route to REFUGE-02.',
    actionTone: SafetyTone.danger,
    connected: true,
    guidanceCurrent: true,
    positionSource: ko ? '모의 데이터' : 'Simulated',
    guidanceId: 'GUIDANCE:$priorityRunId:$priorityIncidentId:$workerId',
    guidanceVersion: version,
    incidentId: priorityIncidentId,
    lastUpdatedLabel: '20:37:11',
    expiresAtLabel: '20:38:11',
    destinationLabel: ko ? 'REFUGE-01' : 'REFUGE-02',
    profileLabel: ko ? '프로필 버전 1 · 확인 완료' : 'Profile version 1 · Confirmed',
    canReplay: true,
    canUnderstand: true,
    canRequestHelp: true,
    canConfirmArrival: true,
    delivery: fixture.delivery,
  );
}

SiteMapOverlay priorityOverlay(String language) => overlayFixture(
  route: language == 'ko'
      ? const [
          MapPoint(65, 25),
          MapPoint(65, 8),
          MapPoint(90, 8),
          MapPoint(100, 8),
          MapPoint(125, 8),
        ]
      : const [
          MapPoint(65, 25),
          MapPoint(65, 42),
          MapPoint(90, 42),
          MapPoint(100, 42),
          MapPoint(125, 42),
        ],
);

Widget priorityWorkerHost({
  required ValueNotifier<SiteMapOverlay> overlay,
  String language = 'ko',
  int version = 1,
  double textScale = 1,
  ValueChanged<String>? onAction,
}) => RepaintBoundary(
  key: priorityCaptureBoundary,
  child: MaterialApp(
    debugShowCheckedModeBanner: false,
    theme: SafetyTheme.dark(),
    builder: (context, child) => MediaQuery(
      data: MediaQuery.of(context).copyWith(
        textScaler: TextScaler.linear(textScale),
        disableAnimations: true,
      ),
      child: child!,
    ),
    home: SafetyWorkerScreen(
      data: priorityWorkerData(language: language, version: version),
      mapOverlay: overlay,
      onReplay: () => onAction?.call('replay'),
      onUnderstood: () => onAction?.call('understood'),
      onHelp: () => onAction?.call('help'),
      onArrival: () => onAction?.call('arrival'),
      onChangeRole: () => onAction?.call('role'),
      onLocaleToggle: () => onAction?.call('locale'),
      onDeviceTools: () => onAction?.call('capabilities'),
    ),
  ),
);
