import { createHash } from "node:crypto";

export const sha256 = (source) => createHash("sha256").update(source).digest("hex");

export function reviewedContentDigest(source) {
  const frontmatter = /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/u.exec(source)?.[0];
  if (!frontmatter) throw new Error("Review digest requires YAML frontmatter");
  const reviewable = frontmatter.replace(/^(?:approvalStatus|reviewedBy|reviewedAt|reviewedContentHash):[^\r\n]*(?:\r?\n|$)/gmu, "");
  return sha256(reviewable + source.slice(frontmatter.length));
}
