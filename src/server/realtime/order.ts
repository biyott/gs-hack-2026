import { randomUUID } from "node:crypto";
import type { SimulationMode, SimulationSnapshot } from "@/contracts";

/** Sequence crosses run resets; stream identity changes only with this runtime instance. */
export class SnapshotOrder {
  readonly streamId = randomUUID();
  private readonly sequences = new Map<SimulationMode, number>();

  next(snapshot: SimulationSnapshot): SimulationSnapshot {
    const sequence = (this.sequences.get(snapshot.mode) ?? -1) + 1;
    this.sequences.set(snapshot.mode, sequence);
    return { ...snapshot, streamId: this.streamId, sequence };
  }
}
