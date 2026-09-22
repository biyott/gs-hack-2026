import { type AccountRole, AuthenticationError, type Session } from "./types";

export function requireRole(
  session: Session | null,
  roles: readonly AccountRole[],
): asserts session is Session {
  if (session === null) throw new AuthenticationError("UNAUTHENTICATED", "Authentication required");
  if (!roles.includes(session.role))
    throw new AuthenticationError("FORBIDDEN", "Role is not authorized");
}

export function requireWorker(
  session: Session | null,
  workerId: string,
): asserts session is Session {
  requireRole(session, ["worker"]);
  if (session.workerId !== workerId)
    throw new AuthenticationError("FORBIDDEN", "Worker is not authorized");
}
