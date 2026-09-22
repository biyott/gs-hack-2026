import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { z } from "zod";
import { type RagCase, RagCaseSchema } from "./case-schema";
import { KnowledgeError, parseKnowledgeDocument } from "./knowledge";
import type { KnowledgeRecord } from "./types";

const root = fileURLToPath(new URL("../../../", import.meta.url));
export const sourceCasesPath = join(root, "tests/rag-test-cases.json");
export const derivedCasesPath = join(root, "tests/rag-test-cases.wall-clock-v1.1.json");
export const documentTestNow = "2026-09-21T09:30:00Z";
const fixtureRoot = join(root, "tests/negative-fixtures/wall-clock-v1.1");
const sourceCasesHash = "be54c02a5697048a29b07b425c6dad74773fcaee1ea56447e516217a0568f245";
const approvalLedgerHash = "ef2d2352527620d43d2a8ccd15a0f00bc740b3935dd995360c46382e1f3de00e";
const bindingHash = "ae85c3dec71024931f885b797c3e296ea0b31c69b603d85a194b32b0f2cebaca";
const manifestHash = "34a5a0f66fd22c097dd6e504c6b37a76e5cc395ad0fc04b5528385f4cfa917b0";
const FixtureIdSchema = z.string().regex(/^NEG-[A-Z-]+$/u);
const ManifestSchema = z.object({
  fixtures: z.array(
    z.object({
      documentId: FixtureIdSchema,
      derivedSha256: z.string(),
      sourceSha256: z.string(),
      sourcePath: z.string().regex(/^tests\/negative-fixtures\/NEG-[A-Z-]+\.md$/u),
    }),
  ),
});

function digest(source: string): string {
  return createHash("sha256").update(source).digest("hex");
}

export function loadRagCases(): readonly RagCase[] {
  const source = readFileSync(sourceCasesPath, "utf8");
  const ledger = readFileSync(join(root, "data/knowledge/reviews/approvals.json"), "utf8");
  const binding = readFileSync(
    join(root, "docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/clock-binding-v1.1.md"),
    "utf8",
  );
  if (
    digest(source) !== sourceCasesHash ||
    digest(ledger) !== approvalLedgerHash ||
    digest(binding) !== bindingHash
  ) {
    throw new KnowledgeError("QR-004 source or approval-ledger prerequisite changed");
  }
  const schema = z.array(RagCaseSchema).length(26);
  const originals = schema.parse(JSON.parse(source));
  const derived = schema.parse(JSON.parse(readFileSync(derivedCasesPath, "utf8")));
  const expected = originals.map((testCase) => ({
    ...testCase,
    context: { ...testCase.context, now: documentTestNow },
  }));
  if (!isDeepStrictEqual(derived, expected)) {
    throw new KnowledgeError("QR-004 derived cases changed fields beyond context.now");
  }
  return derived;
}

export function loadCaseFixture(documentId: string): KnowledgeRecord {
  const id = FixtureIdSchema.parse(documentId);
  const sourcePath = join(fixtureRoot, `${id}.md`);
  const source = readFileSync(sourcePath, "utf8");
  const manifestSource = readFileSync(join(fixtureRoot, "derivation-manifest.json"), "utf8");
  if (digest(manifestSource) !== manifestHash) {
    throw new KnowledgeError("QR-004 derived manifest changed");
  }
  const manifest = ManifestSchema.parse(JSON.parse(manifestSource));
  const entry = manifest.fixtures.find((fixture) => fixture.documentId === id);
  if (entry?.derivedSha256 !== digest(source)) {
    throw new KnowledgeError("QR-004 fixture differs from the derived manifest");
  }
  if (digest(readFileSync(join(root, entry.sourcePath), "utf8")) !== entry.sourceSha256) {
    throw new KnowledgeError("QR-004 original negative fixture changed");
  }
  const record = parseKnowledgeDocument(source, sourcePath);
  if (record.metadata.documentId !== id) throw new KnowledgeError("Fixture identity mismatch");
  return record;
}
