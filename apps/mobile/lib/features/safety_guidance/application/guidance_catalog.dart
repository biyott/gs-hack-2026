import '../models/guidance_event.dart';

class GuidanceText {
  const GuidanceText(this.message, this.locale, this.usedFallback);
  final String message;
  final String locale;
  final bool usedFallback;
}

GuidanceText resolveGuidanceText(GuidanceEvent event) {
  final preference = event.requestedLocale ?? event.profileSnapshot.preferredLocale;
  final language = preference?.trim().replaceAll('_', '-').toLowerCase().split('-').first;
  final supported = language == null || language == 'ko' || language == 'en';
  final locale = supported ? event.locale : 'en';
  final message = event.locale == locale
      ? event.primaryMessage
      : (locale == 'ko' ? _korean : _english)[event.actionCode]!;
  return GuidanceText(message, locale, !supported || event.fallbackLocaleUsed);
}

const _english = {
  'ALERT_HAZARD': 'Hazard detected. Check the current action guidance.',
  'FOLLOW_VALIDATED_ROUTE': 'Follow the displayed validated route to the designated destination.',
  'GUIDANCE_UPDATED': 'Guidance has changed. Follow the current instruction.',
  'ROUTE_UNAVAILABLE':
      'No validated route is available. Request assistance and follow the scenario instruction.',
  'POSITION_UNKNOWN': 'Your position is unknown. Request assistance to confirm your location.',
  'SENSOR_UNKNOWN': 'Sensor status is unknown. Follow the current scenario instruction.',
  'REQUEST_ASSISTANCE': 'Request assistance from the designated support person.',
  'SHELTER_PER_SCENARIO': 'Follow the shelter instruction specified for this scenario.',
  'CONFIRM_UNDERSTANDING': 'Confirm that you understand the current instruction.',
  'CONFIRM_ARRIVAL': 'Confirm arrival only after reaching the designated destination.',
  'AWAIT_REOPEN_AUTHORIZATION': 'Passage has not been reopened. Wait for separate authorization.',
};

const _korean = {
  'ALERT_HAZARD': '위험이 감지되었습니다. 현재 행동 안내를 확인하세요.',
  'FOLLOW_VALIDATED_ROUTE': '화면의 검증된 경로를 따라 지정 목적지로 이동하세요.',
  'GUIDANCE_UPDATED': '안내가 변경되었습니다. 현재 행동 안내를 따르세요.',
  'ROUTE_UNAVAILABLE': '검증된 경로가 없습니다. 도움을 요청하고 시나리오 안내를 따르세요.',
  'POSITION_UNKNOWN': '현재 위치를 알 수 없습니다. 위치 확인을 위한 도움을 요청하세요.',
  'SENSOR_UNKNOWN': '센서 상태를 알 수 없습니다. 현재 시나리오 안내를 따르세요.',
  'REQUEST_ASSISTANCE': '지정된 지원 담당자에게 도움을 요청하세요.',
  'SHELTER_PER_SCENARIO': '이 시나리오에서 지정한 대기 공간 안내를 따르세요.',
  'CONFIRM_UNDERSTANDING': '현재 행동 안내를 이해했는지 확인하세요.',
  'CONFIRM_ARRIVAL': '지정 목적지에 도착한 뒤 도착을 확인하세요.',
  'AWAIT_REOPEN_AUTHORIZATION': '통행이 재개되지 않았습니다. 별도의 재개 승인을 기다리세요.',
};
