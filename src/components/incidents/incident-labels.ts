import type { HazardType, Incident, Priority } from "@/contracts";

export const hazardLabels = {
  equipment: "장비 위험",
  fire: "화재",
  gas: "가스",
  combined: "복합 위험",
  "position-unknown": "위치 미확인",
  "sensor-unknown": "센서 미확인",
} as const satisfies Record<HazardType, string>;

export const priorityLabels = {
  critical: "긴급",
  high: "높음",
  medium: "주의",
  low: "낮음",
} as const satisfies Record<Priority, string>;

export const incidentStatusLabels = {
  active: "진행 중",
  cleared: "위험 해제",
  closed: "종결",
} as const satisfies Record<Incident["status"], string>;

export const supportLabels = {
  none: "지원 요청 없음",
  requested: "지원 요청",
  assigned: "지원 배정",
  accepted: "지원 수락",
  completed: "지원 처리 완료",
} as const satisfies Record<Incident["supportStatus"], string>;

const timeFormatter = new Intl.DateTimeFormat("ko-KR", {
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "Asia/Seoul",
});

export function incidentTime(timestamp: string | null): string {
  return timestamp ? `${timeFormatter.format(new Date(timestamp))} KST` : "기록 없음";
}
