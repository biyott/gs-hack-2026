import 'package:flutter_test/flutter_test.dart';
import 'package:gs_safety_mobile/features/safety_guidance/models/guidance_state.dart';

import 'guidance_fixtures.dart';

void main() {
  late GuidanceRig rig;
  setUp(() {
    rig = GuidanceRig();
  });
  tearDown(() {
    rig.dispose();
  });

  test('display ACK waits for the actual current frame and deduplicates rebuilds', () async {
    rig.coordinator.accept(guidance());
    await settle();
    expect(rig.ack.values.where((ack) => ack.response == 'displayed'), isEmpty);
    await rig.coordinator.markDisplayed(guidanceId: 'guidance-1', guidanceVersion: 9);
    expect(rig.ack.values.where((ack) => ack.response == 'displayed'), isEmpty);
    await rig.coordinator.markDisplayed(guidanceId: 'guidance-1', guidanceVersion: 1);
    await rig.coordinator.markDisplayed(guidanceId: 'guidance-1', guidanceVersion: 1);
    expect(rig.ack.values.where((ack) => ack.response == 'displayed'), hasLength(1));
  });

  test('receipt failure never blocks understanding, help, or arrival responses', () async {
    rig.ack.failures.add('received');
    rig.coordinator.accept(guidance());
    await settle();
    await rig.coordinator.confirmUnderstanding();
    await rig.coordinator.requestHelp();
    await rig.coordinator.confirmArrival();
    expect(rig.coordinator.state.acknowledgements['received'], AcknowledgementStatus.failed);
    for (final response in ['understood', 'help-requested', 'arrived']) {
      expect(rig.coordinator.state.acknowledgements[response], AcknowledgementStatus.sent);
    }
    expect(rig.coordinator.state.speech, SpeechStatus.playing);
  });

  test('failed user response retry keeps the same idempotency request', () async {
    rig.coordinator.accept(guidance());
    await settle();
    rig.ack.failures.add('help-requested');
    await rig.coordinator.requestHelp();
    rig.ack.failures.clear();
    await rig.coordinator.requestHelp();
    final requests = rig.ack.values.where((ack) => ack.response == 'help-requested').toList();
    expect(requests, hasLength(2));
    expect(requests.first.requestId, requests.last.requestId);
    expect(requests.first.occurredAt, requests.last.occurredAt);
    expect(
      requests.last.toJson().keys,
      containsAll([
        'mode',
        'runId',
        'workerId',
        'requestId',
        'incidentId',
        'guidanceId',
        'guidanceVersion',
        'response',
        'occurredAt',
      ]),
    );
  });
}
