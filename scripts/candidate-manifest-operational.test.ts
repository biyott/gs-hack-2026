import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createCandidateManifest } from "./candidate-manifest";

const RUN_PATH = "docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z";
const OPERATIONAL_INPUTS = [
  `${RUN_PATH}/evidence/research/manufacturer/manifest.json`,
  "resources/blender/safety-simulator/mobile-cranes/tadano-gr250n4-rig.json",
  "resources/blender/safety-simulator/mobile-cranes/liebherr-ltm1050-rig.json",
  "resources/blender/safety-simulator/maeda-site/maeda/rig-catalog.json",
  "resources/blender/safety-simulator/lattice-cranes/liebherr-lr1100-rig.json",
  "resources/blender/safety-simulator/lattice-cranes/lr-pivot-correction-01/verify-pivot.mjs",
  "data/equipment/catalog.draft.json",
] as const;
let root: string;
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "candidate-operational-"));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

async function putFiles(paths: readonly string[], content = "operational input") {
  for (const path of paths) {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), content);
  }
}

describe("exact operational asset inputs", () => {
  it("includes every builder input and verifier as required source bytes", async () => {
    // Given
    await putFiles(OPERATIONAL_INPUTS);
    // When
    const manifest = await createCandidateManifest(root);
    // Then
    expect(manifest.sourceFiles.map((file) => file.path)).toEqual([...OPERATIONAL_INPUTS].sort());
    expect(manifest.buildArtifacts).toEqual([]);
    expect(
      manifest.missingRequiredInputs.filter((path) =>
        OPERATIONAL_INPUTS.some((input) => input === path),
      ),
    ).toEqual([]);
  });

  it.each(OPERATIONAL_INPUTS)("detects the exact missing operational input %s", async (omitted) => {
    // Given
    await putFiles(OPERATIONAL_INPUTS.filter((path) => path !== omitted));
    // When
    const manifest = await createCandidateManifest(root);
    // Then
    expect(
      manifest.missingRequiredInputs.filter((path) =>
        OPERATIONAL_INPUTS.some((input) => input === path),
      ),
    ).toEqual([omitted]);
  });

  it.each(OPERATIONAL_INPUTS)("binds operational input %s to source identity", async (path) => {
    // Given
    await putFiles(OPERATIONAL_INPUTS);
    const before = await createCandidateManifest(root);
    await putFiles([path], "changed operational input");
    // When
    const after = await createCandidateManifest(root);
    // Then
    expect(after.sourceSha256).not.toBe(before.sourceSha256);
    expect(after.candidateId).not.toBe(before.candidateId);
    expect(after.buildArtifacts).toEqual(before.buildArtifacts);
    expect(after.missingRequiredInputs).toEqual(before.missingRequiredInputs);
  });

  it("keeps unrelated manufacturer evidence, Blender reports and .omo files excluded", async () => {
    // Given
    await putFiles(OPERATIONAL_INPUTS);
    const before = await createCandidateManifest(root);
    await putFiles([
      `${RUN_PATH}/evidence/research/manufacturer/other-manifest.json`,
      `${RUN_PATH}/evidence/research/manufacturer/archive/manifest.json`,
      "docs/goal-runs/another-run/evidence/research/manufacturer/manifest.json",
      "resources/blender/safety-simulator/mobile-cranes/verification.json",
      "resources/blender/safety-simulator/lattice-cranes/lr-pivot-correction-01/red.json",
      ".omo/evidence/manufacturer/manifest.json",
    ]);
    // When
    const after = await createCandidateManifest(root);
    // Then
    expect(after).toEqual(before);
  });
});
