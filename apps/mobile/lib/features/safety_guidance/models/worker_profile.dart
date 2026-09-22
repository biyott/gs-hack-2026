import 'json_read.dart';

class WorkerSpeedRange {
  const WorkerSpeedRange({required this.min, required this.max});
  final double min;
  final double max;

  factory WorkerSpeedRange.fromJson(Map<String, Object?> json) {
    final read = JsonRead(json);
    final min = read.number('min', min: 0);
    final max = read.number('max', positive: true);
    if (min > max) throw const FormatException('Speed minimum exceeds maximum');
    return WorkerSpeedRange(min: min, max: max);
  }

  Map<String, Object?> toJson() => Map.unmodifiable({'min': min, 'max': max});
}

class WorkerNotificationPreferences {
  const WorkerNotificationPreferences({required this.voice, required this.vibration});
  final bool voice;
  final bool vibration;

  factory WorkerNotificationPreferences.fromJson(Map<String, Object?> json) {
    final read = JsonRead(json);
    return WorkerNotificationPreferences(voice: read.boolean('voice'), vibration: read.boolean('vibration'));
  }

  Map<String, Object?> toJson() => Map.unmodifiable({'voice': voice, 'vibration': vibration});
}

class WorkerProfile {
  const WorkerProfile({
    required this.workerId,
    required this.version,
    required this.preferredLocale,
    required this.locale,
    required this.canUseStairs,
    required this.speedMps,
    required this.needsAssistance,
    required this.needsCompanion,
    required this.notificationPreferences,
    required this.confirmedAt,
  });
  final String workerId;
  final int version;
  final String? preferredLocale;
  final String locale;
  final bool? canUseStairs;
  final WorkerSpeedRange? speedMps;
  final bool? needsAssistance;
  final bool? needsCompanion;
  final WorkerNotificationPreferences notificationPreferences;
  final DateTime? confirmedAt;

  factory WorkerProfile.fromJson(Map<String, Object?> json) {
    final read = JsonRead(json);
    final speed = read.nullableObject('speedMps');
    return WorkerProfile(
      workerId: read.string('workerId', nonEmpty: true),
      version: read.integer('version', positive: true),
      preferredLocale: read.nullableString('preferredLocale', nonEmpty: true),
      locale: read.enumString('locale', {'ko', 'en'}),
      canUseStairs: read.nullableBoolean('canUseStairs'),
      speedMps: speed == null ? null : WorkerSpeedRange.fromJson(speed),
      needsAssistance: read.nullableBoolean('needsAssistance'),
      needsCompanion: read.nullableBoolean('needsCompanion'),
      notificationPreferences: WorkerNotificationPreferences.fromJson(read.object('notificationPreferences')),
      confirmedAt: read.nullableDateTime('confirmedAt'),
    );
  }

  Map<String, Object?> toJson() => Map.unmodifiable({
    'workerId': workerId,
    'version': version,
    'preferredLocale': preferredLocale,
    'locale': locale,
    'canUseStairs': canUseStairs,
    'speedMps': speedMps?.toJson(),
    'needsAssistance': needsAssistance,
    'needsCompanion': needsCompanion,
    'notificationPreferences': notificationPreferences.toJson(),
    'confirmedAt': confirmedAt?.toUtc().toIso8601String(),
  });
}
