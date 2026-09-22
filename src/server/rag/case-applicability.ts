import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { z } from "zod";
import { sourceCasesPath } from "./case-clock";
import { type RagCase, RagCaseSchema } from "./case-schema";
import { KnowledgeError } from "./knowledge";
import type { ApplicabilityFacts } from "./types";

const sourceHash = "be54c02a5697048a29b07b425c6dad74773fcaee1ea56447e516217a0568f245";
const basis = z.object({
  sourceQuery: z.string().min(1),
  sourceReason: z.string().min(1),
  basis: z.string().min(1),
});
const BindingSchema = z
  .object({
    schemaVersion: z.literal("1.0.0"),
    authority: z.literal("QD-008"),
    scope: z.literal("test-input-only"),
    sourceCases: z
      .object({
        path: z.literal("tests/rag-test-cases.json"),
        sha256: z.literal(sourceHash),
      })
      .strict(),
    limitations: z.string().min(1),
    bindings: z.tuple([
      basis
        .extend({
          testId: z.literal("RAG-002-equipment-direction"),
          simulationType: z.literal("equipment"),
          applicability: z.object({ equipmentDirectionChanged: z.literal(true) }).strict(),
        })
        .strict(),
      basis
        .extend({
          testId: z.literal("RAG-006-fire-reroute"),
          simulationType: z.literal("fire-gas"),
          applicability: z.object({ fireInvalidatedPreviousRoute: z.literal(true) }).strict(),
        })
        .strict(),
    ]),
  })
  .strict();

export function loadCaseApplicability(testCase: RagCase): ApplicabilityFacts {
  const source = readFileSync(sourceCasesPath, "utf8");
  if (createHash("sha256").update(source).digest("hex") !== sourceHash) {
    throw new KnowledgeError("QD-008 original case source changed");
  }
  const originals = RagCaseSchema.array().length(26).parse(JSON.parse(source));
  const original = originals.find((entry) => entry.testId === testCase.testId);
  if (
    !original ||
    !isDeepStrictEqual(original, {
      ...testCase,
      context: { ...testCase.context, now: original.context.now },
    })
  ) {
    throw new KnowledgeError("QD-008 case identity or original scenario semantics changed");
  }
  const artifactPath = fileURLToPath(
    new URL("../../../tests/rag-applicability.v1.json", import.meta.url),
  );
  const artifact = BindingSchema.parse(JSON.parse(readFileSync(artifactPath, "utf8")));
  for (const binding of artifact.bindings) {
    const scenario = originals.find((entry) => entry.testId === binding.testId);
    if (
      scenario?.simulationType !== binding.simulationType ||
      scenario.query !== binding.sourceQuery ||
      scenario.reason !== binding.sourceReason
    ) {
      throw new KnowledgeError("QD-008 applicability basis differs from the original scenario");
    }
  }
  return (
    artifact.bindings.find((binding) => binding.testId === testCase.testId)?.applicability ?? {}
  );
}
