import type { Session, SimulationMode, SimulationSnapshot } from "@/contracts";

export type SnapshotListener = (snapshot: SimulationSnapshot) => void;

export class SnapshotBus {
  private readonly listeners = new Map<SimulationMode, Set<SnapshotListener>>();

  subscribe(mode: SimulationMode, listener: SnapshotListener): () => void {
    const listeners = this.listeners.get(mode) ?? new Set<SnapshotListener>();
    listeners.add(listener);
    this.listeners.set(mode, listeners);
    return () => {
      listeners.delete(listener);
    };
  }

  publish(snapshot: SimulationSnapshot): void {
    for (const listener of this.listeners.get(snapshot.mode) ?? []) listener(snapshot);
  }

  count(mode: SimulationMode): number {
    return this.listeners.get(mode)?.size ?? 0;
  }

  clear(): void {
    this.listeners.clear();
  }
}

export function scopeSnapshot(snapshot: SimulationSnapshot, session: Session): SimulationSnapshot {
  if (session.role !== "worker" && session.role !== "device") return snapshot;
  const workerId = session.workerId;
  return {
    ...snapshot,
    workers: snapshot.workers.filter((worker) => worker.workerId === workerId),
    incidents: snapshot.incidents
      .filter((incident) =>
        incident.currentGuidance.some((guidance) => guidance.workerId === workerId),
      )
      .map((incident) => ({
        ...incident,
        firstGuidance: incident.firstGuidance.filter((guidance) => guidance.workerId === workerId),
        currentGuidance: incident.currentGuidance.filter(
          (guidance) => guidance.workerId === workerId,
        ),
        audit: [],
      })),
    events: [],
    cctv: [],
  };
}
