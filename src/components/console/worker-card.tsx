"use client";

import { MapPin, PersonStanding, UserRound, UserRoundCheck } from "lucide-react";
import { incidentTime, supportLabels } from "@/components/incidents/incident-labels";
import { useGuidanceExpiry } from "@/components/incidents/use-guidance-expiry";
import { StatusBadge } from "@/components/ui/primitives";
import type { Guidance, SimulationSnapshot, WorkerState } from "@/contracts";

const responseLabel = (value: string | null, confirmed: string) => (value ? confirmed : "미확인");

const positionSources = {
  mock: "MOCK 위치",
  manual: "수동 입력",
  video: "카메라 처리",
  uwb: "UWB 처리",
} as const;
const originLabels = {
  live: "실제 장치 입력",
  synthetic: "합성 입력",
  unknown: "출처 미확인",
} as const;
const languageLabels = { ko: "한국어", en: "English" } as const;
const voiceLabels = {
  pending: "실행 기록 없음",
  playing: "재생 중",
  "stop-requested": "중지 요청 · 기기 확인 없음",
  completed: "완료",
  failed: "실패",
  unsupported: "미지원",
  cancelled: "취소",
} as const satisfies Record<WorkerState["response"]["voiceStatus"], string>;

function WorkerGuidance({
  guidance,
  observedAt,
  current,
}: {
  readonly guidance: Guidance;
  readonly observedAt: string;
  readonly current: boolean;
}) {
  const expired = useGuidanceExpiry(guidance.expiresAt, observedAt);
  const available = current && !expired;
  return (
    <>
      <p
        className={`worker-action ${available ? "has-guidance" : ""}`}
        lang={available ? guidance.locale : "ko"}
      >
        {available
          ? guidance.primaryMessage
          : expired
            ? "안내 유효기간 만료 · 현재 유효한 안내 없음"
            : "안내 맥락 변경 · 현재 유효한 안내 없음"}
      </p>
      <small className="mono">
        {available ? "현재" : "이전"} 안내 v{guidance.guidanceVersion} ·{" "}
        {languageLabels[guidance.locale]} · {guidance.actionCode}
      </small>
      {guidance.fallbackLocaleUsed ? (
        <small className="muted">
          선호 언어 {guidance.requestedLocale ?? "미확인"} · 검토된{" "}
          {languageLabels[guidance.locale]} 안내로 대체
        </small>
      ) : null}
    </>
  );
}

export function WorkerCard({
  worker,
  snapshot,
  selected,
  onSelect,
}: {
  readonly worker: WorkerState;
  readonly snapshot: SimulationSnapshot;
  readonly selected: boolean;
  readonly onSelect: () => void;
}) {
  const guidance = worker.currentGuidance;
  const help = worker.response.helpRequestedAt !== null;
  const acknowledgements = [
    ["기기 수신", worker.response.receivedAt, "수신"],
    ["화면 표시", worker.response.displayedAt, "표시"],
    ["이해 확인", worker.response.understoodAt, "이해"],
  ] as const;
  const incident = snapshot.incidents.find(
    (item) => item.incidentId === guidance?.incidentId && item.runId === snapshot.run.runId,
  );
  const activeGuidance = incident?.currentGuidance.find(
    (item) => item.workerId === worker.workerId,
  );
  const current =
    guidance !== null &&
    guidance.workerId === worker.workerId &&
    guidance.runId === snapshot.run.runId &&
    guidance.simulationMode === snapshot.mode &&
    guidance.mapId === snapshot.run.mapId &&
    guidance.mapVersion === snapshot.run.mapVersion &&
    guidance.profileVersion === worker.profile.version &&
    incident?.status !== "closed" &&
    activeGuidance?.guidanceId === guidance.guidanceId &&
    activeGuidance?.guidanceVersion === guidance.guidanceVersion;
  const preferred = worker.profile.preferredLocale;
  const preferredLabel =
    preferred === null
      ? "선호 언어 미확인"
      : preferred === "ko" || preferred === "en"
        ? languageLabels[preferred]
        : `선호 언어 ${preferred}`;
  return (
    <article
      className={`worker-card ${selected ? "worker-selected" : ""} ${help ? "worker-help" : ""}`}
    >
      <button
        type="button"
        className="worker-card-heading"
        onClick={onSelect}
        aria-pressed={selected}
      >
        <span className="worker-avatar">
          {worker.profile.needsAssistance ? <PersonStanding size={20} /> : <UserRound size={20} />}
        </span>
        <span>
          <strong>{worker.workerId}</strong>
          <span className="muted">
            {preferredLabel} · {worker.virtual ? "가상 작업자 · " : ""}
            {originLabels[worker.positionInputSource]}
          </span>
        </span>
        <MapPin size={16} />
      </button>
      <div className="worker-position">
        <StatusBadge
          tone={worker.positionStatus === "known" && worker.position !== null ? "info" : "caution"}
        >
          {worker.positionStatus === "known" && worker.position
            ? `(${worker.position.x.toFixed(1)}, ${worker.position.y.toFixed(1)}) m`
            : worker.positionStatus === "stale"
              ? "오래된 위치"
              : "위치 미확인"}
        </StatusBadge>
        <p className="muted">{positionSources[worker.positionSource]}</p>
      </div>
      <small className="muted">최근 관측 {incidentTime(worker.lastObservedAt)}</small>
      {guidance ? (
        <WorkerGuidance guidance={guidance} observedAt={snapshot.run.updatedAt} current={current} />
      ) : (
        <p className="worker-action">현재 유효한 행동 안내가 없습니다.</p>
      )}
      <dl className="worker-response-grid">
        {acknowledgements.map(([label, timestamp, message]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd className={timestamp ? "status-safe" : ""}>{responseLabel(timestamp, message)}</dd>
          </div>
        ))}
        <div>
          <dt>음성 실행</dt>
          <dd>{voiceLabels[worker.response.voiceStatus]}</dd>
        </div>
        <div>
          <dt>지원 요청</dt>
          <dd className={help ? "status-danger" : ""}>
            {worker.response.helpRequestedAt ? "요청됨" : "요청 기록 없음"}
          </dd>
        </div>
        <div>
          <dt>지원 상태</dt>
          <dd>
            {incident ? supportLabels[incident.supportStatus] : "기록 없음"}
            {incident?.assignedTo ? ` · ${incident.assignedTo}` : ""}
          </dd>
        </div>
        <div>
          <dt>도착 확인</dt>
          <dd className={worker.response.arrivedAt ? "status-safe" : ""}>
            {responseLabel(worker.response.arrivedAt, "도착")}
          </dd>
        </div>
      </dl>
      {worker.profile.canUseStairs !== true ? (
        <span className="worker-constraint">
          <PersonStanding size={14} />
          {worker.profile.canUseStairs === null ? "계단 이용 미확인" : "계단 이용 불가"}
        </span>
      ) : null}
      {worker.profile.needsAssistance !== false ? (
        <span className="worker-constraint">
          <UserRoundCheck size={14} />
          {worker.profile.needsAssistance === null ? "이동 지원 미확인" : "이동 지원 필요"}
        </span>
      ) : null}
      {worker.profile.needsCompanion !== false ? (
        <span className="worker-constraint">
          <UserRoundCheck size={14} />
          {worker.profile.needsCompanion === null ? "동행 필요 미확인" : "동행 필요"}
        </span>
      ) : null}
    </article>
  );
}
