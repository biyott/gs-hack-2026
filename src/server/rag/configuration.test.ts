import Database from "better-sqlite3";
import { expect, it } from "vitest";
import { createConfiguredRagService } from "./configuration";

it("rejects a provider timeout above the frozen maximum supplement deadline", () => {
  const db = new Database(":memory:");
  try {
    expect(() => createConfiguredRagService(db, { RAG_TIMEOUT_MS: "10000" })).toThrow();
  } finally {
    db.close();
  }
});
