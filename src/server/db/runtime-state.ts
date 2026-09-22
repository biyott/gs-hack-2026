import type { RunState } from "@gs-safety/contracts";
import { and, eq } from "drizzle-orm";
import type { SafetyDatabase } from "./index";
import { runHeads, runRuntimeState } from "./schema";

export function createRuntimeStateStore(database: SafetyDatabase) {
  const { db } = database;
  return {
    append(run: Pick<RunState, "runId" | "version">, payloadJson: string | undefined): void {
      if (payloadJson === undefined) return;
      db.insert(runRuntimeState)
        .values({ runId: run.runId, version: run.version, payloadJson })
        .run();
    },
    current(runId: string): string | null {
      const row = db
        .select({ payloadJson: runRuntimeState.payloadJson })
        .from(runRuntimeState)
        .innerJoin(
          runHeads,
          and(
            eq(runRuntimeState.runId, runHeads.runId),
            eq(runRuntimeState.version, runHeads.version),
          ),
        )
        .where(eq(runHeads.runId, runId))
        .get();
      return row?.payloadJson ?? null;
    },
  };
}
