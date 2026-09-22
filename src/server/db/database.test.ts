import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createDatabase } from "./index";

const directories: string[] = [];

afterEach(() => {
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

describe("SQLite persistence", () => {
  it("applies migrations and preserves a row when a fresh connection reopens", () => {
    // Given
    const directory = mkdtempSync(join(tmpdir(), "gs-db-"));
    directories.push(directory);
    const filename = join(directory, "nested", "safety.sqlite");
    const first = createDatabase(filename);
    first.sqlite
      .prepare(
        "INSERT INTO accounts (id, role, worker_id, pin_hash, enabled) VALUES (?, ?, ?, ?, ?)",
      )
      .run("worker-a", "worker", "WORKER-A", "fixture", 1);
    first.close();

    // When
    const second = createDatabase(filename);

    // Then
    expect(second.sqlite.prepare("SELECT id, worker_id FROM accounts").all()).toEqual([
      { id: "worker-a", worker_id: "WORKER-A" },
    ]);
    expect(second.sqlite.pragma("foreign_keys", { simple: true })).toBe(1);
    expect(second.sqlite.pragma("journal_mode", { simple: true })).toBe("wal");
    second.close();
  });
});
