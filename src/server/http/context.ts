import type { Session } from "@/contracts";
import { AuthenticationError } from "../auth";
import { getDatabaseServices } from "../services/database";
import { requestToken } from "./security";

export function authenticatedSession(request: Request): Session {
  const token = requestToken(request);
  const session = token ? getDatabaseServices().auth.authenticate(token) : null;
  if (!session)
    throw new AuthenticationError("UNAUTHENTICATED", "Sign in to this local demo server");
  return session;
}
