import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { Session } from "@/contracts";
import { POST as incidentAction } from "../../../app/api/incidents/[id]/actions/route";
import { POST as simulationCommand } from "../../../app/api/simulation/route";
import { POST as workerResponse } from "../../../app/api/workers/[id]/response/route";
import { fixture } from "./session-streams.test-support";

function delayedRequest(path: string, session: Session, payload: unknown) {
  const body = new TransformStream<Uint8Array, Uint8Array>();
  const writer = body.writable.getWriter();
  const options = {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${session.token}` },
    body: body.readable,
    duplex: "half",
  };
  const request = new Request(`http://localhost${path}`, options);
  const complete = async () => {
    await writer.write(new TextEncoder().encode(JSON.stringify(payload)));
    await writer.close();
  };
  return { request, complete };
}

function activeFixture() {
  const f = fixture();
  const admin = f.login("admin", "admin");
  const snapshot = () => f.runtime.getRun("equipment").snapshot;
  f.runtime.command(
    {
      action: "start",
      mode: "equipment",
      expectedVersion: snapshot().run.version,
      requestId: randomUUID(),
    },
    admin,
  );
  f.runtime.command(
    {
      action: "advance",
      deltaMs: 1000,
      mode: "equipment",
      expectedVersion: snapshot().run.version,
      requestId: randomUUID(),
    },
    admin,
  );
  return { ...f, admin, snapshot };
}

describe("session revocation while request JSON is pending", () => {
  it("rejects a simulation command without history changes when logout occurs during body upload", async () => {
    // Given
    const f = fixture();
    const admin = f.login("admin", "admin");
    const before = f.runtime.getRun("equipment").snapshot;
    const historyLength = f.runtime.dependencies.repository.history(before.run.runId).length;
    const delayed = delayedRequest("/api/simulation", admin, {
      action: "start",
      mode: "equipment",
      expectedVersion: before.run.version,
      requestId: randomUUID(),
    });
    const pending = simulationCommand(delayed.request);
    f.auth.logout(admin.token);
    // When
    await delayed.complete();
    const response = await pending;
    // Then
    expect(response.status).toBe(401);
    expect(f.runtime.getRun("equipment").snapshot).toEqual(before);
    expect(f.runtime.dependencies.repository.history(before.run.runId)).toHaveLength(historyLength);
  });

  it("rejects an incident action without history changes when logout occurs during body upload", async () => {
    // Given
    const f = activeFixture();
    const before = f.snapshot();
    const incident = before.incidents[0];
    assert.ok(incident);
    const historyLength = f.runtime.dependencies.repository.history(before.run.runId).length;
    const delayed = delayedRequest(`/api/incidents/${incident.incidentId}/actions`, f.admin, {
      action: "acknowledge",
      mode: "equipment",
      incidentId: incident.incidentId,
      expectedVersion: before.run.version,
      expectedIncidentVersion: incident.version,
      requestId: randomUUID(),
    });
    const pending = incidentAction(delayed.request, {
      params: Promise.resolve({ id: incident.incidentId }),
    });
    f.auth.logout(f.admin.token);
    // When
    await delayed.complete();
    const response = await pending;
    // Then
    expect(response.status).toBe(401);
    expect(f.snapshot()).toEqual(before);
    expect(f.runtime.dependencies.repository.history(before.run.runId)).toHaveLength(historyLength);
  });

  it("rejects a worker response without history changes when logout occurs during body upload", async () => {
    // Given
    const f = activeFixture();
    const worker = f.login();
    const before = f.snapshot();
    const guidance = before.workers.find((entry) => entry.workerId === "WORKER-A")?.currentGuidance;
    assert.ok(guidance);
    const historyLength = f.runtime.dependencies.repository.history(before.run.runId).length;
    const delayed = delayedRequest("/api/workers/WORKER-A/response", worker, {
      mode: "equipment",
      workerId: "WORKER-A",
      runId: before.run.runId,
      incidentId: guidance.incidentId,
      guidanceId: guidance.guidanceId,
      guidanceVersion: guidance.guidanceVersion,
      response: "received",
      requestId: randomUUID(),
      occurredAt: new Date().toISOString(),
    });
    const pending = workerResponse(delayed.request, {
      params: Promise.resolve({ id: "WORKER-A" }),
    });
    f.auth.logout(worker.token);
    // When
    await delayed.complete();
    const response = await pending;
    // Then
    expect(response.status).toBe(401);
    expect(f.snapshot()).toEqual(before);
    expect(f.runtime.dependencies.repository.history(before.run.runId)).toHaveLength(historyLength);
  });
});
