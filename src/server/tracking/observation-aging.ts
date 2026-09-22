import type { PositionObservation } from "../../../packages/contracts/src/tracking";
import { TRACKING_STALE_MS } from "./types";

export function ageObservation<T extends PositionObservation>(value: T, now: string): T {
  const ageMs =
    value.lastObservedAt === null
      ? null
      : Math.max(0, Date.parse(now) - Date.parse(value.lastObservedAt));
  if (ageMs !== null && ageMs > TRACKING_STALE_MS) {
    return {
      ...value,
      ageMs,
      status: "stale",
      position: null,
      tablePositionM: null,
      tablePositionCm: null,
      error: "Last observation is older than 1000ms.",
    };
  }
  return { ...value, ageMs };
}
