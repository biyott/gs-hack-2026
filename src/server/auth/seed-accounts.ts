import { z } from "zod";
import type { SafetyDatabase } from "../db";
import { hashPin, verifyPin } from "./credentials";
import { StoredAccountSchema } from "./stored-account";
import { AuthenticationError, type DemoAccount, DemoAccountSchema } from "./types";

export function seedAccounts(database: SafetyDatabase, accounts: readonly DemoAccount[]): void {
  const parsed = z.array(DemoAccountSchema).safeParse(accounts);
  if (
    !parsed.success ||
    new Set(parsed.data.map((account) => account.id)).size !== parsed.data.length
  ) {
    throw new AuthenticationError("INVALID_CONFIGURATION", "Invalid demo account configuration");
  }
  const find = database.sqlite.prepare("SELECT * FROM accounts WHERE id = ?");
  const insert = database.sqlite.prepare(`INSERT INTO accounts
    (id, role, worker_id, device_role, pin_hash) VALUES (?, ?, ?, ?, ?)`);
  const update = database.sqlite.prepare(`UPDATE accounts SET role = ?, worker_id = ?,
    device_role = ?, pin_hash = ?, auth_version = auth_version + 1 WHERE id = ?`);
  database.sqlite.transaction(() => {
    for (const account of parsed.data) {
      const stored = find.get(account.id);
      if (stored === undefined) {
        insert.run(
          account.id,
          account.role,
          account.workerId,
          account.deviceRole,
          hashPin(account.pin),
        );
        continue;
      }
      const current = StoredAccountSchema.parse(stored);
      const samePin = verifyPin(account.pin, current.pin_hash);
      const sameBinding =
        account.role === current.role &&
        account.workerId === current.worker_id &&
        account.deviceRole === current.device_role;
      if (samePin && sameBinding) continue;
      update.run(
        account.role,
        account.workerId,
        account.deviceRole,
        samePin ? current.pin_hash : hashPin(account.pin),
        account.id,
      );
    }
  })();
}
