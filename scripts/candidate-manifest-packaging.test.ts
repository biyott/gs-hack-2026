import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createCandidateManifest } from "./candidate-manifest";

const ORIGINAL_DRAFTS = [
  "data/knowledge/drafts/common/COMMON-001.md",
  "data/knowledge/drafts/common/COMMON-002.md",
  "data/knowledge/drafts/common/COMMON-003.md",
  "data/knowledge/drafts/common/COMMON-004.md",
  "data/knowledge/drafts/equipment/EQ-001.md",
  "data/knowledge/drafts/equipment/EQ-002.md",
  "data/knowledge/drafts/equipment/EQ-003.md",
  "data/knowledge/drafts/equipment/EQ-004.md",
  "data/knowledge/drafts/equipment/EQ-005.md",
  "data/knowledge/drafts/equipment/EQ-006.md",
  "data/knowledge/drafts/fire-gas/FG-001.md",
  "data/knowledge/drafts/fire-gas/FG-002.md",
  "data/knowledge/drafts/fire-gas/FG-003.md",
  "data/knowledge/drafts/fire-gas/FG-004.md",
  "data/knowledge/drafts/fire-gas/FG-005.md",
  "data/knowledge/drafts/fire-gas/FG-006.md",
  "data/knowledge/drafts/fire-gas/FG-007.md",
  "data/knowledge/drafts/fire-gas/FG-008.md",
] as const;
const REVISION_INPUTS = [
  "data/knowledge/revisions/author-001-20260921T090443Z/revision.json",
  "data/knowledge/revisions/author-001-20260921T090443Z/equipment/EQ-002.md",
  "data/knowledge/revisions/author-001-20260921T090443Z/equipment/EQ-003.md",
  "data/knowledge/revisions/author-001-20260921T090443Z/equipment/EQ-004.md",
  "data/knowledge/revisions/author-001-20260921T090443Z/fire-gas/FG-002.md",
  "data/knowledge/revisions/author-001-20260921T090443Z/fire-gas/FG-006.md",
  "data/knowledge/revisions/author-002-20260921T091009Z/README.md",
  "data/knowledge/revisions/author-002-20260921T091009Z/revision.json",
  "data/knowledge/revisions/author-002-20260921T091009Z/common/COMMON-001.md",
  "data/knowledge/revisions/author-002-20260921T091009Z/common/COMMON-002.md",
  "data/knowledge/revisions/author-002-20260921T091009Z/common/COMMON-003.md",
  "data/knowledge/revisions/author-002-20260921T091009Z/common/COMMON-004.md",
  "data/knowledge/revisions/author-002-20260921T091009Z/fire-gas/FG-001.md",
  "data/knowledge/revisions/author-002-20260921T091009Z/fire-gas/FG-002.md",
  "data/knowledge/revisions/author-002-20260921T091009Z/fire-gas/FG-003.md",
  "data/knowledge/revisions/author-002-20260921T091009Z/fire-gas/FG-004.md",
  "data/knowledge/revisions/author-002-20260921T091009Z/fire-gas/FG-005.md",
  "data/knowledge/revisions/author-002-20260921T091009Z/fire-gas/FG-006.md",
  "data/knowledge/revisions/author-002-20260921T091009Z/fire-gas/FG-007.md",
  "data/knowledge/revisions/author-002-20260921T091009Z/fire-gas/FG-008.md",
] as const;
const REVIEW_INPUTS = [
  "data/knowledge/reviews/approvals.json",
  "data/knowledge/reviews/decisions.json",
  "data/knowledge/reviews/check-corpus.mjs",
  "data/knowledge/reviews/review-digest.mjs",
  "data/knowledge/reviews/verify-approval-ledger.mjs",
  "data/knowledge/reviews/semantic-review.md",
  "data/knowledge/reviews/initial-findings.md",
  "data/knowledge/reviews/structural-initial.json",
  "data/knowledge/reviews/structural-reviewed-candidate.json",
  "data/knowledge/reviews/structural-preapproval.json",
  "data/knowledge/reviews/structural-approved.json",
  "data/knowledge/reviews/integrity-approved.json",
] as const;
const DELIVERY_INPUTS = [
  "consistency-report.md",
  ...ORIGINAL_DRAFTS,
  ...REVISION_INPUTS,
  ...REVIEW_INPUTS,
] as const;
const RUN_PATH = "docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z";
const PROVENANCE_ATTACHMENTS = [
  `${RUN_PATH}/sources/emul-004.body.md`,
  `${RUN_PATH}/goal.input.txt`,
  `${RUN_PATH}/goal.document.original.md`,
  `${RUN_PATH}/requirements/scope-freeze.v1.0.md`,
  `${RUN_PATH}/qa/g0-protocol-v1.md`,
  `${RUN_PATH}/evidence/rag/RAG-ACTUAL-2026-09-21T10-34-09-385Z/report.json`,
] as const;
const APPROVED_DOCUMENTS = ORIGINAL_DRAFTS.map((path) =>
  path.replace("data/knowledge/drafts/", "knowledge/"),
);
let root: string;
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "candidate-packaging-"));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

