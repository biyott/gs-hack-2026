import { HandHelping, MapPinCheck, ShieldCheck, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, Panel, StatusBadge } from "@/components/ui/primitives";
import type { Guidance, Locale, WorkerState } from "@/contracts";
import type { SendWorkerResponse } from "./use-worker-responses";
import { workerCopy, workerTime } from "./worker-copy";

type Props = {
  readonly guidance: Guidance | null;
  readonly worker: WorkerState | undefined;
  readonly locale: Locale;
  readonly pending: boolean;
  readonly voiceEnabled: boolean;
  readonly send: SendWorkerResponse;
  readonly onReplay: () => void;
  readonly onError: (message: string | null) => void;
};

export function WorkerGuidancePanel({
  guidance,
  worker,
  locale,
  pending,
  voiceEnabled,
  send,
  onReplay,
  onError,
}: Props) {
  const copy = workerCopy(locale);
  if (!guidance)
    return (
      <Panel title={copy.currentAction}>
        <EmptyState title={copy.noGuide}>{copy.waitGuide}</EmptyState>
      </Panel>
    );
  const respond = (response: "understood" | "help-requested" | "arrived") => {
    void send(guidance, response)
      .then(() => onError(null))
      .catch((failure: unknown) =>
        onError(failure instanceof Error ? failure.message : "Response failed"),
      );
  };
  const canConfirmArrival =
    guidance.actionCode === "FOLLOW_VALIDATED_ROUTE" || guidance.actionCode === "CONFIRM_ARRIVAL";
  return (
    <Panel
      title={copy.currentAction}
      className="worker-guidance-panel"
      actions={
        <StatusBadge tone={guidance.priority === "critical" ? "danger" : "caution"}>
          {guidance.priority.toUpperCase()}
        </StatusBadge>
      }
    >
      <div className="stack">
        <p
          className="worker-guidance-message"
          lang={guidance.locale}
          aria-live="assertive"
          aria-atomic="true"
        >
          {guidance.primaryMessage}
        </p>
        <div className="cluster">
          <StatusBadge>
            {guidance.locale === "en" ? "English" : "한국어"} · v{guidance.primaryGuidanceVersion}
          </StatusBadge>
          <span className="muted">
            {guidance.mode} · {guidance.templateCatalogVersion}
          </span>
        </div>
        {guidance.fallbackLocaleUsed ? (
          <p className="muted">
            {guidance.requestedLocale ?? "Unknown"} → {guidance.locale} ·{" "}
            {locale === "en" ? "Reviewed language fallback" : "검토된 대체 언어"}
          </p>
        ) : null}
        <p>
          {copy.destination}: <strong>{guidance.destinationId ?? copy.noDestination}</strong>
          {guidance.routeVersion === null ? null : ` · ${copy.route} ${guidance.routeVersion}`}
        </p>
        {guidance.waypoints.length === 0 ? <p className="muted">{copy.noRoute}</p> : null}
        <div className="worker-response-actions">
          <Button
            variant="primary"
            size="worker"
            disabled={pending || Boolean(worker?.response.understoodAt)}
            onClick={() => respond("understood")}
          >
            <ShieldCheck size={20} />
            {copy.understood}
          </Button>
          <Button
            variant="danger"
            size="worker"
            disabled={pending || Boolean(worker?.response.helpRequestedAt)}
            onClick={() => respond("help-requested")}
          >
            <HandHelping size={20} />
            {copy.help}
          </Button>
          <Button
            size="worker"
            disabled={
              pending ||
              !canConfirmArrival ||
              worker?.positionStatus !== "known" ||
              Boolean(worker?.response.arrivedAt)
            }
            onClick={() => respond("arrived")}
          >
            <MapPinCheck size={20} />
            {copy.arrived}
          </Button>
          <Button variant="quiet" size="worker" disabled={!voiceEnabled} onClick={onReplay}>
            <Volume2 size={20} />
            {copy.replay}
          </Button>
        </div>
        <p className="muted">{copy.explicitArrival}</p>
        <div className="cluster muted">
          <span>
            {copy.generated}:{" "}
            <time dateTime={guidance.generatedAt}>{workerTime(guidance.generatedAt, locale)}</time>
          </span>
          <span>
            {copy.expires}:{" "}
            <time dateTime={guidance.expiresAt}>{workerTime(guidance.expiresAt, locale)}</time>
          </span>
        </div>
        {guidance.supplementalExplanation ? (
          <details className="stack">
            <summary>
              {copy.explanation} · v{guidance.guidanceVersion}
            </summary>
            <p lang={guidance.locale}>{guidance.supplementalExplanation}</p>
            <ul>
              {guidance.evidence.map((entry) => (
                <li className="mono" key={`${entry.documentId}:${entry.chunkId}`}>
                  {entry.documentId} · {entry.documentVersion} · {entry.chunkId}
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>
    </Panel>
  );
}
