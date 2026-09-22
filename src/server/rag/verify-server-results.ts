import assert from "node:assert/strict";
import { z } from "zod";
import type { SimulationSnapshot } from "@/contracts";
import type { PersistedRagRow, readApplicabilityProof } from "./verify-server-drivers";
import { primaryGuidance, proveRouteReplacement } from "./verify-server-route-proof";

export { primaryGuidance } from "./verify-server-route-proof";

export type PublicationExpectation =
  | "accepted"
  | "initial-fire-fallback"
  | "fire-route-replacement";
export type ObservedSnapshot = { readonly atMs: number; readonly snapshot: SimulationSnapshot };
export type PublicationPhase = {
  readonly expectation: PublicationExpectation;
  readonly initial: SimulationSnapshot;
  readonly prior: SimulationSnapshot | null;
  readonly commandStartedMs: number;
  readonly commandReturnedMs: number;
  readonly applicability: ReturnType<typeof readApplicabilityProof>;
};

const generationSchema = z.object({
  guidanceId: z.string(),
  callId: z.string().optional(),
  modelReturned: z.string().optional(),
  responseHash: z.string().optional(),
  reason: z.string().optional(),
  completion: z
    .object({ callId: z.string(), responseHash: z.string(), modelReturned: z.string() })
    .nullable()
    .optional(),
});
const retrievalSchema = z.object({
  applicability: z
    .object({
      fireInvalidatedPreviousRoute: z.boolean().optional(),
      equipmentDirectionChanged: z.boolean().optional(),
    })
    .nullable(),
  filters: z.array(
    z.object({ documentId: z.string(), eligible: z.boolean(), reasons: z.array(z.string()) }),
  ),
  queryVector: z.array(z.number()),
  fused: z.array(z.object({ chunkId: z.string(), score: z.number() })),
});
const auditSchema = z.object({ guidanceId: z.string(), primaryGuidanceVersion: z.number() });

export function phaseCompleted(initial: SimulationSnapshot, latest: SimulationSnapshot): boolean {
  const primaries = primaryGuidance(initial);
  return (
    primaries.length > 0 &&
    latest.run.runId === initial.run.runId &&
    primaries.every(
      (primary) =>
        latest.workers.some(
          (worker) =>
            worker.currentGuidance?.guidanceId === primary.guidanceId &&
            worker.currentGuidance.primaryGuidanceVersion === primary.primaryGuidanceVersion &&
            worker.currentGuidance.updateKind === "supplement",
        ) ||
        latest.events.some((event) => {
          if (event.kind !== "rag.fallback") return false;
          const detail = auditSchema.parse(JSON.parse(event.detail));
          return (
            detail.guidanceId === primary.guidanceId &&
            detail.primaryGuidanceVersion === primary.primaryGuidanceVersion
          );
        }),
    )
  );
}

