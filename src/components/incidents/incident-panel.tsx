"use client";

import { Button } from "@/components/ui/button";
import { EmptyState, Panel, StatusBadge } from "@/components/ui/primitives";
import type { Session, SimulationSnapshot } from "@/contracts";
import { DeliveryStatus } from "./delivery-status";
import { GuidanceRecord } from "./guidance-record";
import { IncidentActions } from "./incident-actions";
import {
  hazardLabels,
  incidentStatusLabels,
  incidentTime,
  priorityLabels,
} from "./incident-labels";

export type IncidentPanelProps = {
  readonly snapshot: SimulationSnapshot;
  readonly selectedIncidentId: string | null;
  readonly session: Session | null;
  readonly busy: boolean;
  readonly onSelectIncident: (incidentId: string) => void;
  readonly onSelectWorker: (workerId: string) => void;
};

export function IncidentPanel({
  snapshot,
  selectedIncidentId,
  session,
  busy,
  onSelectIncident,
  onSelectWorker,
}: IncidentPanelProps) {
  const selected =
    snapshot.incidents.find((incident) => incident.incidentId === selectedIncidentId) ??
    snapshot.incidents.at(-1);
  return (
    <Panel
      title="사건 관리"
      eyebrow="INCIDENTS"
      className="incident-panel"
      actions={<span className="incident-count">{snapshot.incidents.length}건</span>}
    >
      {snapshot.incidents.length === 0 ? (
        <EmptyState title="기록된 사건이 없습니다">
          시나리오에서 위험이 발생하면 최초 안내와 처리 이력이 표시됩니다.
        </EmptyState>
      ) : (
        <>
          <ul className="incident-list" aria-label="사건 선택">
            {[...snapshot.incidents].reverse().map((incident) => (
              <li key={incident.incidentId}>
                <button
                  type="button"
                  className="incident-list-item"
                  aria-pressed={incident.incidentId === selected?.incidentId}
                  onClick={() => onSelectIncident(incident.incidentId)}
                >
                  <span>
                    <strong>{hazardLabels[incident.hazardType]}</strong>
                    <span className="mono">{incident.incidentId}</span>
                  </span>
                  <StatusBadge
                    tone={
                      incident.status === "closed"
                        ? "offline"
                        : incident.status === "cleared"
                          ? "info"
                          : "danger"
                    }
                  >
                    {incidentStatusLabels[incident.status]}
                  </StatusBadge>
                </button>
              </li>
            ))}
          </ul>
          {selected ? (
            <div className="incident-detail">
              <div className="incident-detail-heading">
                <h3>{hazardLabels[selected.hazardType]}</h3>
                <StatusBadge
                  tone={
                    selected.priority === "critical" || selected.priority === "high"
                      ? "danger"
                      : "caution"
                  }
                >
                  {priorityLabels[selected.priority]}
                </StatusBadge>
              </div>
              <p className="guidance-context mono">
                {selected.incidentId} · v{selected.version}
              </p>
              <dl className="guidance-facts">
                <div>
                  <dt>사건 인지</dt>
                  <dd>{incidentTime(selected.acknowledgedAt)}</dd>
                </div>
                <div>
                  <dt>위험 해제</dt>
                  <dd>{incidentTime(selected.hazardClearedAt)}</dd>
                </div>
                <div>
                  <dt>통행 재개</dt>
                  <dd>{incidentTime(selected.passageReopenedAt)}</dd>
                </div>
                <div>
                  <dt>사건 종결</dt>
                  <dd>{incidentTime(selected.closedAt)}</dd>
                </div>
              </dl>
              <section className="incident-guidance-section" aria-label="최초 안내 기록">
                <h3>최초 안내 원문</h3>
                <p className="muted">발생 당시 원문, 언어, 개인화 기준과 경로를 보존합니다.</p>
                {selected.firstGuidance.length ? (
                  selected.firstGuidance.map((guidance) => (
                    <GuidanceRecord
                      key={`${guidance.guidanceId}-${guidance.guidanceVersion}`}
                      guidance={guidance}
                      original
                      observedAt={snapshot.run.updatedAt}
                    />
                  ))
                ) : (
                  <EmptyState title="최초 안내 기록 없음" />
                )}
              </section>
              <section className="incident-guidance-section" aria-label="현재 안내와 응답">
                <h3>현재 안내 · 작업자 응답</h3>
                {selected.currentGuidance.length ? (
                  selected.currentGuidance.map((guidance) => (
                    <div
                      className="incident-worker-guidance"
                      key={`${guidance.guidanceId}-${guidance.guidanceVersion}`}
                    >
                      <Button
                        type="button"
                        variant="quiet"
                        onClick={() => onSelectWorker(guidance.workerId)}
                      >
                        {guidance.workerId} 지도에서 보기
                      </Button>
                      <GuidanceRecord guidance={guidance} observedAt={snapshot.run.updatedAt} />
                      <DeliveryStatus
                        guidance={guidance}
                        worker={snapshot.workers.find(
                          (worker) => worker.workerId === guidance.workerId,
                        )}
                        incident={selected}
                        events={snapshot.events}
                      />
                    </div>
                  ))
                ) : (
                  <EmptyState title="현재 유효한 안내 없음">
                    이전 안내와 현재 상태를 구분해 확인하세요.
                  </EmptyState>
                )}
              </section>
              <IncidentActions
                key={selected.incidentId}
                incident={selected}
                session={session}
                busy={busy}
              />
            </div>
          ) : null}
        </>
      )}
    </Panel>
  );
}
