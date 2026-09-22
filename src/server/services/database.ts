import { join } from "node:path";
import { type AuthService, createAuthService, defaultDemoAccounts, seedAccounts } from "../auth";
import { createDatabase, type SafetyDatabase } from "../db";
import { createRunRepository, type RunRepository } from "../db/run-repository";

export type DatabaseServices = Readonly<{
  database: SafetyDatabase;
  auth: AuthService;
  runs: RunRepository;
}>;

declare global {
  var gsSafetyDatabaseServices: DatabaseServices | undefined;
}

export function getDatabaseServices(): DatabaseServices {
  if (globalThis.gsSafetyDatabaseServices) return globalThis.gsSafetyDatabaseServices;
  const database = createDatabase(
    process.env["DATABASE_PATH"] ?? join(process.cwd(), "data", "runtime", "safety.sqlite"),
  );
  seedAccounts(database, defaultDemoAccounts());
  const services = {
    database,
    auth: createAuthService(database),
    runs: createRunRepository(database),
  };
  globalThis.gsSafetyDatabaseServices = services;
  return services;
}
