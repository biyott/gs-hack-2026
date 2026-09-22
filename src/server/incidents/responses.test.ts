import { describe, expect, it } from "vitest";
import type { WorkerResponse } from "@/contracts";
import { AuthenticationError } from "../auth/types";
import { applyWorkerResponse, IncidentTransitionError } from "./index";
import {
  guidance,
  incident,
  now,
  response,
  session,
  snapshot,
  workerContext,
} from "./test-fixtures";

const independentResponses = [
  ["received", "receivedAt"],
  ["displayed", "displayedAt"],
  ["understood", "understoodAt"],
  ["help-requested", "helpRequestedAt"],
  ["arrived", "arrivedAt"],
] as const;

describe("worker incident responses", () => {
  it.each(independentResponses)(
    "records only %s when that worker response arrives",
    (kind, field) => {
      // Given
      const command = response(kind);
      // When
      const outcome = applyWorkerResponse(snapshot, command, workerContext);
      // Then
      expect(outcome.snapshot.workers[0]?.response).toEqual({
        ...snapshot.workers[0]?.response,
        [field]: now,
      });
      expect(snapshot.workers[0]?.response[field]).toBeNull();
    },
  );

  it("records a support request when the worker asks for help", () => {
    // Given / When
    const outcome = applyWorkerResponse(snapshot, response("help-requested"), workerContext);
    // Then
    expect(outcome.snapshot.incidents[0]).toMatchObject({
      supportStatus: "requested",
      assignedTo: null,
    });
    expect(outcome.snapshot.events[0]).toMatchObject({
      actorId: "worker-a",
      occurredAt: now,
      incidentId: "INCIDENT-A",
    });
  });

  it.each([
    ["voice-started", "playing", null],
    ["voice-completed", "completed", now],
    ["voice-failed", "failed", null],
    ["voice-unsupported", "unsupported", null],
  ] as const)("records voice status independently when %s arrives", (kind, status, spokenAt) => {
    // Given / When
    const outcome = applyWorkerResponse(snapshot, response(kind), workerContext);
    // Then
    expect(outcome.snapshot.workers[0]?.response).toEqual({
      ...snapshot.workers[0]?.response,
      voiceStatus: status,
      spokenAt,
    });
  });

  it("denies a different worker when responding to current guidance", () => {
    // Given
    const context = { ...workerContext, session: { ...session("worker"), workerId: "WORKER-B" } };
    // When / Then
    expect(() => applyWorkerResponse(snapshot, response(), context)).toThrow(AuthenticationError);
  });

  it.each([
    { runId: "OLD-RUN" },
    { guidanceId: "OLD-GUIDANCE" },
    { guidanceVersion: 2 },
    { incidentId: "OTHER-INCIDENT" },
    { mode: "fire-gas" },
  ] satisfies Partial<WorkerResponse>[])(
    "rejects a stale response when identity differs by %j",
    (mismatch) => {
      // Given
      const command = { ...response(), ...mismatch };
      // When / Then
      expect(() => applyWorkerResponse(snapshot, command, workerContext)).toThrow(
        IncidentTransitionError,
      );
    },
  );

  it.each([
    { mapId: "OTHER-MAP" },
    { mapVersion: "2" },
    { expiresAt: now },
    { runId: "OLD-RUN" },
    { workerId: "WORKER-B" },
    { profileVersion: 2 },
  ])("rejects a response when current guidance context differs by %j", (mismatch) => {
    // Given
    const state = {
      ...snapshot,
      workers: snapshot.workers.map((worker) => ({
        ...worker,
        currentGuidance: { ...guidance, ...mismatch },
      })),
    };
    // When / Then
    expect(() => applyWorkerResponse(state, response(), workerContext)).toThrow(
      IncidentTransitionError,
    );
  });

  it("rejects arrival when the worker is outside the policy tolerance", () => {
    // Given
    const state = {
      ...snapshot,
      workers: snapshot.workers.map((worker) => ({ ...worker, position: { x: 12.001, y: 10 } })),
    };
    // When / Then
    expect(() => applyWorkerResponse(state, response("arrived"), workerContext)).toThrow(
      IncidentTransitionError,
    );
  });

  it("accepts explicit arrival when the worker is exactly at the tolerance boundary", () => {
    // Given
    const state = {
      ...snapshot,
      workers: snapshot.workers.map((worker) => ({ ...worker, position: { x: 12, y: 10 } })),
    };
    // When
    const outcome = applyWorkerResponse(state, response("arrived"), workerContext);
    // Then
    expect(outcome.snapshot.workers[0]?.response.arrivedAt).toBe(now);
  });

  it("rejects arrival when the position is stale", () => {
    // Given
    const state = {
      ...snapshot,
      workers: snapshot.workers.map((worker) => ({ ...worker, positionStatus: "stale" as const })),
    };
    // When / Then
    expect(() => applyWorkerResponse(state, response("arrived"), workerContext)).toThrow(
      IncidentTransitionError,
    );
  });

  it("uses the trusted last route target when confirming an arrival action without a route", () => {
    // Given
    const arrival = {
      ...guidance,
      actionCode: "CONFIRM_ARRIVAL" as const,
      waypoints: [],
      destinationId: null,
      routeVersion: null,
      stepId: null,
    };
    const state = {
      ...snapshot,
      workers: snapshot.workers.map((worker) => ({ ...worker, currentGuidance: arrival })),
      incidents: [{ ...incident, currentGuidance: [arrival] }],
    };
    const context = { ...workerContext, arrivalTargets: { "WORKER-A": { x: 10, y: 10 } } };
    // When
    const outcome = applyWorkerResponse(state, response("arrived"), context);
    // Then
    expect(outcome.snapshot.workers[0]?.response.arrivedAt).toBe(now);
  });

  it("rejects arrival when a no-route guidance has no trusted arrival target", () => {
    // Given
    const arrival = {
      ...guidance,
      actionCode: "CONFIRM_ARRIVAL" as const,
      waypoints: [],
      destinationId: null,
      routeVersion: null,
      stepId: null,
    };
    const state = {
      ...snapshot,
      workers: snapshot.workers.map((worker) => ({ ...worker, currentGuidance: arrival })),
      incidents: [{ ...incident, currentGuidance: [arrival] }],
    };
    // When / Then
    expect(() => applyWorkerResponse(state, response("arrived"), workerContext)).toThrow(
      IncidentTransitionError,
    );
  });
});

