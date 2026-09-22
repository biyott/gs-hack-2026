import '../models/guidance_event.dart';
import '../models/guidance_state.dart';
import 'guidance_ports.dart';

String? guidanceVoiceResponse(SpeechStatus status) => switch (status) {
  SpeechStatus.playing => 'voice-started',
  SpeechStatus.completed => 'voice-completed',
  SpeechStatus.failed => 'voice-failed',
  SpeechStatus.unsupported => 'voice-unsupported',
  _ => null,
};

class GuidanceAcknowledgements {
  GuidanceAcknowledgements(this.port, this.now);
  final AckPort port;
  final DateTime Function() now;
  final Map<String, AcknowledgementStatus> _statuses = {};
  final Map<String, GuidanceAcknowledgement> _requests = {};
  int _generation = 0;

  Future<void> send(
    GuidanceEvent event,
    String response,
    void Function(String, AcknowledgementStatus) report,
  ) async {
    final version = response.startsWith('voice-') ? event.primaryGuidanceVersion : event.guidanceVersion;
    final key = '${event.runId}/${event.guidanceId}/$version/$response';
    if (_statuses[key] == AcknowledgementStatus.sent || _statuses[key] == AcknowledgementStatus.pending) {
      return;
    }
    final generation = _generation;
    final request = _requests.putIfAbsent(
      key,
      () => GuidanceAcknowledgement(
        workerId: event.workerId,
        runId: event.runId,
        incidentId: event.incidentId,
        guidanceId: event.guidanceId,
        guidanceVersion: version,
        mode: event.simulationMode,
        response: response,
        requestId: 'mobile/$key',
        occurredAt: now(),
      ),
    );
    _statuses[key] = AcknowledgementStatus.pending;
    report(response, AcknowledgementStatus.pending);
    try {
      await port.send(request);
      if (generation != _generation) return;
      _statuses[key] = AcknowledgementStatus.sent;
      report(response, AcknowledgementStatus.sent);
    } catch (_) {
      if (generation != _generation) return;
      _statuses[key] = AcknowledgementStatus.failed;
      report(response, AcknowledgementStatus.failed);
    }
  }

  void clear() {
    _generation++;
    _statuses.clear();
    _requests.clear();
  }
}
