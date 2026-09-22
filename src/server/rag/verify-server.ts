import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import {
  type SimulationMode,
  type SimulationSnapshot,
  SimulationSnapshotSchema,
} from "@/contracts";
import {
  createHttpPublicationDriver,
  createRuntimeDriver,
  type PublicationDriver,
  readApplicabilityProof,
  readPhaseEvidence,
  readRagRows,
} from "./verify-server-drivers";
import {
  evaluatePublication,
  type ObservedSnapshot,
  type PublicationExpectation,
  phaseCompleted,
  primaryGuidance,
} from "./verify-server-results";

const transport = process.argv.find((argument) => argument.startsWith("--http="))?.slice(7);
const selectedMode = process.argv.find((argument) => argument.startsWith("--mode="))?.slice(7);
const modes = selectedMode
  ? [z.enum(["equipment", "fire-gas"]).parse(selectedMode)]
  : transport
    ? (["fire-gas"] as const)
    : (["equipment", "fire-gas"] as const);
const outputRoot = join(process.cwd(), "evidence/rag");
await mkdir(outputRoot, { recursive: true });
const outputDir = await mkdtemp(join(outputRoot, "server-publication-"));
const save = (name: string, value: unknown) =>
  writeFile(join(outputDir, name), JSON.stringify(value, null, 2));
const reports: ReturnType<typeof evaluatePublication>[] = [];

async function verifyScenario(
  driver: PublicationDriver,
  mode: SimulationMode,
  scenarioId: string,
): Promise<void> {
  const observed: ObservedSnapshot[] = [];
  const started = performance.now();
  let notify: (() => void) | undefined;
  const unsubscribe = await driver.subscribe(mode, (snapshot) => {
    observed.push({
      atMs: performance.now() - started,
      snapshot: SimulationSnapshotSchema.parse(snapshot),
    });
    notify?.();
  });
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const waitForPhase = async (initial: SimulationSnapshot) => {
    const completed = () => {
      const latest = observed.at(-1)?.snapshot;
      return latest !== undefined && phaseCompleted(initial, latest);
    };
    if (!completed())
      await new Promise<void>((resolve, reject) => {
        notify = () => {
          if (completed()) resolve();
        };
        timeout = setTimeout(
          () => reject(new Error("No terminal RAG publication observed within 15 seconds")),
          15_000,
        );
        notify();
      });
    if (timeout) clearTimeout(timeout);
    notify = undefined;
    const final = observed.at(-1)?.snapshot;
    assert.ok(final);
    return final;
  };
  try {
    const selected = await driver.execute(mode, { action: "select", scenarioId });
    const expectations: readonly PublicationExpectation[] =
      scenarioId === "FG-ROUTE-BLOCK"
        ? ["initial-fire-fallback", "fire-route-replacement"]
        : [mode === "equipment" ? "accepted" : "initial-fire-fallback"];
    let prior: SimulationSnapshot | null = null;
    for (const expectation of expectations) {
      const name = `${scenarioId}-${expectation}`;
      const previousRowIds = new Set(
        readRagRows(driver.database, selected.run.runId).map((row) => row.id),
      );
      const commandStartedMs = performance.now() - started;
      let initial: SimulationSnapshot;
      if (prior) {
        const resumed = await driver.execute(mode, { action: "resume" });
        initial = await driver.execute(mode, {
          action: "advance",
          deltaMs: 8000 - resumed.run.virtualTimeMs,
        });
      } else {
        initial = await driver.execute(mode, { action: "start" });
        if (primaryGuidance(initial).length === 0)
          initial = await driver.execute(mode, { action: "advance", deltaMs: 1000 });
      }
      const commandReturnedMs = performance.now() - started;
      assert.ok(primaryGuidance(initial).length > 0);
      await driver.execute(mode, { action: "pause" });
      await save(`${name}-initial.json`, initial);
      const final = await waitForPhase(initial);
      await save(`${name}-final.json`, final);
      const rows = readRagRows(driver.database, initial.run.runId).filter(
        (row) => !previousRowIds.has(row.id),
      );
      await save(
        `${name}-rag-runs.json`,
        rows.map((row) => ({
          ...row,
          provider: JSON.parse(row.provider_json),
          detail: JSON.parse(row.detail_json),
        })),
      );
      const evidence = readPhaseEvidence(driver.database, rows);
      await save(`${name}-source-evidence.json`, evidence);
      const guidance = primaryGuidance(initial).find(
        (candidate) => candidate.workerId === "WORKER-A",
      );
      assert.ok(guidance);
      const applicability = readApplicabilityProof(driver.database, guidance);
      await save(`${name}-applicability-history.json`, applicability);
      const report = evaluatePublication(
        { expectation, initial, prior, commandStartedMs, commandReturnedMs, applicability },
        observed,
        rows,
      );
      reports.push(report);
      await save(`${name}-report.json`, report);
      prior = final;
    }
  } finally {
    if (timeout) clearTimeout(timeout);
    notify = undefined;
    await unsubscribe();
    await save(`${scenarioId}-snapshots.json`, observed);
  }
}

let driver: PublicationDriver | undefined;
try {
  const hashes = await Promise.all(
    [
      "src/server/services/rag.ts",
      "src/server/services/rag-applicability.ts",
      "src/server/rag/service.ts",
      "src/server/rag/provider.ts",
      "src/server/rag/retrieval-candidates.ts",
      "src/server/rag/verify-server.ts",
      "src/server/rag/verify-server-drivers.ts",
      "src/server/rag/verify-server-results.ts",
      "src/server/rag/verify-server-route-proof.ts",
      "data/scenarios/fire-gas/fg-fire.json",
      "data/scenarios/fire-gas/fg-route-block.json",
    ].map(async (path) => ({
      path,
      sha256: createHash("sha256")
        .update(await readFile(path))
        .digest("hex"),
    })),
  );
  await save("run.json", {
    transport: transport ? "actual-http-sse" : "direct-runtime-snapshot-bus",
    baseUrl: transport ?? null,
    startedAt: new Date().toISOString(),
    command: process.argv,
    hashes,
    providerMode: "actual",
    modelExecution: "recorded per generation; configured provider identity does not prove a call",
    correction: "QD008 correction01: initial fire exclusion and engine-proven route replacement",
    isolatedDatabase: transport === undefined,
  });
  driver = transport
    ? await createHttpPublicationDriver(z.url().parse(transport))
    : await createRuntimeDriver(outputDir);
  for (const mode of modes) {
    if (mode === "equipment") await verifyScenario(driver, mode, "EQ-APPROACH");
    else {
      await verifyScenario(driver, mode, "FG-FIRE");
      await verifyScenario(driver, mode, "FG-ROUTE-BLOCK");
    }
  }
  await save("report.json", { passed: true, completedAt: new Date().toISOString(), reports });
  process.stdout.write(`${JSON.stringify({ outputDir, passed: true, reports })}\n`);
} catch (error) {
  if (!(error instanceof Error)) throw error;
  await save("failure.json", {
    passed: false,
    name: error.name,
    message: error.message,
    stack: error.stack,
    reports,
  });
  process.stderr.write(`${JSON.stringify({ outputDir, passed: false, message: error.message })}\n`);
  process.exitCode = 1;
} finally {
  await driver?.close();
}
