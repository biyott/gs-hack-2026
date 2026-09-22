import 'package:flutter/foundation.dart';

enum SafetyTone { neutral, info, safe, caution, danger, offline }

enum WorkerDeliveryStatus { pending, active, confirmed, failed, unavailable }

@immutable
class WorkerStatusItem {
  const WorkerStatusItem({
    required this.label,
    required this.status,
    this.detail,
  });

  final String label;
  final WorkerDeliveryStatus status;
  final String? detail;
}

@immutable
class WorkerNotice {
  const WorkerNotice({
    required this.title,
    required this.detail,
    required this.tone,
  });

  final String title;
  final String detail;
  final SafetyTone tone;
}

/// Display data only. The server/coordinator owns validity and safety decisions.
@immutable
class WorkerScreenData {
  const WorkerScreenData({
    required this.workerId,
    required this.language,
    required this.actionText,
    required this.actionTone,
    required this.connected,
    required this.guidanceCurrent,
    required this.positionSource,
    required this.delivery,
    this.guidanceId,
    this.guidanceVersion,
    this.incidentId,
    this.lastUpdatedLabel,
    this.expiresAtLabel,
    this.destinationLabel,
    this.notices = const [],
    this.canReplay = false,
    this.canUnderstand = false,
    this.canRequestHelp = false,
    this.canConfirmArrival = false,
    this.firstDeliveredText,
    this.supplementaryExplanation,
    this.explanationSource,
    this.profileLabel,
  });

  final String workerId;
  final String language;
  final String actionText;
  final SafetyTone actionTone;
  final bool connected;
  final bool guidanceCurrent;
  final String? guidanceId;
  final int? guidanceVersion;
  final String? incidentId;
  final String positionSource;
  final String? lastUpdatedLabel;
  final String? expiresAtLabel;
  final String? destinationLabel;
  final List<WorkerStatusItem> delivery;
  final List<WorkerNotice> notices;
  final bool canReplay;
  final bool canUnderstand;
  final bool canRequestHelp;
  final bool canConfirmArrival;
  final String? firstDeliveredText;
  final String? supplementaryExplanation;
  final String? explanationSource;
  final String? profileLabel;
}

typedef GuidanceDisplayed = void Function(String guidanceId, int version);
