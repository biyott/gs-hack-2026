import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import Database from "better-sqlite3";
import { loadCaseApplicability } from "./case-applicability";
import { documentTestNow, loadCaseFixture, loadRagCases } from "./case-clock";
import { TransformersEmbeddingProvider } from "./embeddings";
import { ingestKnowledgeDirectory } from "./ingestion";
import { OpenAICompatibleLanguageModel } from "./provider";
import { retrieve } from "./retrieval";
import { createRagService } from "./service";
import { RagStore } from "./store";
import { sampleGuidance } from "./test-fixtures";

const root = process.cwd();
const runId = `RAG-ACTUAL-${new Date().toISOString().replace(/[:.]/gu, "-")}`;
const outputDir = join(root, "evidence/rag", runId);
await mkdir(outputDir, { recursive: true });
const db = new Database(join(outputDir, "actual-rag.sqlite"));
const embedding = new TransformersEmbeddingProvider();
const llm = new OpenAICompatibleLanguageModel({
  baseUrl: "http://127.0.0.1:8092/v1",
  model: "Qwen3-0.6B-Q8_0",
  version: "23749fefcc72300e3a2ad315e1317431b06b590a",
  timeoutMs: 5000,
});
const store = new RagStore(db);
const startedAt = new Date().toISOString();
const modelsOnly = process.argv.includes("--models-only");
const candidateFiles: { readonly path: string; readonly sha256: string }[] = [];
async function hashDirectory(directory: string): Promise<void> {
  for (const entry of await readdir(join(root, directory), { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await hashDirectory(path);
    if (entry.isFile())
      candidateFiles.push({
        path,
        sha256: createHash("sha256")
          .update(await readFile(join(root, path)))
          .digest("hex"),
      });
  }
}
for (const directory of [
  "src/server/rag",
  "packages/contracts",
  "knowledge",
  "data/knowledge/reviews",
  "tests/negative-fixtures",
])
  await hashDirectory(directory);
for (const path of [
  "package.json",
  "package-lock.json",
  "tests/rag-test-cases.json",
  "tests/rag-test-cases.wall-clock-v1.1.json",
  "tests/rag-applicability.v1.json",
]) {
  candidateFiles.push({
    path,
    sha256: createHash("sha256")
      .update(await readFile(join(root, path)))
      .digest("hex"),
  });
}
candidateFiles.sort((left, right) => left.path.localeCompare(right.path));
const componentCandidateHash = createHash("sha256")
  .update(JSON.stringify(candidateFiles))
  .digest("hex");
await writeFile(
  join(outputDir, "component-candidate.json"),
  JSON.stringify(
    {
      scope: "RAG component, not full integration candidate",
      componentCandidateHash,
      files: candidateFiles,
    },
    null,
    2,
  ),
);
const notes = {
  goalId: "GS-SAFETY-SIM-001",
  goalVersion: "1.0",
  taskRunId: "GS-SAFETY-SIM-001-20260921T084101Z",
  runId,
  startedAt,
  command: `npx tsx src/server/rag/verify-model.ts${modelsOnly ? " --models-only" : ""}`,
  verificationScope: modelsOnly ? "models-only" : "search-and-models",
  caseClockBinding: "qa/clock-binding-v1.1.md (QR-004)",
  documentTestNow,
  componentCandidateHash,
  environment: { node: process.version, platform: process.platform },
  embedding: embedding.identity,
  llm: llm.identity,
  mode: "actual",
  outputDir,
};
await writeFile(join(outputDir, "run.json"), JSON.stringify(notes, null, 2));
try {
  const ingestion = await ingestKnowledgeDirectory(root, store, {
    embedding,
    scope: "demo",
    now: startedAt,
    signal: AbortSignal.timeout(120_000),
  });
  assert.equal(ingestion.indexedDocumentIds.length, 18);
  const cases = loadRagCases();
  const casesPath = join(outputDir, "retrieval-cases.json");
  const results: {
    readonly testId: string;
    readonly passed: boolean;
    readonly outcome: string;
    readonly actualIds: readonly string[];
    readonly expectedIds: readonly string[];
  }[] = [];
  for (const testCase of modelsOnly ? [] : cases) {
    const { preferredLocale: _locale, negativeFixtureIds, ...context } = testCase.context;
    for (const fixtureId of negativeFixtureIds) {
      const record = loadCaseFixture(fixtureId);
      const vectors = await embedding.embed(
        [`passage: ${record.metadata.title}\n${record.body}`],
        AbortSignal.timeout(30_000),
      );
      const vector = vectors[0];
      assert.ok(vector);
      store.upsert(record, { identity: embedding.identity, vector });
    }
    const result = await retrieve(store, embedding, {
      ...context,
      applicability: loadCaseApplicability(testCase),
      simulationType: testCase.simulationType,
      query: testCase.query,
      runId: `${runId}:${testCase.testId}`,
      limit: 10,
      signal: AbortSignal.timeout(30_000),
    });
    const actualIds =
      result.outcome === "conflict"
        ? result.trace.conflictDocumentIds
        : result.chunks.map((chunk) => chunk.documentId);
    const passed =
      result.outcome === testCase.expectedOutcome &&
      testCase.expectedDocumentIds.every((id) => actualIds.includes(id)) &&
      testCase.forbiddenDocumentIds.every((id) => !actualIds.includes(id)) &&
      testCase.expectedActionCodes.includes(context.actionCode);
    results.push({
      testId: testCase.testId,
      passed,
      outcome: result.outcome,
      actualIds,
      expectedIds: testCase.expectedDocumentIds,
    });
    await writeFile(
      join(outputDir, `${testCase.testId}.json`),
      JSON.stringify({ testCase, result }, null, 2),
    );
    for (const fixtureId of negativeFixtureIds) store.remove(fixtureId);
  }
  await writeFile(casesPath, JSON.stringify(results, null, 2));
  const service = createRagService({ db, embedding, llm });
  const generations = [];
  for (const locale of ["en", "ko"] as const) {
    const now = Date.now();
    const guidance = {
      ...sampleGuidance(),
      runId,
      locale,
      requestedLocale: locale,
      guidanceId: `${runId}-${locale}`,
      profileSnapshot: { ...sampleGuidance().profileSnapshot, locale, preferredLocale: locale },
      generatedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + 60_000).toISOString(),
    };
    const before = performance.now();
    const outcome = await service.enrichGuidance(
      {
        guidance,
        context: {
          query: locale === "ko" ? "중장비 접근 경보" : "equipment approach alert",
          siteId: "SITE-CONSTRUCTION-01",
          simulationType: "equipment",
          hazardTypes: ["equipment"],
          role: "worker",
          zoneIds: ["ZONE-A"],
          substanceIds: [],
          scenarioPolicy: null,
          scope: "demo",
          limit: 3,
          profile: { stairsAllowed: false, assistanceRequired: true, verified: true },
        },
      },
      () => guidance,
    );
    generations.push({ locale, elapsedMs: performance.now() - before, outcome });
  }
  const vectors = store.embeddings();
  const report = {
    ...notes,
    completedAt: new Date().toISOString(),
    ingestion,
    caseResults: results,
    generations,
    vectorCount: vectors.length,
    vectorHash: createHash("sha256").update(JSON.stringify(vectors)).digest("hex"),
    passed:
      results.every((result) => result.passed) &&
      generations.every((result) => result.outcome.status === "accepted"),
  };
  await writeFile(join(outputDir, "report.json"), JSON.stringify(report, null, 2));
  await writeFile(join(outputDir, "vectors.json"), JSON.stringify(vectors));
  process.stdout.write(
    `${JSON.stringify({ outputDir, passed: report.passed, cases: results.filter((result) => result.passed).length, totalCases: results.length, generations })}\n`,
  );
  if (!report.passed) process.exitCode = 1;
} catch (error) {
  if (!(error instanceof Error)) throw error;
  await writeFile(
    join(outputDir, "failure.json"),
    JSON.stringify(
      { name: error.name, message: error.message, at: new Date().toISOString() },
      null,
      2,
    ),
  );
  process.stderr.write(`${error.name}: ${error.message}\n`);
  process.exitCode = 1;
} finally {
  db.close();
}
