import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import Database from "better-sqlite3";
import { type BetterSQLite3Database, drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

export type SafetyDatabase = {
  readonly db: BetterSQLite3Database<typeof schema>;
  readonly sqlite: Database.Database;
  readonly close: () => void;
};

export function createDatabase(path: string): SafetyDatabase {
  if (path !== ":memory:") mkdirSync(dirname(resolve(path)), { recursive: true });
  const sqlite = new Database(path, { timeout: 5000 });
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("synchronous = NORMAL");
  const db = drizzle(sqlite, { schema });
  try {
    migrate(db, { migrationsFolder: resolve(process.cwd(), "drizzle") });
  } catch (error) {
    sqlite.close();
    throw error;
  }
  return { db, sqlite, close: () => sqlite.close() };
}
