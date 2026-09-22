import { describe, expect, it } from "vitest";
import {
  UwbParticipantConfigSchema,
  type UwbParticipantRole,
  type UwbPreparedRegistration,
  UwbPreparedRegistrationSchema,
  UwbSessionConfigSchema,
} from "../packages/contracts/src/uwb-session";
import { UwbPairingService } from "../src/server/tracking/pairing";

const addresses = { EQUIPMENT: "AA:00", WORKER_1: "AA:01", WORKER_2: "AA:02" } as const;
function registration(
  role: UwbParticipantRole,
  override: Partial<UwbPreparedRegistration> = {},
): UwbPreparedRegistration {
  return UwbPreparedRegistrationSchema.parse({
    role,
    deviceId: role,
    generation: 1,
    localAddress: addresses[role],
    channel: role === "EQUIPMENT" ? 9 : null,
    preambleIndex: role === "EQUIPMENT" ? 10 : null,
    capabilities: {
      distanceSupported: true,
      azimuthSupported: false,
      elevationSupported: false,
      backgroundSupported: false,
      supportedConfigIds: [2, 5],
      supportedChannels: [5, 9],
      supportedUpdateRates: [1, 2, 3],
      supportedSlotDurations: [1, 2],
      minRangingInterval: 100,
    },
    ...override,
  });
}
function prepared(last = registration("WORKER_2")): UwbPairingService {
  const pairing = new UwbPairingService();
  pairing.register(registration("EQUIPMENT"));
  pairing.register(registration("WORKER_1"));
  pairing.register(last);
  return pairing;
}

