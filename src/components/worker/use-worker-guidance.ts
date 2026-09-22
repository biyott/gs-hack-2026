"use client";

import { useEffect, useState } from "react";
import type { SimulationSnapshot, SiteMap, WorkerState } from "@/contracts";
import { currentWorkerGuidance } from "./guidance-policy";

export function useWorkerGuidance(
  snapshot: SimulationSnapshot | null,
  worker: WorkerState | undefined,
  map: SiteMap,
) {
  const [, setExpiryRevision] = useState(0);
  const expiresAt = worker?.currentGuidance?.expiresAt;
  useEffect(() => {
    if (!expiresAt) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      const remaining = Date.parse(expiresAt) - Date.now();
      if (remaining <= 0) {
        setExpiryRevision((revision) => revision + 1);
        return;
      }
      timer = setTimeout(schedule, Math.min(remaining + 1, 2_147_483_647));
    };
    schedule();
    return () => {
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [expiresAt]);
  return snapshot && worker ? currentWorkerGuidance(snapshot, worker, map, Date.now()) : null;
}