async function putFiles(paths: readonly string[], content = "original delivery input") {
  for (const path of paths) {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), content);
  }
}

describe("mandatory knowledge delivery packaging", () => {
  it("includes the report and preserved originals alongside the approved corpus", async () => {
    // Given
    await putFiles(DELIVERY_INPUTS);
    await putFiles(APPROVED_DOCUMENTS, "approved content");
    await putFiles([
      "data/knowledge/runtime/models/model.onnx",
      "data/knowledge/runtime/probe-response.json",
      "data/knowledge/reviews/unrelated-execution-report.json",
    ]);
    // When
    const manifest = await createCandidateManifest(root);
    // Then
    expect(manifest.sourceFiles.map((file) => file.path)).toEqual(
      [...DELIVERY_INPUTS, ...APPROVED_DOCUMENTS].sort(),
    );
    expect(
      manifest.missingRequiredInputs.filter((path) =>
        DELIVERY_INPUTS.some((input) => input === path),
      ),
    ).toEqual([]);
  });

  it.each(DELIVERY_INPUTS)("reports the exact omitted delivery input %s", async (omitted) => {
    // Given
    await putFiles(DELIVERY_INPUTS.filter((path) => path !== omitted));
    await putFiles(APPROVED_DOCUMENTS, "approved content cannot replace originals");
    // When
    const manifest = await createCandidateManifest(root);
    // Then
    expect(
      manifest.missingRequiredInputs.filter((path) =>
        DELIVERY_INPUTS.some((input) => input === path),
      ),
    ).toEqual([omitted]);
  });

  it.each([
    "consistency-report.md",
    "data/knowledge/drafts/common/COMMON-001.md",
    "data/knowledge/drafts/equipment/EQ-006.md",
    "data/knowledge/drafts/fire-gas/FG-008.md",
    "data/knowledge/revisions/author-001-20260921T090443Z/revision.json",
    "data/knowledge/revisions/author-002-20260921T091009Z/fire-gas/FG-008.md",
    "data/knowledge/reviews/integrity-approved.json",
  ])("changes source identity when delivery input %s changes", async (path) => {
    // Given
    await putFiles(DELIVERY_INPUTS);
    await putFiles(APPROVED_DOCUMENTS, "approved content remains unchanged");
    const before = await createCandidateManifest(root);
    await putFiles([path], "changed delivery input");
    // When
    const after = await createCandidateManifest(root);
    // Then
    expect(after.sourceSha256).not.toBe(before.sourceSha256);
    expect(after.candidateId).not.toBe(before.candidateId);
    expect(after.buildArtifacts).toEqual(before.buildArtifacts);
    expect(after.missingRequiredInputs).toEqual(before.missingRequiredInputs);
  });
});

describe("exact provenance artifact attachments", () => {
  it("includes only the six attachments while preserving sibling QA and evidence exclusions", async () => {
    // Given
    const siblings = [
      `${RUN_PATH}/qa/g1-protocol-v1.md`,
      `${RUN_PATH}/evidence/rag/RAG-ACTUAL-2026-09-21T10-34-09-385Z/other.json`,
      "docs/goal-runs/another-run/qa/g0-protocol-v1.md",
    ];
    await putFiles([...PROVENANCE_ATTACHMENTS, ...siblings]);
    // When
    const manifest = await createCandidateManifest(root, "", siblings);
    // Then
    expect(manifest.sourceFiles).toEqual([]);
    expect(manifest.buildArtifacts.map((file) => file.path)).toEqual(
      [...PROVENANCE_ATTACHMENTS].sort(),
    );
    expect(manifest.missingRequiredArtifacts.map((entry) => entry.requirement)).toEqual(
      expect.arrayContaining(siblings),
    );
  });

  it.each(PROVENANCE_ATTACHMENTS)("reports the exact omitted attachment %s", async (omitted) => {
    // Given
    await putFiles(PROVENANCE_ATTACHMENTS.filter((path) => path !== omitted));
    // When
    const manifest = await createCandidateManifest(root);
    // Then
    expect(
      manifest.missingRequiredArtifacts
        .filter((entry) => PROVENANCE_ATTACHMENTS.some((path) => path === entry.requirement))
        .map((entry) => entry.requirement),
    ).toEqual([omitted]);
  });

  it.each(PROVENANCE_ATTACHMENTS)(
    "changes only artifact identity when attachment %s changes",
    async (path) => {
      // Given
      await putFiles(PROVENANCE_ATTACHMENTS);
      const before = await createCandidateManifest(root);
      await putFiles([path], "updated provenance attachment");
      // When
      const after = await createCandidateManifest(root);
      // Then
      expect(after.sourceFiles).toEqual(before.sourceFiles);
      expect(after.sourceSha256).toBe(before.sourceSha256);
      expect(after.buildArtifacts).not.toEqual(before.buildArtifacts);
      expect(after.candidateId).not.toBe(before.candidateId);
      expect(after.missingRequiredArtifacts).toEqual(before.missingRequiredArtifacts);
    },
  );
});
