import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const groups = { common: 4, equipment: 6, "fire-gas": 8 };
const prefixes = { common: "COMMON", equipment: "EQ", "fire-gas": "FG" };
const titles = [
  "개인 프로필 적용 원칙", "선호 언어와 안내 이해 확인", "이동 보조 및 지원 요청", "안내 버전 변경과 오래된 안내 처리",
  "중장비 접근 경보", "중장비 방향 변경에 따른 안내 갱신", "개인 이동 제약을 반영한 회피 안내",
  "유효한 회피 경로 없음", "위치 수신 중단", "지정 회피 지점 도착 확인",
  "가상 화재 감지와 통로 제한", "화재로 인한 기존 이동 경로 변경", "가상 가스 경보와 영향 구역 안내",
  "시나리오 정책이 이동을 지정한 경우", "시나리오 정책이 실내 대기를 지정한 경우",
  "화재·가스 복합 위험으로 경로가 없는 경우", "환경 센서 수신 중단", "위험 해제와 별도 통행 재개 확인",
];
const headings = ["목적", "적용 조건", "적용 제외 조건", "필요한 입력 필드", "행동 코드와 설명", "개인화 적용",
  "예외 및 기본 안내", "한국어 안내 예시", "영어 안내 예시", "확인할 상태", "검색 키워드", "관련 문서 ID"];
const actions = new Set(["ALERT_HAZARD", "FOLLOW_VALIDATED_ROUTE", "GUIDANCE_UPDATED", "ROUTE_UNAVAILABLE",
  "POSITION_UNKNOWN", "SENSOR_UNKNOWN", "REQUEST_ASSISTANCE", "SHELTER_PER_SCENARIO", "CONFIRM_UNDERSTANDING",
  "CONFIRM_ARRIVAL", "AWAIT_REOPEN_AUTHORIZATION"]);
const placeholders = new Set(["equipmentId", "zoneId", "nextWaypointLabel", "destinationLabel", "guidanceVersion"]);
const required = ["documentId", "title", "siteIds", "simulationType", "hazardTypes", "applicableRoles",
  "profileConditions", "actionCodes", "language", "version", "synthetic", "approvalStatus", "sourceReference"];
