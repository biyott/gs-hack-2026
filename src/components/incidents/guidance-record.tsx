import { StatusBadge } from "@/components/ui/primitives";
import type { Guidance } from "@/contracts";
import { incidentTime } from "./incident-labels";
import { useGuidanceExpiry } from "./use-guidance-expiry";

type GuidanceRecordProps = {
  readonly guidance: Guidance;
  readonly original?: boolean;
  readonly observedAt: string;
};

const capability = (value: boolean | null) => (value === null ? "미확인" : value ? "예" : "아니요");

function guidanceText(text: string, destinationId: string | null) {
  return Array.from(text.matchAll(/\s+|\S+/gu), (match) => {
    const part = match[0];
    return destinationId && part.startsWith(destinationId) ? (
      <span className="keep-phrase" key={match.index}>
        {part}
      </span>
    ) : (
      part
    );
  });
}

export function GuidanceRecord({ guidance, original = false, observedAt }: GuidanceRecordProps) {
  const profile = guidance.profileSnapshot;
  const expired = useGuidanceExpiry(guidance.expiresAt, observedAt);
  return (
    <article className={`guidance-record${original ? " guidance-original" : ""}`}>
      <div className="guidance-record-heading">
        <strong>{guidance.workerId}</strong>
        <StatusBadge tone={original ? "info" : expired ? "caution" : "info"}>
          {original ? "최초 원문 · 기록 고정" : expired ? "유효기간 만료" : "현재 안내"}
        </StatusBadge>
      </div>
      <p className="guidance-primary" lang={guidance.locale}>
        {guidanceText(guidance.primaryMessage, guidance.destinationId)}
      </p>
      <p className="guidance-explanation" lang="ko">
        {guidanceText(guidance.managerExplanationKo, guidance.destinationId)}
      </p>
      <p className="guidance-context">
        {guidance.locale === "en" ? "영어" : "한국어"} · 안내 v{guidance.guidanceVersion} · 프로필 v
        {guidance.profileVersion}
        {guidance.fallbackLocaleUsed
          ? ` · 요청 언어 ${guidance.requestedLocale ?? "미확인"}의 검토된 대체 언어`
          : ""}
      </p>
      {guidance.updateKind === "supplement" ? (
        <p className="guidance-context">
          기본 행동 v{guidance.primaryGuidanceVersion} 유지 · 보충 설명 갱신
        </p>
      ) : null}
      <dl className="guidance-facts">
        <div>
          <dt>생성</dt>
          <dd>
            <time dateTime={guidance.generatedAt}>{incidentTime(guidance.generatedAt)}</time>
          </dd>
        </div>
        <div>
          <dt>만료</dt>
          <dd>
            <time dateTime={guidance.expiresAt}>{incidentTime(guidance.expiresAt)}</time>
          </dd>
        </div>
        <div>
          <dt>목적지</dt>
          <dd>{guidance.destinationId ?? "이동 목적지 없음"}</dd>
        </div>
        <div>
          <dt>경로</dt>
          <dd>
            {guidance.routeVersion === null
              ? "이동 경로 없음"
              : `v${guidance.routeVersion} · ${guidance.waypoints.length}개 경유점`}
          </dd>
        </div>
      </dl>
      <details className="guidance-detail">
        <summary>개인화 기준 · 경로 · 출처</summary>
        <dl className="guidance-facts">
          <div>
            <dt>안내 ID</dt>
            <dd className="mono">{guidance.guidanceId}</dd>
          </div>
          <div>
            <dt>사건 / 실행</dt>
            <dd className="mono">
              {guidance.incidentId} / {guidance.runId}
            </dd>
          </div>
          <div>
            <dt>행동 코드</dt>
            <dd className="mono">{guidance.actionCode}</dd>
          </div>
          <div>
            <dt>지도 / 층</dt>
            <dd>
              {guidance.mapId} v{guidance.mapVersion} / {guidance.floorId}
            </dd>
          </div>
          <div>
            <dt>현재 단계</dt>
            <dd>{guidance.stepId ?? "이동 단계 없음"}</dd>
          </div>
          <div>
            <dt>계단 이용 가능</dt>
            <dd>{capability(profile.canUseStairs)}</dd>
          </div>
          <div>
            <dt>지원 필요</dt>
            <dd>{capability(profile.needsAssistance)}</dd>
          </div>
          <div>
            <dt>동행 필요</dt>
            <dd>{capability(profile.needsCompanion)}</dd>
          </div>
          <div>
            <dt>확인된 속도</dt>
            <dd>
              {profile.speedMps ? `${profile.speedMps.min}–${profile.speedMps.max} m/s` : "미확인"}
            </dd>
          </div>
          <div>
            <dt>프로필 확인</dt>
            <dd>{incidentTime(profile.confirmedAt)}</dd>
          </div>
          <div>
            <dt>선호 언어</dt>
            <dd>{profile.preferredLocale ?? "미확인"}</dd>
          </div>
          <div>
            <dt>알림 설정</dt>
            <dd>
              음성 {capability(profile.notificationPreferences.voice)} · 진동{" "}
              {capability(profile.notificationPreferences.vibration)}
            </dd>
          </div>
          <div>
            <dt>템플릿</dt>
            <dd>
              {guidance.primaryMessageKey} · {guidance.templateCatalogVersion}
            </dd>
          </div>
        </dl>
        {guidance.waypoints.length > 0 ? (
          <ol className="guidance-waypoints" aria-label="기록된 경유점">
            {guidance.waypoints.map((point) => (
              <li key={`${point.floorId}-${point.nodeId}`}>
                {point.nodeId} · {point.floorId} · ({point.x}, {point.y}) m
              </li>
            ))}
          </ol>
        ) : (
          <p className="muted">이 안내에 기록된 이동 경로가 없습니다.</p>
        )}
        <p className="guidance-context">
          {guidance.mode === "rag-assisted" ? "문서 검색 보충 설명" : "검토된 템플릿 안내"}
        </p>
        {guidance.supplementalExplanation ? (
          <p className="guidance-supplement">{guidance.supplementalExplanation}</p>
        ) : (
          <p className="muted">추가 설명 없음</p>
        )}
        {guidance.evidence.length > 0 ? (
          <ul className="guidance-evidence" aria-label="안내 근거 문서">
            {guidance.evidence.map((item) => (
              <li key={`${item.documentId}-${item.documentVersion}-${item.chunkId}`}>
                {item.documentId} · v{item.documentVersion} · {item.chunkId}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">인용된 검색 근거 없음</p>
        )}
      </details>
    </article>
  );
}
