import { StatusBadge } from "@/components/ui/primitives";
import type { AuditEvent, Guidance, Incident, WorkerState } from "@/contracts";
import { currentSupportAcceptance, transmissionRecord } from "./delivery-records";
import { incidentTime, supportLabels } from "./incident-labels";

type DeliveryStatusProps = {
  readonly guidance: Guidance;
  readonly worker: WorkerState | undefined;
  readonly incident: Incident;
  readonly events: readonly AuditEvent[];
};

const voiceLabels = {
  pending: "음성 실행 기록 없음",
  playing: "음성 재생 중",
  "stop-requested": "중지 요청 · 기기 확인 없음",
  completed: "음성 완료",
  failed: "음성 실행 실패",
  unsupported: "음성 지원 불가",
  cancelled: "음성 취소",
} as const satisfies Record<WorkerState["response"]["voiceStatus"], string>;

export function DeliveryStatus({ guidance, worker, incident, events }: DeliveryStatusProps) {
  const latest = worker?.currentGuidance;
  const response =
    latest?.guidanceId === guidance.guidanceId &&
    latest.guidanceVersion === guidance.guidanceVersion &&
    latest.runId === guidance.runId &&
    latest.incidentId === incident.incidentId
      ? worker?.response
      : undefined;
  const audit = [...incident.audit, ...events]
    .filter((event) => event.incidentId === incident.incidentId && event.runId === guidance.runId)
    .sort((left, right) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt));
  const transmission = transmissionRecord(audit, guidance);
  const assignment = audit.find((event) => event.kind === "incident.assign");
  const accepted = currentSupportAcceptance(audit, incident);
  return (
    <section className="delivery-status" aria-label={`${guidance.workerId} 전달 및 응답 상태`}>
      <h4>전달 · 응답 · 지원</h4>
      <dl className="guidance-facts">
        <div>
          <dt>서버 안내 생성</dt>
          <dd>{incidentTime(guidance.generatedAt)}</dd>
        </div>
        <div>
          <dt>전송 시도</dt>
          <dd>
            {transmission
              ? `${incidentTime(transmission.occurredAt)} · 해당 모드 SSE 연결 ${transmission.connectedSubscriptions}개${transmission.historical ? " · 과거 형식 기록" : ""}`
              : "기록 없음"}
          </dd>
        </div>
        <div>
          <dt>기기 수신</dt>
          <dd>{incidentTime(response?.receivedAt ?? null)}</dd>
        </div>
        <div>
          <dt>화면 표시</dt>
          <dd>{incidentTime(response?.displayedAt ?? null)}</dd>
        </div>
        <div>
          <dt>음성 상태</dt>
          <dd>
            {response ? voiceLabels[response.voiceStatus] : "기록 없음"}
            {response?.spokenAt ? ` · ${incidentTime(response.spokenAt)}` : ""}
          </dd>
        </div>
        <div>
          <dt>내용 이해</dt>
          <dd>{incidentTime(response?.understoodAt ?? null)}</dd>
        </div>
        <div>
          <dt>도움 요청</dt>
          <dd>{incidentTime(response?.helpRequestedAt ?? null)}</dd>
        </div>
        <div>
          <dt>지원 배정</dt>
          <dd>
            {incident.assignedTo ?? "미배정"}
            {assignment ? ` · ${incidentTime(assignment.occurredAt)}` : ""}
          </dd>
        </div>
        <div>
          <dt>지원 수락</dt>
          <dd>{incidentTime(accepted?.occurredAt ?? null)}</dd>
        </div>
        <div>
          <dt>작업자 도착</dt>
          <dd>{incidentTime(response?.arrivedAt ?? null)}</dd>
        </div>
      </dl>
      <StatusBadge tone={incident.supportStatus === "requested" ? "caution" : "info"}>
        {supportLabels[incident.supportStatus]}
      </StatusBadge>
      <p className="muted">
        SSE 연결 수는 해당 모드의 구독 수로, 관리자·관찰자·중복 탭이 포함될 수 있습니다. 기기 수신과
        내용 이해는 별도 기록입니다.
      </p>
      {!response ? (
        <p className="muted">
          이 안내 버전에 연결된 현재 기기 응답이 없습니다. 이전 기록은 사건 이력에서 확인하세요.
        </p>
      ) : null}
    </section>
  );
}
