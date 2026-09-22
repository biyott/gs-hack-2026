import { describe, expect, it } from "vitest";
import { normalizeMetadata, parseKnowledgeDocument, reviewedContentDigest } from "./knowledge";
import { markdown, metadata, record } from "./retrieval-test-fixtures";

describe("metadata normalization", () => {
  it("preserves legacy source fields when singular site and status are supplied", () => {
    // Given
    const { siteIds: _sites, approvalStatus: _status, ...legacy } = metadata;
    // When
    const result = normalizeMetadata({
      ...legacy,
      siteId: "SITE-CONSTRUCTION-01",
      status: "approved_for_demo",
    });
    // Then
    expect(result.siteIds).toEqual(["SITE-CONSTRUCTION-01"]);
    expect(result.approvalStatus).toBe("approved_for_demo");
  });
  it("expands common modes while retaining its explicit sites and original metadata", () => {
    // Given / When
    const result = record({ simulationType: "common" });
    // Then
    expect(result.metadata.simulationTypes).toEqual(["equipment", "fire-gas"]);
    expect(result.metadata.siteIds).toEqual(["SITE-CONSTRUCTION-01"]);
    expect(result.originalMetadata["simulationType"]).toBe("common");
  });
  it.each([
    { siteId: "SITE-OTHER" },
    { status: "retired" },
    { actionCodes: ["EVACUATE_ANYWHERE"] },
    { profileConditions: { age: 30 } },
    { siteIds: ["*"] },
    { unexpectedField: true },
    { synthetic: false },
  ])("rejects conflicting aliases and unsafe schema inputs %j", (change) => {
    // Given / When / Then
    expect(() => record(change)).toThrow();
  });
  it("rejects a truncated procedure instead of separating its conditions", () => {
    // Given
    const source = markdown(metadata, "## 1. Section\nequipment");
    // When / Then
    expect(() => parseKnowledgeDocument(source, "knowledge/equipment/truncated.md")).toThrow();
  });
  it("rejects changed approved procedure content despite unchanged review fields", () => {
    // Given
    const changed = markdown(metadata).replace("equipment approach 12", "changed action 12");
    // When / Then
    expect(() => parseKnowledgeDocument(changed, "knowledge/equipment/changed.md")).toThrow();
  });
  it.each(["title", "version", "siteIds", "actionCodes", "requiredScenarioPolicy"])(
    "binds reviewed metadata field %s",
    (field) => {
      // Given
      const approved = markdown({ ...metadata, requiredScenarioPolicy: "evacuation" });
      const changed = approved.replace(new RegExp(`^${field}:.*$`, "mu"), `${field}: "tampered"`);
      // When / Then
      expect(reviewedContentDigest(changed)).not.toBe(reviewedContentDigest(approved));
    },
  );
  it.each(["\n", "\r\n"])("excludes only complete review YAML lines with %j endings", (ending) => {
    // Given
    const before = `---${ending}title: "fixed"${ending}approvalStatus: draft${ending}---${ending}reviewedBy: body content`;
    const after = before.replace(
      `approvalStatus: draft${ending}`,
      `reviewedAt: "today"${ending}reviewedBy: "reviewer"${ending}approvalStatus: approved_for_demo${ending}reviewedContentHash: "hash"${ending}`,
    );
    // When / Then
    expect(reviewedContentDigest(after)).toBe(reviewedContentDigest(before));
    expect(reviewedContentDigest(after.replace("body content", "changed body"))).not.toBe(
      reviewedContentDigest(before),
    );
  });
});
