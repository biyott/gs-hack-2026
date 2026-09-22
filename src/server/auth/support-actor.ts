import type { SafetyDatabase } from "../db";

export function isSupportActor(database: SafetyDatabase, actorId: string): boolean {
  return (
    database.sqlite
      .prepare("SELECT 1 FROM accounts WHERE id = ? AND role = 'support' AND enabled = 1")
      .get(actorId) !== undefined
  );
}
