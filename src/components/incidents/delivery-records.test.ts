import { describe, expect, it } from "vitest";
import type { AuditEvent } from "@/contracts";
import { currentSupportAcceptance, transmissionRecord } from "./delivery-records";

const target = { workerId: "WORKER-A", guidanceId: "guide-1", guidanceVersion: 2 };
function event(detail: string, occurredAt = "2026-09-21T09:00:00Z"): AuditEvent {
  return {
    eventId: occurredAt,
    incidentId: "incident-1",
    runId: "run-1",
    kind: "guidance.transmission-attempt",
    actorId: "server",
    occurredAt,
    detail,
    version: 2,
  };
}

describe("transmission evidence", () => {
  it("does not infer an attempt from guidance generation", () => {
    const generated = {
      ...event(JSON.stringify({ ...target, transport: "sse", connectedSubscriptions: 1 })),
      kind: "guidance.generated",
    };
    const record = transmissionRecord([generated], target);
    expect(record).toBeNull();
  });

  it("preserves an attempt with zero SSE subscriptions without inferring delivery", () => {
    const attempt = event(
      JSON.stringify({ ...target, transport: "sse", connectedSubscriptions: 0 }),
    );
    const record = transmissionRecord([attempt], target);
    expect(record).toMatchObject({ connectedSubscriptions: 0, historical: false });
  });

  it("marks persisted recipient-count fields as historical evidence", () => {
    const attempt = event(JSON.stringify({ ...target, transport: "sse", connectedRecipients: 2 }));
    const record = transmissionRecord([attempt], target);
    expect(record).toMatchObject({ connectedSubscriptions: 2, historical: true });
  });

  it("prefers the canonical subscription count when both fields exist", () => {
    const attempt = event(
      JSON.stringify({
        ...target,
        transport: "sse",
        connectedSubscriptions: 3,
        connectedRecipients: 99,
      }),
    );
    const record = transmissionRecord([attempt], target);
    expect(record).toMatchObject({ connectedSubscriptions: 3, historical: false });
  });

  it("rejects an invalid canonical count instead of falling back to an old field", () => {
    const attempt = event(
      JSON.stringify({
        ...target,
        transport: "sse",
        connectedSubscriptions: -1,
        connectedRecipients: 2,
      }),
    );
    const record = transmissionRecord([attempt], target);
    expect(record).toBeNull();
  });

  it("ignores other workers and older guidance versions", () => {
    const events = [
      event(
        JSON.stringify({
          ...target,
          workerId: "WORKER-B",
          transport: "sse",
          connectedSubscriptions: 1,
        }),
      ),
      event(
        JSON.stringify({
          ...target,
          guidanceVersion: 1,
          transport: "sse",
          connectedSubscriptions: 1,
        }),
      ),
    ];
    const record = transmissionRecord(events, target);
    expect(record).toBeNull();
  });

  it("uses the newest matching server time regardless of array order", () => {
    const payload = JSON.stringify({ ...target, transport: "sse", connectedSubscriptions: 1 });
    const events = [event(payload, "2026-09-21T09:00:01Z"), event(payload)];
    const record = transmissionRecord(events, target);
    expect(record?.occurredAt).toBe("2026-09-21T09:00:01Z");
  });

  it("ignores malformed audit details", () => {
    const record = transmissionRecord([event("not json")], target);
    expect(record).toBeNull();
  });
});

describe("support acceptance evidence", () => {
  it("does not reuse acceptance after reassignment at the same timestamp", () => {
    const events = [
      { ...event("{}"), kind: "incident.accept-support", actorId: "support", version: 3 },
      { ...event("{}"), kind: "incident.assign", actorId: "admin", version: 4 },
    ];
    const result = currentSupportAcceptance(events, {
      assignedTo: "support",
      supportStatus: "assigned",
    });
    expect(result).toBeUndefined();
  });

  it("selects acceptance after the current assignment by version", () => {
    const events = [
      { ...event("{}"), kind: "incident.assign", actorId: "admin", version: 4 },
      { ...event("{}"), kind: "incident.accept-support", actorId: "support", version: 5 },
    ];
    const result = currentSupportAcceptance(events, {
      assignedTo: "support",
      supportStatus: "accepted",
    });
    expect(result?.version).toBe(5);
  });
});
