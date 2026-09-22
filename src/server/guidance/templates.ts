import type { ActionCode, Locale } from "@/contracts";

export const TEMPLATE_CATALOG_VERSION = "1.0.0";

const messages = {
  ALERT_HAZARD: {
    ko: "위험이 감지되었습니다. 현재 행동 안내를 확인하세요.",
    en: "Hazard detected. Check your current action guidance.",
  },
  FOLLOW_VALIDATED_ROUTE: {
    ko: "표시된 유효 경로를 따라 {destinationId}(으)로 이동하세요.",
    en: "Follow the displayed validated route to {destinationId}.",
  },
  GUIDANCE_UPDATED: {
    ko: "안내가 변경되었습니다. 최신 행동 안내를 확인하세요.",
    en: "Guidance has changed. Check your latest action guidance.",
  },
  ROUTE_UNAVAILABLE: {
    ko: "현재 유효한 경로가 없습니다. 도움을 요청하세요.",
    en: "No valid route is available. Request assistance.",
  },
  POSITION_UNKNOWN: {
    ko: "위치를 확인할 수 없습니다. 도움을 요청하세요.",
    en: "Your position is unknown. Request assistance.",
  },
  SENSOR_UNKNOWN: {
    ko: "위험 센서 상태가 확인되지 않습니다. 관리자 확인을 요청하세요.",
    en: "Hazard sensor status is unknown. Ask a manager to check.",
  },
  REQUEST_ASSISTANCE: {
    ko: "도움 요청을 누르세요.",
    en: "Select Request assistance.",
  },
  SHELTER_PER_SCENARIO: {
    ko: "시나리오가 지정한 공간에서 실내 대기하세요.",
    en: "Shelter indoors in the space designated by the scenario.",
  },
  CONFIRM_UNDERSTANDING: {
    ko: "안내를 이해했다면 이해 확인을 누르세요.",
    en: "Select Confirm understanding when you understand the guidance.",
  },
  CONFIRM_ARRIVAL: {
    ko: "목적지에 도착했다면 도착 확인을 누르세요.",
    en: "Select Confirm arrival when you reach the destination.",
  },
  AWAIT_REOPEN_AUTHORIZATION: {
    ko: "통행 재개 승인 전에는 통제 통로에 진입하지 마세요.",
    en: "Do not enter restricted passages until reopening is authorized.",
  },
} as const satisfies Record<ActionCode, Record<Locale, string>>;

export class GuidanceTemplateError extends Error {
  readonly code = "ROUTE_DESTINATION_REQUIRED";

  constructor() {
    super("A validated route instruction requires an engine destination.");
    this.name = "GuidanceTemplateError";
  }
}

export function getMessageKey(actionCode: ActionCode): string {
  return `guidance.${actionCode.toLowerCase()}`;
}

export function getActionMessage(
  actionCode: ActionCode,
  locale: Locale,
  destinationId: string | null,
): string {
  const template = messages[actionCode][locale];
  if (actionCode !== "FOLLOW_VALIDATED_ROUTE") return template;
  if (destinationId === null) throw new GuidanceTemplateError();
  return template.replace("{destinationId}", () => destinationId);
}
