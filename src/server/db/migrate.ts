import { createDatabase } from "./index";

const database = createDatabase(process.env["DATABASE_PATH"] ?? "data/runtime/safety.sqlite");
database.close();
