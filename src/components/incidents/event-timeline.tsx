import { EmptyState, Panel, StatusBadge } from "@/components/ui/primitives";
import type { AuditEvent, SimulationSnapshot } from "@/contracts";

type EventTimelineProps = {
  readonly snapshot: SimulationSnapshot;
  readonly incidentId?: string;
};

const eventLabels = new Map<string, string>([
  ["incident.acknowledge", "운영자 사건 확인"],
  ["incident.assign", "지원 담당자 배정"],
  ["incident.accept-support", "지원 담당자 수락"],
  ["incident.complete-support", "지원 완료"],
  ["incident.field-check", "현장 확인 기록"],
  ["incident.follow-up", "추가 안내 요청"],
  ["incident.clear-hazard", "위험 해제"],
  ["incident.reopen-passage", "통행 재개 승인"],
  ["incident.close", "사건 종결"],
  ["guidance.generated", "서버 안내 생성"],
  ["guidance.transmission-attempt", "안내 전송 시도"],
  ["worker.received", "작업자 기기 수신"],
  ["worker.displayed", "작업자 화면 표시"],
  ["worker.voice-started", "작업자 음성 시작"],
  ["worker.voice-completed", "작업자 음성 완료"],
  ["worker.voice-failed", "작업자 음성 실패"],
  ["worker.voice-unsupported", "작업자 음성 지원 불가"],
  ["worker.understood", "작업자 내용 이해"],
  ["worker.help-requested", "작업자 도움 요청"],
  ["worker.arrived", "작업자 도착 확인"],
]);

const eventTime = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function timelineEvents({ snapshot, incidentId }: EventTimelineProps): readonly AuditEvent[] {
  const audit = snapshot.incidents
    .filter((incident) => incidentId === undefined || incident.incidentId === incidentId)
    .flatMap((incident) => incident.audit);
  const events = [...audit, ...snapshot.events].filter(
    (event) => incidentId === undefined || event.incidentId === incidentId,
  );
  const uniqueEvents = new Map(events.map((event) => [event.eventId, event]));
  return [...uniqueEvents.values()].sort(
    (left, right) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt),
  );
}

export function EventTimeline(props: EventTimelineProps) {
  const events = timelineEvents(props);
  return (
    <Panel
      title="이벤트 이력"
      eyebrow="서버 기록 · 최신순 · 한국 표준시"
      actions={<StatusBadge>{events.length}건</StatusBadge>}
    >
      {events.length === 0 ? (
        <EmptyState title="기록된 이벤트가 없습니다">
          시뮬레이션 실행과 사건 대응이 기록되면 시간순으로 표시됩니다.
        </EmptyState>
      ) : (
        <ol className="event-timeline" aria-label="최신 이벤트부터 표시한 서버 기록">
          {events.map((event) => (
            <li className="timeline-entry" key={event.eventId}>
              <div className="timeline-meta">
                <time dateTime={event.occurredAt}>
                  {eventTime.format(new Date(event.occurredAt))}
                </time>
                <span>처리자 {event.actorId}</span>
              </div>
              <div className="timeline-copy">
                <strong>{eventLabels.get(event.kind) ?? "서버 이벤트"}</strong>
                <p>{event.detail}</p>
                <small>
                  {event.kind} · 버전 {event.version}
                  {event.incidentId ? ` · 사건 ${event.incidentId}` : ""}
                </small>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