describe("worker response freshness", () => {
  it("rejects an old voice completion when the incident has a replacement guidance version", () => {
    // Given
    const state = {
      ...snapshot,
      incidents: [{ ...incident, currentGuidance: [{ ...guidance, guidanceVersion: 2 }] }],
    };
    // When / Then
    expect(() => applyWorkerResponse(state, response("voice-completed"), workerContext)).toThrow(
      IncidentTransitionError,
    );
  });

  it("preserves the first receipt time when another receipt is recorded for the same version", () => {
    // Given
    const receivedAt = "2026-09-21T09:00:01.000Z";
    const state = {
      ...snapshot,
      workers: snapshot.workers.map((worker) => ({
        ...worker,
        response: { ...worker.response, receivedAt },
      })),
    };
    // When
    const outcome = applyWorkerResponse(state, response(), workerContext);
    // Then
    expect(outcome.snapshot.workers[0]?.response.receivedAt).toBe(receivedAt);
  });

  it("does not replace an accepted support assignment when the worker repeats a help request", () => {
    // Given
    const state = {
      ...snapshot,
      incidents: [{ ...incident, assignedTo: "support-a", supportStatus: "accepted" as const }],
    };
    // When
    const outcome = applyWorkerResponse(state, response("help-requested"), workerContext);
    // Then
    expect(outcome.snapshot.incidents[0]).toMatchObject({
      assignedTo: "support-a",
      supportStatus: "accepted",
    });
  });

  it("rejects arrival against a prior target when the current action forbids movement", () => {
    // Given
    const blocked = {
      ...guidance,
      actionCode: "ROUTE_UNAVAILABLE" as const,
      waypoints: [],
      destinationId: null,
      routeVersion: null,
      stepId: null,
    };
    const state = {
      ...snapshot,
      workers: snapshot.workers.map((worker) => ({ ...worker, currentGuidance: blocked })),
      incidents: [{ ...incident, currentGuidance: [blocked] }],
    };
    const context = { ...workerContext, arrivalTargets: { "WORKER-A": { x: 10, y: 10 } } };
    // When / Then
    expect(() => applyWorkerResponse(state, response("arrived"), context)).toThrow(
      IncidentTransitionError,
    );
  });
});