describe("UWB multicast preparation", () => {
  it("waits for both workers before preparing a controller config", () => {
    // Given only a controller and one worker are prepared.
    const pairing = new UwbPairingService();
    pairing.register(registration("EQUIPMENT"));
    pairing.register(registration("WORKER_1"));
    // When the controller requests its config.
    const result = pairing.getConfig("EQUIPMENT");
    // Then the missing participant remains explicit and no key is exposed.
    expect(result).toEqual({ status: "waiting", missingRoles: ["WORKER_2"] });
  });

  it("builds matching native multicast configs with participant-specific peers", () => {
    // Given three prepared devices supporting provisioned multicast.
    const pairing = prepared();
    // When each authorized participant receives its own config.
    const equipment = UwbParticipantConfigSchema.parse(pairing.getConfig("EQUIPMENT"));
    const first = UwbParticipantConfigSchema.parse(pairing.getConfig("WORKER_1"));
    const second = UwbParticipantConfigSchema.parse(pairing.getConfig("WORKER_2"));
    // Then all share radio/session parameters but see only their native peer topology.
    expect(equipment.config).toMatchObject({
      configId: 5,
      channel: 9,
      preambleIndex: 10,
      updateRateType: 1,
      peerAddresses: ["AA:01", "AA:02"],
    });
    expect(equipment.config.sessionKeyHex).toHaveLength(32);
    expect(equipment.peerWorkers).toEqual({ "AA:01": "WORKER-A", "AA:02": "WORKER-B" });
    expect(first.config).toEqual({ ...equipment.config, peerAddresses: ["AA:00"] });
    expect(second).toEqual(first);
    expect(first.peerWorkers).toEqual({});
    expect(pairing.prepare()).toEqual({
      status: "ready",
      sessionEpoch: equipment.config.sessionEpoch,
    });
  });

  it("falls back to static multicast with the native eight-byte key", () => {
    // Given one worker supports multicast config 2 only.
    const base = registration("WORKER_2");
    const pairing = prepared({
      ...base,
      capabilities: { ...base.capabilities, supportedConfigIds: [2] },
    });
    // When obtaining its config.
    const result = UwbParticipantConfigSchema.parse(pairing.getConfig("WORKER_2"));
    // Then all use the shared supported mode and its exact native key size.
    expect(result.config.configId).toBe(2);
    expect(result.config.sessionKeyHex).toHaveLength(16);
  });

  it.each([
    { reason: "multicast-config", capabilities: { supportedConfigIds: [1] } },
    { reason: "distance", capabilities: { distanceSupported: false } },
    { reason: "channel", capabilities: { supportedChannels: [5] } },
    { reason: "update-rate", capabilities: { supportedUpdateRates: [] } },
  ])("reports unsupported $reason without a session config", ({ reason, capabilities }) => {
    // Given one participant cannot join the common native parameters.
    const base = registration("WORKER_2");
    const pairing = prepared({ ...base, capabilities: { ...base.capabilities, ...capabilities } });
    // When the equipment requests a session.
    const result = pairing.getConfig("EQUIPMENT");
    // Then preparation describes the incompatibility rather than radio success.
    expect(result).toEqual({ status: "unsupported", reason });
  });

  it.each([
    { override: { localAddress: "aa:01" }, reason: "duplicate-address" },
    { override: { deviceId: "WORKER_1" }, reason: "duplicate-device" },
  ])("rejects ambiguous $reason", ({ override, reason }) => {
    // Given two participant roles claim the same radio address or device.
    const pairing = prepared(registration("WORKER_2", override));
    // When preparing the shared session.
    const result = pairing.prepare();
    // Then no ambiguous peer-to-worker mapping is created.
    expect(result).toEqual({ status: "unsupported", reason });
  });

  it("preserves the session on an identical registration retry", () => {
    // Given a ready session whose worker repeats its HTTP registration.
    const pairing = prepared();
    const original = pairing.getConfig("EQUIPMENT");
    // When retrying that exact native preparation.
    pairing.register(registration("WORKER_2"));
    // Then its participants retain the same epoch, key and mapping.
    expect(pairing.getConfig("EQUIPMENT")).toEqual(original);
  });

  it("keeps other unstarted scopes when a waiting participant prepares again", () => {
    // Given no session has been issued and the two phones have independent generations.
    const pairing = new UwbPairingService();
    pairing.register(registration("EQUIPMENT", { generation: 7 }));
    pairing.register(registration("WORKER_1"));
    // When only the waiting worker prepares a replacement local scope.
    const result = pairing.register(registration("WORKER_1", { generation: 2 }));
    // Then the controller's still-prepared scope remains available for the third phone.
    expect(result).toEqual({ status: "waiting", missingRoles: ["WORKER_2"] });
  });

  it("requires fresh preparations when a ready participant replaces its native scope", () => {
    // Given an existing session and a newly prepared worker scope.
    const pairing = prepared();
    // When registering the worker's newer local generation.
    const result = pairing.register(registration("WORKER_2", { generation: 2 }));
    // Then prior native scopes and keys cannot be reused by the new session.
    expect(result).toEqual({ status: "waiting", missingRoles: ["EQUIPMENT", "WORKER_1"] });
    expect(pairing.getConfig("EQUIPMENT")).toEqual(result);
  });

  it("creates a new epoch and random key after reset and re-preparation", () => {
    // Given a fully prepared previous session.
    const pairing = prepared();
    const previous = UwbParticipantConfigSchema.parse(pairing.getConfig("EQUIPMENT"));
    pairing.reset();
    pairing.register(registration("EQUIPMENT"));
    pairing.register(registration("WORKER_1"));
    // When the final participant joins after reset.
    pairing.register(registration("WORKER_2"));
    // Then the newly provisioned key and epoch differ from the invalidated session.
    const current = UwbParticipantConfigSchema.parse(pairing.getConfig("EQUIPMENT"));
    expect(current.config.sessionEpoch).not.toBe(previous.config.sessionEpoch);
    expect(current.config.sessionKeyHex).not.toBe(previous.config.sessionKeyHex);
  });

  it("revokes the full epoch when one prepared participant unregisters", () => {
    // Given a ready multicast session.
    const pairing = prepared();
    // When a participant stops or reselects its role.
    const result = pairing.unregister("WORKER_1");
    // Then every previous native scope must prepare again before sharing new keys.
    expect(result).toEqual({
      status: "waiting",
      missingRoles: ["EQUIPMENT", "WORKER_1", "WORKER_2"],
    });
    expect(pairing.getConfig("WORKER_2")).toEqual(result);
  });

  it("ignores later unregister callbacks for already invalidated participants", () => {
    // Given the prior epoch was cleared and only a fresh controller has registered.
    const pairing = prepared();
    pairing.unregister("WORKER_1");
    pairing.register(registration("EQUIPMENT", { generation: 2 }));
    // When the old worker scope reports its cleanup.
    const result = pairing.unregister("WORKER_2");
    // Then that absent old participant cannot erase the new controller preparation.
    expect(result).toEqual({ status: "waiting", missingRoles: ["WORKER_1", "WORKER_2"] });
  });

  it("keeps session secrets out of ordinary service serialization", () => {
    // Given a prepared session stores private key material.
    const pairing = prepared();
    // When a generic serializer inspects the service.
    const serialized = JSON.stringify(pairing);
    // Then credentials exist only behind the participant-specific getter.
    expect(serialized).toBe("{}");
  });
});

describe("native pairing boundary", () => {
  it.each(["AA", "AA:BB:CC", "GG:00"])("rejects malformed radio address %s", (localAddress) => {
    // Given an address the native parser cannot consume.
    const raw = { ...registration("EQUIPMENT"), localAddress };
    // When parsing the registration boundary.
    const result = UwbPreparedRegistrationSchema.safeParse(raw);
    // Then it cannot enter the server's prepared-role state.
    expect(result.success).toBe(false);
  });

  it("rejects the wrong STS key length for the selected native config", () => {
    // Given a valid static config with an incorrectly doubled key length.
    const raw = {
      sessionEpoch: "epoch",
      sessionId: 5,
      configId: 2,
      sessionKeyHex: "a".repeat(32),
      peerAddresses: ["AA:00"],
      channel: 9,
      preambleIndex: 10,
      updateRateType: 1,
    };
    // When parsing the native session boundary.
    const result = UwbSessionConfigSchema.safeParse(raw);
    // Then the native-rejected configuration never passes the shared contract.
    expect(result.success).toBe(false);
  });
});
