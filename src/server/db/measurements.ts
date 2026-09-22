import { TimestampSchema } from "@gs-safety/contracts";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { PersistenceError } from "./errors";
import type { SafetyDatabase } from "./index";
import { requireMeasurementMetadata } from "./measurement-payload";
import { measurementEvents } from "./schema";

export const MeasurementKindSchema = z.enum(["camera-frame", "uwb"]);
const MeasurementFieldsSchema = z.object({
  kind: MeasurementKindSchema,
  sourceId: z.string().min(1).max(512),
  sequence: z.number().int().nonnegative(),
  observedAt: TimestampSchema,
  receivedAt: TimestampSchema,
  payloadJson: z.string().max(65_536),
});
export const MeasurementInputSchema = MeasurementFieldsSchema.readonly();
const MeasurementEventSchema = MeasurementFieldsSchema.extend({
  id: z.number().int().positive(),
}).readonly();
const ListLimitSchema = z.number().int().min(1).max(1000);
export type MeasurementKind = z.infer<typeof MeasurementKindSchema>;
export type MeasurementInput = z.infer<typeof MeasurementInputSchema>;
export type MeasurementEvent = MeasurementInput & { readonly id: number };
export type MeasurementRepository = {
  readonly append: (measurement: MeasurementInput) => MeasurementEvent;
  readonly latest: (kind: MeasurementKind, sourceId?: string) => MeasurementEvent | null;
  readonly list: (kind: MeasurementKind, limit?: number) => readonly MeasurementEvent[];
};

export function createMeasurementRepository(database: SafetyDatabase): MeasurementRepository {
  const { db, sqlite } = database;
  return {
    append(input) {
      const measurement = MeasurementInputSchema.parse(input);
      requireMeasurementMetadata(measurement.payloadJson);
      return sqlite
        .transaction(() => {
          const existing = db
            .select()
            .from(measurementEvents)
            .where(
              and(
                eq(measurementEvents.kind, measurement.kind),
                eq(measurementEvents.sourceId, measurement.sourceId),
                eq(measurementEvents.sequence, measurement.sequence),
                eq(measurementEvents.observedAt, measurement.observedAt),
              ),
            )
            .get();
          if (existing) {
            if (existing.payloadJson !== measurement.payloadJson) {
              throw new PersistenceError("CONFLICT", "Measurement identity conflict");
            }
            return MeasurementEventSchema.parse(existing);
          }
          const inserted = db.insert(measurementEvents).values(measurement).returning().get();
          return MeasurementEventSchema.parse(inserted);
        })
        .immediate();
    },
    latest(kind, sourceId) {
      const condition = eq(measurementEvents.kind, MeasurementKindSchema.parse(kind));
      const row = db
        .select()
        .from(measurementEvents)
        .where(
          sourceId === undefined
            ? condition
            : and(condition, eq(measurementEvents.sourceId, sourceId)),
        )
        .orderBy(desc(measurementEvents.id))
        .limit(1)
        .get();
      return row ? MeasurementEventSchema.parse(row) : null;
    },
    list(kind, limit = 100) {
      return db
        .select()
        .from(measurementEvents)
        .where(eq(measurementEvents.kind, MeasurementKindSchema.parse(kind)))
        .orderBy(desc(measurementEvents.id))
        .limit(ListLimitSchema.parse(limit))
        .all()
        .map((row) => MeasurementEventSchema.parse(row));
    },
  };
}
