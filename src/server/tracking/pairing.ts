import { randomBytes } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import {
  type UwbPairingStatus,
  type UwbParticipantConfig,
  type UwbParticipantRole,
  UwbParticipantRoleSchema,
  type UwbPreparedRegistration,
  UwbPreparedRegistrationSchema,
  type UwbSessionConfig,
} from "../../../packages/contracts/src/uwb-session";

type PendingStatus = Exclude<UwbPairingStatus, { readonly status: "ready" }>;
type PairingState =
  | PendingStatus
  | {
      readonly status: "ready";
      readonly config: Omit<UwbSessionConfig, "peerAddresses">;
      readonly equipmentAddress: string;
      readonly peerWorkers: UwbParticipantConfig["peerWorkers"];
    };
export type UwbConfigResult = PendingStatus | UwbParticipantConfig;

/** Negotiates credentials only; native peer events establish actual ranging success. */
export class UwbPairingService {
  #registrations = new Map<UwbParticipantRole, UwbPreparedRegistration>();
  #state: PairingState = { status: "waiting", missingRoles: [...UwbParticipantRoleSchema.options] };

  register(raw: unknown): UwbPairingStatus {
    const value = UwbPreparedRegistrationSchema.parse(raw);
    if (isDeepStrictEqual(this.#registrations.get(value.role), value)) return this.prepare();
    switch (this.#state.status) {
      case "ready":
        this.#registrations.clear();
        break;
      case "waiting":
      case "unsupported":
        break;
      default: {
        const exhaustive: never = this.#state;
        return exhaustive;
      }
    }
    this.#registrations.set(value.role, value);
    this.#state = { status: "waiting", missingRoles: [] };
    return this.prepare();
  }

  prepare(): UwbPairingStatus {
    switch (this.#state.status) {
      case "ready":
        return { status: "ready", sessionEpoch: this.#state.config.sessionEpoch };
      case "waiting":
      case "unsupported":
        break;
      default: {
        const exhaustive: never = this.#state;
        return exhaustive;
      }
    }
    const registrations = [...this.#registrations.values()];
    const equipment = registrations.find((value) => value.role === "EQUIPMENT");
    const first = registrations.find((value) => value.role === "WORKER_1");
    const second = registrations.find((value) => value.role === "WORKER_2");
    if (equipment === undefined || first === undefined || second === undefined) {
      this.#state = {
        status: "waiting",
        missingRoles: UwbParticipantRoleSchema.options.filter(
          (role) => !this.#registrations.has(role),
        ),
      };
      return this.#state;
    }
    const configId = registrations.every((value) =>
      value.capabilities.supportedConfigIds.includes(5),
    )
      ? 5
      : registrations.every((value) => value.capabilities.supportedConfigIds.includes(2))
        ? 2
        : null;
    const updateRateType = ([1, 2, 3] as const).find((rate) =>
      registrations.every((value) => value.capabilities.supportedUpdateRates.includes(rate)),
    );
    if (new Set(registrations.map((value) => value.localAddress)).size < 3)
      return this.#unsupported("duplicate-address");
    if (new Set(registrations.map((value) => value.deviceId)).size < 3)
      return this.#unsupported("duplicate-device");
    if (!registrations.every((value) => value.capabilities.distanceSupported))
      return this.#unsupported("distance");
    if (configId === null) return this.#unsupported("multicast-config");
    if (
      !registrations.every((value) =>
        value.capabilities.supportedChannels.includes(equipment.channel),
      )
    )
      return this.#unsupported("channel");
    if (updateRateType === undefined) return this.#unsupported("update-rate");
    let sessionId = 0;
    while (sessionId === 0) sessionId = randomBytes(4).readUInt32BE(0) & 0x7fff_ffff;
    const config = {
      sessionEpoch: randomBytes(16).toString("hex"),
      sessionId,
      configId,
      sessionKeyHex: randomBytes(configId === 5 ? 16 : 8).toString("hex"),
      channel: equipment.channel,
      preambleIndex: equipment.preambleIndex,
      updateRateType,
    } satisfies Omit<UwbSessionConfig, "peerAddresses">;
    this.#state = {
      status: "ready",
      config,
      equipmentAddress: equipment.localAddress,
      peerWorkers: { [first.localAddress]: "WORKER-A", [second.localAddress]: "WORKER-B" },
    };
    return { status: "ready", sessionEpoch: config.sessionEpoch };
  }

  /** The HTTP boundary must derive this role from the authenticated device credential. */
  getConfig(role: UwbParticipantRole): UwbConfigResult {
    this.prepare();
    const state = this.#state;
    switch (state.status) {
      case "waiting":
      case "unsupported":
        return state;
      case "ready":
        switch (role) {
          case "EQUIPMENT":
            return {
              status: "ready",
              config: { ...state.config, peerAddresses: Object.keys(state.peerWorkers) },
              peerWorkers: { ...state.peerWorkers },
            };
          case "WORKER_1":
          case "WORKER_2":
            return {
              status: "ready",
              config: {
                ...state.config,
                peerAddresses: [state.equipmentAddress],
              },
              peerWorkers: {},
            };
          default: {
            const exhaustive: never = role;
            return exhaustive;
          }
        }
      default: {
        const exhaustive: never = state;
        return exhaustive;
      }
    }
  }

  unregister(role: UwbParticipantRole): UwbPairingStatus {
    if (!this.#registrations.has(role)) return this.prepare();
    switch (this.#state.status) {
      case "ready":
        return this.reset();
      case "waiting":
      case "unsupported":
        this.#registrations.delete(role);
        return this.prepare();
      default: {
        const exhaustive: never = this.#state;
        return exhaustive;
      }
    }
  }

  reset(): UwbPairingStatus {
    this.#registrations.clear();
    this.#state = { status: "waiting", missingRoles: [...UwbParticipantRoleSchema.options] };
    return this.#state;
  }

  #unsupported(
    reason: Extract<UwbPairingStatus, { readonly status: "unsupported" }>["reason"],
  ): UwbPairingStatus {
    this.#state = { status: "unsupported", reason };
    return this.#state;
  }
}
