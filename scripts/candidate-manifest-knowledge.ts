export const KNOWLEDGE_DRAFT_INPUTS: readonly string[] = (
  [
    ["common", "COMMON", 4],
    ["equipment", "EQ", 6],
    ["fire-gas", "FG", 8],
  ] as const
).flatMap(([folder, prefix, count]) =>
  Array.from(
    { length: count },
    (_, index) =>
      `data/knowledge/drafts/${folder}/${prefix}-${String(index + 1).padStart(3, "0")}.md`,
  ),
);

export const KNOWLEDGE_REVISION_INPUTS = [
  ...[
    "revision.json",
    "equipment/EQ-002.md",
    "equipment/EQ-003.md",
    "equipment/EQ-004.md",
    "fire-gas/FG-002.md",
    "fire-gas/FG-006.md",
  ].map((path) => `data/knowledge/revisions/author-001-20260921T090443Z/${path}`),
  ...[
    "README.md",
    "revision.json",
    "common/COMMON-001.md",
    "common/COMMON-002.md",
    "common/COMMON-003.md",
    "common/COMMON-004.md",
    "fire-gas/FG-001.md",
    "fire-gas/FG-002.md",
    "fire-gas/FG-003.md",
    "fire-gas/FG-004.md",
    "fire-gas/FG-005.md",
    "fire-gas/FG-006.md",
    "fire-gas/FG-007.md",
    "fire-gas/FG-008.md",
  ].map((path) => `data/knowledge/revisions/author-002-20260921T091009Z/${path}`),
] as const;

export const KNOWLEDGE_REVIEW_INPUTS = [
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

const RUN_PATH = "docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z";
export const PROVENANCE_ARTIFACT_INPUTS = [
  `${RUN_PATH}/sources/emul-004.body.md`,
  `${RUN_PATH}/goal.input.txt`,
  `${RUN_PATH}/goal.document.original.md`,
  `${RUN_PATH}/requirements/scope-freeze.v1.0.md`,
  `${RUN_PATH}/qa/g0-protocol-v1.md`,
  `${RUN_PATH}/evidence/rag/RAG-ACTUAL-2026-09-21T10-34-09-385Z/report.json`,
] as const;
