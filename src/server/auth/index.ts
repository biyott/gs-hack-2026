export {
  SessionRequestSchema as LoginCredentialsSchema,
  SessionSchema,
} from "@gs-safety/contracts";
export { requireRole, requireWorker } from "./authorize";
export { defaultDemoAccounts } from "./config";
export { seedAccounts } from "./seed-accounts";
export { type AuthService, createAuthService } from "./sessions";
export { isSupportActor } from "./support-actor";
export type {
  AccountRole,
  AuthOptions,
  DemoAccount,
  IssuedSession,
  LoginCredentials,
  Session,
} from "./types";
export { AuthenticationError } from "./types";
