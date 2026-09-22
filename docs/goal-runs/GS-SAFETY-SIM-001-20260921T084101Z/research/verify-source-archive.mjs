import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';

const run = 'docs/goal-runs/GS-SAFETY-SIM-001-20260921T084101Z';
const manifestPath = `${run}/sources/emul-manifest.json`;
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const manifestBytes = await readFile(manifestPath);
const manifest = JSON.parse(manifestBytes.toString());
const results = [];

for (const document of manifest.documents) {
  const raw = await readFile(document.rawJsonPath);
  const html = await readFile(document.rawHtmlPath);
  const body = await readFile(document.bodyPath);
  const original = JSON.parse(raw.toString()).data.page;
  const textNodes = [];
  const types = {};
  const visit = (node) => {
    types[node.type] = (types[node.type] ?? 0) + 1;
    if (node.type === 'text') textNodes.push(node.text);
    for (const child of node.content ?? []) visit(child);
  };
  visit(original.content);
  const missingTextNodes = textNodes.filter((text) => !body.toString().includes(text));
  const attachmentResults = [];
  for (const attachment of document.attachments ?? []) {
    const bytes = await readFile(attachment.path);
    attachmentResults.push({
      name: attachment.name,
      expectedBytes: attachment.reportedSize,
      actualBytes: bytes.length,
      expectedSha256: attachment.sha256,
      actualSha256: sha256(bytes),
      matches: attachment.reportedSize === bytes.length && attachment.sha256 === sha256(bytes),
    });
  }
  const checks = {
    rawHash: sha256(raw) === document.rawJsonSha256,
    htmlHash: sha256(html) === document.rawHtmlSha256,
    bodyHash: sha256(body) === document.bodySha256,
    contentHash: sha256(JSON.stringify(original.content)) === document.contentSha256,
    title: original.title === document.title,
    sourceTimestamp: original.updatedAt === document.sourceUpdatedAt,
    completeText: missingTextNodes.length === 0,
    attachments: attachmentResults.every((item) => item.matches),
    attachmentCount: (types.attachment ?? 0) === attachmentResults.length,
  };
  results.push({ id: document.id, title: document.title, textNodeCount: textNodes.length,
    nodeTypes: types, missingTextNodeCount: missingTextNodes.length, checks,
    attachments: attachmentResults, allChecksPassed: Object.values(checks).every(Boolean) });
}

const report = {
  goalId: manifest.goalId,
  goalVersion: '1.0',
  taskId: 'R-SOURCE-CAPTURE',
  runId: manifest.runId,
  evidenceType: 'research self-check; not QA acceptance',
  candidate: { type: 'source-manifest', path: manifestPath, sha256: sha256(manifestBytes) },
  observedAt: new Date().toISOString(),
  environment: { platform: os.platform(), release: os.release(), node: process.version },
  command: `node ${run}/research/verify-source-archive.mjs`,
  testData: 'Six public source documents and one original 008 attachment',
  expected: 'Exactly 002/003/004/005/006/008; every source text node retained; every recorded content/file hash matches; attachment count and size match',
  sourceIdsMatch: manifest.documents.map((document) => document.id).sort().join(',') === '002,003,004,005,006,008',
  actual: results,
};
report.allChecksPassed = report.sourceIdsMatch && results.every((result) => result.allChecksPassed);
const output = `${run}/evidence/research/source-archive-verification.json`;
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ allChecksPassed: report.allChecksPassed, documents: results.length,
  textNodes: results.reduce((total, result) => total + result.textNodeCount, 0), output }, null, 2));
if (!report.allChecksPassed) process.exitCode = 1;
