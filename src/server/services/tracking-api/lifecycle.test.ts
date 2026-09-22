import assert from "node:assert/strict";
import { describe, expect, it } from "vitest";
import { GET as config } from "../../../../app/api/uwb/config/route";
import { POST as prepare, DELETE as unregister } from "../../../../app/api/uwb/prepare/route";
import { authenticatedSession } from "../../http/context";
import { getDatabaseServices } from "../database";
import {
  activateTrackingSession,
  getTrackingServices,
  invalidateTrackingSession,
  registerUwbParticipant,
} from "../tracking";
import { preparePairing, registration, request } from "./fixtures";

describe("authenticated native scope lifecycle", () => {
  it("forgets revoked session generation history when login replaces a cleaned-up native scope", async () => {
    // Given a worker's native scope has stopped but its authenticated session remains active.
    await prepare(request("worker-a", "/api/uwb/prepare", registration("WORKER_1")));
    const previous = authenticatedSession(request("worker-a", "/api/uwb/config"));
    unregister(
      new Request(request("worker-a", "/api/uwb/prepare?generation=1"), { method: "DELETE" }),
    );
    const issued = getDatabaseServices().auth.login({
      actorId: "worker-a",
      role: "worker",
      accessCode: "2026",
    });
    // When the replacement login activates.
    activateTrackingSession(issued.session);
    // Then old authenticated-session history cannot accumulate indefinitely.
    expect(globalThis.gsSafetyUwbGenerations?.has(previous.sessionId)).toBe(false);
  });

  it("forgets the exact logged-out session generation without touching other participants", () => {
    // Given three current participant sessions and their preparation history.
    preparePairing();
    const equipment = authenticatedSession(request("equipment", "/api/uwb/config"));
    const worker = authenticatedSession(request("worker-a", "/api/uwb/config"));
    // When the equipment session logs out.
    invalidateTrackingSession(equipment);
    // Then only the revoked session's retained history is removed.
    expect(globalThis.gsSafetyUwbGenerations?.has(equipment.sessionId)).toBe(false);
    expect(globalThis.gsSafetyUwbGenerations?.has(worker.sessionId)).toBe(true);
  });
  it("reauthenticates a streamed prepare body before replacing native session ownership", async () => {
    // Given a body that started arriving with the equipment's previous credential.
    preparePairing();
    const previous = request("equipment", "/api/uwb/prepare");
    let release: (() => void) | undefined;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        release = () => {
          controller.enqueue(
            new TextEncoder().encode(
              JSON.stringify({ ...registration("EQUIPMENT"), generation: 7 }),
            ),
          );
          controller.close();
        };
      },
    });
    previous.headers.set("content-type", "application/json");
    const init = { method: "POST", headers: previous.headers, body, duplex: "half" };
    const pending = prepare(new Request(previous.url, init));
    const issued = getDatabaseServices().auth.login({
      actorId: "equipment",
      role: "device",
      accessCode: "2026",
    });
    activateTrackingSession(issued.session);
    registerUwbParticipant(issued.session, { ...registration("EQUIPMENT"), generation: 8 });
    await prepare(request("worker-a", "/api/uwb/prepare", registration("WORKER_1")));
    await prepare(request("worker-b", "/api/uwb/prepare", registration("WORKER_2")));
    const epoch = getTrackingServices().pairing.prepare();
    // When the revoked credential's old request body finally finishes arriving.
    assert.ok(release);
    release();
    const response = await pending;
    // Then it is rejected without altering the replacement session's ready epoch.
    expect(response.status).toBe(401);
    expect(getTrackingServices().pairing.prepare()).toEqual(epoch);
  });
  it("requires a generation for cleanup of a registered native scope", async () => {
    // Given an active native worker registration.
    await prepare(request("worker-a", "/api/uwb/prepare", registration("WORKER_1")));
    // When an untagged delayed cleanup request arrives.
    const response = unregister(
      new Request(request("worker-a", "/api/uwb/prepare"), { method: "DELETE" }),
    );
    // Then omission cannot bypass native generation ownership.
    expect(response.status).toBe(409);
  });

  it("rejects changed native preparation data at the same generation", async () => {
    // Given the worker already registered a native generation/address.
    await prepare(request("worker-a", "/api/uwb/prepare", registration("WORKER_1")));
    // When a different native address claims that same generation.
    const response = await prepare(
      request("worker-a", "/api/uwb/prepare", {
        ...registration("WORKER_1"),
        localAddress: "BB:01",
      }),
    );
    // Then conflicting callbacks cannot replace that native scope.
    expect(response.status).toBe(409);
  });
  it("prevents a replacement login from retrieving its predecessor's ready key", () => {
    // Given a ready pairing epoch and a new login replacing the equipment credential.
    preparePairing();
    const issued = getDatabaseServices().auth.login({
      actorId: "equipment",
      role: "device",
      accessCode: "2026",
    });
    const incoming = new Request("http://localhost/api/uwb/config", {
      headers: { authorization: `Bearer ${issued.token}` },
    });
    // When the new authenticated session asks for the old native configuration.
    const response = config(incoming);
    // Then fresh native preparation is required before credentials can be issued.
    expect(response.status).toBe(409);
  });

  it("keeps a newer session registration when an older session logs out late", () => {
    // Given a replacement equipment session that has prepared a new native scope.
    preparePairing();
    const previous = authenticatedSession(request("equipment", "/api/uwb/config"));
    const issued = getDatabaseServices().auth.login({
      actorId: "equipment",
      role: "device",
      accessCode: "2026",
    });
    activateTrackingSession(issued.session);
    registerUwbParticipant(issued.session, registration("EQUIPMENT"));
    // When cleanup from the old login arrives after replacement preparation.
    invalidateTrackingSession(previous);
    // Then it cannot erase the new session's registration.
    expect(getTrackingServices().pairing.prepare()).toEqual({
      status: "waiting",
      missingRoles: ["WORKER_1", "WORKER_2"],
    });
  });

  it("rejects a delayed preparation from an older native generation", async () => {
    // Given generation 8 is already registered by this authenticated worker.
    await prepare(
      request("worker-a", "/api/uwb/prepare", { ...registration("WORKER_1"), generation: 8 }),
    );
    // When a delayed generation 7 callback reaches the route.
    const response = await prepare(
      request("worker-a", "/api/uwb/prepare", { ...registration("WORKER_1"), generation: 7 }),
    );
    // Then native scope ownership cannot move backwards.
    expect(response.status).toBe(409);
  });

  it("rejects cleanup tagged with a superseded native generation", async () => {
    // Given generation 8 owns the worker registration.
    await prepare(
      request("worker-a", "/api/uwb/prepare", { ...registration("WORKER_1"), generation: 8 }),
    );
    // When generation 7 finishes cleanup after the new scope registered.
    const response = unregister(
      new Request(request("worker-a", "/api/uwb/prepare?generation=7"), { method: "DELETE" }),
    );
    // Then the newer generation is preserved.
    expect(response.status).toBe(409);
    expect(getTrackingServices().pairing.prepare()).toEqual({
      status: "waiting",
      missingRoles: ["EQUIPMENT", "WORKER_2"],
    });
  });
});
