import 'package:flutter_test/flutter_test.dart';
import 'package:gs_safety_mobile/features/safety_guidance/models/guidance_state.dart';
import 'package:gs_safety_mobile/features/safety_guidance/presentation/worker_view_data.dart';
import 'package:gs_safety_mobile/session/session_snapshot.dart';
import 'package:gs_safety_mobile/session/worker_screen_adapter.dart';

import 'guidance_fixtures.dart';

void main() {
  for (final locale in ['ko', 'en']) {
    test('server stop intent is explicitly unconfirmed in $locale', () {
      for (final local in [
        SpeechStatus.idle,
        SpeechStatus.preparing,
        SpeechStatus.playing,
        SpeechStatus.cancelled,
      ]) {
        final item = voiceItem(locale: locale, local: local);
        expect(item.status, WorkerDeliveryStatus.pending);
        expect(
          item.detail,
          locale == 'ko'
              ? '중지 요청됨 · 기기 결과 미확인'
              : 'Stop requested · device outcome unconfirmed',
        );
      }
    });
  }

  test('actual local terminal results survive a remote stop request', () {
    for (final local in [SpeechStatus.completed, SpeechStatus.failed]) {
      final item = voiceItem(local: local);
      expect(
        item.status,
        local == SpeechStatus.completed
            ? WorkerDeliveryStatus.confirmed
            : WorkerDeliveryStatus.failed,
      );
      expect(item.detail, local == SpeechStatus.completed ? '완료' : '실패');
    }
  });

  test(
    'server terminal facts survive local pause cancellation bookkeeping',
    () {
      for (final remote in ['completed', 'failed']) {
        final item = voiceItem(local: SpeechStatus.cancelled, remote: remote);
        expect(
          item.status,
          remote == 'completed'
              ? WorkerDeliveryStatus.confirmed
              : WorkerDeliveryStatus.failed,
        );
        expect(item.detail, remote == 'completed' ? '완료' : '실패');
      }
    },
  );

  test('missing and null stop timestamp do not imply a stop request', () {
    for (final response in [
      <String, Object?>{'voiceStatus': 'pending'},
      <String, Object?>{'voiceStatus': 'pending', 'voiceStopRequestedAt': null},
    ]) {
      final item = voiceItem(response: response);
      expect(item.status, WorkerDeliveryStatus.pending);
      expect(item.detail, '대기 중');
    }
  });

  test('durable stop timestamp never overrides completed voice facts', () {
    final item = voiceItem(
      response: {
        'voiceStatus': 'completed',
        'voiceStopRequestedAt': '2030-01-02T03:04:00Z',
      },
    );
    expect(item.status, WorkerDeliveryStatus.confirmed);
    expect(item.detail, '완료');
  });

  test(
    'response from a different guidance version cannot alter local voice',
    () {
      final item = voiceItem(local: SpeechStatus.playing, responseVersion: 2);
      expect(item.status, WorkerDeliveryStatus.active);
      expect(item.detail, '실행 중');
    },
  );
}

WorkerStatusItem voiceItem({
  String locale = 'ko',
  SpeechStatus local = SpeechStatus.idle,
  String remote = 'stop-requested',
  int responseVersion = 1,
  Map<String, Object?>? response,
}) {
  final current = guidance(overrides: {'locale': locale});
  final snapshot = SessionSnapshot({
    'run': {
      'runId': 'run-1',
      'mapId': 'SITE-CONSTRUCTION-01',
      'mapVersion': '1.0.0',
      'status': 'paused',
    },
    'workers': [
      {
        'workerId': 'WORKER-A',
        'profile': profileJson(overrides: {'locale': locale}),
        'position': {'x': 1, 'y': 2},
        'positionSource': 'mock',
        'positionStatus': 'known',
        'lastObservedAt': '2030-01-02T03:04:00Z',
        'currentGuidance': guidanceJson(version: responseVersion),
        'response': response ?? {'voiceStatus': remote},
      },
    ],
    'incidents': <Object?>[],
    'hazards': <Object?>[],
  }, 'WORKER-A');
  final data = workerScreenData(
    workerId: 'WORKER-A',
    snapshot: snapshot,
    state: GuidanceState(
      current: current,
      locale: locale,
      playbackSpeech: local,
      validity: GuidanceValidity.valid,
      connection: GuidanceConnection.connected,
    ),
    connected: true,
  );
  return data.delivery.firstWhere(
    (item) => item.label == (locale == 'ko' ? '음성 안내' : 'Voice guidance'),
  );
}
