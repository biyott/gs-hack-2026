import { describe, expect, it } from "vitest";
import { applyIncidentAction, applyWorkerResponse } from "./index";
import {
  action,
  guidance,
  incident,
  managerContext,
  response,
  snapshot,
  workerContext,
} from "./test-fixtures";

describe("incident audit identity", () => {
  it("keeps both audit records when action and worker receipt request identifiers coincide", () => {
    // Given
    const requestId = "client-request-1";
    const reviewed = applyIncidentAction(
      snapshot,
      { ...action(), requestId },
      managerContext,
    ).snapshot;
    // When
    const outcome = applyWorkerResponse(reviewed, { ...response(), requestId }, workerContext);
    // Then
    expect(new Set(outcome.snapshot.events.map((event) => event.eventId)).size).toBe(2);
  });

  it("keeps each worker audit record when separate worker request identifiers coincide", () => {
    // Given
    const guideB = {
      ...guidance,
      workerId: "WORKER-B",
      profileSnapshot: { ...guidance.profileSnapshot, workerId: "WORKER-B" },
    };
    const workers = snapshot.workers.flatMap((worker) => [
      worker,
      { ...worker, workerId: "WORKER-B", profile: guideB.profileSnapshot, currentGuidance: guideB },
    ]);
    const state = {
      ...snapshot,
      workers,
      incidents: [{ ...incident, currentGuidance: [guidance, guideB] }],
    };
    const received = applyWorkerResponse(state, response(), workerContext).snapshot;
    const context = {
      ...workerContext,
      session: { ...workerContext.session, actorId: "worker-b", workerId: "WORKER-B" },
    };
    // When
    const outcome = applyWorkerResponse(received, { ...response(), workerId: "WORKER-B" }, context);
    // Then
    expect(new Set(outcome.snapshot.events.map((event) => event.eventId)).size).toBe(2);
  });
});
