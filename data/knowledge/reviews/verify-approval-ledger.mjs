import { readFileSync, readdirSync } from "node:fs";
import { reviewedContentDigest, sha256 } from "./review-digest.mjs";

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const initial = readJson("data/knowledge/reviews/structural-initial.json");
const decisions = readJson("data/knowledge/reviews/decisions.json");
const approved = readJson("data/knowledge/reviews/approvals.json");
const initialById = new Map(initial.entries.map((entry) => [entry.documentId, entry]));
const approvedById = new Map(approved.approvals.map((entry) => [entry.documentId, entry]));
const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };
check(approved.schemaVersion === "1.0.0", "ledger schema");
check(decisions.entries.length === 18 && approved.approvals.length === 18 && approvedById.size === 18, "18 unique approvals");
const currentDocumentCount = ["common", "equipment", "fire-gas"].reduce((count, group) =>
  count + readdirSync(`knowledge/${group}`).filter((name) => name.endsWith(".md")).length, 0);
check(currentDocumentCount === 18, "current document count");
const entries = decisions.entries.map((decision) => {
  const approval = approvedById.get(decision.documentId);
  const raw = readFileSync(decision.path, "utf8");
  const draft = readFileSync(decision.draftPath);
  const frontmatter = /^---\n([\s\S]*?)\n---\n/u.exec(raw)?.[1];
  if (!frontmatter) throw new Error("Missing frontmatter");
  const metadata = Object.fromEntries(frontmatter.split("\n").map((line) => {
    const separator = line.indexOf(":");
    return [line.slice(0, separator), JSON.parse(line.slice(separator + 1).trim())];
  }));
  check(approval?.approvedFileHash === sha256(raw), `${decision.documentId}: approved file hash`);
  check(approval?.reviewedContentHash === reviewedContentDigest(raw) &&
    approval?.reviewedContentHash === decision.reviewedContentHash, `${decision.documentId}: reviewed content hash`);
  check(sha256(draft) === decision.originalDraftHash &&
    sha256(draft) === initialById.get(decision.documentId)?.draftSha256, `${decision.documentId}: original draft hash`);
  for (const key of ["documentId", "reviewedContentHash", "reviewedBy", "reviewedAt"]) {
    check(metadata[key] === approval?.[key] && approval?.[key] === decision[key], `${decision.documentId}: ${key} binding`);
  }
  check(metadata.version === approval?.documentVersion && approval?.documentVersion === decision.documentVersion,
    `${decision.documentId}: version binding`);
  check(metadata.approvalStatus === "approved_for_demo" && metadata.reviewedBy === "/root/rag_lead/knowledge_review",
    `${decision.documentId}: approval scope and reviewer`);
  check(metadata.reviewedAt === decisions.reviewedAt && Number.isFinite(Date.parse(metadata.reviewedAt)),
    `${decision.documentId}: review timestamp`);
  check(JSON.stringify(metadata.siteIds) === '["SITE-CONSTRUCTION-01"]', `${decision.documentId}: frozen demo site scope`);
  return { documentId: decision.documentId, approvedFileHash: sha256(raw), reviewedContentHash: reviewedContentDigest(raw),
    originalDraftHash: sha256(draft) };
});
console.log(JSON.stringify({ checkedAt: new Date().toISOString(), command: "node data/knowledge/reviews/verify-approval-ledger.mjs",
  scope: "File integrity and review provenance only; no runtime behavior exercised.", pass: errors.length === 0,
  total: entries.length, errors, entries }, null, 2));
if (errors.length > 0) process.exitCode = 1;
