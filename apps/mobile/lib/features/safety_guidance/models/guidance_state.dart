import 'guidance_event.dart';

enum SpeechStatus { idle, preparing, playing, completed, failed, unsupported, cancelled, disabled }

enum VibrationStatus { idle, active, unavailable, failed, disabled }

enum GuidanceValidity { waiting, valid, expired, mapMismatch, profileMismatch }

enum GuidanceConnection { connecting, connected, disconnected }

enum AcknowledgementStatus { pending, sent, failed }

enum GuidanceRejection {
  wrongWorker,
  wrongRun,
  mapMismatch,
  profileMismatch,
  expired,
  future,
  duplicate,
  outOfOrder,
  invalidSupplement,
}

class GuidanceState {
  GuidanceState({
    this.current,
    this.message = '',
    this.locale = 'en',
    this.usedLocaleFallback = false,
    this.validity = GuidanceValidity.waiting,
    this.speech = SpeechStatus.idle,
    this.playbackGuidanceId,
    this.playbackGuidanceVersion,
    this.playbackSpeech = SpeechStatus.idle,
    this.vibration = VibrationStatus.idle,
    this.connection = GuidanceConnection.connecting,
    this.lastUpdatedAt,
    Map<String, AcknowledgementStatus> acknowledgements = const {},
  }) : acknowledgements = Map.unmodifiable(acknowledgements);

  final GuidanceEvent? current;
  final String message;
  final String locale;
  final bool usedLocaleFallback;
  final GuidanceValidity validity;
  final SpeechStatus speech;
  final String? playbackGuidanceId;
  final int? playbackGuidanceVersion;
  final SpeechStatus playbackSpeech;
  final VibrationStatus vibration;
  final GuidanceConnection connection;
  final DateTime? lastUpdatedAt;
  final Map<String, AcknowledgementStatus> acknowledgements;

  List<GuidanceWaypoint> get route =>
      validity == GuidanceValidity.valid && connection != GuidanceConnection.disconnected
      ? current?.waypoints ?? const []
      : const [];
  String? get destinationId =>
      validity == GuidanceValidity.valid && connection != GuidanceConnection.disconnected
      ? current?.destinationId
      : null;
  bool get canRespond => current != null && validity == GuidanceValidity.valid;

  GuidanceState copyWith({
    SpeechStatus? speech,
    SpeechStatus? playbackSpeech,
    String? playbackGuidanceId,
    int? playbackGuidanceVersion,
    VibrationStatus? vibration,
    GuidanceValidity? validity,
    GuidanceConnection? connection,
    Map<String, AcknowledgementStatus>? acknowledgements,
  }) => GuidanceState(
    current: current,
    message: message,
    locale: locale,
    usedLocaleFallback: usedLocaleFallback,
    validity: validity ?? this.validity,
    speech: speech ?? this.speech,
    playbackGuidanceId: playbackGuidanceId ?? this.playbackGuidanceId,
    playbackGuidanceVersion: playbackGuidanceVersion ?? this.playbackGuidanceVersion,
    playbackSpeech: playbackSpeech ?? this.playbackSpeech,
    vibration: vibration ?? this.vibration,
    connection: connection ?? this.connection,
    lastUpdatedAt: lastUpdatedAt,
    acknowledgements: acknowledgements ?? this.acknowledgements,
  );
}
