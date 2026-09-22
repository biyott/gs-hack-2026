import type { SimulationMode, SimulationSnapshot } from "@/contracts";

export type SnapshotVerdict =
  | "accept"
  | "wrong-mode"
  | "awaiting-stream"
  | "foreign-stream"
  | "out-of-order"
  | "duplicate"
  | "map-mismatch";

export function evaluateSnapshot(
  incoming: SimulationSnapshot,
  state: {
    readonly mode: SimulationMode;
    readonly current: SimulationSnapshot | null;
    readonly streamBaselineReady: boolean;
    readonly canEstablishStream: boolean;
  },
): SnapshotVerdict {
  if (incoming.mode !== state.mode) return "wrong-mode";
  if (!state.streamBaselineReady && !state.canEstablishStream) return "awaiting-stream";
  const current = state.current;
  if (!current) return state.canEstablishStream ? "accept" : "awaiting-stream";
  if (incoming.streamId !== current.streamId)
    return state.canEstablishStream ? "accept" : "foreign-stream";
  if (incoming.sequence < current.sequence) return "out-of-order";
  if (incoming.sequence === current.sequence) return "duplicate";
  if (
    incoming.run.runId === current.run.runId &&
    (incoming.run.mapId !== current.run.mapId || incoming.run.mapVersion !== current.run.mapVersion)
  )
    return "map-mismatch";
  return "accept";
}
