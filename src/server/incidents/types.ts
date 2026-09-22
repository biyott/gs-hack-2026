import type { Point, Session, SimulationSnapshot } from "@/contracts";

export type IncidentContext = {
  readonly session: Session;
  readonly now: string;
};

export type WorkerResponseContext = IncidentContext & {
  readonly arrivalTargets: Readonly<Record<string, Point | null>>;
  readonly arrivalToleranceM: number;
};

export type IncidentOutcome = {
  readonly snapshot: SimulationSnapshot;
  readonly refreshWorkerIds: readonly string[];
};

export type IncidentErrorCode =
  | "NOT_FOUND"
  | "CONFLICT"
  | "INVALID_TRANSITION"
  | "STALE_GUIDANCE"
  | "ARRIVAL_UNVERIFIED"
  | "MODE_MISMATCH";

export class IncidentTransitionError extends Error {
  override readonly name = "IncidentTransitionError";

  constructor(
    readonly code: IncidentErrorCode,
    message: string,
    readonly currentVersion?: number,
  ) {
    super(message);
  }
}

export function assertNever(value: never): never {
  throw new IncidentTransitionError(
    "INVALID_TRANSITION",
    `Unsupported incident operation: ${String(value)}`,
  );
}
