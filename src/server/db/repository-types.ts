import type {
  AuditEvent,
  Guidance,
  IncidentAction,
  SimulationCommand,
  SimulationMode,
  SimulationSnapshot,
  WorkerResponse,
} from "@gs-safety/contracts";

export type RunCommit = {
  readonly snapshot: SimulationSnapshot;
  readonly expectedVersion: number;
  readonly actorId: string;
  readonly response?: WorkerResponse;
  readonly request?: SimulationCommand | IncidentAction;
  readonly runtimeStateJson?: string;
};
export type PreviousRun = {
  readonly runId: string;
  readonly version: number;
  readonly request?: SimulationCommand | IncidentAction;
  readonly runtimeStateJson?: string;
};
export type RequestKey = {
  readonly mode: SimulationMode;
  readonly runId: string;
  readonly requestId: string;
};
export type RequestReceipt = {
  readonly request: SimulationCommand | IncidentAction;
  readonly actorId: string;
  readonly snapshot: SimulationSnapshot;
};
export type ResponseKey = {
  readonly runId: string;
  readonly workerId: string;
  readonly requestId: string;
};
export type ResponseReceipt = {
  readonly request: WorkerResponse;
  readonly actorId: string;
  readonly snapshot: SimulationSnapshot;
};
export type RunRepository = {
  readonly create: (
    snapshot: SimulationSnapshot,
    actorId: string,
    runtimeStateJson?: string,
  ) => SimulationSnapshot;
  readonly commit: (change: RunCommit) => SimulationSnapshot;
  readonly replace: (
    snapshot: SimulationSnapshot,
    previous: PreviousRun,
    actorId: string,
  ) => SimulationSnapshot;
  readonly get: (runId: string) => SimulationSnapshot | null;
  readonly runtimeState: (runId: string) => string | null;
  readonly current: (mode: SimulationMode) => SimulationSnapshot | null;
  readonly history: (runId: string) => readonly SimulationSnapshot[];
  readonly guidanceHistory: (incidentId: string) => readonly Guidance[];
  readonly audits: (runId: string) => readonly AuditEvent[];
  readonly responseReceipt: (key: ResponseKey) => ResponseReceipt | null;
  readonly requestReceipt: (key: RequestKey) => RequestReceipt | null;
  readonly findRequestReceipt: (mode: SimulationMode, requestId: string) => RequestReceipt | null;
};
