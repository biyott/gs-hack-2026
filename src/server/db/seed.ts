import { defaultDemoAccounts, seedAccounts } from "../auth";
import { createDatabase } from "./index";

const database = createDatabase(process.env["DATABASE_PATH"] ?? "data/runtime/safety.sqlite");
try {
  seedAccounts(database, defaultDemoAccounts());
} finally {
  database.close();
}
