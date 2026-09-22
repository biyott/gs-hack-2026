import type { SimulationSnapshot } from "@/contracts";

export function requestPlaybackStop(snapshot: SimulationSnapshot, now: string): SimulationSnapshot {
  return {
    ...snapshot,
    workers: snapshot.workers.map((worker) => {
      if (
        worker.currentGuidance === null ||
        (worker.response.voiceStatus !== "pending" && worker.response.voiceStatus !== "playing")
      )
        return worker;
      return {
        ...worker,
        response: {
          ...worker.response,
          voiceStatus: worker.response.voiceStatus === "playing" ? "stop-requested" : "pending",
          voiceStopRequestedAt: worker.response.voiceStopRequestedAt ?? now,
        },
      };
    }),
  };
}

export function restorePlaybackSnapshot(
  snapshot: SimulationSnapshot,
  now: string,
): SimulationSnapshot {
  const restored: SimulationSnapshot = {
    ...snapshot,
    run: {
      ...snapshot.run,
      status: snapshot.run.status === "running" ? "paused" : snapshot.run.status,
    },
  };
  return restored.run.status === "paused" ? requestPlaybackStop(restored, now) : restored;
}
