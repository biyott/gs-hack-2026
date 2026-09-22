import { describe, expect, it } from "vitest";
import { applyWorkerResponse } from "./index";
import { now, response, sentAt, snapshot, workerContext } from "./test-fixtures";

describe("worker playback response ordering", () => {
  it.each(["voice-completed", "voice-failed", "voice-unsupported"] as const)(
    "preserves %s when an earlier voice-started callback arrives late",
    (terminal) => {
      const settled = applyWorkerResponse(snapshot, response(terminal), workerContext).snapshot;
      const delayedStart = {
        ...response("voice-started"),
        occurredAt: "2026-09-21T09:00:01.000Z",
      };

      const outcome = applyWorkerResponse(settled, delayedStart, workerContext).snapshot;

      expect(outcome.workers[0]?.response).toEqual(settled.workers[0]?.response);
      expect(outcome.incidents[0]?.version).toBe((settled.incidents[0]?.version ?? 0) + 1);
      expect(outcome.events.at(-1)).toMatchObject({
        actorId: "worker-a",
        kind: "worker.voice-started",
        occurredAt: now,
      });
      expect(outcome.events.at(-1)?.detail).toContain(delayedStart.occurredAt);
    },
  );

  it.each([
    ["pending", sentAt, "stop-requested"],
    ["playing", sentAt, "stop-requested"],
    ["playing", null, "playing"],
    ["stop-requested", null, "stop-requested"],
    ["stop-requested", sentAt, "stop-requested"],
    ["cancelled", null, "cancelled"],
    ["cancelled", sentAt, "cancelled"],
    ["completed", sentAt, "completed"],
    ["failed", sentAt, "failed"],
    ["unsupported", sentAt, "unsupported"],
  ] as const)(
    "handles voice-started from %s with stop marker %s as %s",
    (voiceStatus, voiceStopRequestedAt, expectedStatus) => {
      const state = {
        ...snapshot,
        workers: snapshot.workers.map((worker) => ({
          ...worker,
          response: { ...worker.response, voiceStatus, voiceStopRequestedAt, receivedAt: now },
        })),
      };

      const outcome = applyWorkerResponse(state, response("voice-started"), workerContext).snapshot;

      expect(outcome.workers[0]?.response).toEqual({
        ...state.workers[0]?.response,
        voiceStatus: expectedStatus,
      });
      expect(outcome.incidents[0]?.audit.at(-1)?.kind).toBe("worker.voice-started");
    },
  );

  it.each([
    ["paused", "pending"],
    ["paused", "playing"],
    ["idle", "pending"],
    ["idle", "playing"],
    ["completed", "pending"],
    ["completed", "playing"],
  ] as const)("requests stopping %s run playback when %s starts", (status, voiceStatus) => {
    const state = {
      ...snapshot,
      run: { ...snapshot.run, status },
      workers: snapshot.workers.map((worker) => ({
        ...worker,
        response: { ...worker.response, voiceStatus, voiceStopRequestedAt: null },
      })),
    };
    const delayedStart = { ...response("voice-started"), occurredAt: "2026-09-21T09:00:01.000Z" };
    const outcome = applyWorkerResponse(state, delayedStart, workerContext).snapshot;
    expect(outcome.workers[0]?.response).toEqual({
      ...state.workers[0]?.response,
      voiceStatus: "stop-requested",
      voiceStopRequestedAt: now,
    });
    expect(outcome.incidents[0]?.audit.at(-1)).toMatchObject({
      kind: "worker.voice-started",
      actorId: "worker-a",
      occurredAt: now,
    });
  });

  it.each(["paused", "idle", "completed"] as const)(
    "preserves terminal playback when a delayed start arrives during a %s run",
    (status) => {
      for (const voiceStatus of ["completed", "failed", "unsupported", "cancelled"] as const) {
        const state = {
          ...snapshot,
          run: { ...snapshot.run, status },
          workers: snapshot.workers.map((worker) => ({
            ...worker,
            response: { ...worker.response, voiceStatus, voiceStopRequestedAt: null },
          })),
        };
        const outcome = applyWorkerResponse(state, response("voice-started"), workerContext);
        expect(outcome.snapshot.workers[0]?.response).toEqual(state.workers[0]?.response);
      }
    },
  );
});
