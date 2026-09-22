import { createHash } from "node:crypto";
import { lstat, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { PROVENANCE_ARTIFACT_INPUTS } from "./candidate-manifest-knowledge";
import {
  ARTIFACT_INPUTS,
  CALIBRATION_REPORT_PATH,
  CLOCK_BINDING_INPUT,
  EXCLUDED_DIRECTORIES,
  EXECUTION_REPORT_PATHS,
  OPERATIONAL_SOURCE_INPUTS,
  REQUIRED_ARTIFACTS,
  REQUIRED_INPUTS,
  SOURCE_BUILD_DIRECTORIES,
  SOURCE_INPUTS,
} from "./candidate-manifest-scope";

type FileDigest = { readonly path: string; readonly bytes: number; readonly sha256: string };
type Scan = { readonly root: string; readonly output: string; readonly artifacts: boolean };

class ManifestInputError extends Error {
  readonly name = "ManifestInputError";
  constructor(message: string) {
    super(message);
  }
}

function excluded(path: string, artifacts: boolean): boolean {
  if (!artifacts && path === CLOCK_BINDING_INPUT) return false;
  if (!artifacts && OPERATIONAL_SOURCE_INPUTS.some((input) => input === path)) return false;
  if (artifacts && PROVENANCE_ARTIFACT_INPUTS.some((input) => input === path)) return false;
  const name = basename(path);
  return (
    CALIBRATION_REPORT_PATH.test(path) ||
    EXECUTION_REPORT_PATHS.has(path) ||
    path
      .split("/")
      .some(
        (part) =>
          EXCLUDED_DIRECTORIES.has(part) || (!artifacts && SOURCE_BUILD_DIRECTORIES.has(part)),
      ) ||
    (name.startsWith(".env") && !name.endsWith(".example")) ||
    (artifacts && path.split("/").includes("cache")) ||
    /(?:\.(?:sqlite3?|db)(?:-(?:wal|shm|journal))?|\.log|\.pyc|\.tsbuildinfo|\.blend\d+|\.(?:pem|key|jks|keystore|p12))$/i.test(
      name,
    ) ||
    [
      "local.properties",
      "key.properties",
      ".flutter-plugins-dependencies",
      ".debug-journal.md",
    ].includes(name) ||
    /^candidate(?:-manifest)?(?:[.-].*)?\.json$/i.test(name)
  );
}

function digest(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

async function scanFiles(inputs: readonly string[], scan: Scan): Promise<readonly FileDigest[]> {
  // Each scan accumulates one entry per repository-relative path, then sorts without locale rules.
  const files = new Map<string, FileDigest>();
  async function visit(path: string): Promise<void> {
    const absolute = resolve(scan.root, path);
    if (absolute === scan.output || excluded(path, scan.artifacts)) return;
    const metadata = await lstat(absolute).catch((error: unknown) => {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") return null;
      throw error;
    });
    if (metadata === null) return;
    if (metadata.isSymbolicLink()) throw new ManifestInputError(`Unsupported symlink: ${path}`);
    if (metadata.isDirectory()) {
      for (const child of (await readdir(absolute)).sort()) await visit(`${path}/${child}`);
      return;
    }
    if (!metadata.isFile()) throw new ManifestInputError(`Unsupported file type: ${path}`);
    if (
      !scan.artifacts &&
      path.startsWith("resources/blender/") &&
      !OPERATIONAL_SOURCE_INPUTS.some((input) => input === path) &&
      !/\.(?:blend|py|md)$/.test(path) &&
      path !== "resources/blender/safety-simulator/artifact-manifest.json" &&
      basename(path) !== "site-metadata.json"
    )
      return;
    const bytes = await readFile(absolute);
    const after = await lstat(absolute);
    if (metadata.mtimeMs !== after.mtimeMs || bytes.length !== after.size)
      throw new ManifestInputError(`File changed while hashing: ${path}`);
    files.set(path, { path, bytes: bytes.length, sha256: digest(bytes) });
  }
  for (const input of inputs) await visit(input);
  return [...files.keys()].sort().map((path) => {
    const file = files.get(path);
    if (file === undefined) throw new ManifestInputError(`Missing scanned file: ${path}`);
    return file;
  });
}

export async function createCandidateManifest(
  root: string,
  output = "",
  extraArtifacts: readonly string[] = [],
) {
  const repository = resolve(root);
  const extraPaths = [
    ...new Set(
      extraArtifacts.map((path) => {
        const local = relative(repository, resolve(repository, path)).split(sep).join("/");
        if (!local || local === ".." || local.startsWith("../") || isAbsolute(local))
          throw new ManifestInputError(`Artifact must be inside the repository: ${path}`);
        return local;
      }),
    ),
  ].sort();
  const scan = { root: repository, output: output ? resolve(repository, output) : "" };
  const sourceFiles = await scanFiles(SOURCE_INPUTS, { ...scan, artifacts: false });
  const buildArtifacts = await scanFiles([...ARTIFACT_INPUTS, ...extraPaths], {
    ...scan,
    artifacts: true,
  });
  const contains = (files: readonly FileDigest[], path: string) =>
    files.some((file) => file.path === path || file.path.startsWith(`${path}/`));
  const missingRequiredInputs = REQUIRED_INPUTS.filter(
    (path) => !contains(sourceFiles, path),
  ).sort();
  const missingRequiredArtifacts = [
    ...REQUIRED_ARTIFACTS.map((entry) => ({
      ...entry,
      expectedPaths: [
        ...entry.expectedPaths,
        ...(entry.requirement === "android-apk"
          ? extraPaths.filter((path) => path.endsWith(".apk"))
          : []),
      ],
    })),
    ...extraPaths.map((path) => ({ requirement: path, expectedPaths: [path] })),
  ].filter((entry) => !entry.expectedPaths.some((path) => contains(buildArtifacts, path)));
  const sourceSha256 = digest(JSON.stringify(sourceFiles));
  const identity = {
    schemaVersion: "1.0.0",
    sourceSha256,
    buildArtifacts,
    missingRequiredInputs,
    missingRequiredArtifacts,
  };
  return {
    ...identity,
    algorithm: "sha256",
    candidateId: `sha256:${digest(JSON.stringify(identity))}`,
    sourceInputs: SOURCE_INPUTS,
    artifactInputs: [...ARTIFACT_INPUTS, ...extraPaths],
    sourceFiles,
  };
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      root: { type: "string" },
      out: { type: "string" },
      artifact: { type: "string", multiple: true },
      help: { type: "boolean", short: "h" },
    },
  });
  if (values.help) {
    process.stdout.write(
      "Usage: npm run candidate:manifest -- [--root DIR] [--out FILE] [--artifact PATH]\n" +
        "Hashes working-tree inputs and explicit build artifacts. Missing required files exit 2.\n" +
        "--artifact is repeatable and repository-relative. Default output is JSON on stdout.\n" +
        "Secrets, runtime state, caches and execution evidence remain excluded.\n",
    );
    return;
  }
  const root = resolve(values.root ?? process.cwd());
  const output = values.out ? resolve(root, values.out) : "";
  const manifest = await createCandidateManifest(root, output, values.artifact ?? []);
  const json = `${JSON.stringify(manifest, null, 2)}\n`;
  if (output) {
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, json);
  } else process.stdout.write(json);
  if (manifest.missingRequiredInputs.length || manifest.missingRequiredArtifacts.length)
    process.exitCode = 2;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    if (!(error instanceof Error)) throw error;
    process.stderr.write(`${error.name}: ${error.message}\n`);
    process.exitCode = 1;
  });
}
