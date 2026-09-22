import { describe, expect, it } from "vitest";
import { UwbPreparedRegistrationSchema } from "@/contracts";
import { DELETE, POST } from "../../../app/api/session/route";
import { seedAccounts } from "../auth";
import { getTrackingServices, registerUwbParticipant } from "../services/tracking";
import { getSessionStreams } from "./session-streams";
import { fixture, loginRequest, openStream } from "./session-streams.test-support";

const registration = UwbPreparedRegistrationSchema.parse({
  role: "WORKER_1",
  deviceId: "worker-fixture",
  generation: 1,
  localAddress: "AA:01",
  channel: null,
  preambleIndex: null,
  capabilities: {
    distanceSupported: true,
    azimuthSupported: true,
    elevationSupported: true,
    backgroundSupported: false,
    supportedConfigIds: [2, 5],
    supportedChannels: [5, 9],
    supportedUpdateRates: [1, 2, 3],
    supportedSlotDurations: [1, 2],
    minRangingInterval: 100,
  },
});

describe("session replacement isolation", () => {
  it("keeps the prior connection when replacement credentials fail", async () => {
    // Given
    const f = fixture();
    const previous = f.login();
    const stream = openStream(previous);
    await stream.reader.read();
    // When
    const response = await POST(
      new Request("http://localhost/api/session", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `gs_safety_session=${previous.token}`,
        },
        body: JSON.stringify({ actorId: "worker-a", role: "worker", accessCode: "wrong-pin" }),
      }),
    );
    // Then
    expect(response.status).toBe(401);
    expect(f.auth.authenticate(previous.token) !== null).toBe(true);
    expect(f.runtime.bus.count("equipment")).toBe(1);
  });

  it("keeps another administrator connected when the same account logs in independently", async () => {
    // Given
    const f = fixture();
    const previous = f.login("admin", "admin");
    const stream = openStream(previous);
    await stream.reader.read();
    // When
    const response = await POST(loginRequest("admin", "admin"));
    // Then
    expect(response.status).toBe(200);
    expect(f.auth.authenticate(previous.token) !== null).toBe(true);
    expect(f.runtime.bus.count("equipment")).toBe(1);
  });

  it("closes only the displaced slot when a different account claims that device role", async () => {
    // Given
    const f = fixture();
    const previous = f.login();
    const other = f.login("worker-b", "worker");
    const stream = openStream(previous);
    const preserved = openStream(other);
    await stream.reader.read();
    await preserved.reader.read();
    seedAccounts(f.database, [
      {
        id: "worker-replacement",
        role: "worker",
        workerId: "WORKER-A",
        deviceRole: "WORKER_1",
        pin: "2026",
      },
    ]);
    // When
    const response = await POST(loginRequest("worker-replacement", "worker"));
    // Then
    expect(response.status).toBe(200);
    expect((await stream.reader.read()).done).toBe(true);
    expect(f.runtime.bus.count("equipment")).toBe(1);
    expect(getSessionStreams().count(other.sessionId)).toBe(1);
  });
});

describe("session tracking lifecycle hooks", () => {
  it("invalidates native preparation when its authenticated owner logs out", () => {
    // Given
    const f = fixture();
    const previous = f.login();
    registerUwbParticipant(previous, registration);
    // When
    const response = DELETE(
      new Request("http://localhost/api/session", {
        method: "DELETE",
        headers: { authorization: `Bearer ${previous.token}` },
      }),
    );
    // Then
    expect(response.status).toBe(204);
    expect(getTrackingServices().pairing.prepare()).toEqual({
      status: "waiting",
      missingRoles: ["EQUIPMENT", "WORKER_1", "WORKER_2"],
    });
  });

  it("invalidates native preparation when a login replaces its owner", async () => {
    // Given
    const f = fixture();
    registerUwbParticipant(f.login(), registration);
    // When
    const response = await POST(loginRequest());
    // Then
    expect(response.status).toBe(200);
    expect(getTrackingServices().pairing.prepare()).toEqual({
      status: "waiting",
      missingRoles: ["EQUIPMENT", "WORKER_1", "WORKER_2"],
    });
  });
});
