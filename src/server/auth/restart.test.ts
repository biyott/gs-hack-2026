import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { createDatabase } from "../db";
import { seedAccounts } from "./seed-accounts";
import { createAuthService } from "./sessions";

it("restores current sessions from a reopened database after unchanged account seeding", () => {
  // Given
  const directory = mkdtempSync(join(tmpdir(), "gs-auth-restart-"));
  const path = join(directory, "auth.sqlite");
  const account = { id: "worker-a", role: "worker", workerId: "WORKER-A", pin: "2026" } as const;
  const now = () => Date.parse("2026-09-21T09:00:00Z");
  try {
    const original = createDatabase(path);
    const issued = (() => {
      try {
        seedAccounts(original, [account]);
        return createAuthService(original, { now }).login({
          actorId: account.id,
          role: account.role,
          accessCode: account.pin,
        });
      } finally {
        original.close();
      }
    })();
    // When
    const reopened = createDatabase(path);
    try {
      seedAccounts(reopened, [account]);
      const restored = createAuthService(reopened, { now }).authenticate(issued.token);
      // Then
      expect(restored).toEqual(issued.session);
    } finally {
      reopened.close();
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
