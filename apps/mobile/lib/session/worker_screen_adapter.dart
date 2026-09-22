import '../features/safety_guidance/application/guidance_catalog.dart';
import '../features/safety_guidance/models/guidance_event.dart';
import '../features/safety_guidance/models/guidance_state.dart';
import '../features/safety_guidance/presentation/worker_view_data.dart';
import '../l10n/safety_strings.dart';
import 'session_snapshot.dart';

WorkerScreenData workerScreenData({
  required String? workerId,
  required SessionSnapshot? snapshot,
  required GuidanceState state,
  required bool connected,
  GuidanceEvent? firstGuidance,
  String? error,
}) {
  final current = state.current;
  final profile = snapshot?.profile;
  final strings = SafetyStrings.forLocale(
    current == null ? profile?.locale ?? 'ko' : state.locale,
  );
  final usable =
      connected &&
      state.canRespond &&
      snapshot?.mapCompatible == true &&
      (current?.actionCode != 'FOLLOW_VALIDATED_ROUTE' ||
          snapshot?.supportsMovement(current!) == true);
  final worker = snapshot?.worker;
  final responseMatches =
      snapshot?.event?.guidanceId == current?.guidanceId &&
      snapshot?.event?.guidanceVersion == current?.guidanceVersion;
  final response = responseMatches
      ? (worker?['response'] as Map<String, Object?>? ??
            const <String, Object?>{})
      : <String, Object?>{};
  final incident = snapshot?.incident(current?.incidentId);
  final source = switch (worker?['positionSource']) {
    'mock' => strings.simulated,
    'video' => strings.text('카메라 관측', 'Camera observation'),
    'uwb' => strings.text('UWB 실측', 'UWB measurement'),
    'manual' => strings.text('수동 입력', 'Manual input'),
    _ => strings.unknown,
  };
  return WorkerScreenData(
    workerId: workerId ?? strings.unknown,
    language: strings.languageCode,
    actionText: usable ? state.message : strings.currentGuidanceUnavailable,
    actionTone: !usable
        ? SafetyTone.offline
        : switch (current?.priority) {
            'critical' || 'high' => SafetyTone.danger,
            'medium' => SafetyTone.caution,
            _ => SafetyTone.info,
          },
    connected: connected,
    guidanceCurrent: usable,
    guidanceId: current?.guidanceId,
    guidanceVersion: current?.guidanceVersion,
    incidentId: current?.incidentId,
    positionSource: source,
    lastUpdatedLabel: _time(state.lastUpdatedAt),
    expiresAtLabel: _time(current?.expiresAt),
    destinationLabel: usable ? current?.destinationId : null,
    canReplay:
        usable &&
        snapshot?.run['status'] == 'running' &&
        profile?.notificationPreferences.voice == true &&
        state.playbackSpeech != SpeechStatus.playing &&
        state.playbackSpeech != SpeechStatus.preparing,
    canUnderstand: usable,
    canRequestHelp: usable,
    canConfirmArrival:
        usable &&
        state.destinationId != null &&
        state.route.isNotEmpty &&
        worker?['positionStatus'] == 'known',
    firstDeliveredText: firstGuidance == null
        ? null
        : resolveGuidanceText(firstGuidance).message,
    supplementaryExplanation: usable && current?.locale == state.locale
        ? current?.supplementalExplanation
        : null,
    explanationSource: current == null || current.evidence.isEmpty
        ? null
        : current.evidence
              .map(
                (item) =>
                    '${item.documentId} v${item.documentVersion} · ${item.chunkId}',
              )
              .join('\n'),
    profileLabel: profile == null
        ? strings.profileUnverified
        : '${strings.profileVersion} ${profile.version} · ${profile.confirmedAt == null ? strings.profileUnverified : strings.confirmed}',
    delivery: _delivery(state, response, incident, strings),
    notices: [
      if (!connected)
        WorkerNotice(
          title: strings.disconnected,
          detail: strings.connectionLost,
          tone: SafetyTone.offline,
        ),
      if (snapshot?.mapCompatible == false ||
          state.validity == GuidanceValidity.mapMismatch)
        WorkerNotice(
          title: strings.mapMismatch,
          detail: strings.routeUnavailable,
          tone: SafetyTone.danger,
        ),
      if (state.validity == GuidanceValidity.expired)
        WorkerNotice(
          title: strings.guidanceExpired,
          detail: strings.waitingForGuidance,
          tone: SafetyTone.caution,
        ),
      if (state.validity == GuidanceValidity.profileMismatch)
        WorkerNotice(
          title: strings.text('프로필 버전 불일치', 'Profile version mismatch'),
          detail: strings.currentGuidanceUnavailable,
          tone: SafetyTone.caution,
        ),
      if (worker?['positionStatus'] != 'known')
        WorkerNotice(
          title: worker?['positionStatus'] == 'stale'
              ? strings.stalePosition
              : strings.positionUnknown,
          detail: strings.noPositionOrRoute,
          tone: SafetyTone.caution,
        ),
      if (state.usedLocaleFallback)
        WorkerNotice(
          title: strings.language,
          detail: strings.englishFallback,
          tone: SafetyTone.info,
        ),
      if (error != null)
        WorkerNotice(
          title: strings.text('상태 확인 필요', 'Status needs attention'),
          detail: error,
          tone: SafetyTone.caution,
        ),
    ],
  );
}