const expected = Object.entries(groups).flatMap(([group, count]) => Array.from({ length: count }, (_, n) => ({
  group, id: `${prefixes[group]}-${String(n + 1).padStart(3, "0")}`,
})));
const ids = new Set(expected.map(({ id }) => id));
const hash = (value) => createHash("sha256").update(value).digest("hex");
const parse = (text) => {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!match) throw new Error("Front matter is missing");
  // This corpus writes each YAML value using JSON-compatible scalar/collection syntax.
  return { body: text.slice(match[0].length), metadata: Object.fromEntries(match[1].split("\n").map((line) => {
    const separator = line.indexOf(":");
    return [line.slice(0, separator), JSON.parse(line.slice(separator + 1).trim())];
  })) };
};
const entries = expected.map(({ group, id }, index) => {
  const path = `knowledge/${group}/${id}.md`;
  const draftPath = `data/knowledge/drafts/${group}/${id}.md`;
  const text = readFileSync(join(root, path), "utf8");
  const draft = readFileSync(join(root, draftPath), "utf8");
  const { body, metadata } = parse(text);
  const draftMetadata = parse(draft).metadata;
  const problems = [];
  const check = (condition, message) => { if (!condition) problems.push(message); };
  const actualHeadings = [...body.matchAll(/^## (\d+)\. (.+)$/gm)].map((match) => `${match[1]}. ${match[2]}`);
  const sections = body.split(/^## \d+\. .+$/m).slice(1);
  const tokens = (section) => [...(section ?? "").matchAll(/\{([A-Za-z]+)\}/g)].map((match) => match[1]).sort();
  required.forEach((key) => check(key in metadata, `missing:${key}`));
  check(metadata.documentId === id && metadata.title === titles[index], "identity/topic");
  check(metadata.simulationType === group, "mode");
  check(metadata.siteIds.length > 0 && metadata.siteIds.every((site) =>
    ["SITE-CONSTRUCTION-01", "SITE-INDUSTRIAL-01"].includes(site)) &&
    new Set(metadata.siteIds).size === metadata.siteIds.length, "siteIds");
  check(metadata.synthetic === true && metadata.version === "0.1.0", "synthetic/version");
  check(metadata.sourceReference === `synthetic://safety-simulator/${id}`, "sourceReference");
  check(metadata.language === "ko" && JSON.stringify(metadata.applicableRoles) === '["worker"]', "language/role");
  check(metadata.actionCodes.length > 0 && metadata.actionCodes.every((action) => actions.has(action)), "actionCodes");
  const bodyActions = [...body.matchAll(/`([A-Z]+(?:_[A-Z]+)+)`/g)].map((match) => match[1]);
  check(bodyActions.every((action) => actions.has(action)), "body action code");
  check(JSON.stringify(actualHeadings) === JSON.stringify(headings.map((heading, i) => `${i + 1}. ${heading}`)), "12 ordered headings");
  check(sections.every((section) => section.trim().length > 0), "empty section");
  check(JSON.stringify(tokens(sections[7])) === JSON.stringify(tokens(sections[8])), "example placeholder mismatch");
  const exampleIds = (section) => [...(section ?? "").matchAll(/\b(?:SITE-[A-Z-]+-\d+|DEMO-GAS-[A-Z]+|(?:EQUIPMENT|WORKER|PATH|ZONE)-[A-Z]+|(?:REFUGE|ASSEMBLY|SHELTER)-\d+)\b/g)].map((match) => match[0]).sort();
  check(JSON.stringify(exampleIds(sections[7])) === JSON.stringify(exampleIds(sections[8])), "example identifier mismatch");
  check(tokens(body).every((token) => placeholders.has(token)), "unregistered placeholder");
  const related = [...(sections[11] ?? "").matchAll(/`((?:COMMON|EQ|FG)-\d{3})`/g)].map((match) => match[1]);
  check(related.length > 0 && related.every((relatedId) => ids.has(relatedId)), "related IDs");
  check(typeof metadata.reviewedSupplementalExplanation?.ko === "string" &&
    typeof metadata.reviewedSupplementalExplanation?.en === "string", "supplement locales");
  check(JSON.stringify(tokens(metadata.reviewedSupplementalExplanation?.ko)) ===
    JSON.stringify(tokens(metadata.reviewedSupplementalExplanation?.en)), "supplement placeholder mismatch");
  check(metadata.hazardTypes.length > 0 && metadata.hazardTypes.every((hazard) =>
    ["equipment", "fire", "gas", "combined", "position-unknown", "sensor-unknown"].includes(hazard)), "hazardTypes");
  check(JSON.stringify(metadata.profileConditions) === (id === "EQ-003" ? '{"stairsAllowed":false}' : '{}'), "profileConditions");
  check(metadata.requiredScenarioPolicy === (id === "FG-004" ? "evacuation" : id === "FG-005" ? "shelter-per-scenario" : null), "scenarioPolicy");
  check(JSON.stringify(metadata.substanceIds) === (["FG-003", "FG-006"].includes(id) ? '["DEMO-GAS-X"]' : '[]'), "substanceIds");
  check(metadata.effectiveFrom < metadata.expiresAt, "validity date ordering");
  check(["draft", "approved_for_demo"].includes(metadata.approvalStatus), "approvalStatus");
  check(metadata.approvalStatus !== "approved_for_demo" || (typeof metadata.reviewedBy === "string" &&
    Number.isFinite(Date.parse(metadata.reviewedAt))), "approval identity/time");
  check(draftMetadata.approvalStatus === "draft" && draftMetadata.synthetic === true && draftMetadata.version === "0.1.0" &&
    !("reviewedBy" in draftMetadata) && !("reviewedAt" in draftMetadata), "immutable draft provenance");
  return { documentId: id, path, sha256: hash(text), draftPath, draftSha256: hash(draft),
    draftMatchesCurrent: text === draft, approvalStatus: metadata.approvalStatus,
    examplePlaceholders: tokens(sections[7]), relatedDocumentIds: related, problems };
});
const counts = Object.fromEntries(Object.keys(groups).map((group) => [group, {
  current: readdirSync(join(root, "knowledge", group)).filter((name) => name.endsWith(".md")).length,
  drafts: readdirSync(join(root, "data/knowledge/drafts", group)).filter((name) => name.endsWith(".md")).length,
}]));
const pass = entries.every(({ problems }) => problems.length === 0) && Object.entries(groups).every(([group, count]) =>
  counts[group].current === count && counts[group].drafts === count);
console.log(JSON.stringify({ checkedAt: new Date().toISOString(), command: "node data/knowledge/reviews/check-corpus.mjs",
  scope: "Structural checks only; bilingual semantics and runtime behavior require separate evidence.",
  pass, counts, total: entries.length, entries }, null, 2));
if (!pass) process.exitCode = 1;
