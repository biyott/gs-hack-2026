abstract interface class SpeechPort {
  Future<void> stop();
  Future<bool> isLanguageAvailable(String locale);
  Future<void> speak(String text, String locale);
}

abstract interface class AlertPort {
  Future<void> stop();
  Future<void> play();
}

abstract interface class VibrationPort {
  Future<bool> isAvailable();
  Future<void> vibrate();
  Future<void> cancel();
}

abstract interface class AckPort {
  Future<void> send(GuidanceAcknowledgement acknowledgement);
}

class GuidanceAcknowledgement {
  const GuidanceAcknowledgement({
    required this.workerId,
    required this.runId,
    required this.incidentId,
    required this.guidanceId,
    required this.guidanceVersion,
    required this.mode,
    required this.response,
    required this.requestId,
    required this.occurredAt,
  });

  final String workerId;
  final String runId;
  final String incidentId;
  final String guidanceId;
  final int guidanceVersion;
  final String mode;
  final String response;
  final String requestId;
  final DateTime occurredAt;
  String get kind => response;
  String get clientEventId => requestId;

  Map<String, Object?> toJson() => {
    'runId': runId,
    'mode': mode,
    'workerId': workerId,
    'incidentId': incidentId,
    'guidanceId': guidanceId,
    'guidanceVersion': guidanceVersion,
    'response': response,
    'requestId': requestId,
    'occurredAt': occurredAt.toUtc().toIso8601String(),
  };
}
