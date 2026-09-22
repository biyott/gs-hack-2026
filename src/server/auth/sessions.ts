import { randomBytes, randomUUID } from "node:crypto";
import { SessionRequestSchema } from "@gs-safety/contracts";
import type { SafetyDatabase } from "../db";
import { hashToken, verifyPin } from "./credentials";
import { StoredAccountSchema, StoredSessionSchema } from "./stored-account";
import {
  AuthenticationError,
  type AuthOptions,
  type IssuedSession,
  type LoginCredentials,
  type Session,
} from "./types";

export type AuthService = {
  readonly login: (credentials: LoginCredentials) => IssuedSession;
  readonly authenticate: (token: string) => Session | null;
  readonly logout: (token: string) => void;
};

export function createAuthService(
  database: SafetyDatabase,
  options: AuthOptions = {},
): AuthService {
  const now = options.now ?? Date.now;
  const ttl = options.sessionTtlMs ?? 8 * 60 * 60 * 1000;
  if (!Number.isSafeInteger(ttl) || ttl <= 0 || ttl > 7 * 24 * 60 * 60 * 1000) {
    throw new AuthenticationError("INVALID_CONFIGURATION", "Invalid session duration");
  }
  const findAccount = database.sqlite.prepare("SELECT * FROM accounts WHERE id = ?");
  const insertSession = database.sqlite.prepare(`INSERT INTO sessions
    (session_id, token_hash, account_id, auth_version, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)`);
  const findSession =
    database.sqlite.prepare(`SELECT accounts.*, sessions.session_id, sessions.expires_at
    FROM sessions JOIN accounts ON accounts.id = sessions.account_id
    WHERE sessions.token_hash = ? AND sessions.auth_version = accounts.auth_version AND accounts.enabled = 1`);
  const removeSession = database.sqlite.prepare("DELETE FROM sessions WHERE token_hash = ?");
  const removeDeviceSessions = database.sqlite.prepare(`DELETE FROM sessions
    WHERE account_id IN (SELECT id FROM accounts WHERE device_role = ?)`);

  return {
    login(credentials) {
      const parsed = SessionRequestSchema.safeParse(credentials);
      if (
        !parsed.success ||
        parsed.data.accessCode === undefined ||
        parsed.data.accessCode.length < 4 ||
        parsed.data.accessCode.length > 128
      ) {
        throw new AuthenticationError("INVALID_CREDENTIALS", "Invalid credentials");
      }
      const request = parsed.data;
      const result = StoredAccountSchema.safeParse(findAccount.get(request.actorId));
      if (
        !result.success ||
        result.data.enabled !== 1 ||
        result.data.role !== request.role ||
        (request.workerId !== undefined && result.data.worker_id !== request.workerId) ||
        (request.deviceRole !== undefined && result.data.device_role !== request.deviceRole) ||
        !verifyPin(parsed.data.accessCode, result.data.pin_hash)
      ) {
        throw new AuthenticationError("INVALID_CREDENTIALS", "Invalid credentials");
      }
      const account = result.data;
      const createdAt = now();
      const expiresAt = createdAt + ttl;
      const token = randomBytes(32).toString("base64url");
      const sessionId = randomUUID();
      database.sqlite.transaction(() => {
        if (account.device_role !== null) removeDeviceSessions.run(account.device_role);
        insertSession.run(
          sessionId,
          hashToken(token),
          account.id,
          account.auth_version,
          expiresAt,
          createdAt,
        );
      })();
      return {
        token,
        session: {
          sessionId,
          actorId: account.id,
          role: account.role,
          token,
          workerId: account.worker_id,
          deviceRole: account.device_role,
          expiresAt: new Date(expiresAt).toISOString(),
        },
      };
    },
    authenticate(token) {
      if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
      const result = StoredSessionSchema.safeParse(findSession.get(hashToken(token)));
      if (!result.success || result.data.expires_at <= now()) return null;
      const stored = result.data;
      return {
        sessionId: stored.session_id,
        actorId: stored.id,
        role: stored.role,
        token,
        workerId: stored.worker_id,
        deviceRole: stored.device_role,
        expiresAt: new Date(stored.expires_at).toISOString(),
      };
    },
    logout(token) {
      removeSession.run(hashToken(token));
    },
  };
}