export function evaluatePublication(
  phase: PublicationPhase,
  observed: readonly ObservedSnapshot[],
  rows: readonly PersistedRagRow[],
) {
  const { initial, expectation, commandReturnedMs } = phase;
  const final = observed.at(-1)?.snapshot;
  assert.ok(final && phaseCompleted(initial, final));
  const primaries = primaryGuidance(initial);
  assert.ok(primaries.length > 0 && primaries.every((guidance) => guidance.mode === "template"));
  const retrievals = rows
    .filter((row) => row.phase === "retrieval")
    .map((row) => ({
      ragRunId: row.id,
      outcome: row.outcome,
      ...retrievalSchema.parse(JSON.parse(row.detail_json)),
    }));
  assert.ok(retrievals.length > 0);
  const generations = rows
    .filter((row) => row.phase === "generation")
    .map((row) => {
      const detail = generationSchema.parse(JSON.parse(row.detail_json));
      const completion = detail.callId ? detail : detail.completion;
      const modelCalled = completion?.callId
        ? true
        : ["no_match", "conflict"].includes(detail.reason ?? "")
          ? false
          : null;
      return { ragRunId: row.id, outcome: row.outcome, modelCalled, detail };
    });
  const accepted = generations.filter((generation) => generation.outcome === "accepted");
  let routeProof: ReturnType<typeof proveRouteReplacement> | null = null;
  switch (expectation) {
    case "initial-fire-fallback":
      assert.equal(phase.applicability.facts.fireInvalidatedPreviousRoute, false);
      assert.equal(accepted.length, 0);
      assert.ok(
        generations.length > 0 &&
          generations.every(
            (generation) =>
              generation.outcome === "fallback" &&
              generation.detail.reason === "no_match" &&
              generation.modelCalled === false,
          ),
      );
      for (const retrieval of retrievals) {
        assert.equal(retrieval.applicability?.fireInvalidatedPreviousRoute, false);
        const filter = retrieval.filters.find((candidate) => candidate.documentId === "FG-002");
        assert.ok(
          filter && !filter.eligible && filter.reasons.includes("fire-route-invalidation-unproven"),
        );
        assert.ok(retrieval.fused.every((hit) => !hit.chunkId.startsWith("FG-002:")));
      }
      assert.ok(
        final.workers.every(
          (worker) =>
            worker.currentGuidance?.evidence.every(
              (reference) => reference.documentId !== "FG-002",
            ) ?? true,
        ),
      );
      break;
    case "fire-route-replacement":
      assert.ok(phase.prior);
      assert.equal(phase.applicability.facts.fireInvalidatedPreviousRoute, true);
      routeProof = proveRouteReplacement(phase.prior, initial);
      assert.ok(
        retrievals.some(
          (retrieval) =>
            retrieval.applicability?.fireInvalidatedPreviousRoute === true &&
            retrieval.filters.some((filter) => filter.documentId === "FG-002" && filter.eligible) &&
            retrieval.fused.some((hit) => hit.chunkId.startsWith("FG-002:")),
        ),
      );
      assert.ok(
        final.workers.some((worker) =>
          worker.currentGuidance?.evidence.some((reference) => reference.documentId === "FG-002"),
        ),
      );
      assert.ok(accepted.length > 0);
      break;
    case "accepted":
      assert.ok(accepted.length > 0);
      break;
    default:
      unreachable(expectation);
  }
  const publications = accepted.map((generation) => {
    const { detail } = generation;
    assert.ok(detail.callId && detail.responseHash && detail.modelReturned);
    const primary = primaries.find((guidance) => guidance.guidanceId === detail.guidanceId);
    const supplement = final.workers.find(
      (worker) => worker.currentGuidance?.guidanceId === primary?.guidanceId,
    )?.currentGuidance;
    assert.ok(primary && supplement);
    assert.equal(supplement.updateKind, "supplement");
    assert.equal(supplement.mode, "rag-assisted");
    assert.equal(supplement.guidanceVersion, primary.guidanceVersion + 1);
    assert.equal(supplement.primaryGuidanceVersion, primary.primaryGuidanceVersion);
    assert.equal(supplement.actionCode, primary.actionCode);
    assert.equal(supplement.primaryMessage, primary.primaryMessage);
    assert.ok(supplement.supplementalExplanation && supplement.evidence.length > 0);
    const matching = observed.filter((event) =>
      event.snapshot.workers.some(
        (worker) =>
          worker.currentGuidance?.guidanceId === primary.guidanceId &&
          worker.currentGuidance.primaryGuidanceVersion === primary.primaryGuidanceVersion,
      ),
    );
    const firstAtMs = matching.find((event) =>
      event.snapshot.workers.some(
        (worker) =>
          worker.currentGuidance?.workerId === primary.workerId &&
          worker.currentGuidance.updateKind === "primary",
      ),
    )?.atMs;
    const supplementAtMs = matching.find((event) =>
      event.snapshot.workers.some(
        (worker) =>
          worker.currentGuidance?.workerId === primary.workerId &&
          worker.currentGuidance.updateKind === "supplement",
      ),
    )?.atMs;
    assert.ok(
      firstAtMs !== undefined &&
        supplementAtMs !== undefined &&
        firstAtMs < supplementAtMs &&
        commandReturnedMs < supplementAtMs,
    );
    return {
      workerId: primary.workerId,
      guidanceId: primary.guidanceId,
      primaryVersion: primary.guidanceVersion,
      supplementalVersion: supplement.guidanceVersion,
      primaryGuidanceVersion: supplement.primaryGuidanceVersion,
      firstAtMs,
      supplementAtMs,
      callId: detail.callId,
      responseHash: detail.responseHash,
      modelReturned: detail.modelReturned,
      ragRunId: generation.ragRunId,
    };
  });
  for (const incident of initial.incidents)
    assert.deepEqual(
      final.incidents.find((candidate) => candidate.incidentId === incident.incidentId)
        ?.firstGuidance,
      incident.firstGuidance,
    );
  for (const row of rows)
    z.object({ mode: z.literal("actual") }).parse(JSON.parse(row.provider_json));
  return {
    mode: initial.mode,
    scenarioId: initial.run.scenarioId,
    expectation,
    runId: initial.run.runId,
    templateCommandMs: commandReturnedMs - phase.commandStartedMs,
    accepted: accepted.length,
    fallback: generations.filter((generation) => generation.outcome === "fallback").length,
    generations,
    retrievals,
    routeProof,
    publications,
    applicability: phase.applicability.facts,
    historyVersions: phase.applicability.history.map((snapshot) => snapshot.run.version),
    immutableFirstGuidance: true,
  };
}

function unreachable(_value: never): never {
  throw new TypeError("Unsupported publication expectation");
}
