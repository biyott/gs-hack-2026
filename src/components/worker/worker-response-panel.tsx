import { Panel, StatusBadge } from "@/components/ui/primitives";
import type { Incident, Locale, WorkerState } from "@/contracts";
import { voiceLabel, workerCopy, workerTime } from "./worker-copy";

export function WorkerResponsePanel({
  worker,
  incident,
  locale,
}: {
  readonly worker: WorkerState;
  readonly incident: Incident | undefined;
  readonly locale: Locale;
}) {
  const copy = workerCopy(locale);
  const entries = [
    [copy.receipt, worker.response.receivedAt],
    [copy.displayed, worker.response.displayedAt],
    [copy.spoken, worker.response.spokenAt],
    [copy.understanding, worker.response.understoodAt],
    [copy.assistance, worker.response.helpRequestedAt],
    [copy.arrival, worker.response.arrivedAt],
  ] as const;
  return (
    <Panel title={copy.responses}>
      <dl className="worker-response-list">
        {entries.map(([label, time]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>
              <StatusBadge tone={time ? "safe" : "offline"}>{workerTime(time, locale)}</StatusBadge>
            </dd>
          </div>
        ))}
      </dl>
      <p>
        {copy.audioState}: {voiceLabel(worker.response.voiceStatus, locale)}
      </p>
      <p>
        {copy.support}: <strong>{copy[incident?.supportStatus ?? "none"]}</strong>
      </p>
    </Panel>
  );
}
