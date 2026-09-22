import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createCandidateManifest } from "./candidate-manifest";
import { PROVENANCE_ARTIFACT_INPUTS } from "./candidate-manifest-knowledge";

let root: string;
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "candidate-manifest-"));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

async function putFiles(files: Readonly<Record<string, string>>) {
  for (const [path, content] of Object.entries(files)) {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), content);
  }
}

describe("candidate content inventory", () => {
  it("hashes uncommitted source bytes when no git repository exists", async () => {
    // Given
    await putFiles({ "src/new.ts": "abc", "package-lock.json": "lock" });
    // When
    const manifest = await createCandidateManifest(root);
    // Then
    expect(manifest.sourceFiles).toContainEqual({
      path: "src/new.ts",
      bytes: 3,
      sha256: "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    });
    expect(manifest.sourceFiles.map((file) => file.path)).toEqual([
      "package-lock.json",
      "src/new.ts",
    ]);
  });

  it("includes production data, review decisions, GLBs, source assets and contracts", async () => {
    // Given
    const paths = [
      ".env.example",
      "data/maps/site.json",
      "data/scenarios/example.json",
      "data/policies/example.json",
      "data/equipment/catalog.json",
      "drizzle/0000.sql",
      "knowledge/equipment/EQ-001.md",
      "data/knowledge/reviews/decisions.json",
      "data/knowledge/reviews/approvals.json",
      "data/knowledge/reviews/verify-approval-ledger.mjs",
      "tests/negative-fixtures/rejected.md",
      "public/assets/cranes/example.glb",
      "resources/blender/safety-simulator/example/model.blend",
      "resources/blender/safety-simulator/example/build.py",
      "resources/blender/safety-simulator/artifact-manifest.json",
      "docs/contracts/v1.md",
      "docs/demo-runbook.md",
      "DESIGN.md",
      "apps/mobile/lib/main.dart",
      "apps/mobile/pubspec.lock",
    ];
    await putFiles(Object.fromEntries(paths.map((path) => [path, path])));
    // When
    const manifest = await createCandidateManifest(root);
    // Then
    expect(manifest.sourceFiles.map((file) => file.path)).toEqual(paths.sort());
  });

  it("ignores secrets, runtime state, caches and execution evidence", async () => {
    // Given
    await putFiles({ "src/main.ts": "source" });
    const initial = await createCandidateManifest(root);
    await putFiles({
      ".env": "secret",
      ".env.local": "secret",
      "src/.env.production": "secret",
      "src/state.sqlite": "state",
      "src/state.sqlite-wal": "wal",
      "src/runtime.db-shm": "shm",
      "src/server.log": "log",
      "src/node_modules/a.ts": "dependency",
      "apps/mobile/android/local.properties": "host",
      "apps/mobile/android/key.properties": "secret",
      "apps/mobile/build/cache.dart": "cache",
      "data/knowledge/runtime/models/model.onnx": "weights",
      "docs/goal-runs/example/evidence/result.json": "evidence",
      "resources/blender/safety-simulator/demo/verification.json": "evidence",
      "resources/blender/safety-simulator/demo/overview.png": "evidence",
      "resources/blender/safety-simulator/demo/model.blend1": "backup",
      "tests/frontend/evidence/capture.json": "evidence",
      "tests/frontend/artifacts/report.json": "evidence",
      "src/logs/rotated.txt": "log",
      "src/__pycache__/code.pyc": "cache",
    });
    // When
    const manifest = await createCandidateManifest(root);
    // Then
    expect(manifest).toEqual(initial);
  });

  it("includes only the exact required clock binding from the excluded QA directory", async () => {
    // Given
    const qa = "docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa";
    const binding = `${qa}/clock-binding-v1.1.md`;
    await putFiles({
      [binding]: "binding",
      [`${qa}/results.json`]: "evidence",
      [`${qa}/clock-binding-v1.2.md`]: "other binding",
      "docs/goal-runs/another-run/qa/clock-binding-v1.1.md": "other run",
    });
    // When
    const manifest = await createCandidateManifest(root, "", [binding]);
    // Then
    expect(manifest.sourceFiles.map((file) => file.path)).toEqual([binding]);
    expect(manifest.missingRequiredInputs).not.toContain(binding);
    expect(manifest.buildArtifacts).toEqual([]);
  });

  it("keeps its identity stable when a configurable output is regenerated", async () => {
    // Given
    await putFiles({ "src/main.ts": "source" });
    const output = join(root, "src", "candidate.json");
    const initial = await createCandidateManifest(root, output);
    await writeFile(output, JSON.stringify(initial));
    // When
    const manifest = await createCandidateManifest(root, output);
    // Then
    expect(manifest).toEqual(initial);
  });

  it("changes candidate identity when working tree source changes", async () => {
    // Given
    await putFiles({ "src/main.ts": "before" });
    const initial = await createCandidateManifest(root);
    await putFiles({ "src/main.ts": "after" });
    // When
    const manifest = await createCandidateManifest(root);
    // Then
    expect(manifest.sourceSha256).not.toBe(initial.sourceSha256);
    expect(manifest.candidateId).not.toBe(initial.candidateId);
  });

  it("hashes final artifacts separately while binding them to candidate identity", async () => {
    // Given
    await putFiles({ "src/main.ts": "source" });
    const initial = await createCandidateManifest(root);
    await putFiles({
      "apps/mobile/build/app/outputs/flutter-apk/app-debug.apk": "apk",
      ".next/BUILD_ID": "build",
      ".next/package.json": '{"type":"commonjs"}',
      ".next/server/app/page.js": "server",
      ".next/static/app.js": "client",
      ".next/cache/generated.json": "cache",
    });
    // When
    const manifest = await createCandidateManifest(root);
    // Then
    expect(manifest.sourceSha256).toBe(initial.sourceSha256);
    expect(manifest.candidateId).not.toBe(initial.candidateId);
    expect(manifest.buildArtifacts.map((file) => file.path)).toEqual([
      ".next/BUILD_ID",
      ".next/package.json",
      ".next/server/app/page.js",
      ".next/static/app.js",
      "apps/mobile/build/app/outputs/flutter-apk/app-debug.apk",
    ]);
    expect(
      manifest.missingRequiredArtifacts.filter(
        (entry) => !PROVENANCE_ARTIFACT_INPUTS.some((path) => path === entry.requirement),
      ),
    ).toEqual([]);
  });

  it("changes only artifact identity when Next regenerates its environment declaration", async () => {
    // Given
    await putFiles({
      "src/main.ts": "source",
      "next-env.d.ts": 'import "./.next/dev/types/routes.d.ts";',
      ".next/types/routes.d.ts": "export {};",
      ".next/dev/types/routes.d.ts": "export {};",
    });
    const initial = await createCandidateManifest(root);
    await putFiles({ "next-env.d.ts": 'import "./.next/types/routes.d.ts";' });
    // When
    const manifest = await createCandidateManifest(root);
    // Then
    expect(manifest.sourceFiles.map((file) => file.path)).toEqual(["src/main.ts"]);
    expect(manifest.sourceSha256).toBe(initial.sourceSha256);
    expect(manifest.buildArtifacts.map((file) => file.path)).toEqual([
      ".next/types/routes.d.ts",
      "next-env.d.ts",
    ]);
    expect(manifest.buildArtifacts).not.toEqual(initial.buildArtifacts);
    expect(manifest.candidateId).not.toBe(initial.candidateId);
  });

  it("lists missing mandatory inputs and artifacts without accepting build caches", async () => {
    // Given
    await putFiles({ "apps/mobile/build/test/worker.png": "test output" });
    // When
    const manifest = await createCandidateManifest(root);
    // Then
    expect(manifest.missingRequiredInputs).toContain(".env.example");
    expect(manifest.missingRequiredInputs).toContain("knowledge/fire-gas/FG-008.md");
    expect(manifest.missingRequiredInputs).toContain(
      "docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z/qa/clock-binding-v1.1.md",
    );
    expect(
      manifest.missingRequiredArtifacts
        .filter((entry) => !PROVENANCE_ARTIFACT_INPUTS.some((path) => path === entry.requirement))
        .map((entry) => entry.requirement),
    ).toEqual(["android-apk", "web-build-id", "web-package", "web-server", "web-static"]);
    expect(manifest.buildArtifacts).toEqual([]);
  });

  it("rejects source symlinks instead of silently omitting outside content", async () => {
    // Given
    await putFiles({ "src/main.ts": "source", "outside.ts": "hidden" });
    await symlink(join(root, "outside.ts"), join(root, "src/linked.ts"));
    // When / Then
    await expect(createCandidateManifest(root)).rejects.toThrow(/symlink/i);
  });

  it("records generated Next runtime manifests outside the server directory", async () => {
    // Given
    const paths = [
      ".next/images-manifest.json",
      ".next/react-loadable-manifest.json",
      ".next/dynamic-css-manifest.json",
    ];
    await putFiles(Object.fromEntries(paths.map((path) => [path, "{} "])));
    // When
    const manifest = await createCandidateManifest(root);
    // Then
    expect(manifest.buildArtifacts.map((file) => file.path)).toEqual(paths.sort());
  });

  it("records an explicit APK path and accepts it as the required Android artifact", async () => {
    // Given
    await putFiles({ "artifacts/demo.apk": "custom apk" });
    // When
    const manifest = await createCandidateManifest(root, "", ["artifacts/demo.apk"]);
    // Then
    expect(manifest.buildArtifacts.map((file) => file.path)).toEqual(["artifacts/demo.apk"]);
    expect(manifest.missingRequiredArtifacts.map((entry) => entry.requirement)).not.toContain(
      "android-apk",
    );
  });

  it("keeps secrets, caches and execution evidence excluded from explicit artifacts", async () => {
    // Given
    const paths = [".next/cache/data.json", "evidence/result.apk", ".env.production"];
    await putFiles(Object.fromEntries(paths.map((path) => [path, "excluded"])));
    // When
    const manifest = await createCandidateManifest(root, "", paths);
    // Then
    expect(manifest.buildArtifacts).toEqual([]);
    expect(manifest.missingRequiredArtifacts.map((entry) => entry.requirement)).toEqual(
      expect.arrayContaining(paths),
    );
  });

  it("rejects extra artifact paths outside the repository", async () => {
    // Given
    const path = "../outside.apk";
    // When / Then
    await expect(createCandidateManifest(root, "", [path])).rejects.toThrow(
      /inside the repository/,
    );
  });
});

describe("candidate manifest CLI", () => {
  it("writes a requested manifest and returns an incomplete exit code for missing artifacts", async () => {
    // Given
    await putFiles({ "src/main.ts": "source" });
    const output = join(root, "handoff", "candidate.json");
    const script = fileURLToPath(new URL("./candidate-manifest.ts", import.meta.url));
    // When
    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", script, "--root", root, "--out", output],
      { encoding: "utf8" },
    );
    // Then
    expect(result.status).toBe(2);
    expect(result.stderr).toBe("");
    const payload: unknown = JSON.parse(await readFile(output, "utf8"));
    expect(payload).toMatchObject({ sourceFiles: [{ path: "src/main.ts" }] });
  });
});
