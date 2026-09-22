"use client";

import { useState } from "react";
import { sendIncidentAction } from "@/client/use-simulation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/primitives";
import type { Incident, IncidentAction, Session } from "@/contracts";
import { allowedIncidentActions } from "./incident-permissions";

type Action = IncidentAction["action"];
type IncidentActionsProps = {
  readonly incident: Incident;
  readonly session: Session | null;
  readonly busy: boolean;
};

const actionLabels = {
  acknowledge: "사건 인지",
  assign: "지원 배정",
  "accept-support": "지원 수락",
  "complete-support": "지원 처리 완료",
  "field-check": "현장 확인 기록",
  "follow-up": "후속 안내 발행",
  "clear-hazard": "위험 해제",
  "reopen-passage": "통행 재개 승인",
  close: "사건 종결",
} as const satisfies Record<Action, string>;

export function IncidentActions({ incident, session, busy }: IncidentActionsProps) {
  const [assigneeId, setAssigneeId] = useState("support");
  const [note, setNote] = useState("");
  const allowed = allowedIncidentActions(session, incident);
  const finalActions: readonly Action[] = ["clear-hazard", "reopen-passage", "close"];
  const canAssign = allowed.includes("assign");
  const canRecord = allowed.includes("field-check") || allowed.includes("follow-up");

  function disabledReason(action: Action): string | null {
    if (busy) return "요청 처리 중";
    if (incident.status === "closed") return "종결된 사건";
    switch (action) {
      case "acknowledge":
        return incident.acknowledgedAt ? "이미 인지한 사건" : null;
      case "assign":
        return assigneeId.trim() ? null : "지원 담당자 ID를 입력하세요";
      case "accept-support":
        return incident.supportStatus === "assigned" ? null : "지원 배정 후 수락할 수 있습니다";
      case "complete-support":
        return incident.supportStatus === "accepted"
          ? null
          : "지원 수락 후 처리 완료할 수 있습니다";
      case "field-check":
      case "follow-up":
        return note.trim() ? null : "현장 기록 또는 후속 사유를 입력하세요";
      case "clear-hazard":
        return incident.hazardClearedAt ? "위험 해제 기록됨" : null;
      case "reopen-passage":
        return !incident.hazardClearedAt
          ? "위험 해제 후 승인할 수 있습니다"
          : incident.passageReopenedAt
            ? "통행 재개 승인됨"
            : null;
      case "close":
        return incident.hazardClearedAt && incident.passageReopenedAt
          ? null
          : "위험 해제와 통행 재개 승인이 필요합니다";
      default:
        return action satisfies never;
    }
  }

  function act(action: Action) {
    if (disabledReason(action)) return;
    void sendIncidentAction({
      incidentId: incident.incidentId,
      action,
      ...(action === "assign" ? { assigneeId: assigneeId.trim() } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
    });
  }

  function actionButton(action: Action) {
    const reason = disabledReason(action);
    return (
      <div className="incident-action-item" key={action}>
        <Button
          type="button"
          variant={finalActions.includes(action) ? "danger" : "secondary"}
          disabled={reason !== null}
          aria-busy={busy}
          onClick={() => act(action)}
        >
          {actionLabels[action]}
        </Button>
        {reason && !busy ? <small>{reason}</small> : null}
      </div>
    );
  }

  if (allowed.length === 0)
    return (
      <p className="muted">
        이 역할은 사건 기록을 조회할 수 있습니다. 배정된 지원 담당자만 지원을 수락할 수 있습니다.
      </p>
    );

  return (
    <div className="incident-actions">
      <h3>사건 처리</h3>
      {canAssign ? (
        <Field
          label="지원 담당자 ID"
          hint="동일 ID로 접속한 지원 담당자만 배정을 수락할 수 있습니다."
        >
          <input
            value={assigneeId}
            onChange={(event) => setAssigneeId(event.target.value)}
            maxLength={80}
            disabled={busy || incident.status === "closed"}
            autoComplete="off"
          />
        </Field>
      ) : null}
      {canRecord ? (
        <Field
          label="현장 기록 / 후속 안내 사유"
          hint="기록은 이력에 저장됩니다. 후속 안내는 현재 위험·경로 정책으로 다시 생성됩니다."
        >
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={2000}
            rows={3}
            disabled={busy || incident.status === "closed"}
          />
        </Field>
      ) : null}
      <div className="incident-action-grid">
        {allowed.filter((action) => !finalActions.includes(action)).map(actionButton)}
      </div>
      {allowed.some((action) => finalActions.includes(action)) ? (
        <div className="incident-final-actions">
          <h4>관리자 승인</h4>
          <p className="muted">위험 해제, 통행 재개, 사건 종결을 각각 기록합니다.</p>
          <div className="incident-action-grid">
            {allowed.filter((action) => finalActions.includes(action)).map(actionButton)}
          </div>
        </div>
      ) : null}
    </div>
  );
}
