import { z } from "zod";
import type { AuditEvent, Guidance, Incident } from "@/contracts";

const TransmissionIdentitySchema = z.object({
  workerId: z.string(),
  guidanceId: z.string(),
  guidanceVersion: z.number().int().positive(),
  transport: z.literal("sse"),
});
const ConnectionCountSchema = z.number().int().nonnegative();
const TransmissionSchema = z.union([
  TransmissionIdentitySchema.extend({ connectedSubscriptions: ConnectionCountSchema }).transform(
    (record) => ({ ...record, historical: false }),
  ),
  TransmissionIdentitySchema.extend({
    connectedSubscriptions: z.undefined().optional(),
    connectedRecipients: ConnectionCountSchema,
  }).transform((record) => ({
    ...record,
    connectedSubscriptions: record.connectedRecipients,
    historical: true,
  })),
]);
type TargetGuidance = Pick<Guidance, "workerId" | "guidanceId" | "guidanceVersion">;
type TransmissionRecord = Readonly<{
  occurredAt: string;
  connectedSubscriptions: number;
  historical: boolean;
}>;

export function transmissionRecord(
  events: readonly AuditEvent[],
  guidance: TargetGuidance,
): TransmissionRecord | null {
  let latest: TransmissionRecord | null = null;
  for (const event of events) {
    if (event.kind !== "guidance.transmission-attempt") continue;
    let detail: unknown;
    try {
      detail = JSON.parse(event.detail);
    } catch (error) {
      if (error instanceof SyntaxError) continue;
      throw error;
    }
    const parsed = TransmissionSchema.safeParse(detail);
    if (!parsed.success) continue;
    const record = parsed.data;
    if (
      record.workerId !== guidance.workerId ||
      record.guidanceId !== guidance.guidanceId ||
      record.guidanceVersion !== guidance.guidanceVersion
    )
      continue;
    if (latest && Date.parse(latest.occurredAt) >= Date.parse(event.occurredAt)) continue;
    latest = {
      occurredAt: event.occurredAt,
      connectedSubscriptions: record.connectedSubscriptions,
      historical: record.historical,
    };
  }
  return latest;
}

export function currentSupportAcceptance(
  events: readonly AuditEvent[],
  incident: Pick<Incident, "assignedTo" | "supportStatus">,
): AuditEvent | undefined {
  if (incident.supportStatus !== "accepted" && incident.supportStatus !== "completed")
    return undefined;
  const history = [...events].sort((left, right) => right.version - left.version);
  const assignment = history.find((event) => event.kind === "incident.assign");
  return history.find(
    (event) =>
      event.kind === "incident.accept-support" &&
      event.actorId === incident.assignedTo &&
      event.version > (assignment?.version ?? 0),
  );
}
