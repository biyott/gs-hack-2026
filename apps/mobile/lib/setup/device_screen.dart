import 'dart:async';

import 'package:flutter/material.dart';

import '../features/safety_guidance/presentation/safety_primitives.dart';
import '../features/safety_guidance/presentation/safety_text.dart';
import '../features/safety_guidance/presentation/worker_view_data.dart';
import '../session/mobile_session_controller.dart';
import '../theme/safety_theme.dart';
import '../tracking/device_tracking_controller.dart';

class DeviceScreen extends StatelessWidget {
  const DeviceScreen({
    required this.session,
    required this.tracking,
    this.workerTools = false,
    this.onLogout,
    super.key,
  });
  final MobileSessionController session;
  final DeviceTrackingController tracking;
  final bool workerTools;
  final Future<void> Function()? onLogout;

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: Listenable.merge([session, tracking]),
    builder: (context, _) {
      final camera = session.preview;
      return Scaffold(
        appBar: AppBar(title: SafetyText('SIMULATION')),
        body: SafeArea(
          child: ListView(
            padding: const EdgeInsets.all(SafetySpacing.lg),
            children: [
              SafetyText(
                session.deviceRole == 'CCTV'
                    ? '현장 카메라 / Site camera'
                    : '기기 준비 상태 / Device readiness',
                style: SafetyTypography.title,
              ),
              const SizedBox(height: SafetySpacing.sm),
              SafetyText(
                _roleLabel(session.deviceRole),
                style: SafetyTypography.body,
              ),
              const SizedBox(height: SafetySpacing.sm),
              SafetyText(
                session.connected
                    ? '서버 연결됨 / Server connected'
                    : '서버 연결 끊김 / Server disconnected',
                style: SafetyTypography.body.copyWith(
                  color: session.connected
                      ? SafetyColors.safe
                      : SafetyColors.caution,
                ),
              ),
              const SizedBox(height: SafetySpacing.lg),
              SafetyStatusBadge(
                label: _trackingLabel(tracking.state),
                tone: tracking.state == TrackingState.failed
                    ? SafetyTone.danger
                    : SafetyTone.info,
              ),
              const SizedBox(height: SafetySpacing.lg),
              _observationStatus(),
              const SizedBox(height: SafetySpacing.lg),
              _clockStatus(),
              if (tracking.state == TrackingState.waiting) ...[
                const SizedBox(height: SafetySpacing.lg),
                SafetyPanel(
                  title: '기기 연결 대기 / Waiting for devices',
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (tracking.waitingRoles.isEmpty)
                        SafetyText(
                          '서버의 역할 등록 정보를 기다리고 있습니다.\nWaiting for role registration from the server.',
                        ),
                      for (final role in tracking.waitingRoles) ...[
                        SafetyText(
                          _roleLabel(role),
                          style: SafetyTypography.body,
                        ),
                        const SizedBox(height: SafetySpacing.sm),
                      ],
                      SafetyText(
                        '각 기기에서 해당 역할로 연결하세요.\nConnect each device using its assigned role.',
                        style: SafetyTypography.small,
                      ),
                    ],
                  ),
                ),
              ],
              if (tracking.error case final String error) ...[
                const SizedBox(height: SafetySpacing.sm),
                SafetyText(
                  error,
                  style: SafetyTypography.body.copyWith(
                    color: SafetyColors.danger,
                  ),
                ),
              ],
              if (session.error case final String error) ...[
                const SizedBox(height: SafetySpacing.sm),
                SafetyText(error),
              ],
              const SizedBox(height: SafetySpacing.lg),
              if (camera != null)
                AspectRatio(
                  aspectRatio: camera.rotationDegrees % 180 == 0
                      ? camera.width / camera.height
                      : camera.height / camera.width,
                  child: RotatedBox(
                    quarterTurns: camera.rotationDegrees ~/ 90,
                    child: Texture(textureId: camera.textureId),
                  ),
                ),
              if (session.deviceRole == 'CCTV') ...[
                const SizedBox(height: SafetySpacing.sm),
                SafetyText(
                  '후면 카메라 · JPEG 목표 8 fps\nRear camera · JPEG target 8 fps',
                ),
                SafetyText(
                  '실제 수신률·지연은 관제에서 확인합니다.\nActual received rate and latency are reported by the console.',
                ),
              ],
              const SizedBox(height: SafetySpacing.lg),
              for (final entry in tracking.latestMeasurements.entries)
                Padding(
                  padding: const EdgeInsets.only(bottom: SafetySpacing.sm),
                  child: SafetyText(
                    '${entry.key}: ${entry.value.distanceM?.toStringAsFixed(3) ?? '미확인 / Unknown'} m\n'
                    'UWB 안테나 거리 / Antenna distance · ${entry.value.capturedAt.toLocal()}\n'
                    '${_measurementFresh(entry.value.capturedAt) ? '최신 측정 / Current observation' : '오래된 측정 / Stale observation'}',
                  ),
                ),
              if (session.deviceRole != 'CCTV')
                SafetyText(
                  '동시 측정 필수 기기:\n장비와 두 작업자\n'
                  'One controller and two workers are required for simultaneous ranging.\n'
                  '거리만으로 지도 위치를 만들지 않습니다.\nDistance alone does not determine a map position.',
                ),
              const SizedBox(height: SafetySpacing.xxl),
              Wrap(
                spacing: SafetySpacing.sm,
                runSpacing: SafetySpacing.sm,
                children: [
                  FilledButton.icon(
                    onPressed: () => unawaited(tracking.start()),
                    icon: const Icon(Icons.play_arrow),
                    label: SafetyText('준비·다시 시도 / Start'),
                  ),
                  OutlinedButton.icon(
                    onPressed: () => unawaited(tracking.stop()),
                    icon: const Icon(Icons.stop),
                    label: SafetyText('측정 중지 / Stop'),
                  ),
                  OutlinedButton.icon(
                    onPressed: () => unawaited(session.refreshCapabilities()),
                    icon: const Icon(Icons.refresh),
                    label: SafetyText('기능 확인 / Refresh'),
                  ),
                ],
              ),
              const SizedBox(height: SafetySpacing.xxl),
              ExpansionTile(
                title: SafetyText('기기 기능 및 권한 / Capabilities and permissions'),
                children: [
                  for (final entry in session.capabilities.entries)
                    ListTile(
                      title: SafetyText(entry.key),
                      subtitle: SafetyText('${entry.value}'),
                    ),
                ],
              ),
              const SizedBox(height: SafetySpacing.xxl),
              OutlinedButton(
                onPressed: () async {
                  final logout = onLogout;
                  if (logout != null) {
                    await logout();
                  } else {
                    await tracking.stop();
                    await session.logout();
                  }
                  if (workerTools && context.mounted) {
                    Navigator.of(context).pop();
                  }
                },
                child: SafetyText('역할 다시 선택 / Reselect role'),
              ),
              const SizedBox(height: SafetySpacing.lg),
              SafetyText(
                '시뮬레이션 전용\n화면 켜짐 · 전경 실행\nSimulation only · Screen on / Foreground',
              ),
            ],
          ),
        ),
      );
    },
  );

  Widget _observationStatus() {
    final observed = tracking.lastObservedAt;
    final fresh = session.connected && tracking.isFresh;
    final label = observed == null
        ? '아직 입력 없음 / No observation yet'
        : fresh
        ? '최근 입력 최신 / Latest input is current'
        : '최근 입력 오래됨 / Latest input is stale';
    return SafetyPanel(
      title: '입력 상태 / Observation status',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SafetyStatusBadge(
            label: label,
            tone: fresh ? SafetyTone.info : SafetyTone.caution,
          ),
          const SizedBox(height: SafetySpacing.sm),
          SafetyText(
            '출처 / Source: ${tracking.source}',
            style: SafetyTypography.small,
          ),
          SafetyText(
            '마지막 관측 / Last observed:\n${observed?.toLocal().toString() ?? '미확인 / Unknown'}',
            style: SafetyTypography.small,
          ),
        ],
      ),
    );
  }

  Widget _clockStatus() {
    final uncertainty = tracking.clockUncertaintyMs;
    final known =
        uncertainty != null && uncertainty.isFinite && uncertainty >= 0;
    final inconclusive = !known || uncertainty > 50;
    return SafetyPanel(
      title: '시계 동기화 / Clock synchronization',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SafetyText(
            '시계 불확실도 / Clock uncertainty:',
            style: SafetyTypography.body,
          ),
          SafetyText(
            known ? '${uncertainty.toStringAsFixed(3)} ms' : '미확인 / Unknown',
            style: SafetyTypography.body,
          ),
          const SizedBox(height: SafetySpacing.sm),
          if (inconclusive)
            SafetyStatusBadge(
              label: '지연 판정 불가 / Latency inconclusive',
              tone: SafetyTone.caution,
            ),
          const SizedBox(height: SafetySpacing.sm),
          SafetyText(
            known && uncertainty > 50
                ? '불확실도가 50 ms를 넘습니다. 연결을 다시 시도하고 시계를 동기화하세요.\nClock uncertainty exceeds 50 ms. Retry the connection to synchronize clocks.'
                : !known
                ? '시계 동기화 정보를 기다리고 있습니다.\nWaiting for a clock synchronization estimate.'
                : '처리 지연은 실제 프레임 수신 기록으로 판정합니다.\nAssess processing latency from actual received-frame records.',
            style: SafetyTypography.small,
          ),
        ],
      ),
    );
  }

  bool _measurementFresh(DateTime observed) {
    final age = DateTime.now().toUtc().difference(observed).inMilliseconds;
    return session.connected && tracking.isRunning && age >= 0 && age <= 1000;
  }

  String _roleLabel(String? role) => switch (role) {
    'EQUIPMENT' => '장비 / Equipment · EQUIPMENT · Controller',
    'WORKER_1' => '작업자 1 / Worker 1 · WORKER-A · Controlee',
    'WORKER_2' => '작업자 2 / Worker 2 · WORKER-B · Controlee',
    'CCTV' => '현장 카메라 / Site camera · CCTV',
    null => '역할 미선택 / No role selected',
    _ => role,
  };

  String _trackingLabel(TrackingState state) => switch (state) {
    TrackingState.idle => '측정 대기 / Idle',
    TrackingState.preparing => '기기 준비 중 / Preparing',
    TrackingState.waiting => '필수 기기 대기 / Waiting for required devices',
    TrackingState.starting => '측정 시작 중 / Starting',
    TrackingState.running => '측정 실행 중 / Running',
    TrackingState.suspended => '전경 복귀 대기 / Suspended in background',
    TrackingState.failed => '측정 실패 / Tracking failed',
  };
}
