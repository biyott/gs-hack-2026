import type { AuditEvent, Guidance, SimulationSnapshot } from "@gs-safety/contracts";
import { AuditEventSchema, GuidanceSchema, SimulationSnapshotSchema } from "@gs-safety/contracts";
import { and, asc, desc, eq } from "drizzle-orm";
import type { ZodType } from "zod";
import { PersistenceError } from "./errors";
import { requireSupplementLineage } from "./guidance-lineage";
import type { SafetyDatabase } from "./index";
import { guidanceVersions, incidentAudit, runSnapshots } from "./schema";

export function parseStored<T>(schema: ZodType<T>, payload: string): T {
  const value: unknown = JSON.parse(payload);
  return schema.parse(value);
}

export function createHistoryStore(database: SafetyDatabase) {
  const { db } = database;

  function appendGuidance(guidance: Guidance): void {
    const payloadJson = JSON.stringify(guidance);
    const existing = db
      .select()
      .from(guidanceVersions)
      .where(
        and(
          eq(guidanceVersions.guidanceId, guidance.guidanceId),
          eq(guidanceVersions.version, guidance.guidanceVersion),
        ),
      )
      .get();
    if (existing) {
      if (existing.payloadJson !== payloadJson)
        throw new PersistenceError("CONFLICT", "Immutable guidance conflict");
      return;
    }
    const previous = db
      .select()
      .from(guidanceVersions)
      .where(eq(guidanceVersions.guidanceId, guidance.guidanceId))
      .orderBy(desc(guidanceVersions.version))
      .limit(1)
      .get();
    if (guidance.guidanceVersion !== (previous?.version ?? 0) + 1) {
      throw new PersistenceError("CONFLICT", "Guidance version sequence conflict");
    }
    const primary =
      guidance.updateKind === "supplement"
        ? db
            .select()
            .from(guidanceVersions)
            .where(
              and(
                eq(guidanceVersions.guidanceId, guidance.guidanceId),
                eq(guidanceVersions.version, guidance.primaryGuidanceVersion),
              ),
            )
            .get()
        : undefined;
    requireSupplementLineage(
      guidance,
      previous ? parseStored(GuidanceSchema, previous.payloadJson) : null,
      primary ? parseStored(GuidanceSchema, primary.payloadJson) : null,
    );
    db.insert(guidanceVersions)
      .values({
        guidanceId: guidance.guidanceId,
        version: guidance.guidanceVersion,
        runId: guidance.runId,
        incidentId: guidance.incidentId,
        workerId: guidance.workerId,
        createdAt: guidance.generatedAt,
        payloadJson,
      })
      .run();
  }

  function appendAudit(event: AuditEvent): void {
    const payloadJson = JSON.stringify(event);
    const existing = db
      .select()
      .from(incidentAudit)
      .where(eq(incidentAudit.eventId, event.eventId))
      .get();
    if (existing) {
      if (existing.payloadJson !== payloadJson)
        throw new PersistenceError("CONFLICT", "Immutable audit conflict");
      return;
    }
    db.insert(incidentAudit)
      .values({
        eventId: event.eventId,
        runId: event.runId,
        incidentId: event.incidentId,
        actorId: event.actorId,
        occurredAt: event.occurredAt,
        payloadJson,
      })
      .run();
  }

  return {
    append(snapshot: SimulationSnapshot, actorId: string): void {
      db.insert(runSnapshots)
        .values({
          runId: snapshot.run.runId,
          version: snapshot.run.version,
          actorId,
          createdAt: snapshot.run.updatedAt,
          payloadJson: JSON.stringify(snapshot),
        })
        .run();
      for (const incident of snapshot.incidents) {
        if (incident.runId !== snapshot.run.runId)
          throw new PersistenceError("INVALID_RECORD", "Incident run mismatch");
        for (const guidance of [...incident.firstGuidance, ...incident.currentGuidance]) {
          if (
            guidance.runId !== snapshot.run.runId ||
            guidance.incidentId !== incident.incidentId ||
            guidance.simulationMode !== snapshot.mode
          ) {
            throw new PersistenceError("INVALID_RECORD", "Guidance incident or run mismatch");
          }
          appendGuidance(guidance);
        }
        for (const event of incident.audit) {
          if (event.runId !== snapshot.run.runId || event.incidentId !== incident.incidentId) {
            throw new PersistenceError("INVALID_RECORD", "Audit incident or run mismatch");
          }
          appendAudit(event);
        }
      }
      for (const worker of snapshot.workers) {
        const guidance = worker.currentGuidance;
        if (guidance !== null) {
          if (
            guidance.workerId !== worker.workerId ||
            guidance.runId !== snapshot.run.runId ||
            guidance.simulationMode !== snapshot.mode
          ) {
            throw new PersistenceError("INVALID_RECORD", "Guidance worker or run mismatch");
          }
          appendGuidance(guidance);
        }
      }
      for (const event of snapshot.events) {
        if (event.runId !== snapshot.run.runId)
          throw new PersistenceError("INVALID_RECORD", "Audit run mismatch");
        appendAudit(event);
      }
    },
    history(runId: string): readonly SimulationSnapshot[] {
      return db
        .select()
        .from(runSnapshots)
        .where(eq(runSnapshots.runId, runId))
        .orderBy(asc(runSnapshots.version))
        .all()
        .map((row) => parseStored(SimulationSnapshotSchema, row.payloadJson));
    },
    guidanceHistory(incidentId: string): readonly Guidance[] {
      return db
        .select()
        .from(guidanceVersions)
        .where(eq(guidanceVersions.incidentId, incidentId))
        .orderBy(asc(guidanceVersions.version), asc(guidanceVersions.workerId))
        .all()
        .map((row) => parseStored(GuidanceSchema, row.payloadJson));
    },
    audits(runId: string): readonly AuditEvent[] {
      return db
        .select()
        .from(incidentAudit)
        .where(eq(incidentAudit.runId, runId))
        .orderBy(asc(incidentAudit.occurredAt))
        .all()
        .map((row) => parseStored(AuditEventSchema, row.payloadJson));
    },
  };
}
