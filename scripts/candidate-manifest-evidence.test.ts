import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createCandidateManifest } from "./candidate-manifest";

const reportPaths = [
  "tools/calibration/http-smoke-results.json",
  "tools/calibration/http-smoke-results-20260921T103022570Z.json",
  "tools/calibration/http-bridge-smoke-results.json",
  "tools/calibration/http-bridge-smoke-results-20260921T110140255Z.json",
  "tools/calibration/benchmark-results.json",
  "tools/calibration/http-bridge-recovery-red-20260921T110814494Z.json",
  "data/scenarios/self-check-results.json",
  "data/scenarios/self-check.md",
  "apps/mobile/test/presentation/capture-manifest.json",
  "apps/mobile/test/presentation/candidate2-before/priority-first-screen-ko-375-200.png",
  "apps/mobile/test/presentation/candidate2-before/visual-evidence.tar.gz",
  "apps/mobile/test/presentation/candidate3-ui-evidence.md",
  "apps/mobile/test/presentation/candidate4-ui-evidence.md",
  "apps/mobile/test/presentation/priority-review-a.md",
  "apps/mobile/test/presentation/priority-review-b.md",
  "apps/mobile/test/setup/capture-manifest.json",
  "apps/mobile/test/setup/final-ui-evidence.md",
  "tests/negative-fixtures/wall-clock-v1.1/producer-run.json",
  "tests/negative-fixtures/wall-clock-v1.1/producer-run.final.json",
  "tests/negative-fixtures/wall-clock-v1.1/mock-sqlite-results.json",
  "tests/negative-fixtures/wall-clock-v1.1/mock-sqlite-final-results.json",
] as const;
let root: string;
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "candidate-evidence-"));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

async function put(path: string, content: string) {
  await mkdir(dirname(join(root, path)), { recursive: true });
  await writeFile(join(root, path), content);
}

describe("execution report boundaries", () => {
  it("keeps source and candidate identity stable when reports are replaced or added", async () => {
    // Given
    await put("tools/calibration/http-smoke.ts", "tool source");
    for (const path of reportPaths) await put(path, "previous result");
    const initial = await createCandidateManifest(root);
    for (const path of reportPaths) await put(path, "new result");
    await put("tools/calibration/http-bridge-smoke-results-20260922T000000000Z.json", "new run");
    // When
    const manifest = await createCandidateManifest(root);
    // Then
    expect(manifest.sourceFiles.map((file) => file.path)).toEqual([
      "tools/calibration/http-smoke.ts",
    ]);
    expect(manifest.sourceSha256).toBe(initial.sourceSha256);
    expect(manifest.candidateId).toBe(initial.candidateId);
  });

  it.each([
    "tools/calibration/http-smoke.ts",
    "tools/calibration/example-calibration.json",
    "tools/calibration/fixtures/expected-calibration.json",
    "tools/calibration/fixtures/http-smoke-results.json",
    "tools/another/http-bridge-smoke-results.json",
    "data/scenarios/self-check-inputs.json",
    "data/scenarios/equipment/example.json",
    "data/scenarios/fixtures/self-check-results.json",
    "apps/mobile/test/presentation/goldens/worker-ko-375.png",
    "apps/mobile/test/presentation/goldens/priority-first-screen-ko-375-200.png",
    "apps/mobile/test/presentation/worker_destination_wrap_test.dart",
    "apps/mobile/test/presentation/priority_evidence.md",
    "apps/mobile/test/presentation/worker_destination_wrap_evidence.md",
    "apps/mobile/test/presentation/visual-qa-evidence.md",
    "apps/mobile/test/setup/goldens/connection-ko-375-1x-top.png",
    "apps/mobile/test/setup/README.md",
    "apps/mobile/test/presentation/focus_evidence.md",
    "tools/calibration/http-bridge-recovery-red-20260922T000000000Z.json",
    "tests/negative-fixtures/wall-clock-v1.1/derivation-manifest.json",
    "tests/negative-fixtures/wall-clock-v1.1/derivation-manifest.initial.json",
  ])("changes source identity when the preserved input %s changes", async (path) => {
    // Given
    await put(path, "before");
    const initial = await createCandidateManifest(root);
    await put(path, "after");
    // When
    const manifest = await createCandidateManifest(root);
    // Then
    expect(manifest.sourceFiles.map((file) => file.path)).toEqual([path]);
    expect(manifest.sourceSha256).not.toBe(initial.sourceSha256);
    expect(manifest.candidateId).not.toBe(initial.candidateId);
  });

  it("keeps producer reports separate when they are explicitly selected as build artifacts", async () => {
    // Given
    for (const path of reportPaths) await put(path, "execution evidence");
    // When
    const manifest = await createCandidateManifest(root, "", reportPaths);
    // Then
    expect(manifest.sourceFiles).toEqual([]);
    expect(manifest.buildArtifacts).toEqual([]);
  });
});