String? _time(DateTime? value) {
  if (value == null) return null;
  final local = value.toLocal();
  String pad(int n) => n.toString().padLeft(2, '0');
  return '${pad(local.hour)}:${pad(local.minute)}:${pad(local.second)}';
}

List<WorkerStatusItem> _delivery(
  GuidanceState state,
  Map<String, Object?> response,
  Map<String, Object?>? incident,
  SafetyStrings s,
) {
  WorkerDeliveryStatus ack(String kind, String timestamp) {
    final local = state.acknowledgements[kind];
    if (response[timestamp] != null || local == AcknowledgementStatus.sent) {
      return WorkerDeliveryStatus.confirmed;
    }
    return switch (local) {
      AcknowledgementStatus.pending => WorkerDeliveryStatus.active,
      AcknowledgementStatus.failed => WorkerDeliveryStatus.failed,
      _ => WorkerDeliveryStatus.pending,
    };
  }

  final speech = switch ((state.playbackSpeech, response['voiceStatus'])) {
    (
      SpeechStatus.completed || SpeechStatus.failed || SpeechStatus.unsupported,
      _,
    ) =>
      state.playbackSpeech.name,
    (_, 'stop-requested') => 'stop-requested',
    (SpeechStatus.cancelled, 'completed' || 'failed' || 'unsupported') =>
      response['voiceStatus']! as String,
    (SpeechStatus.idle, final String remote) => remote,
    (final local, _) => local.name,
  };
  final voiceStatus = switch (speech) {
    'preparing' || 'playing' => WorkerDeliveryStatus.active,
    'completed' => WorkerDeliveryStatus.confirmed,
    'failed' => WorkerDeliveryStatus.failed,
    'unsupported' ||
    'cancelled' ||
    'disabled' => WorkerDeliveryStatus.unavailable,
    _ => WorkerDeliveryStatus.pending,
  };
  return [
    WorkerStatusItem(label: s.receipt, status: ack('received', 'receivedAt')),
    WorkerStatusItem(
      label: s.screenOutput,
      status: ack('displayed', 'displayedAt'),
    ),
    WorkerStatusItem(
      label: s.audioOutput,
      status: voiceStatus,
      detail: switch (speech) {
        'stop-requested' => s.text(
          '중지 요청됨 · 기기 결과 미확인',
          'Stop requested · device outcome unconfirmed',
        ),
        'disabled' => s.text('프로필 설정에서 꺼짐', 'Disabled in profile'),
        _ => s.statusLabel(speech == 'idle' ? 'pending' : speech),
      },
    ),
    WorkerStatusItem(
      label: s.vibrationOutput,
      status: switch (state.vibration) {
        VibrationStatus.active => WorkerDeliveryStatus.active,
        VibrationStatus.failed => WorkerDeliveryStatus.failed,
        VibrationStatus.disabled ||
        VibrationStatus.unavailable => WorkerDeliveryStatus.unavailable,
        VibrationStatus.idle => WorkerDeliveryStatus.pending,
      },
      detail: state.vibration == VibrationStatus.disabled
          ? s.text('프로필 설정에서 꺼짐', 'Disabled in profile')
          : null,
    ),
    WorkerStatusItem(
      label: s.understanding,
      status: ack('understood', 'understoodAt'),
    ),
    WorkerStatusItem(
      label: s.assistanceRequest,
      status: ack('help-requested', 'helpRequestedAt'),
    ),
    WorkerStatusItem(
      label: s.assistanceAcceptance,
      status:
          incident?['supportStatus'] == 'accepted' ||
              incident?['supportStatus'] == 'completed'
          ? WorkerDeliveryStatus.confirmed
          : incident?['supportStatus'] == 'assigned'
          ? WorkerDeliveryStatus.active
          : WorkerDeliveryStatus.pending,
      detail: incident?['assignedTo'] as String?,
    ),
    WorkerStatusItem(label: s.arrival, status: ack('arrived', 'arrivedAt')),
  ];
}
