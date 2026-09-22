"use client";

import { useConsoleStore } from "@/client/store";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/primitives";
import type { SimulationSnapshot } from "@/contracts";
import { ProfileEditor } from "./profile-editor";
import { WorkerCard } from "./worker-card";

export function WorkerBoard({ snapshot }: { readonly snapshot: SimulationSnapshot }) {
  const selectedWorkerId = useConsoleStore((state) => state.selectedWorkerId);
  const selected = snapshot.workers.find((worker) => worker.workerId === selectedWorkerId);
  const session = useConsoleStore((state) => state.session);
  const busy = useConsoleStore((state) => state.busy);
  const canEdit = session?.role === "admin" || session?.role === "operator";
  return (
    <Panel
      title="작업자 상태"
      eyebrow="WORKER RESPONSE"
      className="worker-board"
      actions={<span className="count-badge">{snapshot.workers.length}</span>}
    >
      <div className="worker-list">
        {snapshot.workers.map((worker) => (
          <WorkerCard
            key={worker.workerId}
            worker={worker}
            snapshot={snapshot}
            selected={selectedWorkerId === worker.workerId}
            onSelect={() => useConsoleStore.getState().selectWorker(worker.workerId)}
          />
        ))}
      </div>
      {selected ? (
        <details className="profile-details">
          <summary>선택 작업자 프로필 · v{selected.profile.version}</summary>
          <ProfileEditor
            key={`${snapshot.run.runId}-${selected.workerId}-${selected.profile.version}`}
            selected={selected}
            canEdit={canEdit}
            busy={busy}
          />
        </details>
      ) : null}
      <Button asChild variant="quiet">
        <a href="/worker" target="_blank" rel="noreferrer">
          작업자 웹 미리보기 열기
        </a>
      </Button>
    </Panel>
  );
}
