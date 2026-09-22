import { randomUUID } from "node:crypto";
import type { AuditEvent, Guidance, SimulationSnapshot } from "@/contracts";
import { createConfiguredRagService, type EnrichmentInput, type EnrichmentResult } from "../rag";
import { guidanceIsCurrent } from "../rag/validation";
import type { SimulationRuntime } from "../simulation/runtime";
import { guidanceApplicability } from "./rag-applicability";

export type RagReadiness = { status: "loading" | "ready" | "failed"; detail: string | null };

export interface AttachedRagService {
  initialize(): Promise<unknown>;
  enrichGuidance(
    input: EnrichmentInput,
    getCurrent: () => Guidance | null,
  ): Promise<EnrichmentResult>;
}

export type RagServiceFactory = (
  database: SimulationRuntime["dependencies"]["database"]["sqlite"],
) => AttachedRagService;

export function attachRag(
  runtime: SimulationRuntime,
  createService: RagServiceFactory = createConfiguredRagService,
): RagReadiness {
  const state: RagReadiness = { status: "loading", detail: null };
  if (runtime.disposed) return { status: "failed", detail: "runtime_disposed" };
  let service: AttachedRagService;
  try {
    service = createService(runtime.dependencies.database.sqlite);
  } catch (error) {
    state.status = "failed";
    state.detail = error instanceof Error ? "configuration_failed" : "configuration_rejected";
    return state;
  }
  const inFlight = new Set<string>();

  async function enrich(guidance: Guidance, snapshot: SimulationSnapshot): Promise<void> {
    const key = `${guidance.guidanceId}:${guidance.guidanceVersion}`;
    if (runtime.disposed || state.status !== "ready" || inFlight.has(key)) return;
    inFlight.add(key);
    try {
      const run = runtime.getRun(snapshot.mode);
      const hazards = snapshot.hazards.filter((hazard) =>
        guidance.hazardIds.includes(hazard.hazardId),
      );
      const getCurrent = () =>
        runtime.disposed
          ? null
          : (runtime
              .getRun(snapshot.mode)
              .snapshot.workers.find((worker) => worker.workerId === guidance.workerId)
              ?.currentGuidance ?? null);
      if (!guidanceIsCurrent(guidance, getCurrent(), Date.now())) return;
      const reason = guidance.messageArgs["reasonCode"];
      const scenarioPolicy =
        reason === "evacuate"
          ? "evacuation"
          : reason === "designated-space"
            ? "designated-refuge"
            : reason === "scenario-shelter"
              ? "shelter-per-scenario"
              : null;
      const profile = guidance.profileSnapshot;
      const assistanceRequired =
        profile.needsAssistance === true || profile.needsCompanion === true
          ? true
          : profile.needsAssistance === false && profile.needsCompanion === false
            ? false
            : null;
      const result = await service.enrichGuidance(
        {
          guidance,
          context: {
            query: `${guidance.primaryMessage} ${guidance.hazardType} ${guidance.actionCode}`,
            siteId: snapshot.run.mapId,
            simulationType: snapshot.mode,
            hazardTypes: [...new Set(hazards.map((hazard) => hazard.hazardType))],
            role: "worker",
            zoneIds: hazards.flatMap((hazard) => (hazard.zoneId ? [hazard.zoneId] : [])),
            substanceIds: hazards.flatMap((hazard) =>
              hazard.substanceId ? [hazard.substanceId] : [],
            ),
            profile: {
              stairsAllowed: profile.canUseStairs,
              assistanceRequired,
              verified: profile.confirmedAt !== null,
            },
            scenarioPolicy,
            applicability: guidanceApplicability(
              guidance,
              runtime.dependencies.repository.history(guidance.runId),
              run.policy.sensorStaleAfterMs,
            ),
            scope: "demo",
            limit: 3,
          },
        },
        getCurrent,
      );
      if (runtime.disposed || !guidanceIsCurrent(guidance, getCurrent(), Date.now())) return;
      applyResult(runtime, guidance, result);
    } catch (error) {
      state.detail = error instanceof Error ? "enrichment_failed" : "enrichment_rejected";
    } finally {
      inFlight.delete(key);
    }
  }

  runtime.onGuidance = (guidance, snapshot) => {
    setImmediate(() => {
      void enrich(guidance, snapshot);
    });
  };
  async function initialize(): Promise<void> {
    try {
      await service.initialize();
      if (runtime.disposed) {
        state.status = "failed";
        state.detail = "runtime_disposed";
        return;
      }
      state.status = "ready";
      for (const run of runtime.runs.values())
        for (const worker of run.snapshot.workers)
          if (worker.currentGuidance?.updateKind === "primary")
            void enrich(worker.currentGuidance, run.snapshot);
    } catch (error) {
      state.status = "failed";
      state.detail = error instanceof Error ? "initialization_failed" : "initialization_rejected";
    }
  }
  void initialize();
  return state;
}

function applyResult(
  runtime: SimulationRuntime,
  primary: Guidance,
  result: EnrichmentResult,
): void {
  const run = runtime.getRun(primary.simulationMode);
  const incident = run.snapshot.incidents.find(
    (candidate) => candidate.incidentId === primary.incidentId,
  );
  if (!incident || incident.status === "closed") return;
  let guidance: Guidance;
  let kind: string;
  let reason: string | null;
  switch (result.status) {
    case "fallback":
      guidance = primary;
      kind = "rag.fallback";
      reason = result.reason;
      break;
    case "accepted":
      guidance = {
        ...primary,
        guidanceVersion: primary.guidanceVersion + 1,
        updateKind: "supplement",
        primaryGuidanceVersion: primary.primaryGuidanceVersion,
        eventId: randomUUID(),
        mode: "rag-assisted",
        supplementalExplanation: result.supplement.supplementalExplanation,
        evidence: [...result.supplement.evidence],
      };
      kind = "guidance.supplement";
      reason = null;
      break;
    default:
      unreachable(result);
  }
  const audit: AuditEvent = {
    eventId: randomUUID(),
    incidentId: primary.incidentId,
    runId: primary.runId,
    kind,
    actorId: "rag",
    occurredAt: new Date().toISOString(),
    version: incident.version + 1,
    detail: JSON.stringify({
      guidanceId: guidance.guidanceId,
      guidanceVersion: guidance.guidanceVersion,
      primaryGuidanceVersion: guidance.primaryGuidanceVersion,
      ragRunId: result.ragRunId,
      reason,
    }),
  };
  const snapshot = {
    ...run.snapshot,
    workers: run.snapshot.workers.map((worker) =>
      worker.workerId === guidance.workerId ? { ...worker, currentGuidance: guidance } : worker,
    ),
    incidents: run.snapshot.incidents.map((currentIncident) =>
      currentIncident.incidentId === guidance.incidentId
        ? {
            ...currentIncident,
            version: currentIncident.version + 1,
            audit: [...currentIncident.audit, audit],
            currentGuidance: currentIncident.currentGuidance.map((current) =>
              current.workerId === guidance.workerId ? guidance : current,
            ),
          }
        : currentIncident,
    ),
    events: [...run.snapshot.events, audit],
  };
  runtime.commit(run, snapshot, "rag");
}

function unreachable(_value: never): never {
  throw new TypeError("Unsupported RAG result");
}
